# Project Log & Planned Steps

This log records the rationale, architectural decisions, completed milestones, and upcoming action items for the **Section-Scoped References (`<references hidden>`)** initiative.

---

## 1. Project Overview & Current Status

* **Status:** Ready for Community & Upstream Outreach (Phase 1)
* **Goal:** Eliminate diff pollution, avoid cross-section merge conflicts, and preserve wikitext readability by decoupling inline reference callouts from section-level citation definitions.
* **Core Artifacts:**
  * 💡 **[PROPOSAL.md](proposal/PROPOSAL.md):** Concise proposal (pure feature focus).
  * 📄 **[CONCEPT.md](proposal/CONCEPT.md):** Comprehensive technical specification and architecture paper.
  * 📝 **[POST.md](proposal/POST.md):** Ready-to-use Wiki post Anschreiben for English Wikipedia ([Wikipedia talk:Citing sources](https://en.wikipedia.org/wiki/Wikipedia_talk:Citing_sources)).
  * 🛡️ **[AUDIT_STRATEGY.md](AUDIT_STRATEGY.md):** Codebase security audit protocols, clean-code & anti-test-smell governance, real DOM test framework, and editorial review strategy.
  * 🧪 **[TEST_PLAN.md](TEST_PLAN.md):** Test pyramid, 1-to-1 modular suite architecture, and quality assurance framework.
  * 🌐 **[refdiff.wiki](refdiff.wiki):** Publication-ready on-wiki documentation page for RefDiff.
  * 🗃️ **[userbox.wiki](userbox.wiki):** Ready-to-deploy userbox template (`{{User:Powercycler/User RefDiff}}`) for Meta-Wiki and cross-wiki user pages.
  * 🗃️ **[userbox_enwiki.wiki](userbox_enwiki.wiki):** Dedicated English Wikipedia userbox template (`Template:User RefDiff`) with TemplateData documentation.
  * 🚀 **[DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md):** Phased rollout protocol (Rings 0–3), pre-flight gates, rollback runbook, and health checks.
  * 📖 **[README.md](README.md):** Repository introduction and index.

---

## 2. Planned Steps & Action Items (Roadmaps)

### 2.1 RefDiff Tool Roadmap (Active In-Browser Gadget)

*Focus: Immediate client-side diff enhancement on `Special:Diff`, phased scaling from 10-user early adoption to 100-user gadget candidacy, patrol tool non-interference, and on-wiki rollout.*

#### Scaling Progression Overview: 10-User Goal vs. 100-User Scale

| Dimension | Tier 1: 10-User Adoption Goal (Early Adopter Gate) | Tier 2: 100-User Scale (Community Gadget Candidacy) |
| :--- | :--- | :--- |
| **Objective** | Validate real-world value with early adopters on en.WP | Qualify for official English Wikipedia Gadget status |
| **Adoption Target** | $\ge 10$ active patrollers via `Template:User RefDiff` | ~50–100+ active NPP/RC reviewers over 60 days |
| **Distribution** | Personal user script in `common.js` / `global.js` | Built-in MediaWiki Gadget in `Special:Preferences` |
| **Crash Blast Radius** | Fail-open `try...catch` boundary (reverts to native diff) | Zero blast radius across diverse multi-script ecosystems |
| **Tool Compatibility** | Non-interference verified on standard diff headers | Formal automated contract tests (Twinkle, HotCat, etc.) |
| **DOM Lifecycle** | Synchronous diff rendering via `wikipage.diff` hook | Full AJAX/SPA re-entrancy without Memento leaks |
| **Skins & Viewports** | Primary focus on Vector 2022 desktop | Vector 2022, Vector 2010, Monobook, Minerva auto-disable |
| **Accessibility** | Semantic HTML, high-contrast angle-bracket badges | Full WCAG 2.1 AA, keyboard focusability, ARIA labels |
| **Feedback Channel** | Scoped strictly to `en:User talk:Powercycler/RefDiff` | Community RFC on `Wikipedia:Village pump (technical)` |

#### RefDiff Checklist & Status Dashboard

##### Active Release (v1.3.0)

| Step | Milestone / Action Item | Priority | Status | Target / Deliverable |
| :---: | :--- | :---: | :---: | :--- |
| **R.8** | On-Wiki Phased Deployment (Rings 0–3) | **P0** | 🚀 **In Progress** | Execute [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) (Ring 0 cleared, Ring 1 Canary next) |

##### Tier 1: 10-User Adoption & Early Stability (Post-v1.3.0)

| Step | Milestone / Action Item | Priority | Status | Target / Deliverable |
| :---: | :--- | :---: | :---: | :--- |
| **R.1** | Fail-Open Crash Boundary | High | 🔮 Future | Top-level `try...catch` boundary; zero blast radius on `common.js` |
| **R.7** | 10-User Governance & Stability Check | Normal | 🔮 Future | Track $\ge 10$ transclusions via `Template:User RefDiff` & 0 P0 defects |

##### Tier 2: 100-User Production Hardening & Gadget Candidacy (Post-10-User Validation)

| Step | Milestone / Action Item | Priority | Status | Target / Deliverable |
| :---: | :--- | :---: | :---: | :--- |
| **R.2** | Dynamic AJAX / SPA Re-entrancy | High | 🔮 Future | JSDOM test simulating consecutive diff table swaps; Memento leak prevention |
| **R.3** | Patrol Tool Non-Interference Contract | High | 🔮 Future | Byte-for-byte protection of diff headers & Twinkle/HotCat nodes |
| **R.4** | Client-Side Observability Mode | Normal | 🔮 Future | Opt-in `?refdiff_debug=1` diagnostic logging mode |
| **R.5** | Accessibility (WCAG 2.1 AA) | High | 🔮 Future | Semantic `aria-label`, keyboard focus navigation, contrast ratio validation |
| **R.6** | Legacy Skins & Mobile Guard | Normal | 🔮 Future | Vector 2010 fallback bar & graceful Minerva mobile auto-disable |

#### RefDiff Action Items (Detail)

##### Active Release Action Item
- [ ] **Step R.8: Phased Rollout Protocol Execution (P0 — Active Release)**
  * Follow [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) through Ring 0 (cleared), Ring 1 (Pinned Canary `refdiff-v1.3.0.js` on en.WP), Ring 2 (Production publish to `en:User:Powercycler/refdiff.js`), and Ring 3 (Community feedback).

##### Tier 1 Action Items: 10-User Early Adopter Goal
- [ ] **Step R.1: Fail-Open Crash Isolation & Top-Level Boundary (Tier 1 — High)**
  * Wrap `init()` and table mutators in a top-level fail-open `try...catch` block.
  * Guarantee that unhandled runtime exceptions in RefDiff cleanly restore the native diff table and never bubble to `window.onerror` or abort subsequent scripts in `common.js` (e.g. Twinkle, HotCat).
- [ ] **Step R.7: 10-User Governance & Stability Check (Tier 1 — Operational)**
  * Monitor adoption via `Special:WhatLinksHere/Template:User_RefDiff` until reaching $\ge 10$ active patrollers.
  * Verify zero P0 runtime exceptions or diff view corruptions across 30 days of real Wikipedia diff reviews per [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) §2.7.

##### Tier 2 Action Items: 100-User Production Hardening & Gadget Scale
- [ ] **Step R.2: Dynamic AJAX / SPA Lifecycle Re-entrancy & Memory Isolation (Tier 2 — High)**
  * Add a JSDOM test simulating sequential `wikipage.diff` Ajax re-entrancy (e.g. 10 consecutive diff loads with table swaps).
  * Ensure RefDiff correctly re-initializes on swapped diff tables without leaking Memento snapshots or duplicating DOM controls.
- [ ] **Step R.3: Core Patrol Tool Non-Interference Contract (Tier 2 — High)**
  * Add automated assertions verifying that RefDiff mutations are strictly confined to `tbody > tr.diff-deletedline`, `tr.diff-addedline`, and `tr.refdiff-cit-row`.
  * Guarantee that header nodes (`tr.diff-title`, `.diff-otitle`, `.diff-ntitle`, `.diff-notice`, `.diff-multi`) and third-party buttons (Twinkle rollback/vandalism links) remain 100% byte-for-byte untouched.
- [ ] **Step R.4: Client-Side Observability & Diagnostic Troubleshooting Mode (Tier 2 — Normal)**
  * Implement opt-in diagnostic logging enabled via URL parameter `?refdiff_debug=1` or `window.refdiffConfig = { debug: true }`.
  * Provide structured diagnostic output (`mw.log.warn` / `console.debug`) detailing revision ID, parsed reference count, paired slots, and execution timings without polluting standard production console.
- [ ] **Step R.5: Accessibility (WCAG 2.1 AA) & Keyboard Navigation (Tier 2 — High)**
  * Add semantic `aria-label` attributes to inline badges (e.g. `aria-label="Citation 1"`, `aria-label="Modified citation: name"`).
  * Ensure keyboard focusability (`tabindex="0"`) and <kbd>Enter</kbd>/<kbd>Space</kbd> keydown navigation from prose badge to citation diff row.
  * Verify color contrast ratios for amber (`#9a6700`) and green (`#14866d`) badges satisfy WCAG 2.1 AA (4.5:1) in Vector 2022 Light and Dark themes.
- [ ] **Step R.6: Legacy Skin (Vector 2010 / Monobook) & Mobile Self-Disablement (Tier 2 — Normal)**
  * Add automated JSDOM test for legacy skins lacking OOUI button containers, verifying fallback mode bar (`#refdiff-mode-bar`) mounting.
  * Add graceful self-disablement invariant for single-column mobile viewports (`MinervaNeue`).

---

### 2.2 Upstream `<ref def>` Tag Roadmap (Future Strategy)

*Focus: Long-term MediaWiki wikitext feature proposal (`<ref def name="...">`), developer RFCs, community discussion, and upstream parser integration.*

#### Upstream Proposal Checklist & Status Dashboard

| Step | Phase & Milestone | Priority | Status | Primary Deliverable / Target |
| :---: | :--- | :---: | :---: | :--- |
| **U.1** | Phase 1: Wikimedia Phabricator Task | P1 | 🔲 Planned | Submit draft to Phabricator tagged `#extension-cite`, `#Parsoid` |
| **U.2** | Phase 1: Cite Discussion Pages | P1 | 🔲 Planned | Post discussion to `mw:Extension talk:Cite` & `en:WT:Citing sources` |
| **U.3** | Phase 1: Community Wishlist Submission | P2 | 🔲 Planned | Submit proposal to `meta:Community Wishlist` for endorsements |
| **U.4** | Phase 2: Feedback Synthesis | P1 | 🔲 Planned | Track editor reactions on syntax options & VE/mobile |
| **U.5** | Phase 2: Specification Refinement | P2 | 🔲 Planned | Update [`CONCEPT.md`](proposal/CONCEPT.md) & [`PROPOSAL.md`](proposal/PROPOSAL.md) |
| **U.6** | Phase 3: Re-Scoping Bot Prototype | P3 | 🔲 Planned | Bot algorithm for automated anchor re-scoping |
| **U.7** | Phase 4: Lua / Scribunto Prototype | P2 | 🔲 Planned | `{{#invoke:RefDef|...}}` on-wiki template prototype |
| **U.8** | Phase 4: Upstream Extension:Cite Patch | P1 | 🔲 Planned | Experimental Gerrit patch for MediaWiki core `Extension:Cite` |

#### Upstream Strategy Phases (Detail)

##### Phase 1: Community & Technical Outreach (Immediate Next Steps)
- [ ] **Step U.1: Submit Wikimedia Phabricator Task**
  * Submit draft to [phabricator.wikimedia.org](https://phabricator.wikimedia.org/maniphest/task/edit/form/1/) tagged with `#extension-cite`, `#Parsoid`, `#MediaWiki-Parser`.
  * Record Phabricator task ID (e.g. `Txxxxxx`) in this log.
- [ ] **Step U.2: Post to Cite Discussion Pages**
  * Post to `mw:Extension talk:Cite` (MediaWiki.org) and/or `en:Wikipedia talk:Citing sources` (or `de:Wikipedia Diskussion:Einzelnachweise`).
  * Link the discussion to the Phabricator task.
- [ ] **Step U.3: Community Wishlist Submission**
  * Submit a focused proposal to [meta:Community Wishlist](https://meta.wikimedia.org/wiki/Community_Wishlist) to gather editor endorsements and votes.

##### Phase 2: Feedback Synthesis & Specification Iteration
- [ ] **Step U.4: Monitor Community & Developer Reactions**
  * Track feedback on syntax choices (`<ref def>`, `<references def>`, `<references hidden>`).
  * Note community questions regarding VisualEditor UX and mobile rendering.
- [ ] **Step U.5: Refine Specification**
  * Incorporate edge cases and consensus items into [CONCEPT.md](proposal/CONCEPT.md) and [PROPOSAL.md](proposal/PROPOSAL.md).

##### Phase 3: Proof of Concept & Migration Tooling
- [ ] **Step U.6: Automated Re-Scoping Bot Prototype**
  * Implement the basic "bot cleanup" algorithm: detect moved `<ref name="..." />` anchors and auto-migrate definitions between sections.

##### Phase 4: Upstream MediaWiki Integration
- [ ] **Step U.7: Lua / Scribunto Prototype**
  * Provide a lightweight template/module implementation (`{{#invoke:RefDef|...}}`) for wikis that want to test the workflow without server modifications.
- [ ] **Step U.8: MediaWiki Extension:Cite Patch (Gerrit)**
  * Work with Wikimedia developers on an experimental patch for `Extension:Cite`.

---

## 3. Architectural & Audit Registers

### 3.1 Architectural Decision Register (ADR)

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| **Primary Working Proposal** | `<ref def name="...">` | Native boolean attribute `def` on `<ref>` explicitly designates a definition-only node without in-situ footnote rendering. The container block `<references def>...</references>` is **optional** for grouping multiple citations. Evaluated alternatives: `<references hidden>`, `<references-def>`, and `<references display="none">`. |
| **Reader View** | Unified global list at document bottom | Preserves the familiar Wikipedia reader experience and continuous `[1], [2], ...` footnote numbering. |
| **Fault Tolerance** | Page-wide resolution scope | Moving sentences between sections never causes red citation errors; ensures high resilience for human editors. |
| **Bot Philosophy** | "Bots clean up" (simple, async) | Avoids frustrating authors with strict lint errors. Normalization and block consolidation happen asynchronously. |
| **Formatting** | Single-line per `<ref>` inside definition block | Prevents excessive vertical file bloat and ensures atomic, 1-line Git diff hunks per source update. |
| **Diff Tooling Scope** | Zero changes required (`wikidiff2` untouched) | Avoids scope creep and maintainer pushback. Decoupling of claim and source in diff hunks is documented as an acknowledged trade-off mitigated by section locality. |
| **Multi-Page Citations** | Native `details="..."` and template `{{rp}}` | Fully supports MediaWiki's native Sub-referencing (`details="p. 45"`) as well as in-prose page suffixes (`{{rp|45}}`). |
| **Legacy & Third-Party Compatibility** | Dynamic LDR Hoisting (Pre-parse Hook & Export Transpiler) | Transpiles `<ref def>` and `<references def>` to standard List-Defined References (LDR) on-the-fly for unpatched/third-party wikis and database dumps (Kiwix). Completely eliminates in-situ `<ol>` rendering and stateful citation flush issues. |
| **RefDiff Internationalization (i18n)** | Deliberate Omission (Language-Agnostic Design) | RefDiff deliberately does not implement an i18n framework (`mw.messages`/`i18next`). The gadget UI has a negligible string footprint (~3 static strings: proper name `RefDiff`, `Inline modified refs`, `Diff view:`). Decoupled badges rely on universal mathematical notation (`⟨...⟩`, `~`, `+`, `-`) and verbatim citation metadata. Omitting i18n preserves the zero-dependency, single-file footprint (~40 KB) required for instant cross-wiki deployment via `m:Special:MyPage/global.js` without network overhead or translation bundle latency (see ADR §3.1). |

---

### 3.2 Audit Findings Register (K1 / M1 / M6 / M7 Taxonomy)

This register serves as the authoritative system of record for all security, architecture, and compliance findings uncovered during codebase audits, external reviews (e.g. against [Ultraviolet](https://en.wikipedia.org/wiki/Wikipedia:Ultraviolet)), and on-wiki gadget security checks. Severity and action thresholds follow the taxonomy defined in [**`AUDIT_STRATEGY.md` (§2.1)**](AUDIT_STRATEGY.md#21-quality-review-taxonomy--findings-registry).

| Finding ID | Title | Class | Severity | Status | Discovery Date | Target Component | Resolved In |
|:---:|:---|:---:|:---:|:---:|:---:|:---|:---:|
| [**K1**](#k1-real-dom-mock-weakness) | Real DOM Mock Weakness | Critical | **P0** | ✅ Resolved | 2026-10-14 | `tests/harness.js`, `tests/test_jsdom.js` | [`b0b7dde`](https://github.com/psytrap/einzelnachweise/commit/b0b7dde) |
| [**M1**](#m1-html-generation-via-template-strings) | HTML Generation via Template Strings | Major / Security | **P1** | ✅ Resolved | 2026-10-14 | `refdiff.js` (UI builders) | [`240d3bd`](https://github.com/psytrap/einzelnachweise/commit/240d3bd) |
| [**M6**](#m6-unpinned-cdn-distribution) | Unpinned CDN Distribution | Major / Security | **P1** | ✅ Resolved | 2026-10-11 | Deployment & On-Wiki Loaders | [`ad6fe91`](https://github.com/psytrap/einzelnachweise/commit/ad6fe91) |
| [**M7**](#m7-on-wiki-nowiki-template-transclusion) | On-Wiki `<nowiki>` Template Transclusion | Major / Syntax | **P1** | ✅ Resolved | 2026-10-14 | `refdiff.js` file wrapper | [`b0b7dde`](https://github.com/psytrap/einzelnachweise/commit/b0b7dde) |

---

#### K1: Real DOM Mock Weakness
* **Finding ID:** `K1`
* **Class & Severity:** Architectural / Test Integrity (**P0**)
* **Discovery Date & Origin:** 2026-10-14 (Ultraviolet architectural benchmark review).
* **Root Cause & Description:** Unit test harnesses previously relied on hand-crafted JavaScript mock objects (`{ innerHTML: ... }`) in `tests/harness.js`. These mocks failed to emulate real browser DOM semantics—such as live `HTMLCollection` mutation, `tr.cells` indexing, event propagation/bubbling, and missing API quirks (`scrollIntoView` undefined in certain headless frames). As a result, critical DOM lifecycle regressions could pass unit tests undetected.
* **Remediation & Implementation:**
  1. Integrated `jsdom` into `package.json` devDependencies.
  2. Implemented [`tests/test_jsdom.js`](tests/test_jsdom.js) executing against real MediaWiki HTML fixtures (`tests/comprehensive_test.html` and `tests/stress_test_1379409916.html`).
  3. Added byte-for-byte in-place Memento invariance verification ($\text{table.innerHTML}_{\text{initial}} \equiv \text{table.innerHTML}_{\text{restored}}$).
  4. Guarded `scrollIntoView` and `MutationObserver` defensively in `refdiff.js`.
* **Resolution Commit:** [`b0b7dde`](https://github.com/psytrap/einzelnachweise/commit/b0b7dde)
* **Verification Gate:** 10 headless JSDOM tests passing; 0 regressions across all 14 test suites.

---

#### M1: HTML Generation via Template Strings
* **Finding ID:** `M1`
* **Class & Severity:** Security Hygiene / XSS Mitigation (**P1**)
* **Discovery Date & Origin:** 2026-10-14 (Comparative code review vs. Ultraviolet TSX/DOM generation).
* **Root Cause & Description:** Dynamic UI elements (`createCitRow`, `createRefDiffButton`, `createInlineToggle`, `createFallbackModeBar`) assembled HTML via string interpolation and template literals assigned to `.innerHTML`. If attribute values or citation labels contained unescaped characters or malicious injections from untrusted wikitext diffs, this introduced potential Cross-Site Scripting (XSS) vectors and DOM parsing quirks.
* **Remediation & Implementation:**
  1. Created native safe DOM builder `el(tag, attrs, ...children)` with automatic attribute whitelisting, Boolean handling, and text escaping via `ownerDocument.createTextNode`.
  2. Implemented `createProseBadgeElement` constructing native `<sup class="reference refdiff-ref">` DOM hierarchies with XSS immunity.
  3. Completely refactored `createCitRow`, `createRefDiffButton`, `createInlineToggle`, and `createFallbackModeBar` to build elements exclusively via DOM constructors.
  4. Maintained headless Node fallback for backward-compatible `createProseBadge` text serialization.
  5. 100% eliminated dynamic `.innerHTML` assignments in all UI generation routines.
* **Resolution Commit:** [`240d3bd`](https://github.com/psytrap/einzelnachweise/commit/240d3bd)
* **Verification Gate:** 99/99 automated tests passing (~250ms, 0 ESLint warnings); dedicated DOM builder tests in `tests/test_renderer.js`.

---

#### M6: Unpinned CDN Distribution
* **Finding ID:** `M6`
* **Class & Severity:** Supply-Chain Security & Compliance (**P1**)
* **Discovery Date & Origin:** 2026-10-11 (Wikimedia gadget compliance & privacy policy audit).
* **Root Cause & Description:** Loading user scripts from third-party CDNs (e.g. unpinned `@main` branch on jsDelivr or GitHub raw) violates Wikimedia privacy and security policies, exposes editors to upstream supply-chain poisoning, and bypasses on-wiki revision tracking.
* **Remediation & Implementation:**
  1. Standardized primary distribution exclusively via Wikimedia infrastructure: Meta-Wiki [`m:User:Powercycler/refdiff.js`](https://meta.wikimedia.org/wiki/User:Powercycler/refdiff.js).
  2. Documented and tested commit-pinned SHA loaders using MediaWiki's `mw.loader.load()` targeting immutable revision IDs for tamper-proof installations (see `AUDIT_STRATEGY.md` §2.4).
  3. Prohibited any external network calls or unpinned third-party asset loading in script code.
* **Resolution Commit:** [`ad6fe91`](https://github.com/psytrap/einzelnachweise/commit/ad6fe91)
* **Verification Gate:** On-wiki deployment verified live on Meta-Wiki and English Wikipedia; zero external runtime dependencies.

---

#### M7: On-Wiki `<nowiki>` Template Transclusion
* **Finding ID:** `M7`
* **Class & Severity:** On-Wiki Parser Compliance (**P1**)
* **Discovery Date & Origin:** 2026-10-14 (On-wiki JavaScript page parsing audit).
* **Root Cause & Description:** Code comments and strings inside `refdiff.js` contained template patterns like `{{sfn|...}}`, `{{efn|...}}`, and signature markers `~~~~`. When hosted on `.js` subpages within MediaWiki, the wikitext parser parsed these sequences as real template transclusions, polluting `templatelinks` tables and generating invalid tracking categories.
* **Remediation & Implementation:**
  1. Enclosed `refdiff.js` within `/* <nowiki> */` at line 1 and `/* </nowiki> */` at the end of the file.
  2. Added automated regex regression assertion in `tests/test_jsdom.js` (Test 10) ensuring delimiters remain balanced and all internal template examples remain safely quarantined.
---

### 3.3 Real-World Diff Verification Register

This register serves as the authoritative system of record for all real-world Wikipedia diffs submitted, triaged, diagnosed, and verified across RefDiff development sprints. Life-cycle transitions adhere to the 6-stage verification protocol defined in [**`AUDIT_STRATEGY.md` (§4)**](AUDIT_STRATEGY.md#4-real-world-diff-verification-lifecycle) and [**`TEST_PLAN.md` (§5.1)**](TEST_PLAN.md#51-real-world-diffs--verification-queue).

| Diff / Article | Revision | Focus Area | Status | Primary Remediation & Suite | Register Anchor |
|:---|:---:|:---|:---:|:---|:---:|
| [Odoacer](https://en.wikipedia.org/w/index.php?diff=1379486498) | `1379486498` | Shortened Footnotes (`{{sfn}}`) & Popups Previews | ✅ Verified | SFN parameter tokenizer & author-year badge anchor mapping | [Odoacer](#odoacer-diff1379486498) |
| [Zagreb Airport](https://en.wikipedia.org/w/index.php?diff=1379409916) | `1379409916` | High-Density Table Stress Benchmark (114 refs) | ✅ Verified | Lookahead-protected regex; sub-50ms execution in JSDOM & CDP | [Zagreb Airport](#zagreb-airport-diff1379409916) |
| [Kim Domingo](https://en.wikipedia.org/w/index.php?diff=1379491398) | `1379491398` | `wikidiff2` Split Tag Boundaries (`/<del>&gt;`) | ✅ Verified | Boundary shifting in `normalizeDiffTags` & single-sided additions | [Kim Domingo](#kim-domingo-diff1379491398) |
| [Cosmic inflation](https://en.wikipedia.org/w/index.php?diff=1379470949) | `1379470949` | Whitespace-Only Prose Diff Retention | ✅ Verified | Guarded empty tag cleanup regex preserving whitespace edits | [Cosmic Inflation](#cosmic-inflation-diff1379470949) |
| [Zipf's law](https://en.wikipedia.org/w/index.php?title=Zipf%27s_law&diff=prev&oldid=1379548357) | `1379548357` | Footnote Unwrapping, `{{rp}}` & Nested Braces | ✅ Verified | Omission of `{{rp}}` from ref parser; lookaround brace assertions | [Zipf's Law](#zipfs-law-diff1379548357) |
| [Donnie Brasco (film)](https://en.wikipedia.org/w/index.php?title=Donnie_Brasco_(film)&curid=1995696&diff=1380017400&oldid=1380012354) | `1380017400` | Unclosed Quote Toleration (`name="mojo_2>`) | ✅ Verified | Hardened `extractName` regex tolerating unclosed quotes | [Donnie Brasco](#donnie-brasco-film-diff1380017400) |
| [Karl-Heinz Riedle](https://en.wikipedia.org/w/index.php?title=Karl-Heinz_Riedle&diff=1380008554&oldid=1335846068) | `1380008554` | Prose Bold Formatting Markup Invariance | ✅ Verified | Clean prose bold handling adjacent to unchanged context refs | [Karl-Heinz Riedle](#karl-heinz-riedle-diff1380008554) |
| [Bihar Legislative Assembly](https://en.wikipedia.org/w/index.php?title=Bihar_Legislative_Assembly&diff=prev&oldid=1379207737) | `1379207737` | Embedded Apostrophe Truncation & Anchor Matching | ✅ Verified | Paired-quote regex in `extractName` & space-to-underscore anchor query | [Bihar Assembly](#bihar-legislative-assembly-diff1379207737) |

---

#### Odoacer (`diff=1379486498`)
* **Article & Revision:** [Odoacer (diff=1379486498)](https://en.wikipedia.org/w/index.php?diff=1379486498)
* **Date Evaluated:** 2026-10-10
* **Status:** ✅ Verified
* **Focus Area:** Shortened footnotes (`{{sfn}}`, `{{r}}`, `{{efn}}`, `{{harvnb}}`), parameter extraction, and author-year anchor mapping.
* **Diagnosis:** Traditional Wikipedia articles heavily employ shortened footnotes linking to a separate bibliography. RefDiff needed to extract author, year, and page parameters, generate concise badges (`⟨Castritius 2005⟩`), and map them to `#cite_note-FOOTNOTE*` anchors for `Extension:Popups` hovercards.
* **Remediation:** Implemented `extractSfnInfo()` supporting 1 to 4+ authors, year, and page numbers. Integrated `cite_note-FOOTNOTE*` anchor resolution in `findCiteNoteAnchor`.
* **Verification:** Unit tests in `tests/test_parser.js`; verified live in headless Chromium CDP on English Wikipedia.

---

#### Zagreb Airport (`diff=1379409916`)
* **Article & Revision:** [Zagreb Airport (diff=1379409916)](https://en.wikipedia.org/w/index.php?diff=1379409916)
* **Date Evaluated:** 2026-10-10
* **Status:** ✅ Verified
* **Focus Area:** High-density airline destination table with 114 citations across 4 change rows; execution performance budget.
* **Diagnosis:** MediaWiki's character differ (`wikidiff2`) split HTML entities across tags (`&lt;/ref<del>&gt;`), causing closing tag regexes to fail and lookaheads to swallow adjacent table cells and text. Monolithic re-rendering risked browser unresponsiveness.
* **Remediation:** Preprocessed split tags in `normalizeDiffTags`. Guarded regex lookaheads with `((?:(?!&lt;ref\b)[\s\S])*?)`. Optimized pairing algorithm to complete in single-digit milliseconds.
* **Verification:** Fixture [`tests/stress_test_1379409916.html`](tests/stress_test_1379409916.html); benchmarks in `tests/test_benchmarks.js` (<15ms) and real DOM suite in `tests/test_jsdom.js` (<100ms).

---

#### Kim Domingo (`diff=1379491398`)
* **Article & Revision:** [Kim Domingo (diff=1379491398)](https://en.wikipedia.org/w/index.php?diff=1379491398)
* **Date Evaluated:** 2026-10-11
* **Status:** ✅ Verified
* **Focus Area:** Split self-closing tag boundaries (`/<del>&gt;`) and single-sided paragraph additions/deletions.
* **Diagnosis:** Single-sided row changes (e.g. adding a new sentence with a citation callout `<ref name="kami" />`) were not decoupled if the row lacked a paired deleted/added companion row. Furthermore, `/<del>&gt;` split spans caused malformed tag markers.
* **Remediation:** Added `normalizeDiffTags` boundary shifting rule for `/<del>&gt;`. Extended `applyDecoupling` to process single-sided change rows, decoupling new citation callouts into dedicated rows while preserving clean prose.
* **Verification:** Automated regression test in `tests/test_pipeline.js`; verified live in Chromium CDP across Light and Dark themes.

---

#### Cosmic Inflation (`diff=1379470949`)
* **Article & Revision:** [Cosmic inflation (diff=1379470949)](https://en.wikipedia.org/w/index.php?diff=1379470949)
* **Date Evaluated:** 2026-10-11
* **Status:** ✅ Verified
* **Focus Area:** Whitespace-only prose edits retention without false context conversion.
* **Diagnosis:** An editor added a space (`<ins class="diffchange diffchange-inline"> </ins>`) to prose adjacent to citations. RefDiff's cleanup regex `/<(ins|del)\b[^>]*>\s*<\/\1>/gi` stripped whitespace-containing diff spans, leaving the row with zero diff tags and causing `updateProseRowAppearance` to convert it to an unchanged context row, masking the edit.
* **Remediation:** Updated empty tag regex to strictly target `/<(ins|del)\b[^>]*><\/\1>/gi` (zero whitespace inside tags), preserving whitespace edits with native blue highlighting and `+`/`-` line markers.
* **Verification:** Regression assertions in `tests/test_utils.js` and `tests/test_pipeline.js`; verified live via Chromium CDP.

---

#### Zipf's Law (`diff=1379548357`)
* **Article & Revision:** [Zipf's law (diff=1379548357)](https://en.wikipedia.org/w/index.php?title=Zipf%27s_law&diff=prev&oldid=1379548357)
* **Date Evaluated:** 2026-10-13
* **Status:** ✅ Verified
* **Focus Area:** Explanatory footnote unwrapping (`{{efn|...<ref name="zipf"/>{{rp|546}}}}`), reference page suffixes (`{{rp}}`), and nested template brace handling.
* **Diagnosis:** Unwrapping an explanatory footnote into top-level prose caused:
  1. `{{rp|546}}` to be mistakenly parsed as an independent citation and paired with the deleted `{{efn}}`, creating a phantom modified badge `⟨~546~⟩`.
  2. Nested template braces to truncate parsing prematurely.
  3. Preceding template braces to merge into triple braces `}}}`.
* **Remediation:** Removed `rp` from `TEMPLATE_REF_REGEX` so it remains attached to the preceding prose badge. Added 2-level nested template brace matching. Implemented lookaround assertions `(?<!\{)` and `(?!\})` in `normalizeDiffTags`. Added `hasBalancedDiffTags` check.
* **Verification:** Suite of 4 regression tests in `tests/test_constants.js`, `tests/test_parser.js`, and `tests/test_pipeline.js`.

---

#### Donnie Brasco (film) (`diff=1380017400`)
* **Article & Revision:** [Donnie Brasco (film) (diff=1380017400)](https://en.wikipedia.org/w/index.php?title=Donnie_Brasco_(film)&curid=1995696&diff=1380017400&oldid=1380012354)
* **Date Evaluated:** 2026-10-13
* **Status:** ✅ Verified
* **Focus Area:** Tolerating unclosed quotation marks in wikitext tag attributes (`<ref name="mojo_2>`).
* **Diagnosis:** MediaWiki's parser tolerates missing closing quotes before `>` brackets, generating footnote anchor `id="cite_note-mojo_2-4"`. RefDiff's strict attribute regex required closing quotes, causing attribute extraction to return `null`, fallback to anonymous label `ref1`, and failure to connect to the hovercard anchor.
* **Remediation:** Hardened `extractName` regex with fallback boundary matching: `/(?:&quot;|["']|&apos;)(.*?)(?:&quot;|["']|&apos;|\/|&gt;|>|\s*$)|name\s*=\s*([^\s"'>&]+)/i`. Accurately extracts `"mojo_2"` and resolves the hovercard anchor.
* **Verification:** Unit test in `tests/test_parser.js` asserting unclosed quote extraction and anchor resolution.

---

#### Karl-Heinz Riedle (`diff=1380008554`)
* **Article & Revision:** [Karl-Heinz Riedle (diff=1380008554)](https://en.wikipedia.org/w/index.php?title=Karl-Heinz_Riedle&diff=1380008554&oldid=1335846068)
* **Date Evaluated:** 2026-10-13
* **Status:** ✅ Verified
* **Focus Area:** Prose bold formatting markup (`'''"Kalle"'''`) in an article with citation context rows.
* **Diagnosis:** An editor added a nickname with bold quotes into the lede sentence, directly adjacent to paragraphs containing unchanged citations.
* **Verification:** Confirmed that RefDiff leaves prose wikitext diff highlighting (`<ins class="diffchange">''' "'''Kalle'''" '''</ins>`) 100% intact, does not generate false citation rows, and maintains byte-for-byte Memento restoration.

---

#### Bihar Legislative Assembly (`diff=1379207737`)
* **Article & Revision:** [Bihar Legislative Assembly (diff=1379207737)](https://en.wikipedia.org/w/index.php?title=Bihar_Legislative_Assembly&diff=prev&oldid=1379207737)
* **Date Evaluated:** 2026-10-14
* **Status:** ✅ Verified
* **Focus Area:** Quotation attribute truncation on embedded apostrophes and space-to-underscore footnote anchor discovery.
* **Diagnosis:**
  1. Reference tags with embedded apostrophes inside double quotes (`name="From teen in RSS shakha to Speaker's Chair: Bihar BJP leader Prem Kumar's long journey"`) were truncated at `"Speaker"` because `extractName`'s non-greedy regex matched the apostrophe `'` against the delimiter character class `["']`.
  2. Footnote anchors generated by MediaWiki convert spaces to underscores (`cite_note-From_teen_in_RSS_shakha_to_Speaker's_Chair:_Bihar_BJP_leader_Prem_Kumar's_long_journey-4`), while `findCiteNoteAnchor` queried using the raw spaced string, failing to find the target anchor element.
* **Remediation:**
  1. Updated `extractName` with symmetric paired quote alternatives (`(?:"|&quot;)(.*?)(?:"|&quot;|\/|&gt;|>|\s*$)` and `(?:'|&apos;)(.*?)(?:'|&apos;|\/|&gt;|>|\s*$)`), cleanly preserving embedded apostrophes inside double quotes and embedded double quotes inside single quotes while retaining unclosed quote toleration.
  2. Enhanced `findCiteNoteAnchor` to generate underscore-normalized candidate lookups (`name.trim().replace(/\s+/g, '_')`) with fallback manual scan across all `[id^="cite_note-"]`.
* **Verification:** Unit tests in `tests/test_parser.js` and `tests/test_anchor.js`; real DOM integration test in `tests/test_jsdom.js`. Total test suite passes at **103/103**.

---

## 4. Chronological Decision & Activity Record

### 2026-10-08: Inception, Design Alignment & Proposal Drafting

* **Problem Identification & Root Cause Analysis:**
  * Analyzed the shortcomings of traditional inline citations (`<ref>...</ref>`): *diff pollution* (sentence and citation changes entangled), artificial merge conflicts, and the *split-hunk* problem when using document-end citation lists.
  * Identified the emerging challenge of **"AI Slop"**: With AI generating large volumes of plausible text, reviewers need clear, unfragmented prose to evaluate claims and an isolated section-level source inventory to audit citations.
* **Architecture Formulation (Two-Tier Model):**
  * Decoupled source storage from reader presentation:
    * *Tier 1 (Source/Git):* Local declaration via `<references-def>` within the section.
    * *Tier 2 (Frontend):* Global continuous numbering `[1], [2], ...` at document end via `<references />`.
* **Resilience & Fault Tolerance Consensus:**
  * Established the rule of **Page-Wide Scope**: Moving sentences with `<ref name="..." />` between sections must **never** break rendering, even if the author forgot to move the definition.
* **Author Ergonomics & "Bots Clean Up" Principle:**
  * Rejected over-engineering of rigid authoring rules. Authors write freely and naturally; automated maintenance bots asynchronously migrate misplaced definitions, consolidate multiple blocks per section, and prune unreferenced dead citations.
* **Syntax & Formatting Standardization:**
  * Selected `<references-def>` as the primary working name (clearly separating *definition* from *rendering* without colliding with nested "sub-references").
  * Adopted a compact **one-line-per-citation** style to minimize vertical space and produce atomic, one-line Git diffs.
* **Document Modularization & Translation:**
  * Created `PROPOSAL.md` (English, laser-focused).
  * Created `CONCEPT.md` (comprehensive English architecture paper).
  * Removed early German drafts (`VORSCHLAG.md`, `KONZEPT.md`) to establish English as the primary lingua franca for upstream Wikimedia discussions.
  * Added Section 8 ("Ecosystem Impact & Affected Tooling") detailing impacts on `Extension:Cite`, `Parsoid`, `VisualEditor`, `Pywikibot`, `InternetArchiveBot`, and external parsers.
  * Prepared submission drafts for Wikimedia Phabricator and Extension:Cite discussion pages.
  * Embedded high-fidelity, 2-column dark-mode MediaWiki diff imitation tables across `PROPOSAL.md`, `CONCEPT.md` (Scenarios 3.1 & 3.2), and `SUBMISSION_DRAFTS.md` (Phabricator draft).
  * Upgraded community talk page draft in `SUBMISSION_DRAFTS.md` to use `<syntaxhighlight lang="diff">` to prevent live MediaWiki citation errors and provide colorized diff display.
  * **Decoupled Diff Trade-Off Analysis (Zero Diff Tooling Dependency):** Analyzed the reviewer challenge of reviewing modified claims without seeing the detached reference definition in the same diff hunk. Explicitly framed this as an **acknowledged trade-off** rather than a blocker requiring modifications to `wikidiff2`. Confirmed that `<references-def>` works 100% out-of-the-box with existing diff tools, with section locality providing sufficient proximity to minimize cognitive load.
  * **Multi-Page Reference Reuse Analysis:** Analyzed real-world Wikipedia workflows for citing different pages of the same work. Documented compatibility with in-prose page suffixes (`{{rp|...}}`), native MediaWiki sub-references (`details="..."`), and shortened footnotes (`{{sfn}}`) in `CONCEPT.md` (Section 7.4) and `PROPOSAL.md` (Section 4).
  * **Cross-Section Dependency & Deletion Hazard Analysis:** Addressed the critical edge-case where Section A defines a reference reused downstream in Section B, and Section A is subsequently deleted. Documented status-quo parity (inline references share this exact vulnerability), established architectural mitigations (tiered global/local placement, parser idempotency for safe duplicate definitions, edit-time linter warnings in Parsoid/VE, and bot hoisting) in `PROPOSAL.md` (Section 4) and `CONCEPT.md` (Section 7.2).
  * **Dismissal Clean-up & Historical Revision Legacy Support:** Defined an automated wikitext de-migration strategy via bot/maintenance script (loss-less hoisting to LDR without prose edits) and guaranteed multi-year parser compatibility for older database revisions (`oldid=...`) via a passive fallback hook in `Extension:Cite` in `PROPOSAL.md` (Section 6) and `CONCEPT.md` (Section 9).
  * **Tooling-Friendly Syntax Evaluation (`<references display="none">`):** Evaluated reusing the existing `<references>` tag with the standard CSS display-suppression attribute `display="none"` to address tooling/bot fatigue. Documented that `display="none"` directly resolves human cognitive friction ("why is `<references>` here if it does not display footnotes?") by explicitly mirroring the universal web standard `display: none;`, while allowing existing AST parsers (`mwparserfromhell`, `wikitextparser`), bots (AWB), and regexes to parse definition blocks without new tag registration, in `PROPOSAL.md` (Section 2) and `CONCEPT.md` (Section 6 & 6.1).
* **Adoption of `<references hidden>` as Primary Working Title Solution:**
  * Formally designated `<references hidden>` as the primary working title solution across all proposal and concept specifications, superseding `<references-def>`.
  * **HTML5 Semantic Standard:** Grounded in the native HTML5 boolean attribute `hidden` (§3.2.6), which directs user agents and parsers that an element is not currently relevant and must be hidden from visual display.
  * **AST & Bot Compatibility:** Reuses the existing MediaWiki `<references>` tag, eliminating the need for new XML tag registration in AST parsers (`mwparserfromhell`, `wikitextparser`, Parsoid AST), bots (AWB, Pywikibot, Citoid), and community regex suites.
  * **Wikitext Ergonomics:** As a boolean attribute, it requires no value quotes or equals sign (`<references hidden>` instead of `<references display="none">`), providing a cleaner, faster, and less error-prone typing experience for wikitext authors.
  * **Preserved RFC Alternatives:** Retained `<references-def>` (for strict parser separation preventing accidental rendering on unpatched legacy third-party wikis) and `<references display="none">` (for explicit CSS property-value alignment) as formally evaluated alternatives.
* **Dynamic LDR Hoisting Compatibility Layer (On-the-Fly Reformatting):**
  * Formulated the architectural solution to the unpatched parser hazard (where an unpatched `Extension:Cite` without the `hidden` attribute patch would render an unwanted in-situ `<ol>` list and prematurely flush the citation buffer).
  * **Pre-Parse Dynamic Hoisting:** Designed a 15-line server hook for `ParserBeforeInternalParse` (or micro-extension `CiteHiddenCompat`) that extracts `<references hidden>` blocks and hoists definitions into the document-end `<references>` tag as standard List-Defined References (LDR) in memory at parse time.
  * **100% Backward-Compatible Output:** Because the legacy parser receives pure standard LDR wikitext, all three unpatched failure modes (stray `<ol>`, premature citation buffer drain, and parameter error banners) are completely eliminated without touching MediaWiki core files.
  * **Export & Mirror Protection:** Specified that Wikimedia database dumps (`pages-articles.xml.bz2`) and export filters (`Special:Export`, Kiwix) transpile to standard LDR on export, safeguarding downstream mirrors and offline readers.
  * Documented as Pathway D in `CONCEPT.md` and integrated into Section 5 of `PROPOSAL.md`.
* **Implementation of `RefDiff` Engine Prototype (`refdiff.py`):**
  * Built a standalone, zero-dependency Python 3 implementation of the RefDiff engine (`refdiff.py`) utilizing standard library modules (`re`, `difflib`, `dataclasses`, `argparse`, `json`).
  * Implemented robust wikitext tokenization for inline `<ref>`, self-closing `<ref name="..." />`, and section-scoped `<references hidden>` blocks.
  * Built the dual diff engine:
    1. Word-level prose differ that groups modifications and translates sentinels into compact superscript badges (`[1]`, `[schmidt2020]`, `{+[2]+}`, `[-[1]-]`).
    2. Key-value citation differ that isolates template parameter changes (`|pages=`, `|url=`, etc.) while suppressing unchanged boilerplate.
  * Implemented 3 output formatters: Section-scoped terminal ANSI renderer, compact git-style `--stat` summary, and structured `--json` emitter for browser gadgets.
  * Added auto-detection for standard Git external diff driver invocations (`git-refdiff`).
  * Created unit test suite (`tests/test_refdiff.py`) covering XML attributes, sentinel injection, badge status rendering, raw diff isolation, and JSON serialization. All tests pass in 0.002s.
* **RefDiff Design Refinements & User Feedback Alignment:**
  * **Raw `<ref>` Span Diffing (No Template Decoding):** Completely removed custom template parameter parsing/decoding logic per user directive. The engine now performs direct, raw word-level diffs on the full encapsulating `<ref name="...">...</ref>` tags, eliminating maintenance complexity and ensuring 100% fidelity to wikitext formatting.
  * **1:1 Prose Badge & Citation Sync with Option A (`[~name~]`):**
    * Dropped verbose `name=` badge prefixes in favor of direct reference names (`[schmidt2020]` or `[ref1]`).
    * Adopted diff tilde notation (`[~schmidt2020~]`) in bold yellow for modified references in both prose badges and citation headers.
    * Ensured that even on ref-only changes, the prose sentence is displayed annotating the affected reference badge (`[~name~]`) so reviewers immediately understand the claim context.
    * Added synchronized badge indicators in `--stat` summary (e.g. `Refs: 1 modified ([~schmidt2020~])`).
  * **Live Wikipedia Revision CLI Fetching (`refdiff.py`):**
    * Added direct Wikipedia diff fetching over HTTP via stdlib `urllib.request` (`python3 refdiff.py <URL>` or `python3 refdiff.py --diff <rev_id>`).
    * Resolves comparison endpoints via the MediaWiki Action API (`action=compare`), parses JSON slots, and pipes revisions straight into the decoupled diff engine.
  * **Zero-Loss In-Place MediaWiki User Script (`refdiff.js`):**
    * Completely discarded synthetic replacement diff tables to preserve 100% of native MediaWiki elements: revision metadata headers (author, timestamp, edit summary), line numbers (`Line 101:`), context rows, and embedded file previews.
    * Implemented in-place DOM row manipulation: replaces `<ref>` tags in changed prose rows with direct inline badges (`⟨name⟩`, `⟨~name~⟩`), converts rows without remaining prose changes to neutral context appearance, and inserts native citation diff rows (`<tr class="refdiff-cit-row">`) directly underneath.
    * Added standard UserScript metadata block for Tampermonkey, Violentmonkey, and Greasemonkey compatibility, plus a 1-line loader snippet for Wikipedia `Special:MyPage/common.js`.
    * Implemented entity-safe attribute regex parsing (`&lt;ref\b((?:(?!&gt;|\/&gt;)[\s\S])*?)...`) resolving HTML entity clipping bugs.
    * Implemented multi-pass citation pairing: (1) matching by explicit `name`, (2) matching identical text content, (3) positional order fallback. Eliminates false modification cascading when citations are inserted at the start of a paragraph.
    * Verified live on English Wikipedia (`Solar System diff=1372329011`) in Chromium CDP across both Light and Dark modes. Confirmed instantaneous zero-loss toggle between Decoupled and Standard Wikidiff.
* **UI Polish, Native OOUI Integration & Visual Ergonomics:**
  * **Native MediaWiki OOUI Diff Toolbar Integration:** Moved the RefDiff button directly into Wikipedia's native mode switcher (`.ve-init-mw-diffPage-diffMode .oo-ui-buttonSelectWidget`) immediately adjacent to `[[]] Wikitext` (`[ 👁 Visual ] [ [[]] Wikitext ] [ ⧉ RefDiff ] Inline ( )`), seamlessly matching Wikipedia's button styling, dark/light theme tokens, and inline diff toggle.
  * **Mathematical Angle Bracket Notation (`⟨ref1⟩`, `⟨~ref3~⟩`):** Replaced square brackets `[...]` with mathematical angle brackets across `refdiff.js`, `refdiff.py`, and specifications, eliminating visual and syntactic collisions with Wikipedia's link highlighting (`[external link]` and `[[wikilink]]`).
  * **Citation Diff Row Prefixing:** Citation diff rows appended directly below the prose line now start with their matching badge (`⟨~ref3~⟩ <ref>...`) in gold/amber highlight, immediately connecting the prose badge to the citation change.
  * **Diff Header Minimalism:** Removed redundant text summary (`(Refs: ...)`) from the diff prefix bar to strictly maintain Wikipedia's clean, native header aesthetics.
  * **Subtle Secondary Styling for Unmodified References:** Replaced link-blue styling (`#0645ad` / `#6da2ff`) and bold weight on `.ref-badge` with Wikipedia's native secondary text color (`var(--color-subtle, #72777d)` in light mode, `#8c9196` in dark mode, normal font weight). Unchanged references blend naturally into prose context without mimicking hyperlinks or drawing false review attention.
  * **Global On-Wiki Deployment & OOUI Container Resilience:**
    * Published globally to Meta-Wiki ([`m:User:Powercycler/refdiff.js`](https://meta.wikimedia.org/wiki/User:Powercycler/refdiff.js)) and enabled for cross-wiki use across all language Wikipedias via [`m:Special:MyPage/global.js`](https://meta.wikimedia.org/wiki/Special:MyPage/global.js).
    * Enhanced toolbar compatibility to seamlessly support both SSR `.oo-ui-buttonGroupWidget` and client-transformed `.oo-ui-buttonSelectWidget` containers with capture-phase event delegation and `MutationObserver` re-rendering resilience.
    * Live on-wiki functionality confirmed working across diff views.
  * **Document Appearance Order Sorting:**
    * Resolved non-sequential anonymous citation numbering (`ref1`, `ref3`, `ref2`) caused by multi-pass matching adding identical citations before modified ones.
    * Sorted citation pairs by their document index prior to numbering, ensuring citations strictly count `ref1`, `ref2`, `ref3` in natural reading order.
  * **Single-Sided Addition & Deletion Row Decoupling:**
    * Extended `applyDecoupling()` to process change rows that contain only `.diff-addedline` or `.diff-deletedline` (such as whole paragraph additions/deletions or `wikidiff2` line replacements).
    * Built comprehensive 5-scenario test suite (`tests/comprehensive_test.html`) and verified against official Wikipedia API `action=compare` `wikidiff2` output in Chromium CDP across Light and Dark themes.
  * **CI Pipeline & JavaScript Linting:**
    * Configured ESLint (`.eslintrc.json`) tailored for browser user scripts, MediaWiki globals (`mw`), and Node unit tests.
    * Added `package.json` with standard npm lifecycle scripts (`npm run lint`, `npm test`, `npm run ci`).
  * **Archival of Python Prototype (`archive/python-prototype/`):**
    * Moved standalone CLI prototype (`refdiff.py`, `git-refdiff`, and `tests/test_refdiff.py`) into `archive/python-prototype/` with its own dedicated README.
    * Refocused root repository and primary documentation on the native MediaWiki in-browser user script (`refdiff.js`).
    * Updated GitHub Actions CI to test the archived prototype suite via `PYTHONPATH=archive/python-prototype`.
  * **Test Suite Streamlining & Comprehensive HTML Integration:**
    * Deleted orphaned `.wiki` sample fixtures (`tests/fixtures/`) leftover from early Python prototype iterations.
    * Wired [`tests/comprehensive_test.html`](tests/comprehensive_test.html) directly into both offline Node unit tests (`tests/test_pairing.js` Test 6) and headless Chromium CDP integration tests (`tests/test_live_cdp.py`).
    * Automated validation of all 5 diff scenarios (sequential ordering, named modification, text+ref added, ref added to existing text, ref removed) with zero-loss Wikitext toggle assertions.
* **Codebase Refactoring & Architecture Documentation (`refdiff.js` & `ARCHITECTURE.md`):**
  * **Clean-Code Modularization of `refdiff.js`:**
    * Encapsulated dispersed mutable variables into a unified `state` namespace (`origTableHtml`, `isDecoupled`, `initRetries`, `diffTypeSwitchWidget`, `modifiedRows`).
    * Centralized string literals and queries into `SELECTORS`, `CLASSES`, and `HOOKS` registries, eliminating magic strings.
    * Refactored monolithic procedures into focused single-responsibility functions: `captureRowSnapshot()`, `restoreRowSnapshot()`, `transformProseCells()`, `updateProseRowAppearance()`, `insertCitationRows()`, and `findModeButtons()`.
    * Enforced full JSDoc typing across all functions.
    * Retained 100% backward compatibility for all public APIs and 0 ESLint warnings/errors.
  * **Comprehensive System Architecture Document (`ARCHITECTURE.md`):**
    * Created dedicated architecture and technical design document featuring Mermaid diagrams for the two-tier system model, subsystem components, and state machine lifecycle.
    * Formulated the Memento DOM snapshot pattern specification explaining why in-place mutation is mandatory to preserve MediaWiki's `inlineFormatToggle.js` and VisualEditor closures.
    * Documented the 3-pass heuristic reference pairing algorithm, entity-safe tokenization, cognitive load color ergonomics, and the two-layer verification pipeline (Unit + CDP live automation).
  * **Verification:**
    * 23/23 unit tests passing in `tests/test_pairing.js`.
    * 7/7 live browser CDP verification steps passing in `tests/test_live_cdp.py` (Visual Diff, Wikitext Diff, RefDiff, direct transitions, Inline toggle switch, and Vector 2022 Dark mode).
* **Tag-Boundary Normalization, Hardened Tokenization & Stress Testing:**
  * **Root Cause Discovery (`wikidiff2` Boundary Shifts):** Identified that MediaWiki's character-level diff engine cuts across HTML entities at edit boundaries (e.g. `&lt;/ref<del>&gt;` or `/<del>&gt;`). Because `&gt;` was placed inside `<del>`, the parser's closing tag regex failed to match, causing unclosed lookaheads to swallow adjacent citations and surrounding article text in high-density tables (such as airline destination lists).
  * **Boundary Preprocessor (`normalizeDiffTags`):** Implemented pre-tokenization normalization in `refdiff.js` that safely shifts misplaced `<del>`/`<ins>` tags outside tag delimiters (`&lt;/ref...&gt;` and `/<del>&gt;`), cleanly removing empty diffchange spans.
  * **Lookahead-Protected Tokenization:** Hardened `REF_REGEX` content capture to `((?:(?!&lt;ref\b)[\s\S])*?)` to guarantee an unclosed citation tag can never swallow subsequent tags.
  * **Bilateral Modification Tracking:** Updated `transformProseCells` to evaluate `(d && d.hasChange) || (a && a.hasChange)`, accurately detecting modified references regardless of diffchange placement.
  * **High-Density Real-World Stress Test:**
    * Captured standalone test fixture [`tests/stress_test_1379409916.html`](tests/stress_test_1379409916.html) (enwiki diff=1379409916, Zagreb Airport, 114 citations across 4 change rows).
    * Added Suite 8 to [`tests/test_pairing.js`](tests/test_pairing.js) with 4 new tests validating boundary normalization, 114 citation parses, 57 1:1 pairs with 0 unparsed leaks, and sub-50ms execution speed.
    * Expanded test suite to **27/27 unit tests passing**.
    * Enhanced live CDP test runner (`tests/test_live_cdp.py`) with `--stress` and `--diff-url` flags, validating clean rendering in headless Chromium.
* **On-Wiki Documentation Refinements (`refdiff.wiki`):**
  * Expanded example diff table 2 to include the full citation markup on both sides with precise digit diff highlighting.
  * Streamlined headings ("English Wikipedia (Recommended)"), eliminated filler words, and removed arbitrary numbering for clear, publication-grade documentation.

### 2026-10-10: Shortened Footnotes, Virtual File Bundle & Modular Test Suite

* **Shortened Footnotes & Footnote Template Support (`{{sfn}}`, `{{r}}`, `{{efn}}`, `{{harvnb}}`):**
  * Integrated full support for shortened footnote templates alongside standard `<ref>` tags in sequential document order.
  * Created `extractSfnInfo()` parameter tokenizer supporting 1, 2, 3, and 4+ authors, year, and page parameters.
  * Added `cite_note-FOOTNOTE*` anchor resolution and live popup preview integration.
  * Tested live on enwiki diff `Odoacer diff=1379486498` with 10 shortened footnotes.
* **RefDiff Virtual File Decomposition:**
  * Refactored monolithic `refdiff.js` into **13 distinct virtual files** with explicit demarcation banners and a sorted header Table of Contents annotated with `(first line: ...)` markers.
  * Retained single-file zero-dependency architecture required for MediaWiki gadget distribution.
* **Modular 1-to-1 Test Suite Architecture:**
  * Established that while the browser gadget is constrained to a single file, the Node.js test environment is unconstrained and benefits from modular organization.
  * Decomposed monolithic `tests/test_pairing.js` into **13 modular test files** mapped 1-to-1 to each virtual file of `refdiff.js`, plus a zero-dependency test harness ([`tests/harness.js`](tests/harness.js)) and master runner ([`tests/runner.js`](tests/runner.js)).
  * Implemented `withMockEnvironment` sandbox preventing cross-test global pollution.
  * Expanded test coverage from 27 to **48 passing tests**, executing in **~18–25 ms** with 0 ESLint warnings.
  * Added standalone module execution support (e.g. `node tests/test_parser.js`).
* **Formal Test Plan & Quality Assurance Framework (`TEST_PLAN.md`):**
  * Created project-level [**`TEST_PLAN.md`**](TEST_PLAN.md) defining the 4-level test pyramid (Unit → Component/Memento → Benchmarks → Live CDP), 1-to-1 virtual source-to-test mapping, and release quality gates.
* **100% Headless Function Coverage Milestone:**
  * Targeted and closed all headless coverage gaps across `refdiff.js` event loop closures, button factories, mutation observers, OOUI widgets, and auto-start MediaWiki hooks.
  * Reached **100.0% function coverage** (66 of 66 functions) in headless Node.js via V8 coverage instrumentation.
  * Increased test suite to **59 passing tests** across all 13 modular suites executing in **~18–25 ms** with 0 ESLint warnings.
  * Synchronized all documentation across [`TEST_PLAN.md`](TEST_PLAN.md), [`README.md`](README.md), [`ARCHITECTURE.md`](ARCHITECTURE.md), and [`REFDIFF.md`](REFDIFF.md).

### 2026-10-11: Configurable Inline-Change Mode & 100% Function Coverage (68/68 functions)

* **Configurable Inline Ref-Diff Mode (`separateChanged: false`):**
  * Implemented user-configurable decoupled vs. inline-diff behavior.
  * In `separateChanged: false` mode, unchanged references are collapsed into clean mathematical badges with full Reference Preview hovercards, while modified, added, and deleted references remain directly inline in the prose diff line with standard MediaWiki `<del>`/`<ins>` diff highlighting (no separate citation rows inserted).
  * Configurable with 4-tier precedence: `window.refdiffConfig.separateChanged` > URL parameter `?refdiff_separate=0|1` > `mw.storage` / `localStorage` (`refdiff-separate-changed`) > default `true` (full decoupling).
* **Automated Test Expansion & 100% Headless Function Coverage:**
  * Added 6 new unit and component tests in `tests/test_mode_coordinator.js` and `tests/test_pipeline.js`.
  * Total test count expanded to **65 passing tests** across 13 modular suites, completing in **~18–25 ms** with 0 ESLint warnings.
  * Verified **100.0% function coverage** across all **68 of 68 functions** via V8 coverage instrumentation.
* **In-Toolbar Decouple Toggle (`[✓] Decouple rows`):**
  * Implemented live checkbox toggle mounted strictly to the left of the mode switcher (`.ve-init-mw-diffPage-diffMode` / `.oo-ui-buttonSelectWidget`) and before fallback mode links.
  * Leftward placement eliminates layout shifts and button jumping during script loading and mode changes.
  * Coordinated disabled state during Wikitext/Visual diff modes without removing the element from the DOM.
  * Added unit tests verifying toggle rendering, preference persistence, and live table re-rendering (67 tests, 71 functions, 100% coverage).

* **Bug Fix: Prose Whitespace Diffs Masked as Context Rows (Cosmic Inflation diff=1379470949):**
  * **Reported Issue:** Diffs with only whitespace changes in prose (such as an added space `<ins class="diffchange diffchange-inline"> </ins>`) failed to render any changes under RefDiff, appearing as an unchanged context row while displaying normally under Wikitext and Visual diffs.
  * **Root Cause:** Empty diffchange tag cleanup in `normalizeDiffTags` and `transformProseCells` used `/<(ins|del)\b[^>]*>\s*<\/\1>/gi`. The `\s*` matched and stripped valid whitespace-only diffs (`<ins class="diffchange"> </ins>`). With no diff tags left, `updateProseRowAppearance` falsely classified the row as having no prose changes and converted it to `diff-context`, removing the `+`/`-` markers.
  * **Resolution:** Replaced the regex with `/<(ins|del)\b[^>]*><\/\1>/gi` to strictly remove truly empty boundary artifacts without affecting whitespace-only diff changes.
  * **Verification:** Confirmed live in Chromium via CDP on `Cosmic inflation diff=1379470949` that the added space is properly highlighted in blue with `+`/`-` markers and citation badges.
  * **Test Coverage:** Added regression tests in `tests/test_utils.js` and `tests/test_pipeline.js`. All **69/69 tests passing (100% headless function coverage across 71/71 functions)**.

### 2026-10-11: In-Toolbar "Inline modified refs" Toggle & In-Place Prepended Badges

* **Intuitive Toolbar Label & Positive Polarity (`[ ] Inline modified refs`):**
  * Renamed the toolbar checkbox from `Decouple rows` to **`Inline modified refs`**.
  * Default state: **Unchecked** (clean traditional RefDiff out-of-the-box, decoupling all modified, added, and deleted citations into separate rows below).
  * When checked: **Inline modified references mode** is enabled (`inlineModified: true` / legacy `separateChanged: false`).
* **In-Place Prepended Badge for Modified References:**
  * Modified references stay directly inline within prose diff lines with full native `<ins class="diffchange">` / `<del class="diffchange">` highlighting preserved.
  * An interactive mathematical badge (`⟨~label~⟩`) is prepended directly before `<ref...>`, linking directly to the `#cite_note-*` live anchor.
  * Unchanged citations remain collapsed into badges (`⟨ref1⟩`).
  * Added citations (e.g. `<ref name="kami" />`) and deleted citations **always** decouple into dedicated citation rows below, regardless of the checkbox.
* **Testing & Quality Assurance:**
  * Total test count expanded to **75/75 passing tests** across 13 modular test suites with 0 ESLint warnings.
  * Verified live via Chromium CDP on Wikipedia diffs.

### 2026-10-11: Reference Previews Hovercard Fix & Anonymous Citation Discovery

* **Rich Reference Preview Activation on Badges:**
  * Resolved missing Reference Preview hovercards on anonymous citations without URLs (such as `<ref>{{Cite book |author=Harris, A. |title=Planetary Dynamics ...}}</ref>`).
  * Enhanced `findCiteNoteAnchor(name, rawContent, label)` to support:
    1. Template metadata matching: extracts `title=` and `author=` / `last=` and matches `.references li[id^="cite_note-"]` text.
    2. Plain-text matching: matches clean non-template substrings against footnotes.
    3. Positional fallback: maps auto-numbered references (e.g. `ref2`) directly to `cite_note-2`.
* **Suppression of Obstructive Native `title` Tooltips:**
  * Omitted the native HTML `title` attribute on all badges linking to `#cite_note-*` in both prose rows and citation diff rows.
  * Eliminates the black browser OS tooltip (`"Citation metadata modified"`) that previously collided with and obscured Wikipedia's native Reference Preview popup card (`Extension:Popups` / `ext.cite.ux-enhancements`).
* **Test Suite Expansion:**
  * Added unit tests in `tests/test_anchor.js` and assertions in `tests/test_renderer.js`.
  * Total test count: **78/78 passing tests** (100% headless function coverage) with 0 ESLint warnings.
  * Verified live in Snap Chromium via CDP on Meta-Wiki (`Show_case` diff) and English Wikipedia (`Kim Domingo` diff).

### 2026-10-13: Unwrapped Footnote & Template Delimiter Bugfixes (Zipf's Law diff=1379548357)

* **Bug Diagnosis (`Zipf's law` diff=1379548357):**
  * When an explanatory footnote (`{{efn|as Zipf acknowledged<ref name=zipf1949/>{{rp|546}}}}`) was unwrapped into top-level prose (`As Zipf acknowledged,<ref name=zipf1949/>{{rp|546}} ...`), multiple compounding issues occurred:
    1. `{{rp|546}}` (Reference Page suffix) was included in `TEMPLATE_REF_REGEX`, causing `546` to be parsed as an independent citation and spuriously paired with the deleted `{{efn}}`, producing a bogus modified citation badge `⟨~546~⟩` and a nonsensical citation row.
    2. `TEMPLATE_REF_REGEX` terminated prematurely at the inner nested `{{rp|546}}` closing braces `}}`, leaving orphaned braces and broken template fragments.
    3. `normalizeDiffTags` rule 6 (`res.replace(/\}<(del|ins)...>\}/, ...)` lacked lookaround assertions, causing the closing brace of adjacent preceding templates (like `{{rp|546}}<del>}}</del>`) to be erroneously merged into triple braces `}}}`.
    4. Unwrapped template syntax spanning across `</del>` into unchanged prose was mistakenly parsed as a deleted citation entity, swallowing unchanged prose and colliding with inner `<ref>` string replacements.
* **Architectural & Algorithmic Solutions:**
  * **Omission of `{{rp}}` from Citation Parser:** Removed `rp` from `TEMPLATE_REF_REGEX` and `parseRefs`. `{{rp|page}}` provides an inline page suffix modifying the preceding citation callout (rendering `[1]:546`) and is preserved attached to the reference badge directly in prose.
  * **Nested Template Resilience in `TEMPLATE_REF_REGEX`:** Updated pattern with balanced matching supporting templates up to 2 levels deep, preventing premature termination at inner template braces.
  * **Adjacent Template Delimiter Lookaround Guards (`normalizeDiffTags`):** Added `(?<!\{)` / `(?!\{)` to rule 5 and `(?<!\})` / `(?!\})` to rule 6, preventing delimiter corruption when templates immediately precede split diffchange tags.
  * **Diffchange Tag Balance Validator (`hasBalancedDiffTags`):** Ensured candidate `<ref>` and template matches do not cross unbalanced `<del>` or `<ins>` boundaries. Unwrapped footnote delimiters are preserved in prose diffs without polluting citation inventories.
  * **Hierarchical Container Filtering:** Filtered out inner references nested inside outer footnote containers (e.g. `<ref>` inside `{{efn}}`), ensuring the outer footnote decouples cohesively without replacement collisions.
* **Verification & Testing:**
  * Added unit and regression tests in `tests/test_constants.js`, `tests/test_utils.js`, `tests/test_parser.js`, and `tests/test_pipeline.js`.
  * Total test count expanded to **86/86 passing tests** across 13 modular test suites with 0 ESLint warnings.
  * `Zipf's law` (`diff=1379548357`) marked as Verified in `TEST_PLAN.md`.

### 2026-10-13: Unclosed Quote Attribute Toleration & Standalone Added Citation Lines (Donnie Brasco diff=1380017400)

* **Bug Diagnosis (`Donnie Brasco (film)` diff=1380017400):**
  * On line 40 of English Wikipedia revision 1380017400, an editor added a reference with a typo missing the closing quote before the tag bracket: `<ref name="mojo_2>{{cite web|url = https://www.boxofficemojo.com/title/tt0119008/}}</ref>`.
  * MediaWiki's native Cite extension tolerates unclosed quotes up to the closing `>` bracket and generates the anchor `id="cite_note-mojo_2-4"`.
  * RefDiff's `extractName(attrsStr)` strictly required matching closing quotes (`/(?:&quot;|["']|&apos;)(.*?)(?:&quot;|["']|&apos;)/`), causing it to return `null`.
  * As a result, RefDiff fell back to assigning an anonymous label `"ref1"` (`⟨+ref1+⟩`), and `findCiteNoteAnchor(null, ...)` failed to link to `#cite_note-mojo_2-4`, breaking native Reference Preview hovercards.
* **Architectural & Algorithmic Solutions:**
  * **Quote Toleration in `extractName`:** Enhanced the attribute extraction regex in `extractName` to accept unclosed quotes bounded by `/`, `&gt;`, `>`, or string end: `/(?:&quot;|["']|&apos;)(.*?)(?:&quot;|["']|&apos;|\/|&gt;|>|\s*$)|name\s*=\s*([^\s"'>&]+)/i`.
  * **Accurate Badge & Anchor Resolution:** RefDiff now correctly extracts `"mojo_2"`, labels the badge `⟨+mojo_2+⟩`, and resolves the target anchor `cite_note-mojo_2-4` for native Reference Preview hovercards.
* **Verification & Testing:**
  * Added unit test in `tests/test_parser.js` (`extracts reference name with unclosed quotation mark (Donnie Brasco diff=1380017400)`).
  * Total test count expanded to **87/87 passing tests** across 13 modular test suites with 0 ESLint warnings.
  * `Donnie Brasco (film)` (`diff=1380017400`) marked as Verified in `TEST_PLAN.md`.

### 2026-10-14: Real DOM Testing in JSDOM & On-Wiki <nowiki> Protection (Ultraviolet Benchmarks)

* **Motivation & Architectural Context:**
  * Comparative review against Wikipedia's [Ultraviolet](https://en.wikipedia.org/wiki/Wikipedia:Ultraviolet) userscript identified key areas for hardening:
    1. **Mock Weakness Elimination:** Testing RefDiff against a real headless DOM environment (`jsdom`) using real MediaWiki `table.diff` fixtures (`tests/comprehensive_test.html`, `tests/stress_test_1379409916.html`).
    2. **On-Wiki Template Protection:** Protecting the script against on-wiki wikitext template expansion (`{{sfn}}`, `{{efn}}`) and parameter substitution (`~~~~`) by wrapping the deployment in `/* <nowiki> */` and `/* </nowiki> */`.
* **Implementation Details:**
  * **JSDOM Integration (`tests/test_jsdom.js`):**
    * Added `jsdom` devDependency to `package.json`.
    * Implemented 10 real DOM test scenarios in `tests/test_jsdom.js`: full diff table decoupling, byte-for-byte in-place Memento restoration, 114-ref airport destination table stress testing, OOUI button mounting and 3-way mode switching, native inline diff switch locking, fallback mode bar mounting, footnote anchor resolution via real `document.querySelector`, `MouseEvent` delegation with class flashing, inline modified refs toggle mode, and nowiki protection.
  * **Defensive DOM Guards in `refdiff.js`:**
    * Safely guarded `scrollIntoView` calls (`typeof target.scrollIntoView === 'function'`) to ensure compatibility with headless and non-standard browser DOM environments.
    * Safely guarded `MutationObserver` instantiation (`window.MutationObserver || MutationObserver`).
  * **On-Wiki `<nowiki>` Protection:**
    * Wrapped `refdiff.js` at line 1 with `/* <nowiki> */` and at the file end with `/* </nowiki> */`.
    * Added automated test ensuring `<nowiki>` delimiters remain balanced with zero unclosed internal tags.
* **Verification & Results:**
  * Test count expanded to **97/97 passing tests** across 14 modular test suites with 0 ESLint warnings.
  * Entire suite executes in **~250 ms** via `npm test` and `npm run ci`.

---

## Planned Future Tasks & Architectural Evaluations

### Task: Evaluate Regex-Based Citation Parsing vs. Preloaded MediaWiki / Meta-Wiki Libraries

* **Objective:**
  Analyze whether maintaining a custom regular expression engine (`REF_REGEX`, `TEMPLATE_REF_REGEX`) remains the optimal long-term strategy for RefDiff, or whether preloaded MediaWiki libraries and ResourceLoader modules (available on Wikimedia projects like Meta-Wiki and English Wikipedia) provide superior wikitext parsing capabilities.

* **Background & Motivation:**
  * RefDiff currently tokenizes `<ref>...</ref>` tags, self-closing tags, and templates (such as `{{sfn}}`) using custom regular expressions and string normalizers (`normalizeDiffTags`, `stripHtml`).
  * Regex-based parsing is fast (<25 ms for 100+ citations), has zero runtime dependencies, and runs headlessly in Node.js unit tests without browser or ResourceLoader mocks.
  * However, wikitext is not a regular grammar. Known challenges with regex include:
    * Nested templates inside citation parameters (e.g. `{{cite web|title={{lang|es|...}}}}`).
    * Template markup split unevenly across MediaWiki `<ins class="diffchange">` / `<del class="diffchange">` boundary tags.
    * Parser functions that generate references dynamically (e.g. `{{#tag:ref|...}}`).

* **Scope of Investigation:**
  1. **Audit Available Libraries on Wikimedia Projects:**
     * Inspect ResourceLoader modules preloaded or available on `Special:Diff` on English Wikipedia and Meta-Wiki:
       * `mediawiki.util` / `mw.util`
       * `mediawiki.Title`
       * VisualEditor core and wikitext modules: `ext.visualEditor.mwwikitext`, `ve.dm.MWReferenceModel`, `ve.dm.MWTemplateModel`.
       * Parsoid HTML data attributes: `typeof="mw:Extension/ref"` and `data-mw` attributes present in Visual Diffs or Parsoid-rendered pages.
       * Lightweight Wikitext tokenizers/parsers used by WikiEditor or VisualEditor.
  2. **Comparative Environment Matrix:**
     * **Meta-Wiki vs. English Wikipedia vs. Third-Party MediaWiki:**
       * Meta-Wiki has a more minimal default module bundle than English Wikipedia (e.g. different Popups/Cite gadgets).
       * Determine whether candidate libraries are synchronously available on diff pages or require asynchronous `mw.loader.using()` calls that could delay diff rendering.
  3. **Trade-Off Analysis:**
     * **Performance:** Regex parsing runs synchronously in single-digit milliseconds; AST/DOM parsing incurs higher overhead.
     * **Bundle Size & Portability:** RefDiff is currently a single portable file (`refdiff.js`) usable across user scripts, gadget managers, and CLI drivers. Relying on MediaWiki core modules would tie it strictly to browser environments with ResourceLoader.
     * **Testing & Maintainability:** The current 78-test headless suite runs in ~20 ms on standard Node.js without requiring a full MediaWiki emulation stack.
  4. **Exploration of Hybrid Models:**
     * Evaluate a hybrid approach: retain the fast-path regex engine for common, clean citations, and fall back to native MediaWiki parser utilities only for complex nested templates or unclosed tags.



---

### 2026-10-11: Supplementing Tool Evaluation & `diffedit.js` Interoperability

* **Ecosystem Analysis (User:Johnjbarton/common.js):**
  * Discovered active real-world adoption of `User:Powercycler/refdiff.js` alongside prominent editing and citation auditing tools: `diffedit.js`, `HarvErrors.js`, `AI Source Verification.js`, `CNfirmed.js`, `RefRenamer.js`, `RefMan.js`, and `Reflinks.js`.
  * Identified [**`m:User:Jon Harald Søby/diffedit.js`**](https://meta.wikimedia.org/wiki/User:Jon_Harald_S%C3%B8by/diffedit.js) as a direct diff-view companion tool allowing inline editing on `Special:Diff`.

* **Failure Mode Analysis (DOM Collision Discovery):**
  1. **Line Enumeration Corruption:** `diffedit` queries `tbody tr td:last-of-type` for `.diff-addedline` and `.diff-context` to enumerate article line numbers. When RefDiff decoupled citation rows (`<tr class="refdiff-cit-row">`) using native diff classes, `diffedit` counted citation rows as article lines (`currentLine++`), causing published edits to write to corrupted line offsets.
  2. **Badge Wikitext Overwrite:** When an editor clicked `[ Edit ]` in `diffedit`, `contenteditable="true"` was enabled across all `.diff-editable` cells. In RefDiff mode, prose cells contained mathematical badge tokens (`⟨ref1⟩`) instead of raw wikitext, which risked saving badge tokens into Wikipedia wikitext.

* **Architectural Safeguards Implemented:**
  1. **Isolated Citation Cell Classes:** Updated `createCitRow` to assign `refdiff-cit-addedline`, `refdiff-cit-deletedline`, and `refdiff-cit-context` instead of native diff classes, styled identically via CSS. This guarantees `diffedit`'s line scanner (`enumerateLines()`) completely skips citation rows.
  2. **Automatic Raw Wikitext Restoration on Edit Mode:** Attached a `MutationObserver` on `table.diff` monitoring `.diff-editmode` and a delegated click listener on `.diffedit-editbutton`. When `diffedit` enters inline editing mode, RefDiff automatically restores native wikitext mode (`selectMode('wikitext')`) so editors edit genuine wikitext.
  3. **CSS Suppression:** Added `table.diff.diff-editmode .refdiff-cit-row { display: none !important; }` to prevent citation row interference while editing.

* **Verification:**
  * Added automated regression test in `tests/test_init.js` asserting cell class isolation and auto-mode switching on `.diff-editmode`.
  * 79/79 tests passing with 0 ESLint warnings.
  * Documented across `README.md`, `REFDIFF.md`, `refdiff.wiki`, `ARCHITECTURE.md`, and `TEST_PLAN.md`.

---

### 2026-10-11: Documentation of Supplemental AI Verification Tools (AI Source Verification & CNfirmed)

* **Context & Motivation:**
  * Following ecosystem inspection of active RefDiff users (`User:Johnjbarton/common.js`), cataloged companion scripts that address complementary dimensions of citation quality:
    * [**`User:Alaexis/AI Source Verification.js`**](https://en.wikipedia.org/wiki/User:Alaexis/AI_Source_Verification.js): In-browser LLM evaluation of citations against claims to catch hallucinations and citation distortion.
    * [**`User:Alaexis/CNfirmed.js`**](https://en.wikipedia.org/wiki/User:Alaexis/CNfirmed.js): Automated reference finder and validator for `{{citation needed}}` tags via Internet Archive APIs and AI judges.
* **Architectural Synergy:**
  * RefDiff operates at the diff review layer, isolating prose from citation markup so that human patrollers and automated tools can review factual claims without visual noise.
  * AI Source Verification and CNfirmed operate at the fact-checking and discovery layer, verifying whether citations actually substantiate the prose claims.
* **Documentation Updates:**
  * Integrated both tools as supplemental companion tools across `README.md` (§2), `REFDIFF.md` (§4.4), `refdiff.wiki` (Complementary Tools wikitable & See Also), and `ARCHITECTURE.md` (§7.2).

---

### 2026-10-11: Ecosystem Documentation — ProveIt Gadget & W190 Locality Synergy

* **Context & Motivation:**
  * Evaluated [**ProveIt**](https://en.wikipedia.org/wiki/Wikipedia:ProveIt) (`MediaWiki:Gadget-Global-ProveIt.js`), Wikipedia's primary graphical citation editor for the source editor, in the context of [**Community Wishlist W190**](https://meta.wikimedia.org/wiki/Community_Wishlist/W190) ("Reference editing", [Phabricator T356471](https://phabricator.wikimedia.org/T356471)).
* **Architectural Findings & Synergies:**
  * **ProveIt's Section-Editing Blind Spot:** ProveIt operates strictly on wikitext in the local edit textarea (`#wpTextbox1`). In section edits with out-of-section or global List-Defined References (LDR), ProveIt encounters only empty stub tags (`<ref name="foo" />`), preventing citation parameter editing.
  * **Solution via `<references hidden>`:** Section-scoped citation blocks provide the missing link by defining references locally within the section wikitext. During section editing, ProveIt can immediately discover and edit full citation templates directly in `#wpTextbox1`, bypassing the W190 cross-section API dilemma.
  * **RefDiff Complementarity:** ProveIt handles GUI authoring and Citoid auto-filling during editing (`Special:Edit`), while RefDiff decouples and highlights citations during review (`Special:Diff`).
* **Documentation Updates:**
  * Updated `README.md` (§2), `REFDIFF.md` (§4.4), `refdiff.wiki` (Complementary Tools wikitable & See Also), `ARCHITECTURE.md` (§7.3), and `proposal/CONCEPT.md` (§7.5).

---

### 2026-10-11: Marked for Check — Zipf's Law (`diff=1379548357`)

* **Candidate Diff URL:** [Zipf's law (`diff=1379548357`)](https://en.wikipedia.org/w/index.php?title=Zipf%27s_law&diff=prev&oldid=1379548357)
* **Article:** [Zipf's law](https://en.wikipedia.org/wiki/Zipf%27s_law) (Revision `1379548357` vs `prev`)
* **Status:** ⏳ Marked for check / verification
* **Evaluation Objectives:**
  * **Mathematical & Formula Interactions:** Check behavior when citation tags (`<ref>...</ref>`) are embedded near or within mathematical expressions, `<math>` tags, LaTeX formatting, or quantitative tables.
  * **Prose/Citation Boundary Decoupling:** Verify that reference decoupling accurately isolates citation metadata while preserving formula syntax, punctuation, and statistical annotations in prose.
  * **DOM Snapshot Invariance:** Ensure mode toggles (Visual / Wikitext / RefDiff) and in-place DOM restoration remain byte-for-byte lossless on quantitative article structures.

---

### 2026-10-12: Ecosystem Documentation — wikEdDiff Tool Addition

* **Context & Motivation:**
  * Added [**wikEdDiff**](https://en.wikipedia.org/wiki/User:Cacycle/wikEdDiff) (`User:Cacycle/wikEdDiff.js`) to the list of similar and complementary tools across project documentation.
* **Architectural Findings & Synergies:**
  * **Categorization as Similar Diff Tool:** Like RefDiff, wikEdDiff targets revision diff comprehension on Wikipedia. While wikEdDiff computes an alternative inline visual diff with character-level granularity, syntax highlighting, and moved-block detection, RefDiff operates on the native two-column diff table specifically to decouple citation noise ("template camouflage") from human prose.
  * **DOM Isolation:** wikEdDiff generates an isolated inline diff container (`div#wikEdDiffContainer`), while RefDiff safely modifies `table.diff` using dedicated CSS classes (`refdiff-cit-row`, `refdiff-cit-addedline`), ensuring complete cohabitation without script collisions.
* **Documentation Updates:**
  * Updated `README.md` (§2), `REFDIFF.md` (§4.4), `refdiff.wiki` (Complementary Tools wikitable & See Also), and `ARCHITECTURE.md` (§7.4).

---

### 2026-10-12: Ecosystem Documentation — RefCruncher Tool Addition

* **Context & Motivation:**
  * Added [**RefCruncher**](https://en.wikipedia.org/wiki/User:Guywan/Scripts/RefCruncher) (`User:Guywan/Scripts/RefCruncher.js`) by User:Guywan to the list of similar and complementary tools across project documentation.
* **Architectural Findings & Synergies:**
  * **Shared Goal (Template De-cluttering):** Like RefDiff and References Segregator, RefCruncher tackles the readability issues caused by inline `<ref>...</ref>` templates.
  * **Lifecycle Differentiation:** RefCruncher acts in `Special:Edit` by collapsing wikitext citation strings into compact, clickable chips directly in the editing textarea. RefDiff operates during review on `Special:Diff` by decoupling references into mathematical badges and dedicated diff rows.
* **Documentation Updates:**
  * Updated `README.md` (§2), `REFDIFF.md` (§4.4), `refdiff.wiki` (Complementary Tools wikitable & See Also), `ARCHITECTURE.md` (§7.5), and `proposal/CONCEPT.md` (§8.3).

---

### 2026-10-14: Audit & Review Strategy — Two-Pillar Framework, JSDOM Harness & `<nowiki>` Protection

* **Context & Motivation:**
  * Synthesized findings from comparative audit against [Ultraviolet](https://en.wikipedia.org/wiki/Wikipedia:Ultraviolet) and established a formal two-pillar **Audit and Review Strategy** ([`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md)).
* **Pillar 1: Codebase & Security Audit (Engineering Integrity):**
  * **Taxonomy & Findings Registry:** Formalized severity classes (K1/M1/M6) tracking real DOM mock blind spots, HTML generation via template strings, unpinned CDN dependencies, and on-wiki `<nowiki>` transclusion.
  * **Real DOM Integration Suite (`tests/test_jsdom.js`):** Implemented 10 automated headless integration tests on real MediaWiki diff fixtures (`comprehensive_test.html` and `stress_test_1379409916.html`), validating byte-for-byte in-place Memento restoration, OOUI button injection, and mouse delegation. Expanded suite to **97/97 passing tests** in <250ms.
  * **Defensive Guards:** Added feature checks for `scrollIntoView` and `MutationObserver` to ensure zero-crash resilience across non-standard environments.
  * **On-Wiki `<nowiki>` Protection:** Enclosed `refdiff.js` inside `/* <nowiki> */` comments to neutralize template parsing of the 20 internal `{{...}}` sequences on MediaWiki JS pages.
* **Pillar 2: Editorial Review & Source Auditing Playbook:**
  * Codified the **Anti-Template-Camouflage** workflow (isolating prose changes concealed behind giant citation templates).
  * Codified the **Anti-AI-Slop** fact-checking playbook (source decoupling, prose coherence verification, one-click Reference Previews via `Extension:Popups`).
  * Structured the **Tri-Mode Review Triage** guide (Visual vs. Wikitext vs. RefDiff vs. Inline modified refs) and ecosystem interoperability (`diffedit.js`, `CNfirmed.js`, `HarvErrors.js`, `ProveIt`).
* **Documentation Updates:**
  * Created [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md); updated [`README.md`](README.md), [`ARCHITECTURE.md`](ARCHITECTURE.md), and [`TEST_PLAN.md`](TEST_PLAN.md).

---

### 2026-10-14: Security Hardening — Safe DOM Builder `el()` & Elimination of Template Strings (M1)

* **Context & Motivation:**
  * Addressed quality audit finding **[M1]** identified in the comparative review against [Ultraviolet](https://en.wikipedia.org/wiki/Wikipedia:Ultraviolet) and documented in [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md).
  * Replaced dynamic HTML generation via string concatenation / `.innerHTML` with a safe, native DOM element builder to eliminate XSS injection risks and tag boundary corruption.
* **Architectural & Code Changes:**
  * **Native DOM Builder Helper (`el`):** Implemented `el(tag, attrs, ...children)` with native attribute sanitization and `ownerDocument.createTextNode` escaping for all user-supplied text values.
  * **Badge Element Builder (`createProseBadgeElement`):** Constructs native `<sup class="reference refdiff-ref">` DOM elements with XSS-immune link and span children. Maintained backward-compatible `createProseBadge` serialization helper with robust headless Node fallback.
  * **Safe Citation Row Generation (`createCitRow`):** Refactored `createCitRow` to build all table row elements (`<tr>`, `<td>`, `<div>`, `<ins>`, `<del>`) directly via DOM constructors, eliminating string interpolation into `citRow.innerHTML`.
  * **Safe UI Component Builders:** Refactored `createInlineToggle`, `createRefDiffButton`, and `createFallbackModeBar` to construct elements natively without `.innerHTML`.
  * **Exports & Testing:** Exported `el` and `createProseBadgeElement`; expanded test coverage in `tests/test_renderer.js` to verify attribute escaping, XSS immunity, and real DOM row construction. Suite expanded to **99/99 passing tests** in ~250ms with 0 ESLint warnings.
* **Documentation Updates:**
  * Marked M1 as **Resolved** in `AUDIT_STRATEGY.md`. Updated test counts in `README.md`, `ARCHITECTURE.md`, `TEST_PLAN.md`, and `refdiff.wiki`.

---

### 2026-10-14: Audit Findings Record Keeping Delegation to LOG.md

* **Context & Motivation:**
  * Aligned documentation architecture so that [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) defines the overarching policy, verification gates, and severity taxonomy (P0/P1/P2), while [`LOG.md`](LOG.md) serves as the persistent, chronological system of record for all audit findings.
* **Architectural & Register Updates:**
  * Established Section 3.2 in `LOG.md` as the **Audit Findings Register (K1 / M1 / M6 / M7 Taxonomy)**, cataloging findings K1, M1, M6, and M7 with complete root causes, remediations, commits, and verification gates.
  * Refactored `AUDIT_STRATEGY.md` §2.1 to delegate record keeping directly to `LOG.md` with a clean summary matrix and cross-links.
  * Added `AUDIT_STRATEGY.md` to `LOG.md` Section 1 Core Artifacts.

---

### 2026-10-14: Test & Real-World Diff Verification Record Keeping Delegation to LOG.md

* **Context & Motivation:**
  * Aligned documentation architecture so that [`TEST_PLAN.md`](TEST_PLAN.md) defines the formal testing pyramid, 1-to-1 virtual source-to-test mapping, and continuous quality gates, while [`LOG.md`](LOG.md) serves as the persistent, authoritative system of record for real-world diff investigations, edge-case diagnoses, and verification status transitions.
* **Architectural & Register Updates:**
  * Established Section 3.3 in `LOG.md` as the **Real-World Diff Verification Register**, cataloging real-world Wikipedia revisions (Odoacer, Zagreb Airport, Kim Domingo, Cosmic inflation, Zipf's law, Donnie Brasco, Karl-Heinz Riedle, Bihar Legislative Assembly) with comprehensive root-cause diagnoses, fixes, and verification gates.
  * Refactored `TEST_PLAN.md` §5.1 to delegate record keeping directly to `LOG.md` via a structured summary table and cross-links.
  * Added `TEST_PLAN.md` to `LOG.md` Section 1 Core Artifacts.
  * Synchronized test execution metrics in `TEST_PLAN.md` to **103 passing tests** across **14 modular test files** in ~250ms with 0 ESLint warnings.

---

### 2026-10-14: Bugfix: Quotation Attribute Truncation & Underscore Anchor Resolution (Bihar diff=1379207737)

* **Bug Diagnosis (`Bihar Legislative Assembly` diff=1379207737):**
  * When an editor added `<ref name="From teen in RSS shakha to Speaker's Chair: Bihar BJP leader Prem Kumar's long journey">`:
    1. `extractName` truncated the attribute value at the apostrophe in `"Speaker's"` (`"From teen in RSS shakha to Speaker"`), because the closing delimiter class `(?:&quot;|["']|&apos;|\/|&gt;|>|\s*$)` matched `'` prematurely.
    2. Even with the full name, `findCiteNoteAnchor` queried `[id^="cite_note-${name}-"]` with raw spaces, whereas MediaWiki converts spaces to underscores in HTML IDs (`cite_note-From_teen_in_RSS_shakha_to_Speaker's_Chair:_Bihar_BJP_leader_Prem_Kumar's_long_journey-4`), resulting in anchor discovery failure and missing hovercards.
* **Architectural & Algorithmic Solutions:**
  * **Symmetric Paired Quote Delimiters in `extractName`:** Split quote matching into explicit outer delimiter branches (double-quote vs single-quote vs unquoted). Embedded apostrophes/quotes inside opposite delimiters are preserved 100% intact, while unclosed quotes (Donnie Brasco) remain tolerated before tag close.
  * **Underscore Candidate Resolution in `findCiteNoteAnchor`:** When `name` contains whitespace, `findCiteNoteAnchor` generates both literal and underscore-converted candidates (`name.trim().replace(/\s+/g, '_')`) and verifies matches across CSS querySelector and fallback DOM scanner.
* **Verification & Results:**
  * Added regression tests in `tests/test_parser.js` (embedded apostrophes in double quotes, embedded double quotes in single quotes), `tests/test_anchor.js` (space-to-underscore anchor discovery), and `tests/test_jsdom.js` (real DOM decoupling and byte-for-byte Memento restoration).
  * Test suite expanded from 99 to **103/103 passing tests** (0 warnings, ~250ms).
  * `Bihar Legislative Assembly` (`diff=1379207737`) marked as **Verified** in `TEST_PLAN.md` and `LOG.md`.

---

### 2026-10-14: Wikipedia Userbox Template (`userbox.wiki` & `refdiff.wiki`)

* **Context & Motivation:**
  * Provided an official Wikipedia userbox template (`{{User:Powercycler/User RefDiff}}`) enabling Wikipedia editors and patrollers to identify themselves on their user pages, declare that they use RefDiff to combat template camouflage, and spread awareness within the community.
* **Architectural & Design Implementation:**
  * **Userbox Template Definition (`userbox.wiki`):**
    * Uses Wikipedia's standard meta-template `{{Userbox}}`.
    * Default styling features RefDiff's signature amber modified citation badge `<span style="font-family: monospace; font-weight: bold; color: #9a6700; background: rgba(255, 215, 0, 0.25); border: 1px solid rgba(218, 165, 32, 0.5); padding: 1px 4px; border-radius: 3px;">⟨~ref~⟩</span>` with warm ivory background (`#fffdf0`) and amber border (`#d4a017`).
    * Configurable parameters: `|badge=` (or `|1=`), `|border-c=`, `|id-c=`, `|id-fc=`, `|info-c=`, `|info-fc=`, `|info=`, `|link=`, and `|nocat=`.
    * Automatic categorization into `[[:Category:Wikipedians who use RefDiff]]` (suppressible via `|nocat=yes`).
    * Standalone pure-HTML table fallback included for wikis lacking the `{{Userbox}}` meta-template.
  * **On-Wiki Documentation Integration (`refdiff.wiki`):**
    * Added `== Userbox ==` section immediately following `== Installation ==` with live visual previews, wikitext copy-paste snippets, and alternative badge configurations (Amber `⟨~ref~⟩`, Minimalist `⟨ref⟩`, Toolbar `⧉ RefDiff`).
    * Cross-linked `User:Powercycler/User RefDiff` in the `== See Also ==` index.
  * **Repository & Index Updates:**
    * Documented userbox installation and linked `userbox.wiki` in `README.md` and `LOG.md` Core Artifacts.
* **Verification & Results:**
    * Ready for deployment on enwiki and Meta-Wiki. All 103 test cases pass with 0 ESLint warnings.

---

### 2026-10-14: Clean Code & Test Code Smell Audit Framework (`AUDIT_STRATEGY.md` §2.5)

* **Context & Motivation:**
  * Expanded the engineering audit strategy to systematically detect, prevent, and eliminate "code smells" and "test smells". High coverage can mask brittle, opaque, or false-positive tests if test code quality is neglected.
* **Architectural & Audit Specifications Added:**
  * **Test Smell Taxonomy (§2.5.1):** Codified 9 distinct test smells and mandatory RefDiff prevention rules:
    1. *Assertion Roulette:* Prohibited unlabelled assertions; every assertion must declare an explanatory failure message string.
    2. *The Mystery Guest / Obscure Test:* Mandated explicit Arrange-Act-Assert (AAA) pattern and named fixtures.
    3. *Over-Mocking & The Mockery:* Enforced real DOM first (`withJsdom()`) over synthetic mock objects (K1).
    4. *Polluted Global State & Resource Leaks:* Mandatory sandboxed teardown via `withMockEnvironment()` or `finally` blocks.
    5. *Conditional Test Logic:* Enforced linear, unconditional test execution without branching or loops around assertions.
    6. *The Eager Test:* Maintained 1-to-1 single behavioral contract per test case.
    7. *Sleep-Based Timing & Async Flakiness:* Mandated deterministic hook/observer synchronization over wall-clock timeouts.
    8. *Silent / Hollow Tests:* Prohibited silent catch blocks and hollow assertions.
    9. *Duplicated Fixture Logic:* Centralized fixtures in `tests/` and shared harnesses.
  * **Production Clean Code Standards (§2.5.2):** Documented single-responsibility decomposition, DAMP (Descriptive And Meaningful Phrases) over DRY in test code, pure functions with guard clauses, XSS-immune DOM construction, and ResourceLoader IIFE encapsulation.
  * **Pre-Merge Review Checklist (§2.5.3):** Established an actionable 8-point checklist for contributors and reviewers.
  * **Continuous Quality Gate (§5):** Added formal Clean Code & Anti-Test-Smell quality gate to CI requirements.
* **Test Code Hygiene Refactoring:**
  * Refactored unlabelled assertions across `tests/test_utils.js`, `tests/test_state.js`, `tests/test_benchmarks.js`, and `tests/test_parser.js` to eliminate Assertion Roulette and provide explicit diagnostic messages.
* **Verification & Results:**
  * All 103/103 tests pass with 0 ESLint warnings in ~250ms.

---

### 2026-10-14: Architectural Decision: Deliberate Omission of i18n Framework

* **Context & Motivation:**
  * Following the comparative review against [Ultraviolet](https://en.wikipedia.org/wiki/Wikipedia:Ultraviolet) and evaluation of item 5 ("i18n through `mw.messages.set` plus `mw.msg`"), a formal architectural decision was made to **omit internationalization (i18n)** from RefDiff.
* **Architectural Rationale & Trade-off Analysis:**
  1. *Negligible String Footprint:* Unlike Ultraviolet (which contains hundreds of user-facing templates, warning forms, and report dialogs), RefDiff's user interface contains only three static tokens: `"RefDiff"` (proper tool name, which is universal and unlocalized on Wikimedia), `"Inline modified refs"` (toolbar checkbox), and `"Diff view:"` (fallback bar).
  2. *Language-Agnostic Mathematical Notation:* RefDiff's primary visual output consists of mathematical angle-bracket badges (`⟨ref1⟩`, `⟨~ref2~⟩`, `⟨+ref3+⟩`, `⟨-ref4-⟩`) and diff markers (`+`, `-`, `~`). Shortened footnote badges synthesize author-year metadata (`⟨Castritius 2005⟩`) verbatim from the wikitext source. This mathematical and bibliographic representation is universally language-neutral.
  3. *Zero-Dependency & Sub-50ms Execution Budget:* Introducing an i18n subsystem (message tables, loader hooks, translation packs) would add significant bundle weight, network latency, and memory footprint without meaningful utility, violating RefDiff's core budget of sub-50ms execution.
  4. *Seamless Cross-Wiki Portability:* RefDiff is designed for central loading across all 300+ Wikimedia language editions via `m:Special:MyPage/global.js`. A language-agnostic design ensures immediate out-of-the-box functionality everywhere without requiring translation campaigns or language pack updates.
* **Documentation & Ledger Updates:**
  * Codified the decision in the **Architectural Decision Register (ADR §3.1)** in `LOG.md`.

---

### 2026-10-14: English Wikipedia Userbox (`userbox_enwiki.wiki`) & Deployment Pre-Flight Suite (`tests/test_deployment.js`)

* **Context & Motivation:**
  * Provided a dedicated English Wikipedia userbox template (`Template:User RefDiff` / `userbox_enwiki.wiki`) formatted according to en.WP template standards with full TemplateData documentation, allowing editors to transclude `{{User RefDiff}}` directly on user pages.
  * Created an automated pre-flight deployment check suite (`tests/test_deployment.js`) to systematically prevent release regressions, on-wiki syntax corruption, and packaging hazards.
* **Architectural & Test Implementations:**
  * **English Wikipedia Template (`userbox_enwiki.wiki`):**
    * Created `Template:User RefDiff` supporting standard shortcut `{{User RefDiff}}` with automatic categorization into `[[:Category:Wikipedians who use RefDiff]]`.
    * Included subpage documentation (`Template:User RefDiff/doc`) with live preview, parameters table, and machine-readable `TemplateData` JSON schema for the VisualEditor template dialog.
    * Updated [`refdiff.wiki`](refdiff.wiki) to document both en.WP shortcut (`{{User RefDiff}}`) and cross-wiki global syntax (`{{User:Powercycler/User RefDiff}}`).
  * **Automated Deployment & Release Quality Gate (`tests/test_deployment.js`):**
    * *Packaging & Encoding:* Validates zero Byte Order Mark (BOM), strict `/* <nowiki> */` and `/* </nowiki> */` boundaries, and no internal unescaped nowiki tags.
    * *On-Wiki Syntax Safety:* Prohibits 3–5 tildes (`~~~`, `~~~~`, `~~~~~`), template substitutions (`{{subst:`, `{{safesubst:`), and raw closing `</script>` tags.
    * *Production Hygiene:* Asserts zero `console.log` statements in `refdiff.js` and no active debug flags.
    * *Syntax & Strict Mode:* Compiles `refdiff.js` in Node VM under strict mode (`'use strict';`) with zero syntax errors.
    * *Version Synchronization:* Asserts that `package.json` version matches `refdiff.js` UserScript `@version` and `refdiff.wiki` infobox version.
    * *Distribution Budget:* Enforces unminified bundle size limits (< 120 KB, > 10 KB).
    * *Public API Surface:* Verifies all 15 required core functions are exported on `RefDiff` and ensures zero global object pollution.
    * *On-Wiki Template Balance:* Verifies balanced `<includeonly>`, `<noinclude>`, and `{{Userbox` invocations across both `userbox.wiki` and `userbox_enwiki.wiki`.
  * **Suite & Metric Synchronization:**
    * Integrated `test_deployment.js` into `tests/runner.js`.
    * Test suite expanded from 103 to **111/111 passing tests** across **15 modular test files** (0 ESLint warnings, ~250ms).
    * Synchronized metrics across `TEST_PLAN.md`, `AUDIT_STRATEGY.md`, `README.md`, `refdiff.wiki`, and `LOG.md`.

---

### 2026-10-14: Deployment Plan (`DEPLOYMENT_PLAN.md`) & Test Sufficiency Audit Migration (`AUDIT_STRATEGY.md` §2.6)

* **Context & Motivation:**
  * Created a concise, high-signal release operations plan ([`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md)) establishing the rollout lifecycle for RefDiff v1.3.0 across English Wikipedia and Meta-Wiki.
  * Recognized that Section 1 of `TEST_PLAN.md` ("Is it Enough or Too Much?") is an audit and governance evaluation, not an operational test execution plan. Formalized the evaluation into `AUDIT_STRATEGY.md` (§2.6) and refactored `TEST_PLAN.md` §1 to focus strictly on operational test metrics while delegating the evaluation.
* **Key Implementations:**
  * **Concise Deployment Plan (`DEPLOYMENT_PLAN.md`):**
    * *Artifact Inventory & Target Destinations:* Mapped 6 deployment artifacts to on-wiki targets (`m:User:Powercycler/refdiff.js`, `en:User:Powercycler/refdiff.js`, `en:Template:User RefDiff`, etc.).
    * *Pre-Flight Quality Gates:* Unified command `npm run ci && node tests/test_deployment.js` covering syntax, 111/111 unit tests, 8 deployment checks, sub-50ms benchmark budget, and JSDOM DOM fidelity.
    * *Progressive Rollout Rings:* Ring 0 (Local Pre-Flight) $\rightarrow$ Ring 1 (Pinned Commit Canary `refdiff-v1.3.0.js` on 5 benchmark diffs) $\rightarrow$ Ring 2 (Production Publishing on Meta & en.WP) $\rightarrow$ Ring 3 (Community Outreach on `WT:Citing sources` & `VPT`).
    * *Rollback Protocol:* Defined instant on-wiki history reversion (< 1 min) and cache purge for P0 incidents, plus graceful degradation lifecycle for P1 syntax edge cases.
    * *Operator Runbook:* Compact 7-item deployment checklist.
  * **Test Proportionality & Sufficiency Audit (`AUDIT_STRATEGY.md` §2.6):**
    * *Proportionality ("Is it Too Much?"):* Evaluated zero runner bloat (built-in Node `assert`), high-value invariants (split diffchanges, Memento, anchor discovery), sandboxed mock isolation (`withMockEnvironment()`), and deterministic execution.
    * *Sufficiency ("Is it Enough?"):* Audited 100% headless function coverage, authentic MediaWiki DOM fixtures, live CDP browser automation, and benchmark budgets; articulated explicit known risk boundaries (malformed wikitext, transcluded templates, mobile MinervaNeue layouts, AJAX dynamic lifecycle).
  * **Operational Test Plan Refactoring (`TEST_PLAN.md` §1):**
    * Refocused Section 1 strictly on quantitative metrics and test suite architecture, adding an explicit delegation callout to `AUDIT_STRATEGY.md` §2.6 and `LOG.md` §3.3.

---

### 2026-10-14: Refactored `AUDIT_STRATEGY.md` for Conciseness and Clarity

* **Context & Motivation:**
  * Following document growth across recent audit and clean-code additions, `AUDIT_STRATEGY.md` was refactored to eliminate redundant ASCII diagrams, duplicated multi-column tables, and verbose boilerplate while preserving 100% of governance rules, taxonomies, and section anchor targets.
* **Key Refactorings:**
  * *Pillar 1 (Engineering Integrity):* Streamlined K1/M1/M6/M7 findings summary into a clean bullet list, consolidated test smell rules (Assertion Roulette, Mystery Guest, Over-Mocking, Polluted Globals, Conditional Logic, Timing Flakes) with an explicit pre-merge checklist, and preserved the §2.6 proportionality/sufficiency evaluation.
  * *Pillar 2 (Editorial Integrity):* Condensed Template Camouflage and AI Slop threat/audit workflows, tri-mode triage matrix, and ecosystem synergies (`diffedit`, `CNfirmed`, `HarvErrors`, Popups).
  * *Lifecycle & Quality Gates:* Maintained the 6-stage diff verification lifecycle diagram and unified continuous quality gate criteria table.
  * *Document Footprint:* Reduced document from 296 lines (~25.6 KB) to ~175 lines (~14.5 KB), enhancing scannability and legibility.

---

### 2026-10-14: Completed and Removed Ultraviolet PoC (`poc/ultraviolet`)

* **Context & Motivation:**
  * The proof-of-concept comparative benchmark against Wikipedia's [Ultraviolet](https://en.wikipedia.org/wiki/Wikipedia:Ultraviolet) userscript has been completed.
  * All actionable engineering and security findings have been fully implemented and codified in the core repository:
    1. **[K1] Real DOM Mock Weakness:** Implemented `tests/test_jsdom.js` against authentic MediaWiki diff fixtures.
    2. **[M1] HTML via Template Strings:** Replaced `.innerHTML` string interpolation with native DOM builder `el()` and text nodes.
    3. **[M6] Unpinned CDN Distribution:** Standardized on-wiki distribution from Meta-Wiki with commit-pinned SHA loader patterns.
    4. **[M7] On-Wiki `<nowiki>` Protection:** Wrapped production code in `/* <nowiki> */` comments with automated balance checks.
    5. **Architectural Decision on i18n:** Formalized deliberate omission of internationalization in favor of a language-agnostic, zero-overhead mathematical notation design (ADR §3.1).
  * With all insights incorporated into [`ARCHITECTURE.md`](ARCHITECTURE.md), [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md), [`TEST_PLAN.md`](TEST_PLAN.md), and [`LOG.md`](LOG.md), the temporary `poc/ultraviolet/` directory (9.4 MB) has been decommissioned and removed.

---

### 2026-10-14: Added Opt-In Beta Release Option (>10 Users) to `DEPLOYMENT_PLAN.md`

* **Context & Motivation:**
  * To support phased growth as RefDiff expands toward ~100 active reviewers, [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) was updated to introduce a dedicated **Beta Release Option (Ring 1.5)** triggered when the active user base exceeds 10 editors.
* **Key Provisions:**
  * *Activation Trigger:* Monitored via `Special:WhatLinksHere/Template:User_RefDiff` reaching > 10 user pages.
  * *On-Wiki Destination:* `en:User:Powercycler/refdiff-beta.js`.
  * *Operational Policy:* Release candidates are deployed to the beta channel for 7 days before Ring 2 general production rollout.
  * *Graduation Gate:* 7 days with zero P0/P1 defects across $\ge 50$ real diff reviews required to promote beta to production.
  * *Checklist Synchronization:* Added beta channel publishing step to the Operator Deployment Runbook.

---

### 2026-10-14: Verification of Unclosed `<ref>` Tag Invariance (Suite Expanded to 113 Tests)

* **Context & Audit Query:**
  * Analyzed whether malformed/unclosed `<ref>` tags (e.g. `&lt;ref&gt;unclosed text...` without matching closing tag) are safely handled and whether they could inadvertently swallow subsequent valid citations.
* **Architectural Mechanics & Verification:**
  1. *Parser Invariant:* `REF_REGEX` requires either `\/&gt;` or `&gt;((?:(?!&lt;ref\b)[\s\S])*?)&lt;\/ref&gt;`. An unclosed `<ref>` tag fails the regex match and is safely bypassed by `parseRefs()`.
  2. *Swallow Prevention:* The negative lookahead `(?:(?!&lt;ref\b)[\s\S])*?` ensures that an unclosed `<ref>` tag cannot cross over and swallow subsequent `<ref>` tags on the same line.
  3. *In-Situ Prose Retention:* In `transformProseCells()`, unmatched wikitext is never modified or removed. Unclosed `<ref>` tags gracefully remain in-situ in the prose diff cell with native MediaWiki highlights.
* **Automated Regression Locking:**
  * Added test in `tests/test_parser.js`: `parseRefs ignores unclosed <ref> tags and protects subsequent valid citations from being swallowed`.
  * Added test in `tests/test_pipeline.js`: `transformProseCells leaves unclosed <ref> tags gracefully in-situ in prose`.
* **Metrics Synchronization:**
  * Test suite expanded from 111 to **113/113 passing tests** across **15 modular test files** (0 ESLint warnings, ~250ms).
  * Synchronized metrics across `ARCHITECTURE.md`, `AUDIT_STRATEGY.md`, `DEPLOYMENT_PLAN.md`, `README.md`, `TEST_PLAN.md`, and `refdiff.wiki`.

---

### 2026-10-14: Logged 100-User Production Readiness Remediation Roadmap (Phase 5)

* **Context & Motivation:**
  * Following an audit analysis of RefDiff against the target profile of a production wiki tool serving **~100 active reviewers** (NPP/RC patrollers), a 7-point remediation roadmap was established and recorded as open action items in Section 2 (Phase 5).
* **Open Action Items Tracked:**
  * **Step 5.1 (P0):** Fail-open crash isolation with top-level `try...catch` boundary and fallback restoration.
  * **Step 5.2 (P0):** Dynamic AJAX/SPA lifecycle re-entrancy and memory isolation in JSDOM tests.
  * **Step 5.3 (P1):** Core patrol tool non-interference contract (verifying `tr.diff-title`, `.diff-otitle`, `.diff-ntitle`, and Twinkle rollback nodes remain untouched).
  * **Step 5.4 (P1):** Client-side observability and diagnostic troubleshooting mode (`?refdiff_debug=1` / `refdiffConfig.debug`).
  * **Step 5.5 (P1):** Accessibility (WCAG 2.1 AA) semantic `aria-label`s, keyboard focusability, and contrast ratio validation.
  * **Step 5.6 (P1):** Legacy skin (Vector 2010 / Monobook) fallback testing and graceful mobile self-disablement.
  * **Step 5.7 (P2):** Formalization of 100-user production governance policy in `AUDIT_STRATEGY.md` §2.7.

---

### 2026-10-14: Scoped Deployment Outreach Strictly to Tool Talk Page on en.WP

* **Context & Decision:**
  * Streamlined community outreach and feedback collection destinations in `DEPLOYMENT_PLAN.md` (Table 1, Ring 3, and Section 5 Runbook Checklist).
  * Rather than broadcasting broadly across community noticeboards (`en:WT:Citing sources`, `en:WP:Village pump (technical)`), initial feedback and release announcements are scoped strictly to the tool's dedicated talk page on en.WP: `en:User talk:Powercycler/RefDiff`.
* **Artifacts Synchronized:**
  * Updated `DEPLOYMENT_PLAN.md` (§1 Table 1, §3 Ring 3, §5 Runbook Checklist).

---

### 2026-10-14: Streamlined Rollout Strategy (Removed Beta Channel in Favor of Pinned Canary)

* **Context & Architectural Decision:**
  * Evaluated whether an opt-in beta release channel (`refdiff-beta.js`) is necessary given immutable pinned commit releases (`refdiff-v1.3.0.js`).
  * Concluded that for a ~100-user patrol tool, a separate beta channel creates redundant coordination overhead without additional safety.
  * Verified that pinned releases benefit from aggressive Varnish/CDN caching (`Cache-Control: public, s-maxage=...` for immutable revisions), instantaneous page-history rollback (< 30s), and deterministic pre-flight testing on 5 benchmark diffs (Ring 1).
* **Rollout Streamlining:**
  * Removed Ring 1.5 (`refdiff-beta.js`) from `DEPLOYMENT_PLAN.md`.
  * Rollout protocol streamlined to:
    * **Ring 0:** Local CI & pre-flight gates (`npm run ci && node tests/test_deployment.js`).
    * **Ring 1:** Pinned commit canary (`refdiff-v1.3.0.js` on 5 benchmark diffs).
    * **Ring 2:** Production publishing (`refdiff.js` on Meta & en.WP).
    * **Ring 3:** Community feedback & gadget candidacy (`en:User talk:Powercycler/RefDiff`).

---

### 2026-10-14: Prioritized `<ref def name="...">` as Primary Upstream Syntax Proposal

* **Context & Architectural Pivot:**
  * Refactored the upstream wikitext proposal strategy to prioritize tag-level definition syntax: `<ref def name="...">...</ref>` over container-level `<references hidden>`.
  * *Rationale:* The boolean attribute `def` on standard `<ref>` directly flags a definition-only citation node, suppressing in-situ footnote marker `[1]` rendering without requiring opening/closing container wrappers (`<references>...</references>`). Provides maximum wikitext brevity for short sections while preserving container compatibility (`<references hidden>`, `<references-def>`) as evaluated alternatives.
* **Artifacts Synchronized:**
  * [`proposal/PROPOSAL.md`](proposal/PROPOSAL.md): Title, wikitext examples, and technical specification refactored to `<ref def name="...">`.
  * [`proposal/POST.md`](proposal/POST.md): Discussion draft and visual diff comparison refactored to `<ref def name="...">`.
  * [`proposal/CONCEPT.md`](proposal/CONCEPT.md): Section 2 architecture diagrams and Section 6 candidate evaluation refactored to prioritize `<ref def name="...">`.
  * [`LOG.md`](LOG.md): Section 2.2 roadmap and ADR §3.1 updated.

---

### 2026-10-14: Purged `archive/` Folder & Streamlined CI Workflow

* **Context & Repository Cleanup:**
  * Cleaned up legacy/prototype artifacts by removing the deprecated `archive/` directory (`archive/python-prototype/`).
  * Removed legacy Python diff script `refdiff.py`, `git-refdiff` git driver, `test_refdiff.py`, and prototype README.
  * Purged Step U.6 prototype action item from `LOG.md` and streamlined `.github/workflows/ci.yml` by eliminating redundant Python test matrix runs.
  * Cleansed references in `README.md` and `REFDIFF.md`.

---

### 2026-10-14: Automated Rollback & Incident Recovery Pre-Flight Quality Gate (`test_deployment.js`)

* **Context & Motivation:**
  * Addressing deployment safety requirements for RefDiff v1.3.0, added an automated pre-flight quality check directly testing the **Rollback & Incident Recovery** invariant.
  * Ensures that any mutation applied to a live diff table (`RefDiff.applyDecoupling(table)`) can be completely undone in-place via `RefDiff.restoreOriginal(table)` with 100% byte-for-byte fidelity and zero orphaned DOM nodes, even under crash or invalid input scenarios.
* **Automated Invariant Assertions (`tests/test_deployment.js`):**
  * *Byte-for-Byte Restoration:* Asserts `table.innerHTML === originalHtml` after decoupling and calling `restoreOriginal(table)`.
  * *Zero Residual Nodes:* Confirms `table.querySelectorAll('.refdiff-cit-row').length === 0` after rollback.
  * *Fail-Open Safety:* Verifies that `applyDecoupling` and `restoreOriginal` safely handle `null` and malformed table objects without throwing uncaught exceptions.
* **Metrics & Ledger Synchronization:**
  * Pre-flight deployment gates expanded from 8 to **9 automated checks** (`node tests/test_deployment.js`).
  * Test suite expanded from 113 to **114/114 passing tests** across 15 modular test files (0 ESLint warnings, ~250ms).
  * Synchronized [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) (§2, §4, §5), [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md), [`TEST_PLAN.md`](TEST_PLAN.md), [`README.md`](README.md), and [`refdiff.wiki`](refdiff.wiki).

---

### 2026-10-14: Established English Wikipedia as Lead Target with Meta Dummy Loader

* **Context & Architectural Architecture:**
  * Restructured deployment targets in [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) to make **English Wikipedia (`enwiki`) the canonical lead platform**, with Meta-Wiki (`metawiki`) functioning as a lightweight secondary dummy forwarding to en.WP.
* **Key Provisions & Invariants:**
  * *Canonical Lead Script:* `en:User:Powercycler/refdiff.js` hosts the full, authoritative, versioned script release.
  * *Meta Dummy Loader:* `m:User:Powercycler/refdiff.js` is reduced to a 1-line script stub: `mw.loader.load('//en.wikipedia.org/w/index.php?title=User:Powercycler/refdiff.js&action=raw&ctype=text/javascript');`.
  * *Lead Documentation:* `en:User:Powercycler/RefDiff` hosts authoritative documentation; `m:User:Powercycler/RefDiff` serves as a soft redirect.
  * *Zero-Overhead Rollback:* P0 rollback on `en:User:Powercycler/refdiff.js` automatically propagates to all Meta global users through the dummy loader without requiring secondary edits on Meta.
* **Artifacts Synchronized:**
  * Updated [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) (§1 Table 1, §3 Rings 1–2, §4 Rollback, §5 Runbook Checklist).
  * Updated [`refdiff.wiki`](refdiff.wiki) to load directly from `en.wikipedia.org` in primary installation snippet.

---

### 2026-10-14: Automated Deployment Consistency Quality Gate & 10-User Adoption Goal

* **Context & Motivation:**
  * Adopted a realistic **10-user adoption goal** for the post-v1.3.0 roadmap (monitoring active transclusions of `Template:User RefDiff`), replacing premature 100-user scaling targets.
  * Added an automated pre-flight quality check directly verifying **Deployment Consistency** across all repository release artifacts, target destinations, and script loader URLs.
* **Automated Invariant Assertions (`tests/test_deployment.js`):**
  * *Artifact Inventory Existence:* Asserts all 5 release artifacts (`refdiff.js`, `refdiff.wiki`, `userbox_enwiki.wiki`, `DEPLOYMENT_PLAN.md`, `proposal/POST.md`) exist on disk and are non-empty.
  * *Version Consistency:* Asserts release version (`1.3.0`) matches across `package.json`, `DEPLOYMENT_PLAN.md`, canary filename (`refdiff-v1.3.0.js`), `refdiff.js`, and `refdiff.wiki`.
  * *Destination & URL Consistency:* Asserts canonical script target (`en:User:Powercycler/refdiff.js`), documentation (`en:User:Powercycler/RefDiff`), userbox (`en:Template:User RefDiff`), and talk page (`en:User talk:Powercycler/RefDiff`) are identically and consistently cross-referenced across all release docs and loader stubs.
* **Metrics & Ledger Synchronization:**
  * Pre-flight deployment gates expanded from 9 to **10 automated checks** (`node tests/test_deployment.js`).
  * Test suite expanded from 114 to **115/115 passing tests** across 15 modular test files (0 ESLint warnings, ~250ms).
  * Synchronized [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) (§2, §5), [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md), [`TEST_PLAN.md`](TEST_PLAN.md), [`README.md`](README.md), [`refdiff.wiki`](refdiff.wiki), and [`LOG.md`](LOG.md).

