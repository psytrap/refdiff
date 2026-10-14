# RefDiff: Deployment Plan

> **Version:** 1.3.0 &bull; **Status:** Ready for Release (Ring 0 Cleared)  
> **Target:** English Wikipedia (`enwiki`), Meta-Wiki (`metawiki`) &bull; **CI Status:** 113/113 passing, 0 lint warnings

---

## 1. Artifacts & Target Destinations

| Artifact | Source File | On-Wiki Destination |
|:---|:---|:---|
| **Production Script** | [`refdiff.js`](refdiff.js) | `m:User:Powercycler/refdiff.js` &bull; `en:User:Powercycler/refdiff.js` |
| **Beta Channel Script** | [`refdiff.js`](refdiff.js) | `en:User:Powercycler/refdiff-beta.js` (Opt-in, activated at > 10 users) |
| **Documentation** | [`refdiff.wiki`](refdiff.wiki) | `en:User:Powercycler/RefDiff` &bull; `m:User:Powercycler/RefDiff` |
| **Showcase Diff** | [`refdiff.wiki`](refdiff.wiki) (§Showcase) | `m:User:Powercycler/RefDiff/Show_case` |
| **en.WP Userbox** | [`userbox_enwiki.wiki`](userbox_enwiki.wiki) (§1, §2) | `en:Template:User RefDiff` &bull; `en:Template:User RefDiff/doc` |
| **Meta Userbox** | [`userbox.wiki`](userbox.wiki) | `m:User:Powercycler/User RefDiff` |
| **Outreach** | [`proposal/POST.md`](proposal/POST.md) | `en:User talk:Powercycler/RefDiff` (Dedicated tool talk page) |

---

## 2. Pre-Flight Quality Gates

All checks must pass before release:
```bash
npm run ci && node tests/test_deployment.js
```
- **Syntax & Style:** 0 ESLint errors/warnings (`npm run lint`).
- **Test Suite:** 113/113 passing tests across 15 modular suites in < 250ms (`npm test`).
- **Deployment Pre-Flight:** 8 automated checks (`node tests/test_deployment.js`):
  Zero BOM, strict `/* <nowiki> */`, zero `~~~~`/`{{subst:}}`, zero `console.log`, valid VM compilation, version sync (`1.3.0`), bundle size < 120 KB, balanced userbox wikitext tags.
- **Performance Budget:** < 50ms processing on 114-reference diffs (`test_benchmarks.js`).
- **DOM Fidelity:** Byte-for-byte Memento restoration on authentic fixtures (`test_jsdom.js`).

---

## 3. Rollout Rings

### Ring 0: Local Verification (Cleared)
- Clean working tree, version `1.3.0` synchronized, all pre-flight gates passing.
- Release tag: `git tag -a v1.3.0 -m "Release v1.3.0" && git push origin v1.3.0`.

### Ring 1: Pinned Commit Canary
- Publish `refdiff.js` to `User:Powercycler/refdiff-v1.3.0.js`.
- Test on 5 live benchmark diffs:
  1. `Bihar Legislative Assembly` (diff=1379207737) — apostrophe in attrs, underscore footnote anchors.
  2. `Odoacer` (diff=1379486498) — shortened footnotes (`{{sfn}}`) author-year badges, Popups preview.
  3. `Zagreb Airport` (diff=1379409916) — 114 references across split diffchange, sub-50ms execution.
  4. `Cosmic inflation` (diff=1379470949) — pure whitespace prose changes preserved.
  5. `Donnie Brasco` (diff=1380017400) — unclosed quote in attributes handled safely.

### Ring 1.5: Opt-In Beta Channel (Activated at > 10 Users)
- **Activation Trigger:** Active user base exceeds 10 editors (tracked via `Special:WhatLinksHere/Template:User_RefDiff`).
- **Channel Target:** `en:User:Powercycler/refdiff-beta.js`.
- **Audience:** Opt-in volunteer reviewers testing release candidates 7 days before general production rollout.
- **Graduation Gate:** 7 days on beta with zero P0/P1 defect reports across $\ge 50$ real diff reviews.

### Ring 2: Production Publishing
1. **Scripts:** Copy [`refdiff.js`](refdiff.js) to `m:User:Powercycler/refdiff.js` and `en:User:Powercycler/refdiff.js`.
2. **Docs:** Copy [`refdiff.wiki`](refdiff.wiki) to `en:User:Powercycler/RefDiff` and `m:User:Powercycler/RefDiff`.
3. **Showcase:** Verify `m:User:Powercycler/RefDiff/Show_case`.
4. **Userboxes:**
   - Create `en:Template:User RefDiff` & `doc` from [`userbox_enwiki.wiki`](userbox_enwiki.wiki).
   - Create `m:User:Powercycler/User RefDiff` from [`userbox.wiki`](userbox.wiki).

### Ring 3: Community Feedback & Gadget Candidacy
- Post announcement and gather feedback on `en:User talk:Powercycler/RefDiff` using [`proposal/POST.md`](proposal/POST.md).
- Gadget candidacy once 50+ active reviewers adopt with zero critical regressions over 60 days.

---

## 4. Rollback & Incident Recovery

- **P0 (Critical — Broken diff view, uncaught loop, table blanking):**
  1. Revert `User:Powercycler/refdiff.js` via on-wiki page history to previous stable revision (< 1 min).
  2. Purge page cache (`&action=purge`). Users bypass browser cache (<kbd>Ctrl</kbd>+<kbd>F5</kbd>).
  3. Defensive fallback: if script mounting fails, native wikitext diff remains untouched.
- **P1 (Non-critical — Syntax edge-case):**
  Unparsed citation remains inline in prose (graceful degradation). Follow 6-stage diff verification lifecycle in [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md#4-real-world-diff-verification-lifecycle).

---

## 5. Deployment Runbook Checklist

- [ ] **Pre-Flight:** `npm run ci && node tests/test_deployment.js` passes.
- [ ] **Git:** Tag release `v1.3.0` and push.
- [ ] **Beta Channel (if > 10 users):** Publish release candidate to `refdiff-beta.js` 7 days prior to Ring 2.
- [ ] **Publish Scripts:** Update `m:User:Powercycler/refdiff.js` and `en:User:Powercycler/refdiff.js`.
- [ ] **Publish Docs:** Update `en:User:Powercycler/RefDiff` and `m:User:Powercycler/RefDiff`.
- [ ] **Publish Userboxes:** Create `Template:User RefDiff` (+ `/doc`) on en.WP and `User:Powercycler/User RefDiff` on Meta.
- [ ] **Live Smoke Check:** Test diff=1379409916 and verify mode switcher, inline toggle, and dark mode.
- [ ] **Outreach:** Post announcement and monitor feedback on `User talk:Powercycler/RefDiff`.
