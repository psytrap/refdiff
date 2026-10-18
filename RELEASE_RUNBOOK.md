# RefDiff: Rollout and Deployment Plan

> **Scope:** Cross-Wiki Phased Rollout (Rings 0–3) &bull; **Cadence:** Two-Phase (Patch Pre-Flight &bull; Minor Post-Shipment)  
> **Script Lead:** Meta-Wiki (`m.WM`) &bull; **Doc Lead:** English Wikipedia (`en.WP`) &bull; **en.WP Script:** SHA Pointer

---

## 1. 📦 Artifacts & Target Destinations

| Artifact | Source File | On-Wiki Destination (Meta Script Lead & en.WP Doc Lead) |
|:---|:---|:---|
| 📜 **Script Lead (m.WM)** | [`refdiff.js`](refdiff.js) | `m:User:Powercycler/refdiff.js` (Canonical code lead on Meta-Wiki) |
| 🔗 **en.WP Script (SHA Pointer)** | Loader snippet | `en:User:Powercycler/refdiff.js` (SHA pointer / loader forwarding to Meta-Wiki) |
| 📖 **Documentation Lead (en.WP)** | [`refdiff.wiki`](refdiff.wiki) | `en:User:Powercycler/RefDiff` (Authoritative documentation on en.WP) |
| 🌐 **Meta Docs (CDN Tools Page)** | [`meta_refdiff.wiki`](meta_refdiff.wiki) | `m:User:Powercycler/RefDiff` (Meta-Wiki tools page & CDN hub pointing to en.WP) |
| 🧪 **Early Testing Harness** | `common.js` snippet | `en:User:Powercycler/common.js` (Early live testing before SHA pointer uprev) |
| 🖼️ **Showcase Diff** | [`refdiff.wiki`](refdiff.wiki) (§Showcase) | `en:User:Powercycler/RefDiff/Show_case` (Reference test diff: `diff=1380240829`) |
| 🏷️ **Userbox** | [`userbox.wiki`](userbox.wiki) | `en:User:Powercycler/Userbox RefDiff` (User space userbox on en.WP) |
| 💬 **Outreach** | [`proposal/POST.md`](proposal/POST.md) | `en:User talk:Powercycler/RefDiff` (Dedicated feedback talk page) |
| 🐙 **GitHub Remote Repository** | Git repository root | `https://github.com/psytrap/refdiff.git` / `git@github.com:psytrap/refdiff.git` (Canonical public repository baseline & release tags) |

---

## 2. 🛡️ Pre-Flight Quality Gates

All checks must pass before release:
```bash
node scripts/bump_version.js patch                # Patch uprev for pre-flight testing (feature uprev only after shipment)
git diff --stat && git diff                       # Quick diff audit: zero debris & clean hunks (REVIEW_GUIDE §2.8)
npm run inspect && npm run capture                # User visual inspection & full audit capture across change cases (Stage 5)
npm run preflight                                 # Full pre-flight: CI, deployment gates, live CDP & benchmarks (Stage 6)
npm run check:deploy                            # Post-shipment live audit across Wikimedia APIs (final verification)
```
- **Two-Phase Version Strategy, Uprev Cadence & Diff Audit:**
  - *Phase 1 (Pre-Flight Testing):* Execute patch bump (`node scripts/bump_version.js patch`) **only once** to validate release candidate (no feature uprevs during pre-flight).
  - *Phase 2 (Post-Shipment Final Step):* Execute feature bump (`node scripts/bump_version.js minor` or `major`) as final step only when pre-flight was completed, shipment is verified live (`npm run check:deploy`), and feature work is completed with user review.
  - *Diff Audit & Scope:* Before any deployment, assure a formal version uprev is executed across manifests; enforce smaller, focused changes between uprevs (no monolithic diffs); and trigger a diff audit (`git diff --stat && git diff`) per [`REVIEW_GUIDE.md` (§2.8)](REVIEW_GUIDE.md#28-git-diff-as-quick-review-protocol-clean--complete-codebase-hygiene).
- **Syntax & Style:** 0 ESLint errors/warnings (`npm run lint`).
- **Headless Test Suite:** Complete unit & DOM test suite (140 tests) passing in < 250ms (`npm test`).
- **Deployment Pre-Flight:** Automated release gates (`test_deployment.js`): zero BOM, strict `/* <nowiki> */`, zero `~~~~`/`{{subst:}}`, zero `console.log`, valid VM syntax, version sync across manifests, size < 120 KB, userbox tags, rollback Memento fidelity, and deployment consistency.
- **System Integration Fixtures:** Authentic MediaWiki tables (`comprehensive_test.html`, `stress_test_1379409916.html`), OOUI mounting, native inline toggle lock, and byte-for-byte Memento restoration (`test_jsdom.js`).
- **Stress & Benchmark Budget:** < 50ms processing on high-density reference fixtures (`test_benchmarks.js`).
- **Automated Visual Capture Gate (`npm run capture`):** Rollout default: capture automated visual inspection matrices across all change cases (pure additions, deletions, intra-line modifications in Vector 2022 light/dark themes) as permanent visual evidence artifacts.
- **Mandatory Live Human Interactive Review Gate:** Automated captures are intended supporting evidence, but **must never bypass or replace interactive human inspection**. Before deploying to Meta-Wiki (`m:User:Powercycler/refdiff.js`), maintainers must arm a dedicated interactive browser session (Chromium on port 9222 via `scripts/run_persistent_cdp_patch.py`), allow the reviewer to inspect real diffs interactively (testing mode toggles, Reference Previews popups, layout feel, and Memento restoration), and obtain explicit human sign-off. Ring 1 is strictly blocked without this sign-off.
- **Mandatory Live CDP Invariant (Level 4):** We always run live browser CDP tests (`npm run test:live` via port 9222) before any update to `refdiff.js` to verify real DOM decoupling, OOUI mode switcher, Vector 2022 light/dark tokens, and `Extension:Popups` hovercards (`test_live_cdp.py`).
- **Live Benchmark Monkey Patching (`npm run test:bench`):** We test canonical live benchmark diffs (`Bihar` 1379207737, `Odoacer` 1379486498, `Zagreb` 1379409916, `Inflation` 1379470949, `Brasco` 1380017400, `Leonardo` 1380356173) directly in Chromium via CDP monkey patching before on-wiki deployment (`test_live_benchmarks.py`).
- **Live On-Wiki Deployment Auditor (`npm run check:deploy`):** Final verification step: audits remote SHA-1 & revision parity across Wikimedia APIs (`scripts/check_live_deployment.js`) once shipment is complete.

---

## 3. 🚀 Rollout Rings

- **Release Tag & Baseline:** Tag release candidate locally: `git tag -a v<version> -m "Release v<version>"`. Verify clean working tree and release SHA-1 (`refdiff.js`) before on-wiki deployment. Automated `git push` is strictly forbidden; all pushing to remotes is 100% manual.
- **Strict Zero Deployment Automation Policy:** All deployments, on-wiki edits, loader uprevs, and git pushes are performed manually by the maintainer. Automated scripts must never write to remote Wikimedia targets or push git commits.
- **Sole Read-Write Automation Exception (`check_toolpage_installer.py`):** The **single and only exception** to the zero-write rule is [`scripts/check_toolpage_installer.py`](scripts/check_toolpage_installer.py) (`npm run check:installer --press` or `--toggle-roundtrip`). This script is explicitly authorized to interactively press the `Install` / `Uninstall` button on the toolpage (`User:Powercycler/RefDiff`) via Chromium CDP to test that ScriptInstaller triggers proper common.js state transitions in the browser DOM.

### ⚪ Ring 0: Git Release Baseline & GitHub Remote Publication
1. **Remote Origin Configuration:** Configure or verify canonical `origin` remote:
   ```bash
   git remote add origin https://github.com/psytrap/refdiff.git
   # or via SSH:
   git remote add origin git@github.com:psytrap/refdiff.git
   ```
2. **Pre-Push Anonymity & Privacy Scan:** Perform a comprehensive repository scan to ensure zero personal emails and zero absolute user filesystem paths (`/home/<user>/`) exist in tracked files:
   ```bash
   # Verify zero absolute user home paths
   grep -rn --exclude-dir={.git,node_modules} "/home/" .
   # Verify zero personal email addresses
   git grep -inE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
   ```
3. **Working Tree Cleanliness:** Ensure working tree has zero untracked scratch files or leftover artifacts (`git status --ignored`).
4. **Local Quality Gates:** Verify all unit tests, deployment checks, and linter pass cleanly (`npm test && npm run lint`).
5. **Tag Release Candidate:** Create annotated git release tag:
   ```bash
   git tag -a v<version> -m "Release v<version>"
   ```
6. **Manual Git Push:** Push commits and tags to GitHub (automated `git push` is strictly forbidden; all pushing is 100% manual):
   ```bash
   git push origin main
   git push origin v<version>
   ```

### 🛑 Mandatory Pre-Deployment Gate: Live Human Interactive Review
Before advancing to Ring 1, the release candidate must be interactively inspected and approved by the human reviewer in a live browser (Chromium on port 9222 via `scripts/run_persistent_cdp_patch.py`). Automated test passes and visual captures alone do not authorize deployment.

### 🟢 Ring 1: Update Meta-Wiki Script Lead (`m.WM refdiff.js`) — Requires Human Sign-Off
1. **Script Lead (m.WM):** Update `m:User:Powercycler/refdiff.js` with local [`refdiff.js`](refdiff.js).
2. **Meta Docs:** Set `m:User:Powercycler/RefDiff` as soft redirect to `en:User:Powercycler/RefDiff`.
3. **Showcase:** Exclusively on English Wikipedia (`en:User:Powercycler/RefDiff/Show_case`, `diff=1380240829`); Meta showcase retired.

### 🟡 Ring 2: Early Testing on en.WP & SHA Pointer Uprev (No Canary Needed)
During deployment stages, no canary needed: we early test via `en:User:Powercycler/common.js` and only uprev the SHA pointer in `en:User:Powercycler/refdiff.js` once verified:
1. **Early Testing (en.WP common.js):** Update `en:User:Powercycler/common.js` to load Meta script; verify canonical live benchmark diffs (`Bihar` 1379207737, `Odoacer` 1379486498, `Zagreb` 1379409916, `Inflation` 1379470949, `Brasco` 1380017400, `Leonardo` 1380356173).
2. **en.WP Script (SHA Pointer):** Update `en:User:Powercycler/refdiff.js` with revision-pinned SHA pointer (`// [[m:User:Powercycler/refdiff.js]] (Release SHA-1: <sha1>, oldid: <revid>)` loading `...&oldid=<revid>&action=raw...`).
3. **Lead Docs (en.WP):** Publish [`refdiff.wiki`](refdiff.wiki) to `en:User:Powercycler/RefDiff` (lead documentation).
4. **Userbox (en.WP):** Create `en:User:Powercycler/Userbox RefDiff` from [`userbox.wiki`](userbox.wiki).
5. **Audit:** Run `npm run check:deploy` to verify 100% SHA-1 parity across all Wikimedia targets.

### 🔵 Ring 3: Community Feedback, Gadget Candidacy & Post-Shipment Feature Uprev
- Post announcement on `en:User talk:Powercycler/RefDiff` using [`proposal/POST.md`](proposal/POST.md).
- Follow scaling policy per [**`ROADMAP.md` (§1)**](ROADMAP.md#1-scaling-progression-overview-10-user-pilot-50-user-gadget--mass-scale): Tier 1 pilot (10 users) followed by Tier 2 gadget candidacy (50-user reviewer milestone over 60 days).
- **Post-Shipment Feature Uprev (Final Step):** Executed as the final step only when pre-flight was completed, live on-wiki rollout is verified across all Wikimedia targets (`npm run check:deploy` passes), and work on the feature is completed with user review: execute feature uprev bump (`node scripts/bump_version.js minor` or `major`) to stamp the deployed milestone.

---

## 4. 🧯 Rollback & Incident Recovery

- 🔴 **P0 (Critical — Broken diff view, uncaught loop, table blanking):**
  1. Revert `m:User:Powercycler/refdiff.js` or `en:User:Powercycler/refdiff.js` via page history (< 1 min). The SHA pointer guarantees reproducible rollback. Purge page cache (`&action=purge`); users bypass browser cache (<kbd>Ctrl</kbd>+<kbd>F5</kbd>).
  2. Defensive fallback: if script mounting fails, native diff remains untouched (in-place Memento `restoreOriginal` guarantees 100% byte-for-byte restoration and zero orphaned `.refdiff-cit-row` nodes).
  3. Run `npm run check:deploy` to confirm reverted revision status on Wikimedia APIs.
- 🟡 **P1 (Non-critical — Syntax edge-case):** Unparsed citation remains inline in prose (graceful degradation). Follow 7-stage lifecycle in [**`REVIEW_GUIDE.md` (§4)**](REVIEW_GUIDE.md#4-real-world-diff-verification-lifecycle).

---

## 5. ✅ Deployment Runbook Checklist

- [ ] **CI & Local Pre-Flight Gates:** Assure version uprev before deployment; execute patch bump only once during pre-flight (`node scripts/bump_version.js patch`); run diff audit (`git diff --stat && git diff`), and pre-flight suite (`npm run ci && node tests/test_deployment.js`).
- [ ] **Automated Visual Capture Gate:** Generate visual inspection captures across all change cases (`npm run capture`).
- [ ] **Automated Live CDP & Benchmarks:** Verify live browser integration and canonical live diffs (`npm run test:live && npm run test:bench`).
- [ ] **Pre-Push Anonymity Audit & Remote Origin Sync (Ring 0):** Configure or verify `origin` remote (`https://github.com/psytrap/refdiff.git`); audit repository for personal emails and absolute user paths (`/home/<user>/`); ensure clean working tree.
- [ ] **Git Release Tag & Remote Publication (Ring 0):** Tag release candidate (`git tag -a v<version> -m "Release v<version>"`) and manually push commit and tag to GitHub `origin`.
- [ ] **Mandatory Live Human Interactive Review Gate:** Arm interactive Chromium browser (port 9222 via `scripts/run_persistent_cdp_patch.py`), present live test diffs to human reviewer, and obtain explicit sign-off *before* updating Meta-Wiki.
- [ ] **Update m.WM Script Lead (Ring 1):** Copy `refdiff.js` to `m:User:Powercycler/refdiff.js` only after human sign-off.
- [ ] **Early Testing (en.WP common.js):** Update `en:User:Powercycler/common.js` and verify canonical live benchmark diffs.
- [ ] **Update en.WP SHA Pointer:** Update `en:User:Powercycler/refdiff.js` with new SHA pointer.
- [ ] **Publish Lead Docs (en.WP):** Update `en:User:Powercycler/RefDiff` (en.WP leads docs) & Meta redirect.
- [ ] **Publish Userbox:** Create `en:User:Powercycler/Userbox RefDiff` on en.WP.
- [ ] **Live Audit & Smoke Check:** `npm run check:deploy` passes; verify diffs on en.WP.
- [ ] **Outreach:** Post announcement and monitor feedback on `en:User talk:Powercycler/RefDiff`.
- [ ] **Post-Shipment Feature Uprev (Final Step):** Execute feature uprev bump (`node scripts/bump_version.js minor` or `major`) as the final step only when pre-flight was completed, shipment is verified live (`npm run check:deploy`), and feature work is completed with user review.
