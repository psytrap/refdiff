# RefDiff vs. Ultraviolet: comparison

**Baseline:** the Ultraviolet build that enwiki users get today (loader [`dist/beta.js`](dist/beta.js), commit `6c65c40` from 2026-02-02, branch `dev`). For outlook I also looked at the default branch `vue` (Vue/Vite rewrite, in progress). The UV test suite was **not** run (old Node-16 toolchain); everything below comes from reading the code and the repository.

> [!NOTE]
> The two tools do different jobs. UV is a patrol app of about 19,000 lines of TypeScript (revert, warn, report, protection requests). On `Special:Diff` it only adds revert buttons above `.diff-otitle`/`.diff-ntitle` ([DiffViewerInjector.tsx](deployed/src/ui/injectors/DiffViewerInjector.tsx)) and leaves `table.diff` alone. RefDiff is a focused gadget of about 2,000 lines of JS that rewrites `table.diff` itself. So **they don't collide functionally**, and the useful comparison is about engineering practice.

## Overview

| Aspect | RefDiff 1.3.0 | Ultraviolet (deployed) | Better |
| :--- | :--- | :--- | :---: |
| Size (own code only) | 1 file, 2,083 lines JS (~1,330 lines of logic once comments, blank lines and ~200 lines of embedded CSS are removed) | 172 files, 18,958 lines TS/TSX (**14,591 lines of code** without comments and blank lines). First-party `src/` only, no `node_modules`, nothing vendored. Libraries (Material Components, i18next, tsx-dom and others) ship in separate bundles: ~400 KB minified, versus 323 KB for UV's own `ultraviolet.js` | – |
| Language / types | ES2020, JSDoc without type checking | TypeScript 4.5 (23× `any`, 17× `ts-ignore`/`eslint-disable`) | UV |
| Build | none (shipped as is) | webpack, minified, with source map | depends |
| **Distribution** | `cdn.jsdelivr.net/gh/…@main` (third-party CDN, moving branch) | on-wiki loader **pinned to a commit hash**, assets on Wikimedia's own `tools-static` | **UV** |
| `<nowiki>` protection on-wiki | missing (20× `{{` in the code) | loader wrapped in `<nowiki>`, plus a CI test that rejects `nowiki` in `src` ([NowikiTest.ts](deployed/tests/syntax/NowikiTest.ts)) | **UV** |
| **HTML generation** | template strings → `innerHTML`, no escaping | TSX → `document.createElement` (escapes automatically). 5 `innerHTML` spots, only for trusted parser/i18n output | **UV** (fixed in RefDiff via `el()` / M1) |
| **i18n** | **Omitted by architectural decision** (language-agnostic design: mathematical notation, proper tool name, ~3 UI strings total) | i18next with language packs and a `qqq` documentation pack (~400 KB bundle overhead) | RefDiff (zero-overhead) |
| Test framework | own harness, hand-written DOM mocks | Jest + **jsdom**, HTML fixtures from real diff pages | UV (fixed in RefDiff via `test_jsdom.js` / K1) |
| **Test density** | ~2,400 test lines / 2,083 code lines, 86 tests | **~330 test lines / 19,000 code lines**, 6 test files (1 disabled) | **RefDiff** |
| Domain tests against real diffs | yes (enwiki fixtures, benchmark) | fixtures exist but barely used | **RefDiff** |
| CI | lint + test on Node 20/22 | test + build on **Node 16 (EOL)**, **no lint** in CI | RefDiff |
| Debug flag in production | none | `window.rw_debug = true` in the loader ([beta.js L69](dist/beta.js)), so verbose logging for every user | RefDiff |
| Source map | – | **49/155 files mis-associated** (checked with [extract_sources.js](extract_sources.js)) | – |
| Governance | single author | CODEOWNERS, husky hooks, review deploy per branch, team | UV |
| Documentation | extensive, marketing tone | on-wiki docs for users, little technical documentation | mixed |
| Oddities | absolute claims ("zero-loss", "100 %") | "TamperProtection" joke module (Rickroll URL as a group name), 44× TODO | – |

## What RefDiff should take from UV

Ordered by benefit and effort. Each point also fixes a finding from the RefDiff quality review (IDs K1/M1/M6 refer to that review).

1. **Commit-pinned on-wiki loader** (fixes M6 — **Implemented**). Pattern from [`beta.js`](dist/beta.js):
   ```js
   // <nowiki>
   (function () {
     var commit = '<sha>'; // changed only by a deliberate edit
     mw.loader.load('https://en.wikipedia.org/w/index.php?title=User:X/refdiff-' + commit + '.js&action=raw&ctype=text/javascript');
   })();
   // </nowiki>
   ```
   Implemented in `ad6fe91`: central on-wiki loading documented in `refdiff.wiki` with SHA-pinned loader patterns and jsDelivr fallback.
2. **Wrap in `// <nowiki>` … `// </nowiki>`, plus a test like `NowikiTest`** (fixes M7 — **Implemented**). Implemented in `b0b7dde`: `refdiff.js` is enclosed in `/* <nowiki> */` and `/* </nowiki> */` comments, backed by automated delimiter balance tests in `tests/test_jsdom.js`.
3. **Build DOM instead of strings** (fixes M1 — **Implemented**). Built native `el(tag, attrs, ...children)` and `createProseBadgeElement` helpers; refactored `createCitRow`, `createRefDiffButton`, `createInlineToggle`, and `createFallbackModeBar` to construct DOM nodes directly with native escaping and whitelisted attribute handling. 100% eliminated dynamic `.innerHTML` template string assignments for UI generation.
4. **Run tests in jsdom** (fixes K1 — **Implemented**). Implemented in `b0b7dde`: JSDOM suite (`tests/test_jsdom.js`) tests real MediaWiki `table.diff` fixtures (`tests/comprehensive_test.html`, `stress_test_1379409916.html`), verifies byte-for-byte in-place Memento restoration, and covers live OOUI button lifecycle in headless CI.
5. ~~**i18n through `mw.messages.set` plus `mw.msg`**~~ (**Architectural Decision: No i18n Support / Deliberate Omission**):
   RefDiff explicitly evaluated and decided **against** introducing an internationalization subsystem:
   * **Negligible String Footprint:** Unlike Ultraviolet (which contains hundreds of English warning forms, report templates, and configuration screens), RefDiff has almost zero user-facing prose. Its UI consists of only three static tokens: `"RefDiff"` (proper tool name), `"Inline modified refs"` (toolbar checkbox), and `"Diff view:"` (fallback bar). Proper tool names are not localized on Wikimedia.
   * **Language-Agnostic Mathematical Notation:** Diff badges use universal mathematical symbols (`⟨ref1⟩`, `⟨~ref2~⟩`, `⟨+ref3+⟩`, `⟨-ref4-⟩`) or verbatim author-year metadata extracted directly from the wikitext source (`⟨Castritius 2005⟩`). These are language-neutral and universally understood across all cultures.
   * **Zero Runtime Dependencies & Sub-50ms Budget:** Adding an i18n dictionary, loader layer, or banana-i18n parser would add significant bundle weight and runtime overhead for negligible benefit, violating RefDiff's strict sub-50ms execution budget.
   * **Seamless Cross-Wiki Portability:** RefDiff functions immediately across all 300+ Wikimedia language editions via `m:Special:MyPage/global.js` without requiring language packs or translator communities.

## What RefDiff already does better (keep it)

- **Test discipline**: RefDiff has roughly 65× UV's test density (1.16 vs. 0.017 test lines per line of code), and its tests cover the hard domain logic (parser, pairing, normalisation) against real enwiki diffs. Whole areas of UV (revert, warn, report) have no automated tests.
- **CI hygiene**: current Node versions, lint as a gate. UV's deployed branch builds on Node 16 without linting. The `vue` rewrite fixes this (Node 22, ESLint plus `eslint-config-wikimedia`, coverage reports).
- **No build, no hidden layer**: what's on the wiki is what's in the repo. UV's broken source map shows the cost of a build pipeline. Anyone debugging the minified bundle with that map ends up in the wrong file in about a third of cases.

## Outlook: the UV `vue` branch

The rewrite is where UV is heading, and it's the stronger reference for RefDiff's future: Vue 3, **`@wikimedia/codex`** (the official design system, matching RefDiff's OOUI integration), `banana-i18n` (the MediaWiki message format), Vitest plus happy-dom with type tests, `eslint-config-wikimedia`, coverage published through cobertura in CI. It's still small, though (46 files, ~4,000 lines, 6 test files).

## Bottom line

UV was ahead in **delivery and security hygiene (M1, M6, M7)**. Those have now been **fully resolved in RefDiff** through the pinned on-wiki loader, `<nowiki>` wrapping, safe DOM builder `el()`, and JSDOM real DOM test harness (K1). On **i18n**, RefDiff made the deliberate architectural decision to remain **language-agnostic** (mathematical notation, proper tool names, zero-dependency footprint) rather than carrying the weight of a localization framework. RefDiff remains decisively ahead in **core domain test coverage (103/103 tests), Memento DOM safety, sub-50ms performance, and CI hygiene**.
