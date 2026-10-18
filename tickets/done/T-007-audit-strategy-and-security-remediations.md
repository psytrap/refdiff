# Ticket 007: Audit Strategy and Security Remediations (K1, M1, M6, M7)

* **Status:** Done
* **Date:** 2026-10-14
* **Scope & Relevant Files:** `AUDIT_STRATEGY.md`, `refdiff.js` (`src/dom_helpers.js`, `src/renderer.js`), `tests/harness.js`, `tests/test_jsdom.js`

## Description & Context
A rigorous security, architectural, and compliance audit conducted against [Ultraviolet](https://en.wikipedia.org/wiki/Wikipedia:Ultraviolet) and Wikimedia gadget security policies identified four critical findings:
1. **K1 (Real DOM Mock Weakness — P0):** Unit tests relied on hand-crafted JavaScript mock objects in `harness.js` that failed to emulate real browser DOM semantics (live `tr.cells`, collections, mutation observers, scrolling).
2. **M1 (HTML Generation via Template Strings — P1):** Dynamic UI elements assembled HTML via string concatenation assigned to `.innerHTML`, posing Cross-Site Scripting (XSS) risks from untrusted wikitext diffs.
3. **M6 (Unpinned CDN Distribution — P1):** Loading scripts from unpinned third-party CDNs (jsDelivr, raw GitHub) violates Wikimedia privacy policy and risks supply-chain poisoning.
4. **M7 (On-Wiki `<nowiki>` Template Transclusion — P1):** Template examples in code comments (`{{sfn}}`, `~~~~`) caused MediaWiki's wikitext parser to register phantom transclusions and redlink categories on `.js` subpages.

## Criteria
- [x] Author and publish audit strategy documentation codifying the Two-Pillar Audit Strategy (Pillar 1: Security & Clean-Code Governance, Pillar 2: Editorial Review & Anti-Template-Camouflage; consolidated into [`REVIEW_GUIDE.md`](../../REVIEW_GUIDE.md)).
- [x] **Resolve K1:** Integrate `jsdom` and implement [`tests/test_jsdom.js`](../../tests/test_jsdom.js) executing real DOM decoupling and byte-for-byte Memento restoration against authentic MediaWiki HTML fixtures ([commit `b0b7dde`](https://github.com/psytrap/einzelnachweise/commit/b0b7dde)).
- [x] **Resolve M1:** Implement safe DOM builder `el(tag, attrs, ...children)` with attribute whitelisting and text node escaping; refactor all UI builders to 100% eliminate dynamic `.innerHTML` assignments ([commit `240d3bd`](https://github.com/psytrap/einzelnachweise/commit/240d3bd)).
- [x] **Resolve M6:** Standardize distribution exclusively via Wikimedia infrastructure ([`m:User:Powercycler/refdiff.js`](https://meta.wikimedia.org/wiki/User:Powercycler/refdiff.js)) using immutable SHA revision IDs ([commit `ad6fe91`](https://github.com/psytrap/einzelnachweise/commit/ad6fe91)).
- [x] **Resolve M7:** Enclose `refdiff.js` in `/* <nowiki> */` comments and add automated regression checks in `tests/test_deployment.js` ([commit `b0b7dde`](https://github.com/psytrap/einzelnachweise/commit/b0b7dde)).
- [x] Formalize ADR §3.1 on the **deliberate omission of internationalization (i18n)** in favor of language-agnostic mathematical notation (`⟨...⟩`, `~`, `+`, `-`) to preserve a zero-dependency, sub-50ms footprint.

## Execution Notes
1. **DOM Security Refactoring (M1):**
   - Implemented `el()` in `src/dom_helpers.js`.
   - Refactored `createProseBadgeElement`, `createCitRow`, `createRefDiffButton`, `createInlineToggle`, and `createFallbackModeBar`.
2. **Real DOM Test Suite (K1):**
   - Added `tests/test_jsdom.js` verifying real DOM tree manipulations, event dispatch, and in-place Memento rollback fidelity.
3. **Packaging & Compliance (M6 / M7):**
   - Added `/* <nowiki> */` headers and footers.
   - Pinned on-wiki deployment pointers to immutable revision numbers.
4. **Verification:**
   - 99/99 automated tests passing (~250ms, 0 ESLint warnings); zero regressions across real MediaWiki diff fixtures.
