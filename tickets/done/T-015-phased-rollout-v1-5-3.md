# Ticket 015: Phased Production Rollout of RefDiff v1.5.3

* **Status:** Done
* **Date:** 2026-10-17
* **Scope & Relevant Files:** `ROLLOUT_PLAN.md`, `refdiff.js`, `refdiff.wiki`, `scripts/check_live_deployment.js`, `package.json`

## Description & Context
Following the completion of Visual Diff isolation (T-010), inter-template diff alignment for `{{citation needed}}` (T-013), and two-tier DOM identifier matching (T-014), T-015 executed the phased production rollout of **`v1.5.3`** across all deployment rings.

## Criteria
- [x] Clear all pre-flight quality gates:
  - Version manifest synchronization across `package.json`, `package-lock.json`, `refdiff.js`, and `refdiff.wiki`.
  - Clean static linting (0 ESLint errors, 0 warnings).
  - 138/138 unit and DOM test suites passing in Node/JSDOM.
  - 10/10 deployment integrity gates passing in `tests/test_deployment.js`.
  - 8/8 live browser checks passing in `tests/test_live_cdp.py`.
  - 5/5 live benchmark diffs passing with byte-for-byte Memento roundtrip in `tests/test_live_benchmarks.py`.
- [x] **Ring 0 (Release Baseline):** Commit and tag `v1.5.3` ([commit `fa9e7f2`](https://github.com/psytrap/einzelnachweise/commit/fa9e7f2), tag `v1.5.3`, SHA-1: `46c5f070`).
- [x] **Live User Inspection Gate:** Launch dedicated interactive Chromium CDP session (`scripts/run_persistent_cdp_patch.py`); obtain user review and sign-off on live diffs (Dwight D. Eisenhower, Showcase, Bihar).
- [x] **Ring 1 (Meta-Wiki Script Lead):** Deploy `v1.5.3` payload to `m:User:Powercycler/refdiff.js` (Rev **`31176975`**, saved 2026-10-17 06:17 UTC).
- [x] **Ring 2 (English Wikipedia Early Testing, Pointer & Docs):**
  - Verify on `en:User:Powercycler/common.js` (Rev **`1380682062`**).
  - Update canonical SHA pointer `en:User:Powercycler/refdiff.js` (Rev **`1380681839`**) pinned to Meta Rev `31176975`.
  - Update documentation lead `en:User:Powercycler/RefDiff` (Rev **`1380682190`**, `| version = 1.5.3`).
- [x] **Post-Shipment Audit:** Confirm 100% synchronization across all Wikimedia endpoints via `node scripts/check_live_deployment.js`.

## Execution Notes
1. **Pre-Flight Gates:**
   - Ran `node scripts/bump_version.js patch` $\to$ `v1.5.3`.
   - `npm run preflight` executed with 100% green pass.
2. **On-Wiki Rollout Execution:**
   - Ring 0: Tagged `v1.5.3` at `fa9e7f2`.
   - Ring 1: Updated Meta-Wiki script lead (Rev `31176975`).
   - Ring 2: Updated English Wikipedia SHA pointer (Rev `1380681839`) and docs lead (Rev `1380682190`).
3. **Verification:**
   - Live deployment auditor (`scripts/check_live_deployment.js`) verified all 6 Wikimedia endpoints in complete byte-for-byte synchronization.
