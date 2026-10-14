# RefDiff: Audit and Review Strategy

> **Status:** Active & Implemented &bull; **Version:** 1.4.0  
> **Target Audience:** Script Maintainers, Wikimedia Reviewers, Wikipedia Patrollers & Source Auditors  
> **Governing Artifacts:** [`refdiff.js`](refdiff.js), [`tests/`](tests/), [`refdiff.wiki`](refdiff.wiki), [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md), [`TEST_PLAN.md`](TEST_PLAN.md), [`LOG.md`](LOG.md)

---

## 1. Executive Summary & Purpose

The **Audit and Review Strategy** establishes the quality, security, and editorial governance framework for RefDiff across two pillars:

1. **Pillar 1: Codebase & Security Audit (Engineering Integrity):** Enforces Wikimedia gadget security compliance, clean code and anti-test-smell standards, real DOM regression testing (JSDOM and live CDP), test proportionality, and the "Git Diff as Quick Review" zero-debris protocol.
2. **Pillar 2: Editorial Source Audit (Editorial Integrity):** Provides patrollers with actionable workflows to uncover "template camouflage", combat "AI slop", and audit citations parameter-by-parameter on `Special:Diff`.

---

## 2. Pillar 1: Codebase Quality & Security Audit

### 2.1 Quality Review Taxonomy & Findings Registry

Review findings and comparative audits are classified using a three-tier severity taxonomy:

| Class | Severity | Description | Action Threshold |
|:---:|:---:|:---|:---|
| **K** (*Kritisch*) | **P0** | Architectural flaw, DOM mutation hazard, or test mock blind spot hiding runtime failures. | Blocker for release; immediate remediation. |
| **M** (*Major*) | **P1** | Security hygiene issue (XSS, unpinned CDN) or on-wiki compliance blocker. | Blocker for on-wiki gadget promotion. |
| **N** (*Minor*) | **P2** | Code style, documentation drift, or non-blocking micro-optimizations. | Addressed during regular refactoring. |

> [!NOTE]
> All detailed finding histories and remediation records are maintained in [**`LOG.md` (§3.2 Audit Findings Register)**](LOG.md#32-audit-findings-register-k1--m1--m6--m7-taxonomy).

#### Architectural Audit Findings Summary
* **[K1] Real DOM Mock Weakness (P0 — Resolved):** Replaced synthetic DOM mocks with authentic MediaWiki diff fixtures in `tests/test_jsdom.js` and live CDP browser testing. ([`LOG.md#k1`](LOG.md#k1-real-dom-mock-weakness))
* **[M1] HTML via Template Strings (P1 — Resolved):** Replaced `.innerHTML` string interpolation with native DOM builder `el()` and text nodes. ([`LOG.md#m1`](LOG.md#m1-html-generation-via-template-strings))
* **[M6] Unpinned CDN Distribution (P1 — Resolved):** Eliminated external CDNs in favor of on-wiki loading with optional commit-pinned SHA loaders. ([`LOG.md#m6`](LOG.md#m6-unpinned-cdn-distribution))
* **[M7] On-Wiki `<nowiki>` Protection (P1 — Resolved):** Wrapped script in `/* <nowiki> */` comments with automated delimiter balance checks. ([`LOG.md#m7`](LOG.md#m7-on-wiki-nowiki-template-transclusion))

---

### 2.2 Security & Sanitization Protocols

Because RefDiff processes untrusted wikitext and HTML attributes from arbitrary revisions:
1. **Attribute Stripping:** All badge titles, labels, and anchor lookups are processed through `stripHtml()` and XML entity decoding.
2. **Anchor Sanitization:** All internal anchor targets (`#refdiff-cit-...`) must pass `sanitizeAnchor()`, stripping characters outside `[a-zA-Z0-9_\-.:]`.
3. **Diffchange Balance:** `hasBalancedDiffTags` validates that candidate wikitext does not cross unclosed `<ins>` or `<del>` spans before parsing.
4. **Defensive Browser APIs:** Optional APIs (`scrollIntoView`, `pushState`, `MutationObserver`) are guarded via `typeof` checks or `try/catch` blocks.

---

### 2.3 Real DOM Regression Harness (JSDOM & Live CDP)

RefDiff operates a dual-engine DOM verification pipeline:
* **Level 2 — JSDOM Suite (`tests/test_jsdom.js`):** Headless Node.js execution on authentic MediaWiki diff fixtures. Validates byte-for-byte Memento invariance:
  $$\text{table.innerHTML}_{\text{initial}} \equiv \text{table.innerHTML}_{\text{restored}}$$
  Restoration must leave zero orphaned rows, leaked classes, or dangling event listeners.
* **Level 4 — Live Chromium CDP (`tests/test_live_cdp.py`):** Live browser verification over WebSocket port 9222 covering OOUI mode switcher, Vector 2022 Dark Mode tokens, and `Extension:Popups` Reference Previews.
* **Mandatory CDP Pre-Condition:** Live browser CDP testing (`npm run test:live` on port 9222) is an invariant that must ALWAYS be executed before any update or deployment to `refdiff.js`. No changes to `refdiff.js` may be published without passing live CDP sign-off.
* **Performance Budgets:** Processing 114 references across split diffchanges must complete in **< 50 ms** in browser environments and **< 250 ms** across all 15 suites in CI.

---

### 2.4 On-Wiki Distribution & Security Hygiene

To meet Wikimedia security policies for user scripts and gadgets:
1. **No External CDNs:** Production deployments load strictly from Wikimedia servers (`en.wikipedia.org`, `meta.wikimedia.org`, or local wiki `Special:MyPage`).
2. **Revision-Pinned Loader Pattern & No-Versioned-Filenames:** Users and downstream distributions requiring immutable versions pin release revisions via MediaWiki's native revision ID (`&oldid=123456789`) or commit SHA loader rather than creating versioned filenames (`refdiff-v1.js`).
3. **Meta Script Lead & en.WP SHA Pointer Architecture:**
   - **Script Lead (`m:User:Powercycler/refdiff.js`):** The primary unminified codebase payload lives canonically on Meta-Wiki to serve cross-wiki userbases.
   - **SHA Pointer (`en:User:Powercycler/refdiff.js`):** English Wikipedia hosts an immutable/release-pinned loader forwarding to Meta-Wiki with target release SHA-1 metadata.
   - **Early Testing Harness (`en:User:Powercycler/common.js`):** During deployment stages, maintainers smoke-test newly deployed Meta builds directly in personal `common.js` on live diffs before upreving the en.WP SHA pointer (eliminating the need for a separate canary page).
   - **Documentation Lead (`en:User:Powercycler/RefDiff`):** English Wikipedia leads the authoritative documentation, while Meta-Wiki (`m:User:Powercycler/RefDiff`) acts as a soft redirect.
4. **Wikitext Protection:** The script begins with `/* <nowiki> */` and ends with `/* </nowiki> */` to prevent template parsing and signature expansion.


---

### 2.5 Clean Code & Test Code Smell Standards

To ensure tests remain resilient, diagnostic, and maintainable, RefDiff enforces strict clean-code rules:

#### Production Standards
* **Single Responsibility:** Decoupled modules (`parser`, `pairing`, `memento`, `renderer`, `init`, `state`) with zero circular dependencies.
* **XSS-Immune DOM Construction:** Dynamic elements built via native `el()` and `ownerDocument.createTextNode()`; zero `.innerHTML` interpolation.
* **ResourceLoader Encapsulation:** Zero global scope leaks; IIFE closure with explicit `window.RefDiff` exports only under Node.js test environments.

#### Test Code Smell Prevention
* **Assertion Roulette:** Prohibited. Every assertion must provide an explicit diagnostic failure message.
* **Mystery Guest & Magic Literals:** Tests must use explicit AAA (Arrange-Act-Assert) structure and named fixtures (`tests/fixtures/`).
* **Over-Mocking:** UI and table transformations must run against authentic HTML in JSDOM, never synthetic mock objects.
* **Polluted Globals:** All mocked globals must execute within `withMockEnvironment()` or `try/finally` with guaranteed teardown.
* **Conditional Logic:** Prohibited. Tests must execute linearly without branching (`if`/`switch`) to prevent silently skipped assertions.
* **Timing Flakes:** Prohibited. Synchronization must rely on deterministic hooks (`mw.hook`) rather than wall-clock `sleep()` delays.
* **DAMP over DRY in Tests:** Test cases prioritize Descriptive And Meaningful Phrases over aggressive DRY abstraction to maximize legibility.

#### Pre-Merge Review Checklist
- [ ] Clear Arrange-Act-Assert structure with zero branching logic.
- [ ] Every assertion contains an explanatory failure message.
- [ ] All global modifications run inside `withMockEnvironment()`.
- [ ] DOM tests execute against authentic MediaWiki fixtures in JSDOM.
- [ ] Deterministic synchronization (no `setTimeout` or `sleep`).
- [ ] Passes `npm run ci` with 0 ESLint warnings.

---

### 2.6 Test Proportionality & Sufficiency Audit: "Is it Enough or Too Much?"

#### Proportionality Audit: Is it Too Much?
**Verdict: No.**
* **Zero Runner Bloat:** Pure Node.js built-in `assert` without third-party frameworks (no Jest/Mocha/Babel). 15 modular suites run in **~250 ms**.
* **High-Value Invariants:** Every assertion guards a specific failure mode: tag splitting across `diffchange`, Memento restoration, author-year synthesis (`{{sfn}}`), anchor discovery, and inline-modified mode.
* **Sandboxed Mock Isolation:** Scoped `withMockEnvironment()` guarantees state restoration with zero cross-test interference.

#### Sufficiency Audit: Is it Enough?
**Verdict: Sufficient for production release (v1.4.0), with explicit, monitored boundaries.**
* **100% Core Production Coverage:** 71 of 71 internal functions covered, authentic DOM fixtures in JSDOM, live CDP browser automation, and stress benchmarks.
* **Monitored Testing Boundaries:**
  1. *Malformed Wikitext:* Unclosed `<ref>` tags gracefully remain in-situ in prose.
  2. *Transcluded Footnotes:* Citations inside complex template wrappers (`{{refn}}`, `{{sfnp}}`) remain in-situ without badging.
  3. *Mobile Diffs:* Single-column stacked layouts (MinervaNeue) are outside desktop test scope.
  4. *Dynamic AJAX Lifecycle:* Successive diff reloads without full page refresh.
  5. *Prose Invariance:* Continuous differential fuzzing of prose diff preservation is delegated to [`LOG.md` §3.3](LOG.md#33-real-world-diff-verification-register).

---

### 2.7 Adoption & Scaling Policy: 10-User Pilot, 50-User Gadget Milestone & Beyond

To govern the transition from initial release to broad community gadget candidacy and eventual mass adoption, RefDiff enforces a phased three-tier stability model:

#### Tier 1: Early Adopter Pilot Gate (10-User Milestone)
1. **Pilot Adoption Threshold:** Active transclusions monitored via `Special:WhatLinksHere/Template:User_RefDiff` reaching $\ge 10$ active patrollers on English Wikipedia.
2. **Defect Threshold:** Zero uncaught runtime errors (P0) and zero unhandled table corruptions across real Wikipedia diff reviews.
3. **Fail-Open Invariant:** Uncaught exceptions in any auxiliary component must cleanly restore the native diff view without impacting reviewer workflows or common.js tools (Twinkle, HotCat).
4. **Direct Qualitative Feedback:** Operational feedback and edge-case diff submissions triaged directly on `en:User talk:Powercycler/RefDiff`.

#### Tier 2: 50-User Community Reviewer Scale (Gadget Proposal Prerequisite)
1. **Critical Mass Threshold:** $\ge 50$ active NPP/RC reviewers sustained over $\ge 60$ days with 0 critical regressions.
2. **Ecosystem Non-Interference:** Formal automated test assertions verifying zero disruption to diff headers, revision metadata, and third-party buttons (TODO: check Twinkle and Ultraviolet compatibility, HotCat, diffedit).
3. **Dynamic SPA Re-Entrancy:** Safe re-initialization on sequential `wikipage.diff` Ajax table swaps without Memento memory leaks.
4. **Client-Side Observability:** Opt-in diagnostic troubleshooting flag (`?refdiff_debug=1`) for rapid triage of reviewer bug reports.
5. **Community Consensus:** Formal RFC proposal on `Wikipedia:Village pump (technical)` for definition as an opt-in gadget in `MediaWiki:Gadgets-definition`.

#### Tier 3: Beyond 50-User Goal (Mass Scale, Default Gadget & Upstream Integration)
1. **Formal Accessibility Compliance:** Full WCAG 2.1 AA keyboard focus navigation, screen reader semantics (`aria-label`), and contrast validation across light/dark themes.
2. **Multi-Skin & Mobile Fallback:** Verified support across legacy skins (Vector 2010, Monobook, Timeless) and graceful auto-disablement on single-column mobile viewports (`MinervaNeue`).
3. **Default-Enabled Status:** Broad community consensus for default-on gadget status (`[default]`) on English Wikipedia or cross-wiki deployment.
4. **Upstream MediaWiki Integration:** Core parser and `Extension:Cite` native support for `<ref def>` definitions (see [`LOG.md` §2.2](LOG.md#22-upstream-ref-def-tag-roadmap-future-strategy)).


---

### 2.8 "Git Diff as Quick Review" Protocol (Clean & Complete Codebase Hygiene)

Even when test suites pass 100%, automated assertions cannot detect incomplete refactorings, stale documentation metrics, orphaned links, or extraneous debug debris. Maintainers and auditors enforce the **"Git Diff as Quick Review"** protocol as an essential pre-merge audit gate:

```bash
# 1. Concise summary of modified line counts and file scope
git diff --stat

# 2. Line-by-line inspection of unstaged working tree changes
git diff

# 3. Final verification of staged commit payload
git diff --staged

# 4. Status check to ensure no untracked scratch files remain
git status --short
```

#### The 4-Point Diff Audit Invariant Checklist

| Checkpoint | Target of Scrutiny in `git diff` | Failure Signature & Anti-Pattern Caught |
|:---|:---|:---|
| **1. Zero Debris & Scratch Residue** | Diff hunks must contain zero lingering `console.log`, temporary test variables, debug flags (`window.rw_debug`), or scratch test dumps. | Leftover exploratory prints, temporary variables (`let temp = ...`), disabled tests. |
| **2. Completeness of Cleanups** | When removing or deprecating an artifact, path, or function, verify that all references across docs, tables, and test harnesses are completely updated. | Removing a folder (e.g. `archive/`) but leaving dead markdown links; deleting a parameter without updating docstrings. |
| **3. Metric & Spec Synchronization** | Any change altering test counts, pre-flight checks, release versions, or canonical target URLs must update all governing specifications in lockstep. | Adding a test file while `TEST_PLAN.md` or `ARCHITECTURE.md` still reports obsolete counts (e.g. 113 vs 115). |
| **4. Hunk Conciseness & Zero Noise** | Every modified line must serve a dedicated purpose. Avoid gratuitous whitespace modifications, formatting churn, or accidental unrelated file touches. | Auto-formatter re-indenting 300 unchanged lines; accidental trailing whitespace; accidental touches to scratch files. |

> [!TIP]
> **Case Study in Incomplete Cleanups:** During the v1.3.0 audit, a quick `git diff` review revealed that while the `archive/` prototype directory was deleted, four documentation files still referenced dead `archive/python-prototype/` links, and two tables listed 113 instead of 115 tests. Running the `git diff` quick review protocol eliminated these discrepancies before release tagging.

#### Two-Phase Version Strategy: Patch Pre-Flight & Minor Post-Deployment

To ensure diff reviews remain fast, high-confidence, and zero-defect, all releases enforce RefDiff's two-phase version strategy:
1. **Pre-Flight Pass & Feature Completion (Patch Uprev):** When a scoped feature increment or architectural improvement is completed and passes all pre-flight quality gates (CI, DOM fixtures, live browser CDP, and live benchmark monkey patching), execute a **patch uprev bump** (`node scripts/bump_version.js patch`).
2. **Post-Deployment Milestone (Minor Uprev):** Once an on-wiki rollout is fully deployed and verified across all Wikimedia targets (`m:User:Powercycler/refdiff.js`, `en:User:Powercycler/refdiff.js`, docs, userbox; `npm run check:deploy` passes), execute a **minor uprev bump** (`node scripts/bump_version.js minor`) to stamp the deployed milestone and transition into the next development cycle.
3. **Mandatory Uprev Before Deployment:** Maintainers and release automation must assure a formal version uprev is executed across all repository manifests (`package.json`, `refdiff.js`, `refdiff.wiki`, `ROLLOUT_PLAN.md`) before initiating on-wiki deployment. Deploying against unbumped version numbers is prohibited.
4. **Smaller Changes Between Uprevs:** Increments between uprevs must be scoped to small, single-focus batches rather than monolithic changesets to prevent reviewer fatigue, keep hunks immediately comprehensible, and make regressions straightforward to isolate.
5. **Uprev Triggers Diff Audit:** Every version bump strictly triggers the mandatory `git diff --stat && git diff` audit before advancing through the rollout rings in [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md).

---

## 3. Pillar 2: Editorial Review & Source Auditing Playbook

### 3.1 The "Template Camouflage" Audit Workflow
* **Threat:** Vandals conceal prose changes inside massive citation template additions, turning entire paragraphs yellow/blue in standard diffs.
* **Audit Workflow:**
  1. Open diff on `Special:Diff` (RefDiff decouples automatically).
  2. **Prose Scan:** Review prose rows; word changes stand out cleanly in green/red highlights.
  3. **Badge Inspection:** Unmodified citations appear as grey badges (`⟨ref1⟩`), modified as amber (`⟨~name~⟩`), and added as green (`⟨+name+⟩`).
  4. **Citation Delta Scan:** Inspect the dedicated citation diff row directly beneath the prose row to review parameter changes (URLs, page numbers, authors).

### 3.2 Auditing Against "AI Slop" & Hallucinated Sources
* **Threat:** LLM-generated edits produce syntactically valid wikitext with fabricated citations (hallucinated DOIs, fake books, dead URLs).
* **Audit Workflow:**
  1. **Source Decoupling:** Extract citations to inspect prose coherence and neutrality in isolation.
  2. **Preview Verification:** Hover over badges (`⟨1⟩`, `⟨2⟩`) to trigger MediaWiki Reference Previews (`Extension:Popups`) without scrolling to footnotes.
  3. **Anchor Matching:** Badges link to `#cite_note-*`; orphaned or broken citations are flagged immediately when no popover appears.

### 3.3 Tri-Mode Review Triage

```
[ 👁 Visual ]  [ [[]] Wikitext ]  [ ⧉ RefDiff ]  [✓] Inline modified refs
```

| Edit Type | Recommended Mode | Rationale |
|:---|:---:|:---|
| **Simple Typos / Formatting** | **Visual Diff** | Fast WYSIWYG review. |
| **Templates / Tables / Infoboxes** | **Wikitext Diff** | Inspect parser functions and syntax. |
| **Scholarly / Citation-Heavy Edit** | **RefDiff Mode** | Decouples citations from prose; audits sources parameter by parameter. |
| **Dense Destination Matrix / Tables** | **RefDiff (Inline modified checked)** | Keeps modified citations inline with `⟨~label~⟩` badges without altering row heights. |

### 3.4 Integration with the Review Ecosystem
* **[`diffedit.js`](https://en.wikipedia.org/wiki/User:BrandonXLF/diffedit):** RefDiff automatically yields and restores native wikitext when in-diff editing begins.
* **[`CNfirmed.js`](https://en.wikipedia.org/wiki/User:Alaexis/CNfirmed.js):** Cross-check unsourced claims in RefDiff's prose pane against the Internet Archive.
* **[`HarvErrors.js`](https://en.wikipedia.org/wiki/User:Svick/HarvErrors.js):** Author-year badges (`⟨Castritius 2005⟩`) link to shortened footnote anchors, exposing missing bibliography citations.

---

## 4. Real-World Diff Verification Lifecycle

Every real-world diff anomaly submitted to the audit queue follows a strict 6-stage funnel:

```mermaid
flowchart LR
    Q1["1. Candidate Triage<br/>(TEST_PLAN.md)"] --> Q2["2. Raw HTML Capture<br/>(tests/fixtures/)"]
    Q2 --> Q3["3. JSDOM Reproduction<br/>(test_jsdom.js)"]
    Q3 --> Q4["4. Core Fix<br/>(refdiff.js)"]
    Q4 --> Q5["5. CDP Audit<br/>(test_live_cdp.py)"]
    Q5 --> Q6["6. Regression Lock<br/>(npm run ci)"]
```

1. **Candidate Triage:** Diff URL, revision ID, and anomaly logged in [`TEST_PLAN.md`](TEST_PLAN.md#51-real-world-diffs--verification-queue).
2. **Raw HTML Capture:** Raw MediaWiki diff HTML saved into test fixtures.
3. **JSDOM Reproduction:** Failing test added without mocks to `test_jsdom.js`.
4. **Core Fix:** `refdiff.js` patched following modular standards.
5. **CDP Browser Audit:** Live browser testing on port 9222 verifies switcher, themes, and popups.
6. **Regression Lock:** Diff marked `Verified` in `TEST_PLAN.md` and recorded in `LOG.md` §3.3.

---

## 5. Continuous Quality Gates & Enforcement

All criteria must pass before merging or tagging releases:

| Quality Gate | Invariant / Threshold | Verification Command |
|:---|:---|:---|
| **Test Suite Pass Rate** | **115 / 115 passing tests across 15 suites** | `npm test` |
| **Code Style & Linting** | **0 errors, 0 ESLint warnings** | `npm run lint` |
| **Clean Code & Test Smells** | **AAA pattern, descriptive assertions, 0 global leaks** | `npm test && npm run lint` |
| **Deployment Pre-Flight** | **10 checks: zero BOM, nowiki, version sync, rollback, deployment consistency** | `node tests/test_deployment.js` |
| **Live On-Wiki Deployment** | **All release targets verified & synchronized across Wikimedia APIs** | `npm run check:deploy` |
| **Uprev Diff Audit Gate** | **Small changes between uprevs; zero debris, no orphaned references, concise hunks** | `git diff --stat && git diff` |
| **CI Execution Budget** | **< 250 ms across all 15 test suites** | `npm run ci` |
| **Stress Benchmark Budget** | **< 50 ms on 114-reference table** | `node tests/test_benchmarks.js` |
| **DOM Memento Invariance** | **Byte-for-byte table restoration** | `node tests/test_jsdom.js` |
