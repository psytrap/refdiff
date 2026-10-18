# Ticket 004: Inline-Modified Mode, Whitespace Preservation, and diffedit Interoperability

* **Status:** Done
* **Date:** 2026-10-11
* **Scope & Relevant Files:** `refdiff.js` (`src/mode_coordinator.js`, `src/utils.js`, `src/events.js`, `src/renderer.js`), `tests/test_pipeline.js`, `tests/test_utils.js`

## Description & Context
Several real-world diff inspections revealed critical ergonomic and compatibility requirements:
1. **Configurable Inline-Modified Mode:** Editors frequently prefer seeing minor typo fixes in existing citations directly inline with native intra-line diff highlights (`<del>`/`<ins>`), rather than scrolling down to separate citation rows.
2. **Whitespace-Only Diff Masking ([Cosmic inflation `diff=1379470949`]):** When an editor added a space (`<ins class="diffchange diffchange-inline"> </ins>`) to prose adjacent to citations, RefDiff's empty tag cleanup regex `/<(ins|del)\b[^>]*>\s*<\/\1>/gi` stripped the span, leaving the row with zero diff tags and falsely converting it to an unchanged context row.
3. **Single-Sided Paragraph Additions ([Kim Domingo `diff=1379491398`]):** Single-sided row additions containing citation callouts were skipped by pairing logic if lacking a paired deleted row, and split tags (`/<del>&gt;`) broke markup.
4. **Tool Collision with `diffedit.js`:** The in-diff section editing gadget `diffedit.js` enumerated all table rows; injected citation rows caused line offset desynchronization and edit collision.

## Criteria
- [x] Implement the configurable `[ ] Inline modified refs` mode: unchanged citations collapse to compact badges, modified citations remain inline in prose with prepended badge (`⟨~label~⟩`) and native diff highlights, while pure additions/deletions decouple into separate rows.
- [x] Mount the inline mode checkbox seamlessly in the diff toolbar to the left of the mode switcher without layout shift.
- [x] Fix empty diffchange tag cleanup in `normalizeDiffTags` to strictly target `/<(ins|del)\b[^>]*><\/\1>/gi` (zero whitespace), preserving prose whitespace edits with native highlighting.
- [x] Support single-sided paragraph additions and normalize `/<del>&gt;` split self-closing tags (Kim Domingo).
- [x] Establish full interoperability with `diffedit.js`: assign isolated cell classes (`refdiff-cit-addedline`) so line enumerators skip citation rows, and observe `.diff-editmode` to automatically revert RefDiff to clean wikitext mode during inline editing.

## Execution Notes
1. **Mode Coordinator & Toolbar UI:**
   - Added preference state management (`isInlineModifiedPreferred`, `setInlineModifiedPreferred`).
   - Injected `#refdiff-inline-toggle` into the diff toolbar.
2. **Cosmic Inflation Whitespace Fix:**
   - Modified empty tag cleanup in `src/utils.js` to avoid matching `\s+` within empty tags. Validated that whitespace diffs retain blue highlighting and `+`/`-` line markers.
3. **Kim Domingo Tag Normalization:**
   - Added Rule 3 to `normalizeDiffTags` shifting `/<del>&gt;` $\to$ `&gt;<del>/</del>`.
4. **`diffedit.js` Coexistence:**
   - Citation rows use isolated classes (`refdiff-cit-row`, `refdiff-cit-deletedline`, `refdiff-cit-addedline`).
   - Attached `MutationObserver` on `table.diff` monitoring the `.diff-editmode` class: switches to Wikitext mode on edit start and restores RefDiff on save/cancel.
