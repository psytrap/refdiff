# Ticket 011: Comprehensive Visual Inspection Across All Change Cases

* **Status:** Done
* **Date:** 2026-10-14
* **Scope & Relevant Files:** `scripts/capture_full_audit.py`, `scripts/capture_live_visual.py`, `refdiff.js` (`src/renderer.js`, `src/cit_row.js`), `LOG.md` (§2.1 T-011)

## Description & Context
To ensure visual quality, cognitive ergonomics, and zero regression across diverse diff configurations, T-011 established a comprehensive visual inspection matrix.
The inspection covers all primary citation change categories, composite multi-ref lines, and theme variants (Vector 2022 Light and Dark modes), verifying that prose rows and decoupled citation rows render with pixel-perfect MediaWiki fidelity.

## Criteria
- [x] **Pure Addition (`isAdd`):** Newly added citations appear in the right column (`diff-addedline`) with empty left cells (`diff-empty`); citation body is unadorned (NO intra-line `<ins class="diffchange">` around the entire citation text); displays addition badge (`⟨+name+⟩` / green).
- [x] **Pure Deletion (`isDel`):** Removed citations appear in the left column (`diff-deletedline`) with empty right cells; citation body is unadorned (NO intra-line `<del class="diffchange">`); displays deletion badge (`⟨-name-⟩` / red).
- [x] **Intra-Line Modification (`isMod`):** Modified citations appear in both columns with modification badge (`⟨~name~⟩` / amber); native token-level `<del>`/`<ins>` diff highlighting is strictly preserved on changed parameters (e.g. `pages=50–55` $\to$ `pages=80–88`), leaving unchanged tokens unadorned.
- [x] **Unchanged / Normalized Citations (`norm`):** Reordered reference callouts retain normal badge styling without false modification indicators.
- [x] **Multi-Ref & Composite Rows:** Rows with multiple adjacent references having mixed change types render distinct badge callouts in prose and split/paired citation rows.
- [x] **Templates & Footnotes:** Validate full rendering across `{{sfn}}`, `{{harv}}`, `{{efn}}`, and `<references>` block definitions.
- [x] **Theme Invariance:** Validate high contrast visual clarity across Vector 2022 Light and Dark modes.
- [x] Implement automated visual capture scripts (`scripts/capture_full_audit.py` and `scripts/capture_live_visual.py`).

## Execution Notes
1. **Automation & Tooling:**
   - Implemented `scripts/capture_full_audit.py` automating screenshot capture of high-density diffs across Light and Dark themes.
   - Built `scripts/capture_live_visual.py` for focused viewport captures.
2. **Visual Verification Audit:**
   - Validated Pure Addition on Bihar ([`diff=1379207737`](https://en.wikipedia.org/w/index.php?diff=1379207737)).
   - Validated Intra-Line Modification on Odoacer ([`diff=1379543160`](https://en.wikipedia.org/w/index.php?diff=1379543160)).
   - Validated Composite multi-ref rows on Showcase diff ([`diff=1380240829`](https://en.wikipedia.org/w/index.php?title=User:Powercycler/RefDiff/Show_case&diff=1380240829)).
   - Verified that citation bodies in dedicated rows are rendered cleanly without redundant intra-line diff wrappers ([commit `a44d7d1`](https://github.com/psytrap/einzelnachweise/commit/a44d7d1)).
3. **Sign-Off:**
   - Inspection matrix reviewed, approved, and signed off in `LOG.md` (§2.1 T-011).
