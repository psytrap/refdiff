# RefDiff: Rollout and Deployment Plan

> **Scope:** Cross-Wiki Phased Rollout (Rings 0–3) &bull; **Cadence:** Two-Phase (Patch Pre-Flight &bull; Minor Post-Shipment)  
> **Script Lead:** Meta-Wiki (`m.WM`) &bull; **Doc Lead:** English Wikipedia (`en.WP`) &bull; **en.WP Script:** SHA Pointer

---

## 1. Artifacts & Target Destinations

| Artifact | Source File | On-Wiki Destination (Meta Script Lead & en.WP Doc Lead) |
|:---|:---|:---|
| **Script Lead (m.WM)** | [`refdiff.js`](refdiff.js) | `m:User:Powercycler/refdiff.js` (Canonical code lead on Meta-Wiki) |
| **en.WP Script (SHA Pointer)** | Loader snippet | `en:User:Powercycler/refdiff.js` (SHA pointer / loader forwarding to Meta-Wiki) |
| **Documentation Lead (en.WP)** | [`refdiff.wiki`](refdiff.wiki) | `en:User:Powercycler/RefDiff` (Authoritative documentation on en.WP) |
| **Meta Docs (Soft Redirect)** | Soft redirect | `m:User:Powercycler/RefDiff` (Soft redirect pointing to en.WP documentation) |
| **Early Testing Harness** | `common.js` snippet | `en:User:Powercycler/common.js` (Early live testing before SHA pointer uprev) |
| **Showcase Diff** | [`refdiff.wiki`](refdiff.wiki) (§Showcase) | `m:User:Powercycler/RefDiff/Show_case` (Reference test diff) |
| **Userbox** | [`userbox_enwiki.wiki`](userbox_enwiki.wiki) (§1, §2) | `en:Template:User RefDiff` &bull; `en:Template:User RefDiff/doc` |
| **Outreach** | [`proposal/POST.md`](proposal/POST.md) | `en:User talk:Powercycler/RefDiff` (Dedicated feedback talk page) |

---

## 2. Pre-Flight Quality Gates

All checks must pass before release:
```bash
node scripts/bump_version.js patch                # Patch uprev for pre-flight testing (feature uprev only after shipment)
git diff --stat && git diff                       # Quick diff audit: zero debris & clean hunks (AUDIT_STRATEGY §2.8)
npm run preflight                                 # Full pre-flight: CI, deployment gates, live CDP & benchmarks
npm run check:deploy                            # Post-shipment live audit across Wikimedia APIs (final verification)
```
- **Two-Phase Version Strategy, Uprev Cadence & Diff Audit:** Versioning follows a strict two-phase cadence: (1) *Pre-Flight Testing:* execute a patch uprev (`node scripts/bump_version.js patch`) **only once during pre-flight** to validate the release candidate—feature uprevs are never performed during pre-flight; (2) *Post-Shipment Final Step:* execute the feature uprev bump (`node scripts/bump_version.js minor` or `major`) as the final step only when pre-flight was completed, on-wiki shipment is verified live (`npm run check:deploy`), and work on the feature is completed with user review. Before any deployment, assure a formal version uprev is executed across manifests; enforce smaller, focused changes between uprevs (no monolithic diffs); and ensure every uprev triggers a diff audit (`git diff --stat && git diff`) per [`AUDIT_STRATEGY.md` (§2.8)](AUDIT_STRATEGY.md#28-git-diff-as-quick-review-protocol-clean--complete-codebase-hygiene).
- **Syntax & Style:** 0 ESLint errors/warnings (`npm run lint`).
- **Headless Test Suite:** Complete unit & DOM test suite passing in < 250ms (`npm test`).
- **Deployment Pre-Flight:** Automated release gates (`test_deployment.js`): zero BOM, strict `/* <nowiki> */`, zero `~~~~`/`{{subst:}}`, zero `console.log`, valid VM syntax, version sync across manifests, size < 120 KB, userbox tags, rollback Memento fidelity, and deployment consistency.
- **System Integration Fixtures:** Authentic MediaWiki tables (`comprehensive_test.html`, `stress_test_1379409916.html`), OOUI mounting, native inline toggle lock, and byte-for-byte Memento restoration (`test_jsdom.js`).
- **Stress & Benchmark Budget:** < 50ms processing on high-density reference fixtures (`test_benchmarks.js`).
- **Mandatory Live CDP Invariant (Level 4):** We always run live browser CDP tests (`npm run test:live` via port 9222) before any update to `refdiff.js` to verify real DOM decoupling, OOUI mode switcher, Vector 2022 light/dark tokens, and `Extension:Popups` hovercards (`test_live_cdp.py`).
- **Live Benchmark Monkey Patching (`npm run test:bench`):** We test canonical live benchmark diffs (`Bihar` 1379207737, `Odoacer` 1379486498, `Zagreb` 1379409916, `Inflation` 1379470949, `Brasco` 1380017400) directly in Chromium via CDP monkey patching before on-wiki deployment (`test_live_benchmarks.py`).
- **Live On-Wiki Deployment Auditor (`npm run check:deploy`):** Final verification step: audits remote SHA-1 & revision parity across Wikimedia APIs (`scripts/check_live_deployment.js`) once shipment is complete.

---

## 3. Rollout Rings

### Ring 0: Local Release Tagging & Baseline (Cleared)
- **Release Tag & Baseline:** Tag release candidate: `git tag -a v<version> -m "Release v<version>" && git push origin v<version>`. Verify clean working tree and release SHA-1 (`refdiff.js`) before on-wiki deployment.

### Ring 1: Update Meta-Wiki Script Lead (`m.WM refdiff.js`)
1. **Script Lead (m.WM):** Update `m:User:Powercycler/refdiff.js` with local [`refdiff.js`](refdiff.js).
2. **Meta Docs:** Set `m:User:Powercycler/RefDiff` as soft redirect to `en:User:Powercycler/RefDiff`.
3. **Showcase:** Verify `m:User:Powercycler/RefDiff/Show_case`.

### Ring 2: Early Testing on en.WP & SHA Pointer Uprev (No Canary Needed)
During deployment stages, no canary needed: we early test via `en:User:Powercycler/common.js` and only uprev the SHA pointer in `en:User:Powercycler/refdiff.js` once verified:
1. **Early Testing (en.WP common.js):** Update `en:User:Powercycler/common.js` to load Meta script; verify canonical live benchmark diffs (`Bihar` 1379207737, `Odoacer` 1379486498, `Zagreb` 1379409916, `Inflation` 1379470949, `Brasco` 1380017400).
2. **en.WP Script (SHA Pointer):** Update `en:User:Powercycler/refdiff.js` with new SHA pointer (`// [[m:User:Powercycler/refdiff.js]] (Release SHA-1: <sha1>)`).
3. **Lead Docs (en.WP):** Publish [`refdiff.wiki`](refdiff.wiki) to `en:User:Powercycler/RefDiff` (lead documentation).
4. **Userbox (en.WP):** Create `en:Template:User RefDiff` & `doc` from [`userbox_enwiki.wiki`](userbox_enwiki.wiki).
5. **Audit:** Run `npm run check:deploy` to verify 100% SHA-1 parity across all Wikimedia targets.

### Ring 3: Community Feedback, Gadget Candidacy & Post-Shipment Feature Uprev
- Post announcement on `en:User talk:Powercycler/RefDiff` using [`proposal/POST.md`](proposal/POST.md).
- Follow scaling policy per [`AUDIT_STRATEGY.md` (§2.7)](AUDIT_STRATEGY.md#27-adoption--scaling-policy-10-user-pilot-50-user-gadget-milestone--beyond): Tier 1 pilot (10 users) followed by Tier 2 gadget candidacy (50-user reviewer milestone over 60 days).
- **Post-Shipment Feature Uprev (Final Step):** Executed as the final step only when pre-flight was completed, live on-wiki rollout is verified across all Wikimedia targets (`npm run check:deploy` passes), and work on the feature is completed with user review: execute feature uprev bump (`node scripts/bump_version.js minor` or `major`) to stamp the deployed milestone.

---

## 4. Rollback & Incident Recovery

- **P0 (Critical — Broken diff view, uncaught loop, table blanking):**
  1. Revert `m:User:Powercycler/refdiff.js` or `en:User:Powercycler/refdiff.js` via page history (< 1 min). The SHA pointer guarantees reproducible rollback. Purge page cache (`&action=purge`); users bypass browser cache (<kbd>Ctrl</kbd>+<kbd>F5</kbd>).
  2. Defensive fallback: if script mounting fails, native diff remains untouched (in-place Memento `restoreOriginal` guarantees 100% byte-for-byte restoration and zero orphaned `.refdiff-cit-row` nodes).
  3. Run `npm run check:deploy` to confirm reverted revision status on Wikimedia APIs.
- **P1 (Non-critical — Syntax edge-case):** Unparsed citation remains inline in prose (graceful degradation). Follow 6-stage lifecycle in [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md#4-real-world-diff-verification-lifecycle).

---

## 5. Deployment Runbook Checklist

- [ ] **Pre-Flight Quality Gates:** Assure version uprev before deployment; execute patch bump only once during pre-flight (`node scripts/bump_version.js patch`); run diff audit (`git diff --stat && git diff`), and full pre-flight suite (`npm run preflight`).
- [ ] **Git Release Tag (Ring 0):** Tag release candidate and push (`git tag -a v<version> -m "Release v<version>"`).
- [ ] **Update m.WM Script Lead:** Copy `refdiff.js` to `m:User:Powercycler/refdiff.js`.
- [ ] **Early Testing (en.WP common.js):** Update `en:User:Powercycler/common.js` and verify canonical live benchmark diffs.
- [ ] **Update en.WP SHA Pointer:** Update `en:User:Powercycler/refdiff.js` with new SHA pointer.
- [ ] **Publish Lead Docs (en.WP):** Update `en:User:Powercycler/RefDiff` (en.WP leads docs) & Meta redirect.
- [ ] **Publish Userbox:** Create `Template:User RefDiff` (+ `/doc`) on en.WP.
- [ ] **Live Audit & Smoke Check:** `npm run check:deploy` passes; verify diffs on en.WP.
- [ ] **TODO (Tool Compatibility):** Check Twinkle and Ultraviolet compatibility on live en.WP diffs.
- [ ] **Outreach:** Post announcement and monitor feedback on `en:User talk:Powercycler/RefDiff`.
- [ ] **Post-Shipment Feature Uprev (Final Step):** Execute feature uprev bump (`node scripts/bump_version.js minor` or `major`) as the final step only when pre-flight was completed, shipment is verified live (`npm run check:deploy`), and feature work is completed with user review.
