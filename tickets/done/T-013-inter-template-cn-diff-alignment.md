# Ticket 013: Inter-Template Diff Fragment Alignment (Citation Needed & cn)

* **Status:** Done
* **Date:** 2026-10-14
* **Scope & Relevant Files:** `refdiff.js` (`src/utils.js`, `src/cit_row.js`, `src/memento.js`, `src/pipeline.js`), `tests/test_utils.js`, `tests/test_parser.js`, `tests/test_pipeline.js`, `tests/test_jsdom.js`

## Description & Context
Semi-automated citation patrol workflows (such as Alaexis's `CNfirmed` or `ProveIt`) frequently replace unreferenced `{{citation needed|...}}` or `{{cn|...}}` maintenance tags with full `<ref>{{cite ...}}</ref>` book or web citations.
In [Dwight D. Eisenhower (`diff=1380014667`)](https://en.wikipedia.org/w/index.php?title=Dwight_D._Eisenhower&diff=prev&oldid=1380014667), replacing `{{citation needed|date=August 2025}}` with two book citations triggered a severe diff entanglement artifact:
1. MediaWiki's character differ (`wikidiff2`) matched identical shared tokens (`{{`, `|date=`, `}}`) between the maintenance template and the new citation template.
2. Only the opening `<ref>` and closing `</ref>` tags were wrapped in `<ins class="diffchange">` spans, while the template body was interspersed with unhighlighted tokens.
3. `hasBalancedDiffTags` detected an unbalanced closing `</ins>` and rejected the match to prevent malformed DOM mutations.
4. Consequently, the citations remained trapped inline in prose and were never decoupled into citation rows.

## Criteria
- [x] **Strict Scope Invariant:** Restrict normalization strictly to `{{citation needed|...}}` and its canonical alias `{{cn|...}}` (bare and parameterized); avoid unbounded generic template matching to preserve parser performance and eliminate side effects.
- [x] Implement `hasDeletedCn()` to detect deleted/modified citation-needed templates.
- [x] Implement `normalizeCnDiffPair()` to align the deleted template into a single cohesive `<del class="diffchange diffchange-inline">` span and consolidate the added citation block into a cohesive `<ins class="diffchange diffchange-inline">` unit guarded by `isPureRefSequence()` to ensure zero adjacent prose is swallowed.
- [x] Wire `normalizeCnDiffPair` defensively into `applyDecoupling`, `transformProseCells`, and `parseRefs`.
- [x] Verify decoupling on Dwight D. Eisenhower (`diff=1380014667`): 2 citation rows cleanly decoupled, badges rendered in prose, clean deletion in deleted line, and 100% byte-for-byte Memento restoration.
- [x] Expand automated regression test suite to 129/129 tests passing.

## Execution Notes
1. **Diagnosis & Scope:**
   - Isolated the `wikidiff2` token-matching behavior on `{{` and `|date=`.
   - Constrained normalization strictly to `/(?:citation needed|cn)\b/i`.
2. **Implementation (`src/utils.js`):**
   - Added `hasDeletedCn(delHtml)` and `normalizeCnDiffPair(delHtml, addHtml)`.
   - Built `isPureRefSequence()` validating that only references and whitespace are grouped into the replacement `<ins>` block.
3. **Automated Test Coverage:**
   - Added unit tests in `tests/test_utils.js` (detecting bare and parameterized forms, rejecting unrelated templates like `{{clarification needed}}`).
   - Added parsing tests in `tests/test_parser.js` and pipeline tests in `tests/test_pipeline.js`.
   - Added real DOM test in `tests/test_jsdom.js`. Total test suite expanded to **129/129 passed**.
4. **Live Verification:**
   - Verified live in Chromium CDP against `diff=1380014667`: clean citation rows, zero prose leakage, perfect Memento toggle roundtrip.
