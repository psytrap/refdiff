# Ticket 017: Documentation Synchronization, CDP Reconnection Hardening, and Regex Audit

* **Status:** Done
* **Date:** 2026-10-17
* **Scope & Relevant Files:** `ARCHITECTURE.md`, `AUDIT_STRATEGY.md`, `README.md`, `REFDIFF.md`, `ROLLOUT_PLAN.md`, `TEST_PLAN.md`, `proposal/CONCEPT.md`, `scripts/run_persistent_cdp_patch.py`, `package.json`

## Description & Context
Following the implementation of Rule 7b in `v1.5.4`/`v1.5.5`, project artifacts and tooling required comprehensive maintenance:
1. **Documentation Drift:** 9 core architecture and rollout documents had version numbers and test counts drifting across `v1.4.3`, `v1.5.0`, `v1.5.3`, and `v1.5.5`.
2. **CDP Daemon Fragility:** The persistent monkey-patch script (`scripts/run_persistent_cdp_patch.py`) crashed immediately if Chromium closed or a WebSocket connection dropped, lacking auto-reconnect logic and remote script blocking.
3. **Parser Architecture & Regex Audit:** An in-depth audit of regular expressions (`REF_REGEX`, `TEMPLATE_REF_REGEX`, `normalizeDiffTags`) was required to evaluate catastrophic backtracking risks, nesting boundaries, and tokenizer evolution.

## Criteria
- [x] Synchronize version numbers (`v1.5.5`) and test suite metrics (140 unit/DOM tests across 15 suites, 10 deployment gates, 6 live CDP benchmarks) across all 9 project documentation files.
- [x] Neutralize tone in `refdiff.wiki` (§1.1 and §7) with objective Wikipedia-compliant phrasing.
- [x] Harden `scripts/run_persistent_cdp_patch.py`:
  - Add top-level reconnection loop to survive Chromium restarts and WebSocket drops.
  - Implement `Network.setBlockedURLs` (`*refdiff.js*`) to prevent on-wiki version collisions.
  - Arm `Page.addScriptToEvaluateOnNewDocument` and add clean-up reset before re-evaluating.
- [x] Conduct the Regex Parser Architecture Audit (`ARCH-REPORT-2026-10-17-REGEX`) and formulate roadmap items T-021 (formal citation suffix tokenization) and T-019 (surface live deployment drift in pre-flight).
- [x] Ensure all 140 tests pass with 0 ESLint warnings.

## Execution Notes
1. **Documentation Synchronization:**
   - Synchronized `ARCHITECTURE.md`, `AUDIT_STRATEGY.md`, `README.md`, `REFDIFF.md`, `ROLLOUT_PLAN.md`, `TEST_PLAN.md`, `proposal/CONCEPT.md`, and `package.json`.
   - Verified that all documentation links and metrics align with `v1.5.5` and 140 tests.
2. **CDP Script Hardening:**
   - Updated `scripts/run_persistent_cdp_patch.py` with `try...except (ConnectionClosed, IncompleteReadError) -> sleep(2) -> reconnect`.
   - Added network blocking for `*refdiff.js*` and clean Memento reset expression prior to re-injection.
3. **Regex Parser Audit:**
   - Evaluated `REF_REGEX` and `normalizeDiffTags` rules. Confirmed that lookahead bounds prevent catastrophic backtracking.
   - Formulated T-021 in `LOG.md` to transition citation page suffixes (`{{rp}}`) to a formal AST-like tokenizer in future sprints.
   - Formulated T-019 to surface on-wiki deployment drift during version bumps.
4. **Verification:**
   - `npm test`: 140/140 passed.
   - `node tests/test_deployment.js`: 10/10 checks passed.
   - 0 ESLint warnings.
