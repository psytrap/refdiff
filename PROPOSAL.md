# Proposal: Section-Scoped Reference Blocks (`<references-def>`)

* **Target Venue:** Wikimedia Phabricator ([phabricator.wikimedia.org/maniphest/task/edit/form/1/](https://phabricator.wikimedia.org/maniphest/task/edit/form/1/))
* **Task Title:** `Proposal: Section-scoped reference definition blocks (<references-def>) for clean diffs and citation locality`
* **Projects / Tags:** `#extension-cite`, `#Parsoid`, `#MediaWiki-Parser`

---

## 1. Goals in a Nutshell

* **Clean, Focused Diffs:** Prose edits and citation metadata changes produce completely isolated, minimal diff hunks.
* **Readable Wikitext, References Still Nearby:** Sentences stay free of template clutter, yet full citations remain conveniently close within the same section.
* **Resilience Against "AI Slop":** Reviewers can scrutinize factual claims without wading through template noise, and audit all sources for a chapter in one unified section block.
* **Zero Merge Conflicts:** Collaborators editing different sections never collide in a single global references list at the bottom of the document.
* **Unaltered Reader Experience:** Readers still get the familiar, globally numbered footnote list (`[1]`, `[2]`, …) at the end of the article.

---

## 2. Proposed Syntax

Instead of embedding bulky citation templates directly into sentences, the wikitext separates callouts from source definitions across three tiers:

* **Prose callouts (`<ref name="..." />`):** Lightweight inline anchors next to the claim.
* **Section definition block (`<references-def>`):** Compact, one-line-per-source definitions at the end of each section.
* **Global render anchor (`<references />`):** The standard tag at the end of the document.

```wikitext
== 1. Geology of Venus ==
The surface of Venus is dominated by intense volcanism.<ref name="schmidt2020" />
Radar imaging reveals thousands of volcanic structures.<ref name="nasa-radar" />

<references-def>
<ref name="schmidt2020">{{Cite book |author=Schmidt, Rainer |title=Volcanism on Terrestrial Planets |year=2020 |pages=45–48}}</ref>
<ref name="nasa-radar">{{Cite web |author=NASA JPL |url=https://example.org/venus-radar |title=Venus Radar Mapping Project |access-date=2026-10-08}}</ref>
</references-def>

== References ==
<references />
```

## 3. Concrete Diff Comparison

<div style="background: #0f141c; padding: 16px; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #cdd9e5; line-height: 1.5; margin: 12px 0; border: 1px solid #2d333b;">
<table style="width: 100%; border-collapse: separate; border-spacing: 12px 5px; border: none; margin: 0;">
  <thead>
    <tr>
      <th style="text-align: left; color: #ffffff; font-size: 13px; font-weight: bold; padding-left: 20px;">Line 1:</th>
      <th style="text-align: left; color: #ffffff; font-size: 13px; font-weight: bold; padding-left: 20px;">Line 1:</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Current ==</div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Current ==</div></td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
    </tr>
    <tr>
      <td style="vertical-align: top;">
        <div style="display: flex; align-items: flex-start;">
          <span style="width: 16px; color: #768390; font-weight: bold; font-size: 14px; text-align: center; margin-right: 4px;">−</span>
          <div style="flex: 1; background: #1a1614; border: 1px solid #543b1f; border-radius: 4px; padding: 6px 10px; color: #e6edf3;">
            The atmosphere consists mostly of carbon dioxide&lt;ref&gt;{{Cite book |author=Schmidt, Rainer |title=Planetary Atmospheres |year=2020 |pages=112–115 |isbn=978-3-12-345678-9 |publisher=Springer}}&lt;/ref&gt;, creating an <span style="background: #5a3814; color: #ffd8a8; font-weight: bold; padding: 1px 4px; border-radius: 3px;">extreme</span> greenhouse effect that heats the surface.
          </div>
        </div>
      </td>
      <td style="vertical-align: top;">
        <div style="display: flex; align-items: flex-start;">
          <span style="width: 16px; color: #768390; font-weight: bold; font-size: 14px; text-align: center; margin-right: 4px;">+</span>
          <div style="flex: 1; background: #121a24; border: 1px solid #1f3d5c; border-radius: 4px; padding: 6px 10px; color: #e6edf3;">
            The atmosphere consists mostly of carbon dioxide&lt;ref&gt;{{Cite book |author=Schmidt, Rainer |title=Planetary Atmospheres |year=2020 |pages=112–115 |isbn=978-3-12-345678-9 |publisher=Springer}}&lt;/ref&gt;, creating an <span style="background: #1f3f6d; color: #a5d6ff; font-weight: bold; padding: 1px 4px; border-radius: 3px;">runaway</span> greenhouse effect that heats the surface.
          </div>
        </div>
      </td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Proposed ==</div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Proposed ==</div></td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
    </tr>
    <tr>
      <td style="vertical-align: top;">
        <div style="display: flex; align-items: flex-start;">
          <span style="width: 16px; color: #768390; font-weight: bold; font-size: 14px; text-align: center; margin-right: 4px;">−</span>
          <div style="flex: 1; background: #1a1614; border: 1px solid #543b1f; border-radius: 4px; padding: 6px 10px; color: #e6edf3;">
            The atmosphere consists mostly of carbon dioxide&lt;ref name="schmidt2020" /&gt;, creating an <span style="background: #5a3814; color: #ffd8a8; font-weight: bold; padding: 1px 4px; border-radius: 3px;">extreme</span> greenhouse effect that heats the surface.
          </div>
        </div>
      </td>
      <td style="vertical-align: top;">
        <div style="display: flex; align-items: flex-start;">
          <span style="width: 16px; color: #768390; font-weight: bold; font-size: 14px; text-align: center; margin-right: 4px;">+</span>
          <div style="flex: 1; background: #121a24; border: 1px solid #1f3d5c; border-radius: 4px; padding: 6px 10px; color: #e6edf3;">
            The atmosphere consists mostly of carbon dioxide&lt;ref name="schmidt2020" /&gt;, creating an <span style="background: #1f3f6d; color: #a5d6ff; font-weight: bold; padding: 1px 4px; border-radius: 3px;">runaway</span> greenhouse effect that heats the surface.
          </div>
        </div>
      </td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">&lt;references-def&gt;</div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">&lt;references-def&gt;</div></td>
    </tr>
  </tbody>
</table>
</div>

---

## 4. Core Mechanics & Rules

1. **Render Suppression:** `<references-def>` registers citations with the parser but emits **no HTML** at that position.
2. **Global Aggregation:** The global `<references />` tag at the bottom collects all definitions across all `<references-def>` blocks on the page, rendering a continuous `[1], [2], ...` numbered list ordered by first appearance in the text.
3. **Fault Tolerance & Relocation:** If an author moves a sentence with `<ref name="..." />` to another section and forgets to move the definition, **the page does not break** (definitions resolve page-wide). Maintenance bots can asynchronously clean up and migrate misplaced definitions to their respective section.
4. **Cross-Section Dependencies & Deletion Resilience:**
   * *The Hazard:* If Section A defines `<ref name="smith2020">` and Section B reuses `<ref name="smith2020" />`, subsequent deletion or refactoring of Section A could orphan the call in Section B (`cite_error_references_no_text`).
   * *Status Quo Parity:* This hazard is identical to status-quo inline references (where the primary definition is buried in an upstream paragraph). However, `<references-def>` makes this significantly easier to mitigate:
     * **Tiered Placement:** Sources cited in a single section remain in that section's `<references-def>`. Pervasive sources cited across many sections can optionally be defined in a document-level `<references-def>` block near `== References ==`.
     * **Parser Idempotency:** Defining the identical reference in multiple section blocks is accepted without error; the parser deduplicates them cleanly, allowing sections to be fully self-contained.
     * **Edit-Time Linter / VE Warning:** Because definitions are held in structured blocks rather than buried in prose, Parsoid and edit preview tools can detect when a deleted definition is still referenced downstream, warning the editor to hoist the definition before saving.
5. **Multi-Page Reuse:** Fully compatible with MediaWiki's native sub-referencing (`<ref name="book" details="p. 45" />`) as well as community page templates (`<ref name="book" />{{rp|45}}`).

---

## 5. Affected Tooling (Overview)

* **MediaWiki Core & Parser:** `Extension:Cite` (tag registration & suppressed rendering), `Parsoid` (round-trip DOM handling), `Page Previews` (hovercards).
* **Diff Tools (`wikidiff2`):** **No modifications required.** Works out-of-the-box with standard diffs (the separation of prose and source hunks within the section is an acknowledged trade-off).
* **Editors & UI:** `VisualEditor` (option to append citations to section blocks), `SyntaxHighlighter` (tag recognition), `IDE/LSP tools` (local `name="..."` autocomplete).
* **Bots & Maintenance:** `Pywikibot` (citation scripts), `InternetArchiveBot` (clean in-place URL fixes), `AutoWikiBrowser (AWB)`.
* **External Parsers & Readers:** Python AST parsers (`mwparserfromhell`, `wikitextparser`), `Kiwix / Pandoc` (offline dumps and exports).

---

## 6. Rollback & Dismissal Strategy

To guarantee that introducing `<references-def>` poses zero permanent risk to Wikimedia wikis, the proposal defines a clean dismissal path and long-term legacy support for historical revisions:

### 6.1 Automated Wikitext Clean-Up (In Case of Dismissal)
If a wiki community or the WMF decides to decommission `<references-def>`, all articles can be migrated back to standard syntax automatically without manual editor labor:
* **Tracking & Scope:** All affected pages are automatically tracked via `Category:Pages that use section-scoped reference definitions`.
* **Automated Bot / Maintenance Script:** A dedicated migration script (`cleanupReferencesDef.php` / Pywikibot routine) systematically unwinds the syntax:
  * **Option A: Loss-less Hoisting to LDR (Default / Recommended):** The script extracts all definitions from section `<references-def>` blocks across the page and appends them into the article's existing document-end `<references>` block (converting the article to standard List-Defined References).  
    * **Zero Prose Modifications:** Sentences, paragraphs, and inline callouts (`<ref name="..." />`) remain 100% untouched. This completely eliminates risks of text corruption or merge conflicts during de-migration.
  * **Option B: Inline Re-injection:** For communities strictly preferring traditional inline references, the script substitutes each definition back into its first in-prose callout (`<ref name="X">...</ref>`) and removes the `<references-def>` container.

### 6.2 Long-Term Legacy Support for Historical Revisions
A core requirement for MediaWiki is that older revisions (`oldid=...`) and historical diffs must continue to render correctly for years after an article has been edited or a feature has been retired:
* **Passive Fallback Hook:** Even if active authoring of `<references-def>` is disabled via configuration, `Extension:Cite` maintains a minimal, passive fallback hook (~10 lines of code) as a multi-year LTS compatibility layer.
* **Seamless Archive Rendering:** When rendering an older revision containing `<references-def>`, the legacy hook registers the enclosed `<ref>` definitions into the citation pool and suppresses in-situ HTML output.
* **Zero Reader / Historical Breakage:** Historical permalinks and diff views continue to render footnotes cleanly with **zero red cite errors** (`cite_error_references_no_text`) and without raw unparsed tags spilling into prose.
