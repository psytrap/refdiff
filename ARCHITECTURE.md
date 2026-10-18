# RefDiff & Decoupled References: Architecture & Technical Design Document

This document provides a comprehensive architectural and engineering specification for **RefDiff** (*The Ref-Differentiator*) and the section-modular citation decoupling ecosystem.

> [!TIP]
> **New Contributor Onboarding:** For an accessible, step-by-step code walkthrough tracing a concrete diff execution case across all virtual modules (Detection $\to$ Memento $\to$ Parsing $\to$ Pairing $\to$ Pipeline $\to$ Rendering $\to$ Rollback), see [**CODE_WALKTHROUGH.md**](CODE_WALKTHROUGH.md).

---

## 1. Executive Summary & Architectural Goals

Traditional inline citations (`<ref>{{Cite ...}}</ref>`) interleave prose assertions with verbose bibliographic metadata. On MediaWiki and Git, this creates **severe diff noise**, **artificial merge conflicts**, and **cognitive fatigue during reviews**.

The project resolves this through a **two-tier architecture**:
1. **Storage Tier (Wikitext / Git):** Section-modular storage where citations are defined in section-scoped blocks (`<ref def>` / `<references hidden>`).
2. **Review & Presentation Tier (`RefDiff.js`):** A client-side gadget that provides a **virtual decoupling lens** directly on MediaWiki `Special:Diff`, transforming monolithic diff tables into clean, decoupled prose rows paired with isolated citation diff rows.

```mermaid
flowchart TD
    subgraph StorageTier["1. Storage Tier (Database / Wikitext)"]
        RawWikitext["Raw Wikitext (Articles with inline &lt;ref&gt; or &lt;references hidden&gt;)"]
    end

    subgraph MediaWikiCore["MediaWiki Core Diff Engine"]
        DiffEngine["wikidiff2 (C++ / PHP)"]
        DiffTable["Native Diff Table (table.diff)"]
    end

    subgraph RefDiffEngine["2. Presentation Tier (RefDiff.js)"]
        Lifecycle["Lifecycle Coordinator & State Machine"]
        Lexer["Lexer &amp; Parser (REF_REGEX)"]
        Pairing["3-Pass Heuristic Pairing Engine"]
        Memento["Memento / DOM Snapshot Manager"]
        Renderer["DOM Transformation &amp; Badge Injector"]
        HookBridge["MediaWiki Hook &amp; OOUI Bridge"]
    end

    RawWikitext --> DiffEngine
    DiffEngine --> DiffTable
    DiffTable --> Lifecycle
    Lifecycle --> Memento
    Memento --> Lexer
    Lexer --> Pairing
    Pairing --> Renderer
    Renderer --> HookBridge
    HookBridge --> LiveDOM["User Browser Display (Decoupled Prose + Citation Diffs)"]
```

---

## 2. RefDiff.js Component Architecture

`refdiff.js` is structured as a zero-dependency, self-contained Universal Module Definition (UMD) module. It runs in browser environments (`common.js`, Tampermonkey, ResourceLoader) and headless Node.js testing environments without modification.

### 2.1 Core Subsystems

```mermaid
classDiagram
    class StateManager {
        +origTableHtml: string
        +isDecoupled: boolean
        +initRetries: number
        +diffTypeSwitchWidget: OOUIWidget
        +modifiedRows: RowSnapshot[]
    }

    class ParserEngine {
        +REF_REGEX: RegExp
        +normalizeDiffTags(html): string
        +parseRefs(html): RefMatch[]
        +extractName(attrs): string
        +stripHtml(str): string
    }

    class PairingEngine {
        +pairReferences(delRefs, addRefs): RefPair[]
        -matchByExplicitName()
        -matchByCleanContent()
        -pairByPositionalOrder()
        -sortByAppearance()
    }

    class MementoManager {
        +captureRowSnapshot(row): RowSnapshot
        +restoreRowSnapshot(snapshot)
    }

    class DOMRenderer {
        +createProseBadge(type, label): string
        +createCitRow(modifiedCit): HTMLTableRowElement
        +transformProseCells(delHtml, addHtml, pairs, counter)
        +updateProseRowAppearance(row, delHtml, addHtml)
        +insertCitationRows(anchorRow, modifiedCits)
    }

    class ModeCoordinator {
        +selectMode(mode, table)
        +updateButtonState(active, table)
        +setInlineSwitchDisabled(disabled)
        +notifyBodyUpdate(table)
    }

    StateManager <-- MementoManager
    ParserEngine --> PairingEngine
    PairingEngine --> DOMRenderer
    MementoManager --> ModeCoordinator
    DOMRenderer --> ModeCoordinator
```

### 2.2 Virtual File Architecture (Single-File Modularization)

Although physically maintained and deployed as a **single file** (`refdiff.js`) to satisfy MediaWiki's user-script runtime constraints without requiring an external bundler, the internal architecture is explicitly delineated into **multiple virtual files** using standardized region boundaries (`/* === [VIRTUAL FILE: src/...] === */`).

This provides the architectural separation of a multi-file project while preserving single-file zero-dependency distribution:

| Virtual File | Primary Symbols / Scope | Responsibility |
| :--- | :--- | :--- |
| **`src/constants.js`** | `VERSION`, `REF_REGEX`, `TEMPLATE_REF_REGEX`, `STORAGE_KEY`, `SELECTORS`, `CLASSES`, `HOOKS`, `BADGE_STYLES` | Centralizes regex patterns, storage keys, DOM selectors, CSS classes, hook names, and inline badge styles. |
| **`src/state.js`** | `state` (`origTableHtml`, `isDecoupled`, `initRetries`, `modifiedRows`, etc.) | Encapsulates runtime state, lifecycle flags, and modified row snapshot mementos. |
| **`src/utils.js`** | `stripHtml`, `escapeRegex`, `extractName`, `normalizeDiffTags`, `hasBalancedDiffTags`, `extractSfnInfo`, `formatBadgeDisplayLabel`, `hasDeletedCn`, `normalizeCnDiffPair` | Preprocesses diff boundary splits, regex escaping, HTML stripping, name extraction, diffchange tag balance, and sfn parameter parsing. |
| **`src/parser.js`** | `parseRefs` | Unified reference parser. Scans `<ref>` tags and footnote templates (`{{sfn}}`, `{{r}}`, `{{efn}}`, `{{harv}}`), filtering nested refs and preserving document order. |
| **`src/pairing.js`** | `pairReferences` | 3-pass heuristic matching associating deleted citations with added citations (name, content equality, positional alignment). |
| **`src/anchor.js`** | `sanitizeAnchor`, `findCiteNoteAnchor` | Scans live article preview for matching footnote IDs (`cite_note-*`, `cite_note-FOOTNOTE*`) and binds native `Extension:Popups`. |
| **`src/renderer.js`** | `el`, `createProseBadge`, `createProseBadgeElement`, `createCitRow`, `replaceRefInHtml`, `parseTemplateList`, `showBadgePreview`, `hideBadgePreview` | Constructs mathematical angle bracket badges (`⟨ref1⟩`, `⟨~mod~⟩`) and decoupled citation diff rows (`<tr class="refdiff-cit-row">`). |
| **`src/memento.js`** | `captureRowSnapshot`, `restoreRowSnapshot` | Non-destructive DOM row snapshots preserving native MediaWiki event closures in-place. |
| **`src/pipeline.js`** | `applyDecoupling`, `restoreOriginal`, `transformProseCells`, `insertCitationRows`, `onTableClick` | Orchestrates prose badge substitution, citation row injection, click handling, jump target flashing, and restoration. |
| **`src/dom_helpers.js`** | `getDiffBodyRows`, `notifyBodyUpdate` | Categorizes diff body rows and fires MediaWiki synchronization hooks (`wikipage.diff.wikitextBodyUpdate` & `wikipage.content`). |
| **`src/mode_coordinator.js`** | `selectMode`, `updateButtonState`, `setInlineSwitchDisabled`, `isRefDiffPreferred` | Manages transitions between `wikitext`, `refdiff`, and `visual` modes, locks the inline format switch, and persists user preference. |
| **`src/init.js`** | `init`, `isDiffPage`, `createRefDiffButton`, `createFallbackModeBar` | Page/diff view detection, OOUI button injection, fallback mode bar creation, lifecycle wiring, and browser auto-start. |
| **`src/exports.js`** | `module.exports` / `root.RefDiff` return object | Universal Module Definition (UMD) exports and public API surface. |

---

## 3. The Decoupling Lifecycle & State Machine

RefDiff operates alongside MediaWiki's native Wikitext Diff and VisualEditor Visual Diff modes.

### 3.1 Mode State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> Initializing: Page Loaded (table.diff detected)
    Initializing --> VisualMode: isVisualDiffActive() == true (VE diff active)
    Initializing --> WikitextMode: !isVisualDiffActive() && !isRefDiffPreferred()
    Initializing --> RefDiffMode: !isVisualDiffActive() && isRefDiffPreferred()

    WikitextMode --> RefDiffMode: User clicks [ ⧉ RefDiff ] (Save: true)
    RefDiffMode --> WikitextMode: User clicks [ [[]] Wikitext ] (Save: false)
    
    RefDiffMode --> VisualMode: User clicks [ 👁 Visual ] (Save: false; Button disabled)
    WikitextMode --> VisualMode: User clicks [ 👁 Visual ] (Save: false; Button disabled)
    VisualMode --> WikitextMode: User clicks [ [[]] Wikitext ] (Save: false; Button enabled)

    state RefDiffMode {
        [*] --> CaptureSnapshots: Backup live row properties
        CaptureSnapshots --> DecoupleProse: Replace &lt;ref&gt; with badges
        DecoupleProse --> InsertCitRows: Append &lt;tr class="refdiff-cit-row"&gt;
        InsertCitRows --> DisableInlineSwitch: Lock native 2-col switch
        DisableInlineSwitch --> NotifyHook: wikipage.diff.wikitextBodyUpdate
    }

    state WikitextMode {
        [*] --> RemoveCitRows: Remove .refdiff-cit-row
        RemoveCitRows --> RestoreSnapshots: Restore DOM in-place
        RestoreSnapshots --> EnableInlineSwitch: Unlock native 2-col switch
        EnableInlineSwitch --> ShowBodyRows: Remove .oo-ui-element-hidden
    }

    state VisualMode {
        [*] --> RestoreOriginal: Restore wikitext table cleanly (Memento)
        RestoreOriginal --> VEDormant: RefDiff completely dormant (0 interference)
        VEDormant --> DimButton: RefDiff button set to oo-ui-widget-disabled
        DimButton --> VERender: VisualEditor renders Parsoid visual diff natively
    }
```

### 3.2 Visual Diff Isolation & Wikitext-First Activation Protocol

To guarantee zero interference with VisualEditor while providing a predictable user experience, RefDiff enforces five core architectural principles:

* **Wikitext-Only Scope:** RefDiff operates exclusively as a wikitext diff enhancer (`!isVisualDiffActive()`). In Visual Diff mode, RefDiff remains dormant with zero DOM mutations.
* **Disabled in Visual Mode:** When Visual Diff mode is active, the RefDiff button is visually dimmed and made inert (`oo-ui-widget-disabled`, `aria-disabled="true"`, `tabindex="-1"`). Direct clicks on the disabled RefDiff button are halted with `stopPropagation()` and ignored.
* **Predictable Two-Step Transition (Visual → Wikitext → RefDiff):** Reviewers wishing to inspect decoupled citations from Visual mode switch to native Wikitext diff first, which un-dims the RefDiff button and restores interactive decoupling.
* **Deterministic Mode Memory:** Explicitly choosing Visual or Wikitext diff persists `refdiff-active: false` in user preferences and storage to prevent unexpected overrides on reload. Choosing RefDiff persists `true`.
* **Clean Event Delegation:** Native VisualEditor controls bubble unhindered in standard event propagation; RefDiff isolates event interception strictly to `#refdiff-ooui-btn` in the capture phase.

### 3.3 Sequence: Wikitext-First Transition from Visual to RefDiff

```mermaid
sequenceDiagram
    autonumber
    actor Reviewer
    participant VEBtn as OOUI [ [[]] Wikitext ]
    participant RefBtn as OOUI [ ⧉ RefDiff ]
    participant Coordinator as Mode Coordinator
    participant VE as MediaWiki VisualEditor
    participant Pipeline as RefDiff Pipeline
    participant DOM as table.diff (DOM)

    Note over Reviewer,DOM: Initial State: Visual Diff Active (.ve-ui-diffElement), RefDiff Dimmed & Disabled
    Reviewer->>VEBtn: Click [ [[]] Wikitext ]
    VEBtn->>VE: Switch to source diff mode
    VE->>DOM: Hide .ve-ui-diffElement, display table.diff
    Coordinator->>RefBtn: setRefDiffButtonDisabled(false) (Enabled, tabindex="0")
    Note over Reviewer,DOM: State: Native Wikitext Active, RefDiff Ready
    Reviewer->>RefBtn: Click [ ⧉ RefDiff ]
    RefBtn->>Coordinator: selectMode('refdiff')
    Coordinator->>Pipeline: applyDecoupling(table)
    Pipeline->>DOM: Transform prose badges & insert citation rows
    Coordinator->>DOM: Set [ ⧉ RefDiff ] active, [ [[]] Wikitext ] inactive
    Note over Reviewer,DOM: Decoupled RefDiff active on wikitext table
```

### 3.4 Sequence: Transitioning between Wikitext and RefDiff

```mermaid
sequenceDiagram
    autonumber
    actor Reviewer
    participant Button as OOUI Diff Toolbar
    participant RefDiff as RefDiff Coordinator
    participant Memento as Memento Manager
    participant DOM as table.diff (DOM)
    participant MWHook as mw.hook Bridge
    participant InlineSw as Inline Diff Switch

    Reviewer->>Button: Click [ ⧉ RefDiff ]
    Button->>RefDiff: selectMode('refdiff')
    RefDiff->>Memento: captureRowSnapshot(row)
    Memento-->>RefDiff: Snapshot array stored in state.modifiedRows
    RefDiff->>DOM: Replace <ref> with ⟨ref1⟩ / ⟨~ref3~⟩
    RefDiff->>DOM: Insert citation <tr> directly below prose
    RefDiff->>InlineSw: setInlineSwitchDisabled(true)
    RefDiff->>MWHook: fire('wikipage.diff.wikitextBodyUpdate', $(bodyRows))

    Note over Reviewer,DOM: Reviewer audits clean prose + source deltas

    Reviewer->>Button: Click [ [[]] Wikitext ]
    Button->>RefDiff: selectMode('wikitext')
    RefDiff->>DOM: Remove all tr.refdiff-cit-row
    RefDiff->>Memento: restoreRowSnapshot(snapshot)
    Note over Memento,DOM: Modifies innerHTML & classes on original nodes (No detachment!)
    RefDiff->>InlineSw: setInlineSwitchDisabled(false)
    RefDiff->>MWHook: fire('wikipage.diff.wikitextBodyUpdate', $(bodyRows))
    InlineSw-->>Reviewer: Native inline diff switch works immediately
```

---

## 4. Critical Architecture Decision: The Memento Pattern for DOM Preservation

### The Problem
MediaWiki's native diff scripts (`mediawiki.diff/inlineFormatToggle.js`) and VisualEditor cache references to the table's `<tr>` elements when the page loads. 

If a tool uses destructive table replacement:
```javascript
// ANTIPATTERN (DO NOT USE):
table.innerHTML = modifiedTableHtml;
```
All event closures inside MediaWiki become bound to detached DOM nodes. When the user later toggles the native **Inline Diff** switch, MediaWiki mutates detached nodes off-screen, completely breaking the interface.

### The Solution: Non-Destructive In-Place Memento
RefDiff implements the **Memento Design Pattern** (`captureRowSnapshot` / `restoreRowSnapshot`):

```javascript
function captureRowSnapshot(row) {
  const delDiv = row.querySelector('.diff-deletedline div');
  const addDiv = row.querySelector('.diff-addedline div');
  const delTd = row.querySelector('.diff-deletedline');
  const addTd = row.querySelector('.diff-addedline');
  const markers = Array.from(row.querySelectorAll('.diff-marker'));

  return {
    row,
    delDiv,
    addDiv,
    delTd,
    addTd,
    delHtml: delDiv ? delDiv.innerHTML : null,
    addHtml: addDiv ? addDiv.innerHTML : null,
    delTdClass: delTd ? delTd.className : null,
    addTdClass: addTd ? addTd.className : null,
    markers: markers.map(mk => ({ el: mk, marker: mk.getAttribute('data-marker') }))
  };
}
```

During `restoreOriginal()`:
1. All injected citation rows (`tr.refdiff-cit-row`) are pruned via `.remove()`.
2. The preserved cell elements (`delDiv`, `addDiv`, `delTd`, `addTd`) have their exact original HTML strings and classes restored in-place.
3. **Zero `<tr>` or `<td>` nodes are detached from the document tree**, keeping all MediaWiki event closures 100% operational.

---

## 5. Algorithmic Specifications

### 5.1 Regex Tokenization, Entity Handling & Boundary Normalization
MediaWiki's diff engine escapes raw HTML wikitext into HTML entities:
* `<ref>` becomes `&lt;ref&gt;`
* `</ref>` becomes `&lt;/ref&gt;`
* Attributes may contain `&quot;` or `&apos;`
* Diff spans (`<ins class="diffchange">` or `<del class="diffchange">`) may wrap whole tags, slice across attributes, or cut through tag delimiters.

#### Diffchange Boundary Normalization (`normalizeDiffTags`)
When common characters (such as `>`) border deleted or added text, MediaWiki's character-level diff engine (`wikidiff2`) shifts `<del>` or `<ins>` tags across the boundary, splitting HTML entity sequences:
* `&lt;/ref<del class="diffchange">&gt;` (opening `del` splits closing tag delimiter)
* `/<del class="diffchange">&gt;` or `/(</del>|</ins>)&gt;` (`del`/`ins` boundaries split self-closing delimiters)
* `&lt;ref...<del...>&gt;` (opening tag split before delimiter)

Before executing regular expressions, `normalizeDiffTags(html)` safely shifts split delimiters outside diffchange spans so that tags remain structurally well-formed, and purges empty diffchange spans (`<del></del>`).

#### Robust Lookahead-Constrained Tokenization (`REF_REGEX`)
```javascript
const REF_REGEX = /&lt;ref\b((?:(?!&gt;|\/&gt;)[\s\S])*?)(?:\/&gt;|&gt;((?:(?!&lt;ref\b)[\s\S])*?)&lt;\/ref&gt;)/gi;
```
* **Inner Content Constraint:** Rather than unconstrained non-greedy matching (`[\s\S]*?`), the content capture group enforces a negative lookahead assertion `((?:(?!&lt;ref\b)[\s\S])*?)`.
* **Failure Cascading Prevention:** Even if an article contains unclosed or malformed markup, an unclosed tag can never swallow subsequent `<ref>` tags or surrounding prose.

#### Shortened Footnote & Template Reference Support (`TEMPLATE_REF_REGEX` & `extractSfnInfo`)
In addition to standard `<ref>` tags, millions of Wikipedia articles use Shortened Footnotes (`{{sfn|...}}`, `{{sfnp|...}}`, `{{sfnm|...}}`), Explanatory Footnotes (`{{efn|...}}`), Shorthand references (`{{r|...}}`), and Harvard citations (`{{harvnb|...}}`).

RefDiff integrates dedicated lexing and parsing for footnote templates:
```javascript
const TEMPLATE_REF_REGEX = /\{\{\s*(?:<(?:ins|del)[^>]*>)?\s*(sfn|sfnp|sfnm|sfnmp|efn|efn-[a-z0-9_-]+|r|harv|harvnb|harvtxt|harvp)\b((?:[^{}]|\{\{(?:[^{}]|\{\{[^{}]*\}\})*\}\})*?)\}\}/gi;
```

* **Nested Template Resilience:** Balanced matching supports templates nested up to 2 levels deep (e.g. `{{efn|as acknowledged<ref name=zipf1949/>{{rp|546}}}}`), preventing premature termination at inner `}}` delimiters.
* **Separation of Page Number Suffixes (`{{rp|...}}`):** In MediaWiki, `{{rp|page}}` provides an inline page suffix for preceding citation callouts (rendering `[1]:546`). Because `{{rp}}` is not an independent footnote definition, it is preserved inline directly attached to the reference badge rather than decoupled into citation diff rows.
* **Diffchange Tag Balance Validation (`hasBalancedDiffTags`):** Validates that matches do not cross unbalanced `<del>` or `<ins>` boundaries. This prevents treating unwrapped footnotes (where editors remove outer footnote templates into top-level prose) as broken or corrupt citations.
* **Hierarchical Container Filtering:** Filters out references nested within outer footnote containers (such as `<ref>` tags inside `{{efn|...}}`), ensuring outer explanatory footnotes decouple as a single cohesive unit without replacement collisions.
* **Intelligent Author & Year Labeling (`extractSfnInfo`):** Positional parameters are extracted and formatted into human-readable scholarly labels:
  * `{{sfn|Castritius|2005}}` $\rightarrow$ `⟨Castritius 2005⟩`
  * `{{sfn|Reichert|Wolfram|2010|p=574}}` $\rightarrow$ `⟨Reichert & Wolfram 2010⟩` (page arguments cleanly omitted from prose badges)
  * `{{sfn|Smith|Jones|Brown|2020|pp=12-15}}` $\rightarrow$ `⟨Smith, Jones & Brown 2020⟩`
  * `{{sfn|Author1|Author2|Author3|Author4|2023}}` $\rightarrow$ `⟨Author1 et al. 2023⟩`
* **FOOTNOTE Anchor Synthesis:** Generates MediaWiki-compatible anchor tokens (`FOOTNOTE<Author1><Author2><Year>`), enabling instant DOM query correlation with generated `cite_note-FOOTNOTE*` footnote entries and hovercard activations.
* **Unified Document-Order Sorting:** `parseRefs` merges `<ref>` tags and citation templates into a single stream sorted by character position, preserving the author's exact narrative order.

### 5.2 Heuristic Reference Pairing (3-Pass Algorithm)

```mermaid
flowchart TD
    Start["DelRefs (deleted) & AddRefs (added)"] --> Pass1{"Pass 1: Explicit Name Match?"}
    Pass1 -- "Yes (case-insensitive)" --> Pair1["Pair {d, a, name}"]
    Pass1 -- "No" --> Pass2{"Pass 2: Clean Content Hash/String Equality?"}
    Pass2 -- "Yes (identical content)" --> Pair2["Pair {d, a, name}"]
    Pass2 -- "No" --> Pass3["Pass 3: Positional Order Alignment"]
    Pass3 --> Remainders["Assign unmatched del as {d, null} & added as {null, a}"]
    Pair1 --> Sort["Sort all pairs by document appearance position"]
    Pair2 --> Sort
    Remainders --> Sort
    Sort --> Finish["Rendered Badges & Cit Rows"]
```

1. **Pass 1 (Name-addressed):** Matches citations sharing the identical `name="..."` attribute (e.g. `name="schmidt2020"`).
2. **Pass 2 (Content-addressed):** Matches citations where `stripHtml(content)` is identical, identifying references that were relocated or surrounded by new markup without attribute modifications.
3. **Pass 3 (Positional fallback):** Pairs remaining unlinked citations sequentially in order of appearance. Any leftover deleted or added citations are marked as pure deletions (`{d, null}`) or pure additions (`{null, a}`).
4. **Ordering Invariant:** Pairs are sorted by original index in the document stream to preserve reading linearity.

---

## 6. Visual Interface & Ergonomics Design

### 6.1 Mathematical Angle Bracket Notation
To prevent visual collisions with wikitext links, RefDiff avoids brackets `[...]` and braces `{...}`:
* External links: `[https://example.org text]`
* Internal wikilinks: `[[Page Title]]`
* RefDiff badges: `⟨ref1⟩`, `⟨~schmidt2020~⟩`, `⟨+newref+⟩`, `⟨-oldref-⟩`

### 6.2 Cognitive Load Reduction (No "Blue Noise")
In earlier prototypes, unchanged reference badges were colored blue. Reviewers reported cognitive fatigue because blue badges mimicked clickable hyperlinks and competed with actual text edits.

**RefDiff Color Specification:**
* **Unmodified Citation (`norm`):** Subtle secondary neutral color (`var(--color-subtle, #72777d)` / `#8c9196`), normal font weight. Blends into prose.
* **Modified Citation (`mod`):** Amber/Gold background (`#ffd043` / `#9a6700`), tildes `⟨~name~⟩`. Flags metadata changes clearly.
* **Added Citation (`add`):** Green tint (`#36c39a` / `#14866d`), pluses `⟨+name+⟩`.
* **Removed Citation (`del`):** Red tint (`#ff6e6e` / `#b32424`), minuses and strikethrough `⟨-name-⟩`.

### 6.3 Interactive Reference Badges & Native Extension:Popups Integration

RefDiff connects the diff table with Wikipedia's native reading infrastructure via a two-tier preview architecture:

1. **Native Reference Previews (`Extension:Popups`):**
   * Badges with resolved live anchors are wrapped in standard MediaWiki footnote markup:
     ```html
     <sup class="reference refdiff-ref"><a href="#cite_note-name-num" class="ref-badge ...">⟨label⟩</a></sup>
     ```
   * RefDiff fires `mw.hook('wikipage.content').fire($(table))` upon rendering.
   * As a result, hovering over any reference badge triggers Wikipedia's standard **Reference Preview hovercard (`ext.popups`)** completely out-of-the-box, displaying the full formatted citation card from Read mode. Native `title` tooltips are suppressed to eliminate visual collision.

2. **Anchor Discovery Engine (`findCiteNoteAnchor`):**
   * **Named Citations:** Queries the live article preview for `[id^="cite_note-${name}-"]` or `[id="cite_note-${name}"]`.
   * **Shortened Footnotes (`{{sfn}}`):** Queries synthesized `cite_note-FOOTNOTE*` anchor IDs or text matching author-year strings across `.references li`.
   * **Anonymous / Unnamed Citations (DOM Identifier Matching):** Scans the citation wikitext for persistent global identifiers and directly queries MediaWiki's rendered links in `.references a[href*="..."]`:
     * **DOI:** `10.\d{4,9}/[^\s|}<>"]+` (e.g. `10.1183/20734735.0310-2019` $\to$ `#cite_note-31`)
     * **PMID:** `pmid\s*=\s*(\d+)`
     * **PMC:** `pmc\s*=\s*(?:PMC)?(\d+)`
     * **ISBN:** `isbn\s*=\s*([0-9Xx-]+)` (matching `Special:BookSources/...`)
     * **URL:** `https?://[^\s|}<>"]+`
   * Completely immune to Vancouver-style author syntax (`vauthors = ...`), unescaped quotes, or author/title template variations without custom bibliographic parsing.

3. **List-Format Preview Fallback for Unmatched & Added Citations:**
   * When `findCiteNoteAnchor()` yields no hit (e.g. newly added citations in partial diffs `⟨+ref1+⟩` that do not exist on the rendered revision):
   * `parseTemplateList(rawContent)` parses citation templates (`{{cite journal}}`, `{{cite web}}`, `{{sfn}}`) respecting nested brackets into structured key-value pairs:
     ```text
     Added citation: ⟨+ref1+⟩
     {{cite journal}}
     • vauthors: Shakespeare J, Fletcher J
     • title: The Two Noble Kinsmen
     • journal: Stationers' Register
     • date: 1634
     • doi: 10.1183/20734735.0310-2019
     ```
   * **Multi-Line Tooltip:** Exposed via the native `title` attribute with Unicode bullets (`•`) for browser tooltips and accessibility.
   * **Floating Preview Card (`.refdiff-preview-card`):** On hover, renders a floating preview card with `<ul><li>` list items matching Wikipedia's Popups aesthetic (dark-mode ready via `skin-theme-clientpref-night`).
   * **Collision Suppression:** Temporarily stashes the native `title` attribute while the preview card is visible to prevent black browser OS tooltips from obscuring the card.

4. **In-Table Citation Row Jumping:**
   * For modified, added, or deleted citations, the badge links to its injected citation diff row (`#refdiff-cit-${label}-${index}`).
   * Clicking the badge smoothly scrolls the diff table to the row and triggers a subtle `@keyframes refdiff-flash` highlight animation.

---

## 7. MediaWiki Integration Matrix

| Integration Point | Mechanism | Failure Mode Prevented |
| :--- | :--- | :--- |
| **OOUI Mode Switcher** | Injects `ButtonOptionWidget` into `.ve-init-mw-diffPage-diffMode` | Native look-and-feel; no ugly non-native banners |
| **Fallback Skins** | Injects `#refdiff-mode-bar` above table if OOUI is absent | Compatibility with Monobook, Timeless, and legacy skins |
| **VisualEditor Bridge** | Listens to `wikipage.diff.wikitextBodyUpdate` & applies `oo-ui-element-hidden` | Visual Diff row leakage and phantom table stacking |
| **Inline Toggle Switch** | Infuses `mw-diffPage-inline-toggle-switch` & locks disabled during RefDiff | Preventing contradictory side-by-side vs inline states |
| **Reference Previews (Extension:Popups)** | Semantic `<sup class="reference refdiff-ref"><a href="...">` + `mw.hook('wikipage.content')` | Displays native reading-mode citation cards on hover |
| **diffedit (Inline Diff Editor)** | Isolates cell classes (`refdiff-cit-addedline`) & restores raw wikitext on `.diff-editmode` | Line enumeration corruption in `diffedit` and editing mathematical badges |
| **Vector 2022 Dark Mode** | Uses `skin-theme-clientpref-night` and CSS variables | High-contrast dark theme without flash-of-unstyled-content |

### 7.1 Third-Party Gadget Interoperability: `diffedit.js`
[`diffedit.js`](https://meta.wikimedia.org/wiki/User:Jon_Harald_S%C3%B8by/diffedit.js) allows editors to edit article sections directly on `Special:Diff`. Because both tools operate directly on `table.diff`, RefDiff implements two explicit architectural safeguards to guarantee 100% interoperability:
1. **Line-Enumeration Protection:** `diffedit` enumerates lines by querying `tbody tr td:last-of-type` for `.diff-addedline` and `.diff-context`. If RefDiff's decoupled citation rows used these native classes, `diffedit` would increment its internal line counter (`currentLine++`), causing edits to publish to corrupted line offsets. RefDiff assigns isolated classes (`refdiff-cit-addedline`, `refdiff-cit-context`), styled identically to native diffs via CSS, ensuring `diffedit`'s line scanner completely ignores citation rows.
2. **Automatic Raw Wikitext Restoration:** When an editor clicks `[ Edit ]` in `diffedit` or when `table.diff` gains `.diff-editmode`, RefDiff observes the class mutation and automatically restores native wikitext mode (`selectMode('wikitext')`). This guarantees that `contenteditable="true"` operates on raw wikitext rather than badge tokens (`⟨ref1⟩`), preventing accidental vandalism upon saving.

### 7.2 Source Integrity & AI Verification Ecosystem (`AI Source Verification` & `CNfirmed`)
RefDiff isolates and clarifies citation diffs on `Special:Diff`. In production user configurations (such as `User:Johnjbarton/common.js`), editors pair RefDiff with AI-assisted verification and citation discovery tools:
1. **AI Source Verification** ([`User:Alaexis/AI Source Verification.js`](https://en.wikipedia.org/wiki/User:Alaexis/AI_Source_Verification.js)): Uses LLMs (Gemini, Claude, GPT) to evaluate citations in-browser, verifying whether cited references factually support article claims. RefDiff complements this by separating prose from citation clutter, giving human reviewers an unambiguous claim baseline when inspecting AI-flagged citation discrepancies.
2. **CNfirmed** ([`User:Alaexis/CNfirmed.js`](https://en.wikipedia.org/wiki/User:Alaexis/CNfirmed.js)): Discovers and verifies candidate references for `{{citation needed}}` tags using Internet Archive APIs and LLM judges.

Together with RefDiff on `Special:Diff`, `diffedit` for rapid editing, and `HarvErrors` for anchor integrity, these tools form a layered, end-to-end citation quality ecosystem.

### 7.3 Source Editing & Form Interfaces: ProveIt and Section-Scoped Locality
[**ProveIt**](https://en.wikipedia.org/wiki/Wikipedia:ProveIt) (`Gadget-ProveIt.js`) is Wikipedia's widely adopted graphical citation manager for the wikitext editor, providing a form-based UI driven by `TemplateData` and `Citoid` auto-filling:
1. **The Section-Editing Barrier (Community Wishlist W190 / Phabricator T356471):** ProveIt parses and modifies references strictly within the wikitext loaded into `#wpTextbox1`. When an editor edits a single section, citations defined outside that section—either in earlier sections or in global List-Defined Reference blocks (`{{reflist|refs=...}}`)—only appear as self-closing stubs (`<ref name="foo" />`). Because the full definition is absent from the section textarea, ProveIt cannot display or edit the source parameters, and MediaWiki's section-save architecture prevents writing to other sections.
2. **Integration with `<references hidden>`:** By organizing source definitions in section-scoped blocks (`<references hidden>`), reference definitions reside locally within the section where they are cited. ProveIt can immediately discover, edit, and auto-fill complete citation templates directly within section editing mode, resolving the W190 barrier without requiring complex cross-section API orchestration.
3. **Role in the Citation Lifecycle:** While ProveIt simplifies citation creation and modification during *authoring* (`Special:Edit`), RefDiff isolates and visualizes citation changes during *review* (`Special:Diff`), forming complementary bookends of the citation workflow.

### 7.4 Similar & Complementary Diff Tools: wikEdDiff
[**wikEdDiff**](https://en.wikipedia.org/wiki/User:Cacycle/wikEdDiff) (`User:Cacycle/wikEdDiff.js`) is an established MediaWiki diff enhancement tool that computes an inline visual diff directly in the browser:
1. **Architectural Differentiation:** wikEdDiff generates an alternative unified inline view (`div#wikEdDiffContainer`) featuring word- and character-level diffing, moved text block detection, syntax highlighting, and visual cleanup. In contrast, RefDiff operates on the native two-column MediaWiki diff table (`table.diff`), specifically targeting **citation camouflage** by separating prose edits from citation metadata changes.
2. **DOM Isolation:** wikEdDiff renders into its own independent container above or below `table.diff`. Because RefDiff strictly queries and decorates `table.diff` elements using isolated classes (`refdiff-cit-row`, `refdiff-cit-addedline`), both tools execute without DOM collision or script interference.

### 7.5 Editor Decluttering Tools: References Segregator & RefCruncher
While RefDiff addresses citation camouflage during **revision diff review** (`Special:Diff`), other community tools target the exact same cognitive overload during **wikitext editing** (`Special:Edit`):
1. **References Segregator** (`User:PleaseStand/segregate-refs.js`): Splits the edit window into two vertical panes, hoisting citation definitions into a dedicated bottom pane while editing prose cleanly above.
2. **RefCruncher** ([`User:Guywan/Scripts/RefCruncher.js`](https://en.wikipedia.org/wiki/User:Guywan/Scripts/RefCruncher)): Replaces bulky inline `<ref>...</ref>` spans with interactive, collapsed inline chips directly inside the wikitext textarea, expanding on-click when reference editing is required.
3. **Integration with `<references hidden>`:** Both editor scripts attempt to mitigate inline template sprawl client-side. The `<references hidden>` architecture natively solves this problem at the wikitext storage level, eliminating the need for client-side regex folding or artificial split panes.

---

## 8. Verification & Test Architecture

RefDiff enforces a rigorous two-layer verification pipeline with a 5-level test pyramid (see [**TESTING.md**](TESTING.md) for the comprehensive specification and [**REVIEW_GUIDE.md**](REVIEW_GUIDE.md) for the quality taxonomy and editorial audit strategy):

1. **Modular Unit, Component & Real DOM Testing (`tests/test_*.js` & `tests/runner.js`):**
   * **140 tests** (100% headless function & DOM integration coverage) across **15 modular test files** covering virtual modules, real DOM integration, and deployment pre-flight checks.
   * Fast execution budget: entire suite executes in **~250 ms** via `node tests/runner.js` (`npm test`).
   * **Selective execution:** Any module can be tested in isolation (e.g. `node tests/test_parser.js`, `node tests/test_pairing.js`, or `node tests/test_jsdom.js`).
   * **Mock & JSDOM Sandboxing:** Safe `withMockEnvironment` harness guarantees restoration of global DOM mocks (`window`, `document`, `location`) even on assertion failures, supplemented by `tests/test_jsdom.js` running against real MediaWiki diff fixtures.
   * **Parser & Text Utilities (`tests/test_parser.js`, `tests/test_utils.js`, `tests/test_constants.js`):** XML entity decoding (`&quot;`), self-closing tags, nested `diffchange` spans, boundary split normalization, `hasDeletedCn`, `normalizeCnDiffPair`, `Rule 7b` paragraph-merge normalization, `TEMPLATE_REF_REGEX`, mixed sequential order, unclosed quotation attribute toleration (`name="foo>`), embedded apostrophe preservation in double quotes, and `extractSfnInfo` for 1, 2, 3, and 4+ authors.
   * **Renderer & Badge Previews (`tests/test_renderer.js`):** Mathematical angle bracket badges, safe DOM construction via `el()`, `createProseBadgeElement`, `parseTemplateList`, and floating `.refdiff-preview-card` preview cards.
   * **Heuristic Pairing (`tests/test_pairing.js`):** 3-pass matching algorithm, insertions at front/end, surrounded edits, pure additions/deletions, self-closing identicals, and `{{sfn}}` pairing by label.
   * **Anchor Discovery & Popups (`tests/test_anchor.js`):** Resolves explicit named footnotes (including space-to-underscore normalized IDs), anonymous URL matching, DOI, PMID, PMC, and ISBN identifier matching for Reference Previews on unnamed citations, shortened `cite_note-FOOTNOTE*` anchors, and `sanitizeAnchor` tokenization.
   * **Memento & Pipeline (`tests/test_memento.js`, `tests/test_pipeline.js`):** In-place DOM snapshotting (`captureRowSnapshot` / `restoreRowSnapshot`), table decoupling mutation and clean round-trip restoration preserving native MediaWiki event closures.
   * **Mode Coordination & UI (`tests/test_mode_coordinator.js`, `tests/test_dom_helpers.js`):** 3-way mode switching (visual/wikitext/refdiff), row categorization, `wikitextBodyUpdate` hook firing, and locking `mw-diffPage-inline-toggle-switch`.
   * **Persistence (`tests/test_state.js`):** `localStorage`, `mw.storage`, and `?refdiff=0/1` URL parameter overrides.
   * **Stress & Performance Benchmarks (`tests/test_benchmarks.js`):** Real-world stress testing on high-density changesets (e.g. enwiki `diff=1379409916`, airport destination tables with 114 dense citations verified in <50ms with 0 leaks).
   * **Real DOM Integration & JSDOM Testing (`tests/test_jsdom.js`):** Real DOM test suite verifying full table decoupling, byte-for-byte in-place Memento restoration, OOUI button mounting, native inline switch locking, `MouseEvent` delegation with class flashing, and on-wiki `<nowiki>` comment protection.

2. **Live Browser Automation via CDP (`tests/test_live_cdp.py`):**
   * Uses Chrome DevTools Protocol over WebSocket port 9222.
   * Executes live end-to-end tests against real MediaWiki DOM (Meta-Wiki Special:Diff, local test fixtures, standalone stress fixtures, and live diffs such as Odoacer `diff=1379486498`, Zagreb Airport `diff=1379409916`, Kim Domingo `diff=1379491398`, Cosmic inflation `diff=1379470949`, Zipf's law `diff=1379548357`, Donnie Brasco `diff=1380017400`, Bihar Legislative Assembly `diff=1379207737`, Respiratory therapist `diff=1380407169`, and Leonardo Torres Quevedo `diff=1380356173`).
   * Verifies reference badge anchor discovery (114/114 links on stress fixture), native popup hovercards (`Extension:Popups`), visual diff transitions, inline toggle switch lock/unlock, dark mode tokens, and dense table parsing.

---

## 9. Future Architecture & Evaluation Tasks

### 9.1 Evaluating Regex Parsing vs. Preloaded MediaWiki / Meta-Wiki Libraries

* **Context:**
  RefDiff currently relies on regular expressions (`REF_REGEX`, `TEMPLATE_REF_REGEX`) and string normalizers to identify and extract `<ref>` tags and shortened footnotes (`{{sfn}}`) from diff table cells.

* **Research Problem:**
  Wikitext is non-regular; nested templates, complex parser functions (`{{#tag:ref|...}}`), and diffchange tags dissecting template boundaries can challenge pure regex heuristics. MediaWiki environments (such as English Wikipedia and Meta-Wiki) include various preloaded ResourceLoader modules and editing libraries. An architectural evaluation is needed to determine whether native libraries should replace or augment the regex pipeline.

* **Evaluation Dimensions:**
  1. **Availability Across Wikis:**
     * Meta-Wiki provides a leaner default module set than English Wikipedia.
     * Candidate modules (e.g. `mediawiki.util`, `ext.visualEditor.mwwikitext`, `ve.dm.MWReferenceModel`, or Parsoid DOM representations) may not be preloaded on `Special:Diff` on all wikis without explicit asynchronous loading (`mw.loader.using`).
  2. **Execution Latency & Budget:**
     * RefDiff executes in <25 ms across 100+ citations using pure string/regex matching. Heavyweight AST parsers or DOM-based tokenizers must be benchmarked against this performance standard.
  3. **Portability & Headless Testing:**
     * The current zero-dependency bundle runs anywhere (in-browser gadget, tampermonkey, and headless Node.js tests). Introducing hard dependencies on `mw.*` or `ve.*` would require mocking those frameworks in headless CI or maintaining separate parsing paths.
  4. **Hybrid Strategy Potential:**
     * A proposed candidate architecture is a **two-tier parsing model**: fast-path regex execution for standard citations (`<ref name="...">`, `{{Cite book}}`, `{{sfn}}`), with fallback to native MediaWiki parser libraries only when unclosed tags or nested template anomalies are encountered.

---

## 10. Architectural Decision Register (ADR)

This register records the key architectural choices, trade-offs, and design rationales governing the RefDiff client-side architecture and integration model. Upstream storage-tier syntax decisions are maintained in [**`proposal/CONCEPT.md` (§6)**](proposal/CONCEPT.md#6-syntax-alternatives--evaluation).

### 10.1 RefDiff Architecture Decision Summary

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| **Decoupling Lens Model** | Virtual Presentation Tier (In-Memory DOM Transformation) | RefDiff acts purely as a client-side lens over standard MediaWiki diffs. Wikitext on disk and database representations remain completely standard and untouched. No changes to `wikidiff2` or server rendering pipelines are required. |
| **State Preservation & Restoration** | In-Place DOM Memento Pattern (`table.innerHTML` snapshot) | Captures a byte-for-byte Memento of `table.diff` before applying transformations. Allows instantaneous, deterministic toggling between native diff and decoupled view with zero residual DOM nodes, memory leaks, or discarded event listeners ($\text{table.innerHTML}_{\text{initial}} \equiv \text{table.innerHTML}_{\text{restored}}$). |
| **DOM Construction & XSS Immunity** | Native Element Builder `el()` | Replaced dynamic `.innerHTML` string interpolation with native `document.createElement()` and `document.createTextNode()` calls. Enforces rigorous attribute whitelisting, Boolean handling, and absolute immunity against script injection from untrusted wikitext diffs (M1). |
| **Badge Visual Ergonomics** | Universal Mathematical Angle Brackets (`⟨...⟩`, `~`, `+`, `-`) | Badges use clean mathematical notation (`⟨Castritius 2005⟩`, `⟨~1~⟩`, `⟨+2+⟩`, `⟨-3-⟩`) to distinguish decoupled citation references from standard prose. High contrast, theme-aware styling guarantees accessibility across both Vector 2022 Light and Dark modes. |
| **Two-Tier Preview Architecture** | Native Footnote Anchor First, Deterministic List Parser Fallback | **Tier 1:** Scans citation text for persistent identifiers (DOI, PMID, PMC, ISBN, URL) and links to `#cite_note-*` in the DOM, triggering native `Extension:Popups` hovercards. **Tier 2:** When no DOM anchor exists (newly added or unmatched citations), parses wikitext deterministically into an accessible multi-line list preview card (`role="tooltip"`), bypassing OS tooltip suppression. |
| **Zero External Network Dependencies** | Self-Contained UMD Bundle with Bundled Polyfills | Runs entirely within standard MediaWiki ResourceLoader or UserScript environments. Zero runtime fetches to external CDNs or third-party libraries (M6). Ensures complete privacy compliance and resilience in restricted/offline environments. |
| **RefDiff Internationalization (i18n)** | Deliberate Omission (Language-Agnostic Design) | RefDiff deliberately does not implement an i18n framework (`mw.messages`/`i18next`). The gadget UI has a negligible string footprint (~3 static strings: proper name `RefDiff`, `Inline modified refs`, `Diff view:`). Decoupled badges rely on universal mathematical notation (`⟨...⟩`, `~`, `+`, `-`) and verbatim citation metadata. Omitting i18n preserves the zero-dependency, single-file footprint (~40 KB) required for instant cross-wiki deployment via `m:Special:MyPage/global.js` without network overhead or translation bundle latency. |
| **Fail-Open Error Boundary** | Top-Level Try/Catch with Automatic Memento Rollback | Any unexpected parsing or DOM exception in `init()` or `applyDecoupling()` automatically restores the original native diff table and logs a warning, guaranteeing editors are never blocked from reviewing diffs. |

