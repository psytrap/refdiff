# Project Log & Planned Steps

This log records the rationale, architectural decisions, completed milestones, and upcoming action items for the **Section-Scoped References (`<references hidden>`)** initiative.

---

## 1. Project Overview & Current Status

* **Status:** Ready for Community & Upstream Outreach (Phase 1)
* **Goal:** Eliminate diff pollution, avoid cross-section merge conflicts, and preserve wikitext readability by decoupling inline reference callouts from section-level citation definitions.
* **Core Artifacts:**
  * 💡 **[PROPOSAL.md](PROPOSAL.md):** Concise proposal (pure feature focus).
  * 📄 **[CONCEPT.md](CONCEPT.md):** Comprehensive technical specification and architecture paper.
  * 📝 **[POST.md](POST.md):** Ready-to-use Wiki post Anschreiben for English Wikipedia ([Wikipedia talk:Citing sources](https://en.wikipedia.org/wiki/Wikipedia_talk:Citing_sources)).
  * 📖 **[README.md](README.md):** Repository introduction and index.

---

## 2. Planned Steps & Action Items (Roadmap)

### Phase 1: Community & Technical Outreach (Immediate Next Steps)
- [ ] **Step 1.1: Submit Wikimedia Phabricator Task**
  * Submit draft to [phabricator.wikimedia.org](https://phabricator.wikimedia.org/maniphest/task/edit/form/1/) tagged with `#extension-cite`, `#Parsoid`, `#MediaWiki-Parser`.
  * Record Phabricator task ID (e.g. `Txxxxxx`) in this log.
- [ ] **Step 1.2: Post to Cite Discussion Pages**
  * Post to `mw:Extension talk:Cite` (MediaWiki.org) and/or `en:Wikipedia talk:Citing sources` (or `de:Wikipedia Diskussion:Einzelnachweise`).
  * Link the discussion to the Phabricator task.
- [ ] **Step 1.3: Community Wishlist Submission**
  * Submit a focused proposal to [meta:Community Wishlist](https://meta.wikimedia.org/wiki/Community_Wishlist) to gather editor endorsements and votes.

### Phase 2: Feedback Synthesis & Specification Iteration
- [ ] **Step 2.1: Monitor Community & Developer Reactions**
  * Track feedback on syntax choices (`<references hidden>` vs `<references-def>` vs `<references display="none">`).
  * Note community questions regarding VisualEditor UX and mobile rendering.
- [ ] **Step 2.2: Refine Specification**
  * Incorporate edge cases and consensus items into [CONCEPT.md](CONCEPT.md) and [PROPOSAL.md](PROPOSAL.md).

### Phase 3: Proof of Concept (PoC) Prototype
- [ ] **Step 3.1: Python CLI Demonstration Tool (`ref-scope`)**
  * Build a standalone Python script in this repository using `mwparserfromhell` or `wikitextparser`.
  * Capabilities:
    1. Parse a standard Wikipedia wikitext article.
    2. Extract inline `<ref>` tags and relocate them into section `<references hidden>` blocks.
    3. Generate before/after git diff statistics on real Wikipedia sample articles.
- [ ] **Step 3.2: Automated Re-Scoping Bot Prototype**
  * Implement the basic "bot cleanup" algorithm: detect moved `<ref name="..." />` anchors and auto-migrate definitions between `<references hidden>` blocks.

### Phase 4: Upstream MediaWiki Integration
- [ ] **Step 4.1: Lua / Scribunto Prototype**
  * Provide a lightweight template/module implementation (`{{#invoke:RefDef|...}}`) for wikis that want to test the workflow without server modifications.
- [ ] **Step 4.2: MediaWiki Extension:Cite Patch (Gerrit)**
  * Work with Wikimedia developers on an experimental patch for `Extension:Cite`.

---

## 3. Architectural Decision Register (ADR)

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| **Primary Working Title** | `<references hidden>` | Native HTML5 boolean attribute `hidden` on the existing `<references>` tag. Maximizes AST parser reuse (`mwparserfromhell`, Parsoid AST) and bot compatibility (AWB) without registering new XML tags. Quote-free, clean wikitext ergonomics. Evaluated alternatives: `<references-def>` and `<references display="none">`. |
| **Reader View** | Unified global list at document bottom | Preserves the familiar Wikipedia reader experience and continuous `[1], [2], ...` footnote numbering. |
| **Fault Tolerance** | Page-wide resolution scope | Moving sentences between sections never causes red citation errors; ensures high resilience for human editors. |
| **Bot Philosophy** | "Bots clean up" (simple, async) | Avoids frustrating authors with strict lint errors. Normalization and block consolidation happen asynchronously. |
| **Formatting** | Single-line per `<ref>` inside definition block | Prevents excessive vertical file bloat and ensures atomic, 1-line Git diff hunks per source update. |
| **Diff Tooling Scope** | Zero changes required (`wikidiff2` untouched) | Avoids scope creep and maintainer pushback. Decoupling of claim and source in diff hunks is documented as an acknowledged trade-off mitigated by section locality. |
| **Multi-Page Citations** | Native `details="..."` and template `{{rp}}` | Fully supports MediaWiki's native Sub-referencing (`details="p. 45"`) as well as in-prose page suffixes (`{{rp|45}}`). |
| **Legacy & Third-Party Compatibility** | Dynamic LDR Hoisting (Pre-parse Hook & Export Transpiler) | Transpiles `<references hidden>` to standard List-Defined References (LDR) on-the-fly for unpatched/third-party wikis and database dumps (Kiwix). Completely eliminates in-situ `<ol>` rendering and stateful citation flush issues. |

---

## 4. Chronological Decision & Activity Record

### 2026-10-08: Inception, Design Alignment & Proposal Drafting

* **Problem Identification & Root Cause Analysis:**
  * Analyzed the shortcomings of traditional inline citations (`<ref>...</ref>`): *diff pollution* (sentence and citation changes entangled), artificial merge conflicts, and the *split-hunk* problem when using document-end citation lists.
  * Identified the emerging challenge of **"AI Slop"**: With AI generating large volumes of plausible text, reviewers need clear, unfragmented prose to evaluate claims and an isolated section-level source inventory to audit citations.
* **Architecture Formulation (Two-Tier Model):**
  * Decoupled source storage from reader presentation:
    * *Tier 1 (Source/Git):* Local declaration via `<references-def>` within the section.
    * *Tier 2 (Frontend):* Global continuous numbering `[1], [2], ...` at document end via `<references />`.
* **Resilience & Fault Tolerance Consensus:**
  * Established the rule of **Page-Wide Scope**: Moving sentences with `<ref name="..." />` between sections must **never** break rendering, even if the author forgot to move the definition.
* **Author Ergonomics & "Bots Clean Up" Principle:**
  * Rejected over-engineering of rigid authoring rules. Authors write freely and naturally; automated maintenance bots asynchronously migrate misplaced definitions, consolidate multiple blocks per section, and prune unreferenced dead citations.
* **Syntax & Formatting Standardization:**
  * Selected `<references-def>` as the primary working name (clearly separating *definition* from *rendering* without colliding with nested "sub-references").
  * Adopted a compact **one-line-per-citation** style to minimize vertical space and produce atomic, one-line Git diffs.
* **Document Modularization & Translation:**
  * Created `PROPOSAL.md` (English, laser-focused).
  * Created `CONCEPT.md` (comprehensive English architecture paper).
  * Removed early German drafts (`VORSCHLAG.md`, `KONZEPT.md`) to establish English as the primary lingua franca for upstream Wikimedia discussions.
  * Added Section 8 ("Ecosystem Impact & Affected Tooling") detailing impacts on `Extension:Cite`, `Parsoid`, `VisualEditor`, `Pywikibot`, `InternetArchiveBot`, and external parsers.
  * Prepared submission drafts for Wikimedia Phabricator and Extension:Cite discussion pages.
  * Embedded high-fidelity, 2-column dark-mode MediaWiki diff imitation tables across `PROPOSAL.md`, `CONCEPT.md` (Scenarios 3.1 & 3.2), and `SUBMISSION_DRAFTS.md` (Phabricator draft).
  * Upgraded community talk page draft in `SUBMISSION_DRAFTS.md` to use `<syntaxhighlight lang="diff">` to prevent live MediaWiki citation errors and provide colorized diff display.
  * **Decoupled Diff Trade-Off Analysis (Zero Diff Tooling Dependency):** Analyzed the reviewer challenge of reviewing modified claims without seeing the detached reference definition in the same diff hunk. Explicitly framed this as an **acknowledged trade-off** rather than a blocker requiring modifications to `wikidiff2`. Confirmed that `<references-def>` works 100% out-of-the-box with existing diff tools, with section locality providing sufficient proximity to minimize cognitive load.
  * **Multi-Page Reference Reuse Analysis:** Analyzed real-world Wikipedia workflows for citing different pages of the same work. Documented compatibility with in-prose page suffixes (`{{rp|...}}`), native MediaWiki sub-references (`details="..."`), and shortened footnotes (`{{sfn}}`) in `CONCEPT.md` (Section 7.4) and `PROPOSAL.md` (Section 4).
  * **Cross-Section Dependency & Deletion Hazard Analysis:** Addressed the critical edge-case where Section A defines a reference reused downstream in Section B, and Section A is subsequently deleted. Documented status-quo parity (inline references share this exact vulnerability), established architectural mitigations (tiered global/local placement, parser idempotency for safe duplicate definitions, edit-time linter warnings in Parsoid/VE, and bot hoisting) in `PROPOSAL.md` (Section 4) and `CONCEPT.md` (Section 7.2).
  * **Dismissal Clean-up & Historical Revision Legacy Support:** Defined an automated wikitext de-migration strategy via bot/maintenance script (loss-less hoisting to LDR without prose edits) and guaranteed multi-year parser compatibility for older database revisions (`oldid=...`) via a passive fallback hook in `Extension:Cite` in `PROPOSAL.md` (Section 6) and `CONCEPT.md` (Section 9).
  * **Tooling-Friendly Syntax Evaluation (`<references display="none">`):** Evaluated reusing the existing `<references>` tag with the standard CSS display-suppression attribute `display="none"` to address tooling/bot fatigue. Documented that `display="none"` directly resolves human cognitive friction ("why is `<references>` here if it does not display footnotes?") by explicitly mirroring the universal web standard `display: none;`, while allowing existing AST parsers (`mwparserfromhell`, `wikitextparser`), bots (AWB), and regexes to parse definition blocks without new tag registration, in `PROPOSAL.md` (Section 2) and `CONCEPT.md` (Section 6 & 6.1).
* **Adoption of `<references hidden>` as Primary Working Title Solution:**
  * Formally designated `<references hidden>` as the primary working title solution across all proposal and concept specifications, superseding `<references-def>`.
  * **HTML5 Semantic Standard:** Grounded in the native HTML5 boolean attribute `hidden` (§3.2.6), which directs user agents and parsers that an element is not currently relevant and must be hidden from visual display.
  * **AST & Bot Compatibility:** Reuses the existing MediaWiki `<references>` tag, eliminating the need for new XML tag registration in AST parsers (`mwparserfromhell`, `wikitextparser`, Parsoid AST), bots (AWB, Pywikibot, Citoid), and community regex suites.
  * **Wikitext Ergonomics:** As a boolean attribute, it requires no value quotes or equals sign (`<references hidden>` instead of `<references display="none">`), providing a cleaner, faster, and less error-prone typing experience for wikitext authors.
  * **Preserved RFC Alternatives:** Retained `<references-def>` (for strict parser separation preventing accidental rendering on unpatched legacy third-party wikis) and `<references display="none">` (for explicit CSS property-value alignment) as formally evaluated alternatives.
* **Dynamic LDR Hoisting Compatibility Layer (On-the-Fly Reformatting):**
  * Formulated the architectural solution to the unpatched parser hazard (where an unpatched `Extension:Cite` without the `hidden` attribute patch would render an unwanted in-situ `<ol>` list and prematurely flush the citation buffer).
  * **Pre-Parse Dynamic Hoisting:** Designed a 15-line server hook for `ParserBeforeInternalParse` (or micro-extension `CiteHiddenCompat`) that extracts `<references hidden>` blocks and hoists definitions into the document-end `<references>` tag as standard List-Defined References (LDR) in memory at parse time.
  * **100% Backward-Compatible Output:** Because the legacy parser receives pure standard LDR wikitext, all three unpatched failure modes (stray `<ol>`, premature citation buffer drain, and parameter error banners) are completely eliminated without touching MediaWiki core files.
  * **Export & Mirror Protection:** Specified that Wikimedia database dumps (`pages-articles.xml.bz2`) and export filters (`Special:Export`, Kiwix) transpile to standard LDR on export, safeguarding downstream mirrors and offline readers.
  * Documented as Pathway D in `CONCEPT.md` and integrated into Section 5 of `PROPOSAL.md`.
* **Implementation of `RefDiff` Engine Prototype (`refdiff.py`):**
  * Built a standalone, zero-dependency Python 3 implementation of the RefDiff engine (`refdiff.py`) utilizing standard library modules (`re`, `difflib`, `dataclasses`, `argparse`, `json`).
  * Implemented robust wikitext tokenization for inline `<ref>`, self-closing `<ref name="..." />`, and section-scoped `<references hidden>` blocks.
  * Built the dual diff engine:
    1. Word-level prose differ that groups modifications and translates sentinels into compact superscript badges (`[1]`, `[schmidt2020]`, `{+[2]+}`, `[-[1]-]`).
    2. Key-value citation differ that isolates template parameter changes (`|pages=`, `|url=`, etc.) while suppressing unchanged boilerplate.
  * Implemented 3 output formatters: Section-scoped terminal ANSI renderer, compact git-style `--stat` summary, and structured `--json` emitter for browser gadgets.
  * Added auto-detection for standard Git external diff driver invocations (`git-refdiff`).
  * Created unit test suite (`tests/test_refdiff.py`) covering XML attributes, sentinel injection, badge status rendering, raw diff isolation, and JSON serialization. All tests pass in 0.002s.
* **RefDiff Design Refinements & User Feedback Alignment:**
  * **Raw `<ref>` Span Diffing (No Template Decoding):** Completely removed custom template parameter parsing/decoding logic per user directive. The engine now performs direct, raw word-level diffs on the full encapsulating `<ref name="...">...</ref>` tags, eliminating maintenance complexity and ensuring 100% fidelity to wikitext formatting.
  * **1:1 Prose Badge & Citation Sync with Option A (`[~name~]`):**
    * Dropped verbose `name=` badge prefixes in favor of direct reference names (`[schmidt2020]` or `[ref1]`).
    * Adopted diff tilde notation (`[~schmidt2020~]`) in bold yellow for modified references in both prose badges and citation headers.
    * Ensured that even on ref-only changes, the prose sentence is displayed annotating the affected reference badge (`[~name~]`) so reviewers immediately understand the claim context.
    * Added synchronized badge indicators in `--stat` summary (e.g. `Refs: 1 modified ([~schmidt2020~])`).
  * **Live Wikipedia Revision CLI Fetching (`refdiff.py`):**
    * Added direct Wikipedia diff fetching over HTTP via stdlib `urllib.request` (`python3 refdiff.py <URL>` or `python3 refdiff.py --diff <rev_id>`).
    * Resolves comparison endpoints via the MediaWiki Action API (`action=compare`), parses JSON slots, and pipes revisions straight into the decoupled diff engine.
  * **Zero-Loss In-Place MediaWiki User Script (`refdiff.js`):**
    * Completely discarded synthetic replacement diff tables to preserve 100% of native MediaWiki elements: revision metadata headers (author, timestamp, edit summary), line numbers (`Line 101:`), context rows, and embedded file previews.
    * Implemented in-place DOM row manipulation: replaces `<ref>` tags in changed prose rows with direct inline badges (`⟨name⟩`, `⟨~name~⟩`), converts rows without remaining prose changes to neutral context appearance, and inserts native citation diff rows (`<tr class="refdiff-cit-row">`) directly underneath.
    * Added standard UserScript metadata block for Tampermonkey, Violentmonkey, and Greasemonkey compatibility, plus a 1-line loader snippet for Wikipedia `Special:MyPage/common.js`.
    * Implemented entity-safe attribute regex parsing (`&lt;ref\b((?:(?!&gt;|\/&gt;)[\s\S])*?)...`) resolving HTML entity clipping bugs.
    * Implemented multi-pass citation pairing: (1) matching by explicit `name`, (2) matching identical text content, (3) positional order fallback. Eliminates false modification cascading when citations are inserted at the start of a paragraph.
    * Verified live on English Wikipedia (`Solar System diff=1372329011`) in Chromium CDP across both Light and Dark modes. Confirmed instantaneous zero-loss toggle between Decoupled and Standard Wikidiff.
* **UI Polish, Native OOUI Integration & Visual Ergonomics:**
  * **Native MediaWiki OOUI Diff Toolbar Integration:** Moved the RefDiff button directly into Wikipedia's native mode switcher (`.ve-init-mw-diffPage-diffMode .oo-ui-buttonSelectWidget`) immediately adjacent to `[[]] Wikitext` (`[ 👁 Visual ] [ [[]] Wikitext ] [ ⧉ RefDiff ] Inline ( )`), seamlessly matching Wikipedia's button styling, dark/light theme tokens, and inline diff toggle.
  * **Mathematical Angle Bracket Notation (`⟨ref1⟩`, `⟨~ref3~⟩`):** Replaced square brackets `[...]` with mathematical angle brackets across `refdiff.js`, `refdiff.py`, and specifications, eliminating visual and syntactic collisions with Wikipedia's link highlighting (`[external link]` and `[[wikilink]]`).
  * **Citation Diff Row Prefixing:** Citation diff rows appended directly below the prose line now start with their matching badge (`⟨~ref3~⟩ <ref>...`) in gold/amber highlight, immediately connecting the prose badge to the citation change.
  * **Diff Header Minimalism:** Removed redundant text summary (`(Refs: ...)`) from the diff prefix bar to strictly maintain Wikipedia's clean, native header aesthetics.
  * **Subtle Secondary Styling for Unmodified References:** Replaced link-blue styling (`#0645ad` / `#6da2ff`) and bold weight on `.ref-badge` with Wikipedia's native secondary text color (`var(--color-subtle, #72777d)` in light mode, `#8c9196` in dark mode, normal font weight). Unchanged references blend naturally into prose context without mimicking hyperlinks or drawing false review attention.
  * **Global On-Wiki Deployment & OOUI Container Resilience:**
    * Published globally to Meta-Wiki ([`m:User:Powercycler/refdiff.js`](https://meta.wikimedia.org/wiki/User:Powercycler/refdiff.js)) and enabled for cross-wiki use across all language Wikipedias via [`m:Special:MyPage/global.js`](https://meta.wikimedia.org/wiki/Special:MyPage/global.js).
    * Enhanced toolbar compatibility to seamlessly support both SSR `.oo-ui-buttonGroupWidget` and client-transformed `.oo-ui-buttonSelectWidget` containers with capture-phase event delegation and `MutationObserver` re-rendering resilience.
    * Live on-wiki functionality confirmed working across diff views.
  * **Document Appearance Order Sorting:**
    * Resolved non-sequential anonymous citation numbering (`ref1`, `ref3`, `ref2`) caused by multi-pass matching adding identical citations before modified ones.
    * Sorted citation pairs by their document index prior to numbering, ensuring citations strictly count `ref1`, `ref2`, `ref3` in natural reading order.
  * **Single-Sided Addition & Deletion Row Decoupling:**
    * Extended `applyDecoupling()` to process change rows that contain only `.diff-addedline` or `.diff-deletedline` (such as whole paragraph additions/deletions or `wikidiff2` line replacements).
    * Built comprehensive 5-scenario test suite (`tests/comprehensive_test.html`) and verified against official Wikipedia API `action=compare` `wikidiff2` output in Chromium CDP across Light and Dark themes.
  * **CI Pipeline & JavaScript Linting:**
    * Configured ESLint (`.eslintrc.json`) tailored for browser user scripts, MediaWiki globals (`mw`), and Node unit tests.
    * Added `package.json` with standard npm lifecycle scripts (`npm run lint`, `npm test`, `npm run ci`).
    * Expanded JS unit test suite (`tests/test_pairing.js`) with tests for pure additions, pure deletions, and self-closing tags.
    * Set up GitHub Actions workflow (`.github/workflows/ci.yml`) to automatically test Node (20.x, 22.x) and Python (3.10, 3.12) matrices on push and pull requests.





