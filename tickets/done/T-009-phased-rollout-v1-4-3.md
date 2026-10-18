# Ticket 009: Phased Rollout Infrastructure and v1.4.3 Release

* **Status:** Done
* **Date:** 2026-10-14
* **Scope & Relevant Files:** `ROLLOUT_PLAN.md`, `tests/test_deployment.js`, `scripts/check_live_deployment.js`, `tests/test_live_benchmarks.py`, `scripts/bump_version.js`, `package.json`

## Description & Context
Prior to public deployment on Wikimedia wikis, RefDiff required formal release engineering infrastructure to prevent regressions, enforce security invariants, and orchestrate safe deployments.
Under T-009, the project established:
1. Phased deployment rings (Ring 0 Local Pre-Flight $\to$ Ring 1 Meta Script Lead $\to$ Ring 2 en.WP Pointer & Docs $\to$ Ring 3 Community Pilot).
2. Quality gates enforcing packaging, strict mode, zero `console.log`, size budgets (<120 KB), and Memento rollback fidelity.
3. Automated tools for live API audits, CDP benchmarks, and atomic version bumping.
4. Production release of **`v1.4.3`**.

## Criteria
- [x] Author rollout plan documentation defining the 4-ring phased rollout protocol, pre-flight gates, rollback runbook, and health verification checks (consolidated into [`RELEASE_RUNBOOK.md`](../../RELEASE_RUNBOOK.md)).
- [x] Implement [`tests/test_deployment.js`](../../tests/test_deployment.js) enforcing 10 automated pre-flight checks (nowiki packaging, BOM absence, strict mode, zero `console.log`, version sync across manifest files, size budget).
- [x] Implement [`scripts/check_live_deployment.js`](../../scripts/check_live_deployment.js) querying Wikimedia APIs to verify live revision numbers, timestamps, and SHA-1 hashes against local release files.
- [x] Build [`tests/test_live_benchmarks.py`](../../tests/test_live_benchmarks.py) for automated live diff benchmarking in Chromium via CDP port 9222.
- [x] Build atomic version bumper [`scripts/bump_version.js`](../../scripts/bump_version.js) managing two-phase version cadence.
- [x] Tag and execute production rollout of `v1.4.3` across Ring 0, Ring 1 (`m:User:Powercycler/refdiff.js`), and Ring 2 (`en:User:Powercycler/refdiff.js`).

## Execution Notes
1. **Rollout Tooling Delivered:**
   - `ROLLOUT_PLAN.md`: Comprehensive runbook with step-by-step ring checklists.
   - `tests/test_deployment.js`: Automated release gate (`node tests/test_deployment.js`).
   - `scripts/check_live_deployment.js`: Live auditor (`npm run check:deploy`).
   - `tests/test_live_benchmarks.py`: 5 canonical live diff benchmarks (`npm run test:bench`).
   - `scripts/bump_version.js`: Synchronizes `package.json`, `package-lock.json`, `refdiff.js`, and `refdiff.wiki`.
2. **Production Deployment Execution (v1.4.3):**
   - Ring 0: Tagged release `v1.4.3` ([commit `8a1b0bd`](https://github.com/psytrap/einzelnachweise/commit/8a1b0bd)).
   - Ring 1: Published payload to `m:User:Powercycler/refdiff.js` (Rev **`31167174`**, 92.2 KB).
   - Ring 2: Published SHA pointer `en:User:Powercycler/refdiff.js` (Rev **`1380226922`**), documentation lead `en:User:Powercycler/RefDiff` (Rev **`1380227024`**), and userbox (Rev **`1380228630`**).
   - Live Auditor: Verified 100% byte-for-byte synchronization across all endpoints via `npm run check:deploy`.
