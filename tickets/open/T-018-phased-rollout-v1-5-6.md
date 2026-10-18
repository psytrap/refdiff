# Ticket 018: Phased Rollout of Release Candidate (v1.5.6)

* **Status:** In Progress
* **Date:** 2026-10-18
* **Scope & Relevant Files:** `RELEASE_RUNBOOK.md`, `refdiff.js`, `refdiff.wiki`, `scripts/check_live_deployment.js`, `scripts/bump_version.js`, `tests/test_deployment.js`, `tests/test_live_benchmarks.py`

## Description & Context
Release candidate **`v1.5.6`** bundles the production fix for the `wikidiff2` paragraph-merge and sentence-append closing tag boundary displacement defect (Rule 7b in `normalizeDiffTags`, T-016), non-technical refinements across repository specifications (corporate buzzword eradication per T-043, positive tone and language rules, and clean visual status indicators), neutral Wikipedia tone refinements in `refdiff.wiki`, and test suite expansion to 140 tests.
All pre-flight quality gates (unit tests, real-DOM JSDOM suites, deployment gates, live CDP benchmarks, and interactive user diff inspection) have passed cleanly.
Ticket 018 tracks the active phased on-wiki rollout across deployment rings under the repository's Strict Zero Deployment Automation Policy.

## Criteria
- [x] Clear all automated pre-flight quality gates:
  - [x] **Version Manifest Synchronization:** Bumper executed (`node scripts/bump_version.js patch`), synchronizing `v1.5.6` across `package.json`, `package-lock.json`, `refdiff.js`, and `refdiff.wiki`.
  - [x] **Lint & Static Hygiene (`npm run lint`):** 0 ESLint errors, 0 warnings across all source, test, and script files.
  - [x] **Unit & DOM Test Suites (`npm test`):** 140/140 tests passing across all 15 suites in ~250ms.
  - [x] **Deployment Release Gate (`node tests/test_deployment.js`):** 10/10 deployment integrity checks passing.
  - [x] **Live Browser Verification (`npm run test:live`):** 8/8 checks passed in Chromium CDP.
  - [x] **Live Benchmark Suite (`npm run test:bench`):** 6/6 canonical diffs verified with byte-for-byte Memento roundtrip (Bihar, Odoacer, Zagreb 114 refs, Cosmic Inflation, Donnie Brasco, Leonardo Torres Quevedo).
- [x] **Interactive User Inspection Sign-Off:**
  - Launch live monkey-patched Chromium CDP session (`scripts/run_persistent_cdp_patch.py`).
  - User inspection completed and signed off on Benny Indra Ardhianto (`diff=1337298010`): *"Confirmed. looks good"*.
- [ ] **Ring 0 (Release Baseline):** Commit working tree changes and create tag `v1.5.6`.
- [ ] **Ring 1 (Meta-Wiki Script Lead):** Manually publish `refdiff.js` payload to `m:User:Powercycler/refdiff.js`.
- [ ] **Ring 2 (English Wikipedia Early Testing, Pointer & Docs):**
  - Verify early testing on `en:User:Powercycler/common.js`.
  - Update canonical SHA pointer `en:User:Powercycler/refdiff.js` pinned to the new Meta-Wiki revision ID.
  - Publish updated documentation lead `refdiff.wiki` to `en:User:Powercycler/RefDiff` (`| version = 1.5.6`).
- [ ] **Post-Shipment Live Parity Audit:** Run `npm run check:deploy` to verify 100% byte-for-byte synchronization across all 6 Wikimedia endpoints.

## Execution Notes
1. **Pre-Flight Gate Status (Cleared ✅):**
   - Linting, unit tests (140/140), and deployment checks (10/10) all passing.
   - Version manifest synchronized to `v1.5.6`.
   - Live CDP benchmark suite (6/6) passing.
2. **Interactive Live Verification:**
   - Evaluated `Benny Indra Ardhianto` (`diff=1337298010`).
   - Verified that Rule 7b in `normalizeDiffTags` successfully unbundled the inline `<ins>` boundary shift, cleanly extracting citation 1, rendering prose without raw markup leakage, and injecting 2 citation rows (`⟨+ref2+⟩`, `⟨+ref3+⟩`).
   - Verified that footnote anchors (`#cite_note-4`, `#cite_note-5`, `#cite_note-6`) resolve accurately via persistent identifier URL matching.
   - User confirmed live visual inspection in chat: *"Confirmed. looks good"*.
3. **Current Rollout Stage:**
   - Pre-flight gates and visual sign-off complete.
   - Awaiting maintainer execution of on-wiki publication across Ring 0 (tag `v1.5.6`), Ring 1 (`m:User:Powercycler/refdiff.js`), and Ring 2 (`en:User:Powercycler/refdiff.js`).
