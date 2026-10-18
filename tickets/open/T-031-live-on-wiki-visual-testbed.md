# Ticket 031: Live On-Wiki Visual Inspection Environment

- **Status:** Todo
- **Priority:** High
- **Tier / Phase:** Tier 2: Community Reviewer Scale (50-User Milestone)
- **Scope & Relevant Files:**
  - `RELEASE_RUNBOOK.md`
  - `scripts/run_persistent_cdp_patch.py`
  - `scripts/inspect_diff.py`

---

## Description & Context
Retire legacy local HTTP visual test servers (`http://127.0.0.1:8000/refdiff.js`) in favor of authenticated live on-wiki visual inspection:
1. Eliminate local HTTP server dependencies to avoid browser mixed-content restrictions on HTTPS Wikipedia diffs.
2. Standardize `scripts/run_persistent_cdp_patch.py` as the canonical tool for interactive reviewer sign-offs (Chromium CDP port 9222 with WebSocket hold-open and live script injection).
3. Document live visual inspection workflows in `RELEASE_RUNBOOK.md` and `REVIEW_GUIDE.md`.

---

## Criteria
- [ ] Retire local HTTP visual inspection dependencies in `scripts/inspect_diff.py`
- [ ] Standardize persistent CDP patch script with support for arbitrary diff URLs and live tab activation
- [ ] Update `RELEASE_RUNBOOK.md` runbook with updated interactive review instructions
- [ ] All test suites passing (`npm test`)
- [ ] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
