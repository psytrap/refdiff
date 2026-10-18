# Ticket 025: Automated Showcase Test in Rollout Protocol

- **Status:** Todo
- **Priority:** Normal
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `scripts/check_live_deployment.js`
  - `tests/comprehensive_old.wiki`
  - `tests/comprehensive_new.wiki`
  - `tests/test_live_benchmarks.py`

---

## Description & Context
Integrate formal showcase diff verification into the rollout protocol and deployment auditor:
1. Reconcile on-wiki showcase diff `en:User:Powercycler/RefDiff/Show_case` (`diff=1380240829&oldid=1380240443`) with canonical local wikitext sources in `tests/comprehensive_old.wiki` and `tests/comprehensive_new.wiki`.
2. Auditor Target Integration (`scripts/check_live_deployment.js`): Add the en.WP Showcase diff page as Target #7 in `check_live_deployment.js` to automatically verify remote page availability, revision IDs, and diff API health.
3. Automated Live Smoke Test Gate: Include a live CDP smoke test verifying that RefDiff boots and decouples citations across all showcase change sections (modified, shortened footnote, pure add, pure del, template variations).
4. Documentation Parity: Verify showcase diff links across `refdiff.wiki` and documentation resolve cleanly.

---

## Criteria
- [ ] Add showcase diff endpoint check to `scripts/check_live_deployment.js`
- [ ] Add automated smoke test in live benchmark runner for `diff=1380240829`
- [ ] Verify all change sections decouple cleanly with byte-for-byte Memento restoration
- [ ] All test suites passing (`npm test`)
- [ ] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
