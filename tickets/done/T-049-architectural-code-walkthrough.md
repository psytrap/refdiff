# Ticket 049: Architectural Code Walkthrough with Representative Execution Case

- **Status:** Done
- **Priority:** Normal
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `CODE_WALKTHROUGH.md` (new document) or `ARCHITECTURE.md` (§5 Lifecycle Walkthrough)
  - `DESIGN.md`
  - `REVIEW_GUIDE.md`
  - `refdiff.js`
  - `tickets/INDEX.md`

---

## Description & Context
Author an approachable, pedagogical code walkthrough that provides new maintainers, contributors, and reviewers with an easy onboarding guide to how RefDiff works under the hood, structured around a simple, representative diff execution case:

1. **Concrete Representative Diff Case:**
   Frame the entire walkthrough around a minimal, relatable MediaWiki diff row:
   - Left (Deleted): `The planet has an atmosphere.<ref name="smith2020">{{Cite book|title=Old Atmosphere}}</ref>`
   - Right (Added): `The planet has a dense atmosphere.<ref name="smith2020">{{Cite book|title=New Atmosphere}}</ref>`
   This single example showcases simultaneous prose diffing, reference extraction, attribute reuse, heuristic pairing, badge substitution, and decoupled citation row generation.

2. **Step-by-Step Execution Lifecycle:**
   Break down the execution flow chronologically from diff load to teardown:
   - **Phase 1: Detection & Lifecycle Hooking (`src/init.js`):** `isDiffPage()` URL/DOM detection, `mw.hook('wikipage.diff')` listener, and OOUI mode switch button mounting.
   - **Phase 2: Memento Capture (`src/memento.js`):** Snapshotting original `table.diff` DOM rows for byte-for-byte in-place restoration.
   - **Phase 3: Lexical Extraction (`src/parser.js`):** Scanning `.diff-addedline` and `.diff-deletedline` with `parseRefs()`, regex boundary handling, and template parameter tokenization.
   - **Phase 4: Heuristic Reference Pairing (`src/pairing.js`):** 3-pass heuristic pairing matching identical names, similar wikitext, and positional proximity.
   - **Phase 5: Transformation Pipeline (`src/pipeline.js`):** Replacing prose citation spans with mathematical angle badges (`⟨ref1⟩`), generating `.refdiff-cit-row` elements, and preserving native `diffchange` highlights.
   - **Phase 6: Safe DOM Rendering (`src/renderer.js`):** Native DOM construction via XSS-safe `el()`, attribute whitelisting, and floating preview card mounting.
   - **Phase 7: Interaction & Fail-Open Rollback (`src/memento.js`):** Flash-scrolling on badge click, OOUI toggle behavior, and byte-for-byte `restoreOriginal()` rollback.

3. **Visual Data Flow Diagram:** Include a concise Mermaid flowchart/sequence diagram showing input DOM $\to$ Tokenized Refs $\to$ Paired Slots $\to$ Transformed DOM $\to$ Restored DOM.
4. **Contributor Quick Reference Map:** 1-to-1 table linking virtual source components to their respective implementation functions in `refdiff.js` and unit test files under `tests/`.

---

## Criteria
- [x] Author `CODE_WALKTHROUGH.md` (or add dedicated walkthrough chapter to `ARCHITECTURE.md`) based on a minimal representative diff case
- [x] Detail each execution phase (Detection $\to$ Memento $\to$ Parsing $\to$ Pairing $\to$ Pipeline $\to$ Rendering $\to$ Rollback)
- [x] Provide a visual sequence/data-flow diagram illustrating the transformation lifecycle
- [x] Provide a contributor orientation table mapping lifecycle phases to `refdiff.js` functions and `tests/` test files
- [x] Verify all markdown file links and cross-references
- [x] All test suites passing (`npm test`)
- [x] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
1. **Document Authored (`CODE_WALKTHROUGH.md`):**
   - Created a comprehensive, pedagogical, and accessible technical walkthrough for new contributors, maintainers, and reviewers.
   - Used clean visual indicators & emojis (📊, 📋, 🧭, 🎯, 🛡️, 🟢, 🟡, 🔴, 🔵) in headings and tables, written in natural, concise technical English with zero corporate jargon.
   - Structured around a concrete representative diff case with dual edits:
     - Left (Deleted): `The planet has an atmosphere.<ref name="smith2020">{{Cite book|title=Old Atmosphere}}</ref>`
     - Right (Added): `The planet has a dense atmosphere.<ref name="smith2020">{{Cite book|title=New Atmosphere}}</ref>`
   - Detailed the 7 sequential phases:
     - **Phase 1: Detection & Lifecycle Hooking (`src/init.js`, `src/mode_coordinator.js`):** URL and DOM verification via `isDiffPage()`, hook registration on `mw.hook('wikipage.diff')`, OOUI `ButtonOptionWidget` `#refdiff-ooui-btn` mounting with fallback bar support, and preference checking.
     - **Phase 2: Memento Capture (`src/memento.js`):** In-place snapshotting of live row nodes (`delDiv`, `addDiv`, `delTd`, `addTd`, `delHtml`, `addHtml`, `markers`) into `state.modifiedRows` preventing detachment of MediaWiki event closures (`inlineFormatToggle.js`).
     - **Phase 3: Lexical Extraction (`src/parser.js`, `src/utils.js`):** Entity and boundary shift normalization (`normalizeDiffTags`), lookahead-constrained tokenization (`REF_REGEX`, `TEMPLATE_REF_REGEX`), and extraction of parsed `RefMatch` objects.
     - **Phase 4: Heuristic Reference Pairing (`src/pairing.js`):** 3-pass heuristic matching (explicit name match $\to$ clean content equality $\to$ positional alignment) associating the deleted and added references into a paired slot.
     - **Phase 5: Transformation Pipeline (`src/pipeline.js`):** Prose badge substitution (`createProseBadge`), preserving native `diffchange` highlights (`<ins class="diffchange">dense </ins>`), and generating citation row descriptors (`modifiedCits`).
     - **Phase 6: Safe DOM Rendering (`src/renderer.js`, `src/anchor.js`):** XSS immunity via native element builder `el()`, attribute whitelisting, isolated citation row classes (`refdiff-cit-addedline`, `refdiff-cit-deletedline`), and floating preview cards (`.refdiff-preview-card`).
     - **Phase 7: Interaction & Fail-Open Rollback (`src/pipeline.js`, `src/memento.js`):** In-table badge jump navigation with `@keyframes refdiff-flash` highlight animation, byte-for-byte Memento restoration (`restoreOriginal()`), and top-level try/catch fail-open boundaries.
   - Visual Mermaid sequence diagram showing the data flow across all 7 phases.
   - Contributor Quick Reference Map linking virtual modules (`src/`) to physical line numbers in `refdiff.js`, test suites in `tests/`, and key verification invariants.

2. **Cross-References & Documentation Links:**
   - Linked `CODE_WALKTHROUGH.md` in `README.md` under Documentation & Project Governance.
   - Added prominent onboarding tip linking `CODE_WALKTHROUGH.md` in `ARCHITECTURE.md`.

3. **Quality Gates & Verification:**
   - Executed `npm test`: all 141 tests passed (100% success rate across all unit, component, JSDOM, and deployment pre-flight checks).
   - Executed `npm run lint`: 0 ESLint errors and 0 warnings.
