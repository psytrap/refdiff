# RefDiff: Deployment Plan

> **Version:** 1.3.0 &bull; **Status:** Ready for Release (Ring 0 Cleared)  
> **Lead Target:** English Wikipedia (`enwiki`) &bull; **Secondary / Dummy:** Meta-Wiki (`metawiki`) (redirect / loader stub)  
> **CI Status:** 115/115 passing, 0 lint warnings

---

## 1. Artifacts & Target Destinations

| Artifact | Source File | On-Wiki Destination (en.WP Lead & Meta Dummy) |
|:---|:---|:---|
| **Production Script (Lead)** | [`refdiff.js`](refdiff.js) | `en:User:Powercycler/refdiff.js` (Canonical lead script) |
| **Meta Loader (Dummy)** | Stub snippet | `m:User:Powercycler/refdiff.js` (1-line `mw.loader.load` forwarding to en.WP) |
| **Pinned Canary** | [`refdiff.js`](refdiff.js) | `en:User:Powercycler/refdiff-v1.3.0.js` (Immutable canary on en.WP) |
| **Documentation (Lead)** | [`refdiff.wiki`](refdiff.wiki) | `en:User:Powercycler/RefDiff` (Authoritative documentation) |
| **Meta Docs (Dummy)** | Soft redirect | `m:User:Powercycler/RefDiff` (Soft redirect pointing to en.WP) |
| **Showcase Diff** | [`refdiff.wiki`](refdiff.wiki) (§Showcase) | `m:User:Powercycler/RefDiff/Show_case` (Reference test diff) |
| **Userbox** | [`userbox_enwiki.wiki`](userbox_enwiki.wiki) (§1, §2) | `en:Template:User RefDiff` &bull; `en:Template:User RefDiff/doc` |
| **Outreach** | [`proposal/POST.md`](proposal/POST.md) | `en:User talk:Powercycler/RefDiff` (Dedicated feedback talk page) |

---

## 2. Pre-Flight Quality Gates

All checks must pass before release:
```bash
npm run ci && node tests/test_deployment.js  # Headless unit, real DOM & pre-flight (115 tests, 10 gates)
npm run test:live                           # Level 4: Live browser CDP integration (port 9222)
npm run check:deploy                        # Live on-wiki deployment audit across Wikimedia APIs
```
- **Syntax & Style:** 0 ESLint errors/warnings (`npm run lint`).
- **Headless Test Suite:** 115/115 passing tests across 15 modular suites in < 250ms (`npm test`).
- **Deployment Pre-Flight:** 10 gates (`test_deployment.js`): zero BOM, strict `/* <nowiki> */`, zero `~~~~`/`{{subst:}}`, zero `console.log`, valid VM syntax, version sync (`1.3.0`), size < 120 KB, userbox tags, rollback Memento fidelity, and deployment consistency.
- **System Integration Fixtures:** Authentic MediaWiki tables (`comprehensive_test.html`, `stress_test_1379409916.html`), OOUI mounting, native inline toggle lock, and byte-for-byte Memento restoration (`test_jsdom.js`).
- **Stress & Benchmark Budget:** < 50ms processing on 114-reference table (`test_benchmarks.js`).
- **Live Browser CDP Integration (Level 4):** Chromium CDP automation on port 9222 verifying real DOM decoupling, OOUI mode switcher, Vector 2022 light/dark tokens, and `Extension:Popups` hovercards (`test_live_cdp.py`).
- **Live On-Wiki Deployment Auditor:** Remote SHA-1 & revision verification across Wikimedia APIs (`scripts/check_live_deployment.js`).

---

## 3. Rollout Rings

### Ring 0: Local Verification (Cleared)
- Clean working tree, version `1.3.0` synchronized, all pre-flight gates passing.
- Level 2–4 verified: JSDOM fixtures, sub-50ms benchmarks, and live Chromium CDP suite.
- Release tag: `git tag -a v1.3.0 -m "Release v1.3.0" && git push origin v1.3.0`.

### Ring 1: Pinned Commit Canary
- Publish `refdiff.js` to `en:User:Powercycler/refdiff-v1.3.0.js`.
- Test on 5 live benchmark diffs:
  1. `Bihar Legislative Assembly` (diff=1379207737) — apostrophe in attrs, underscore footnote anchors.
  2. `Odoacer` (diff=1379486498) — shortened footnotes (`{{sfn}}`) author-year badges, Popups preview.
  3. `Zagreb Airport` (diff=1379409916) — 114 references across split diffchange, sub-50ms execution.
  4. `Cosmic inflation` (diff=1379470949) — pure whitespace prose changes preserved.
  5. `Donnie Brasco` (diff=1380017400) — unclosed quote in attributes handled safely.

### Ring 2: Production Publishing
1. **Lead Script (en.WP):** Copy [`refdiff.js`](refdiff.js) to `en:User:Powercycler/refdiff.js` (canonical production release).
2. **Meta Loader (Dummy):** Set `m:User:Powercycler/refdiff.js` to 1-line loader forwarding to en.WP (`mw.loader.load('//en.wikipedia.org/w/index.php?title=User:Powercycler/refdiff.js&action=raw&ctype=text/javascript');`).
3. **Lead Docs (en.WP):** Copy [`refdiff.wiki`](refdiff.wiki) to `en:User:Powercycler/RefDiff` (primary documentation).
4. **Meta Docs (Dummy):** Set `m:User:Powercycler/RefDiff` as a soft redirect pointing to `en:User:Powercycler/RefDiff`.
5. **Showcase:** Verify `m:User:Powercycler/RefDiff/Show_case`.
6. **Userbox (en.WP):** Create `en:Template:User RefDiff` & `doc` from [`userbox_enwiki.wiki`](userbox_enwiki.wiki).

### Ring 3: Community Feedback & Gadget Candidacy
- Post announcement and gather feedback on `en:User talk:Powercycler/RefDiff` using [`proposal/POST.md`](proposal/POST.md).
- Gadget candidacy once 50+ active reviewers adopt with zero critical regressions over 60 days.

---

## 4. Rollback & Incident Recovery

- **P0 (Critical — Broken diff view, uncaught loop, table blanking):**
  1. Revert `en:User:Powercycler/refdiff.js` via on-wiki page history to previous stable revision (< 1 min). The Meta dummy loader automatically forwards the reverted script without separate edits.
  2. Purge page cache (`&action=purge`). Users bypass browser cache (<kbd>Ctrl</kbd>+<kbd>F5</kbd>).
  3. Defensive fallback: if script mounting fails, native wikitext diff remains untouched (guaranteed by automated pre-flight rollback check in `test_deployment.js`). In-place Memento (`restoreOriginal`) guarantees 100% byte-for-byte restoration and zero orphaned `.refdiff-cit-row` nodes.
- **P1 (Non-critical — Syntax edge-case):**
  Unparsed citation remains inline in prose (graceful degradation). Follow 6-stage diff verification lifecycle in [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md#4-real-world-diff-verification-lifecycle).

---

## 5. Deployment Runbook Checklist

- [ ] **Pre-Flight:** `npm run ci && node tests/test_deployment.js` (115 tests, 10 gates) & `npm run test:live` (CDP suite).
- [ ] **Git:** Tag release `v1.3.0` and push (`git tag -a v1.3.0 -m "Release v1.3.0" && git push origin v1.3.0`).
- [ ] **Canary Verification:** Publish `refdiff-v1.3.0.js` on en.WP and verify 5 live benchmark diffs (Ring 1).
- [ ] **Publish Lead Script:** Update `en:User:Powercycler/refdiff.js` (canonical production release).
- [ ] **Publish Meta Stub:** Ensure `m:User:Powercycler/refdiff.js` has dummy loader forwarding to en.WP.
- [ ] **Publish Lead Docs:** Update `en:User:Powercycler/RefDiff` & verify Meta doc soft redirect.
- [ ] **Publish Userbox:** Create `Template:User RefDiff` (+ `/doc`) on en.WP.
- [ ] **Live Audit & Smoke Check:** `npm run check:deploy` passes; test diff=1379409916 on en.WP.
- [ ] **Outreach:** Post announcement and monitor feedback on `en:User talk:Powercycler/RefDiff`.
