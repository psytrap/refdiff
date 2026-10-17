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
  * 🗃️ **[userbox.wiki](userbox.wiki):** Ready-to-deploy userbox template (`{{User:Powercycler/Userbox RefDiff}}`) for English Wikipedia and cross-wiki user pages.
  * 🚀 **[ROLLOUT_PLAN.md](ROLLOUT_PLAN.md):** Phased rollout protocol (Rings 0–3), pre-flight gates, rollback runbook, and health checks.
  * 📖 **[README.md](README.md):** Repository introduction and index.

---

## 2. Planned Steps & Action Items (Roadmaps)

### 2.1 RefDiff Tool Roadmap (Active In-Browser Gadget)

*Focus: Immediate client-side diff enhancement on `Special:Diff`, phased scaling from Early Adopter Pilot (10-user milestone) to Community Reviewer Milestone (50-user scale), delineating mass-scale goals beyond 50 users, and on-wiki rollout.*

#### Scaling Progression Overview: 10-User Pilot, 50-User Gadget & Beyond-50 Mass Scale

| Dimension | Tier 1: Early Adopter Pilot (10-User Milestone) | Tier 2: Community Reviewer Scale (50-User Milestone) | Tier 3: Mass Deployment (Beyond 50 Users) |
| :--- | :--- | :--- | :--- |
| **Objective** | Validate real-world value with early adopters on en.WP | Qualify for official opt-in English Wikipedia Gadget | Site-wide default gadget or upstream MediaWiki core feature |
| **Adoption Target** | $\ge 10$ active patrollers via `User:Powercycler/Userbox RefDiff` | $\ge 50$ active NPP/RC reviewers over 60 days | 1,000+ editors, site-wide default, cross-wiki deployment |
| **Distribution** | Personal user script in `common.js` / `global.js` | Built-in opt-in Gadget in `Special:Preferences` | Default-enabled gadget (`[default]`) or native `Extension:Cite` |
| **Crash Blast Radius** | Fail-open `try...catch` boundary (reverts to native diff) | Zero blast radius across diverse multi-script ecosystems | Core platform stability, server-side / Parsoid guarantees |
| **Tool Compatibility** | Non-interference verified on standard diff headers | Formal automated contract tests (Twinkle, HotCat, etc.) | Universal compatibility across all gadgets and extensions |
| **DOM Lifecycle** | Synchronous diff rendering via `wikipage.diff` hook | Full AJAX/SPA re-entrancy without Memento leaks | Universal client/server hydration lifecycle |
| **Skins & Viewports** | Primary focus on Vector 2022 desktop | Vector 2022 desktop (core reviewer skin) | Full multi-skin (Vector 2010, Monobook) & mobile (`MinervaNeue`) |
| **Accessibility** | Semantic HTML, high-contrast angle-bracket badges | Accessible DOM structure and contrast compliance | Formal WCAG 2.1 AA audit, full screen reader & keyboard nav |
| **Feedback Channel** | Scoped strictly to `en:User talk:Powercycler/RefDiff` | Community RFC on `Wikipedia:Village pump (technical)` | MediaWiki Phabricator, Gerrit patches, cross-wiki RFCs |

#### RefDiff Checklist & Status Dashboard

##### Shipped Releases: v1.5.3, v1.5.4 | Active Development: Post-Shipment & Community Feedback (Phase 1)

| Step | Milestone / Action Item | Priority | Status | Target / Deliverable |
| :---: | :--- | :---: | :---: | :--- |
| **R.8** | On-Wiki Phased Rollout (v1.4.3) | **P0** | ✅ **Completed** | Rollout verified 100% synchronized across Meta-Wiki and en.WP (`npm run check:deploy`) |
| **R.20** | Phased Rollout of Recent Updates (v1.5.3) | **P0** | ✅ **Completed** | Deployed `v1.5.3` across all rings: Ring 0 tagged (`fa9e7f2`), Live User Inspection signed off, Ring 1 Meta Script Lead (`m:User:Powercycler/refdiff.js` rev 31176975), Ring 2 en.WP pointer (`en:User:Powercycler/refdiff.js` rev 1380681839), early testing on `common.js` (rev 1380682062), and en.WP lead docs (`en:User:Powercycler/RefDiff` rev 1380682190). Showcase diff update deferred to future release cycle. |
| **R.26** | Phased Rollout of Paragraph Merge Fix (v1.5.4) | **P0** | ⏳ **In Progress** | Release candidate `v1.5.4` addressing Leonardo Torres Quevedo `wikidiff2` paragraph-merge boundary shift (Step R.22). All 140 unit/DOM tests, 10 deployment gates, and 6 live CDP benchmarks verified green. Preparing on-wiki deployment across rings. |

##### Immediate Pre-Pilot Priority (P0 — Higher than Tier 1)

| Step | Focus Area (Milestone) | Priority | Status | Proposed Optimization (Deliverable) |
| :---: | :--- | :---: | :---: | :--- |
| **Step R.15** | On-Wiki Documentation, Meta Redirect & Userbox Polish | **P0** | ✅ **Finished** | Polished on-wiki documentation (en.WP doc lead `refdiff.wiki` & `en:User:Powercycler/RefDiff`, Meta tools page `meta_refdiff.wiki` & `m:User:Powercycler/RefDiff`, and userbox `User:Powercycler/Userbox RefDiff`): documented agentic coding methodology & formal QA governance in `AUDIT_STRATEGY.md` and `refdiff.wiki`, added script installer hint, dynamic version in button tooltip, synced 122 tests, and established 100% parity with live on-wiki deployment |
| **Step R.21** | Inter-Template Diff Alignment (`{{citation needed}}` & `{{cn}}`) | **P0** | ✅ **Finished** | Strictly scoped to `{{citation needed}}` and `{{cn}}` (parameterized or bare): normalized split diffchange boundaries when MediaWiki aligns tokens (`{{`, `&#124;date=`, `}}`) between deleted `{{citation needed}}` / `{{cn}}` and added `<ref>` citations for key customer CNfirmed ([Dwight D. Eisenhower diff=1380014667](https://en.wikipedia.org/w/index.php?title=Dwight_D._Eisenhower&diff=prev&oldid=1380014667)). Fully verified across unit, pipeline, JSDOM, and live CDP tests (129 tests passing). |
| **Step R.22** | Paragraph Merge Diff Entanglement (`Leonardo Torres Quevedo`) | **P0** | ✅ **Finished** | Normalized `wikidiff2` boundary-shifted trailing closing ref tags across merged paragraphs (`Rule 7b` in `normalizeDiffTags`) for [Leonardo Torres Quevedo (diff=1380356173)](https://en.wikipedia.org/w/index.php?title=Leonardo_Torres_Quevedo&diff=prev&oldid=1380356173). Fully verified across unit tests, JSDOM, and live CDP benchmarks (10 cit rows, 26 badges, Memento roundtrip). |
| **Step R.23** | DOM-Identifier-Matching & Vorlagen-Listenformat-Preview | **P0** | ✅ **Finished** | Zweistufige Architektur: Deterministisches DOM-Identifier-Matching (DOI/PMID/PMC/ISBN/URL) für MediaWikis native Reference Previews (`mw.popups`) bei bestehenden Quellen sowie automatische Listenformat-Preview (`parseTemplateList` mit `• key: val` Tooltip & schwebender `.refdiff-preview-card`) bei Nicht-Treffern/neuen Quellen. 138/138 Tests bestanden, 0 ESLint-Warnungen. |

##### Tier 1: Early Adopter Pilot & Stability (10-User Milestone)

| Step | Focus Area (Milestone) | Priority | Status | Proposed Optimization (Deliverable) |
| :---: | :--- | :---: | :---: | :--- |
| **Step R.1** | Fail-Open Crash Boundary | High | 🔮 Future | Top-level `try...catch` boundary; zero blast radius on `common.js` |
| **Step R.7** | Pilot Cohort Validation | Normal | 🔮 Future | Track $\ge 10$ active patrollers via `User:Powercycler/Userbox RefDiff` with 0 P0 defects |
| **Step R.17** | Streamline Rollout & Version Bump Process | Normal | 🔮 Future | TODO: Streamline rollout runbook, version bump cadence, and deployment checklist (simplify, do not over-automate) |
| **Step R.18** | Automated Showcase Test in Rollout Protocol | Normal | 🔮 Future | TODO: Add automated Showcase diff test (`m:User:Powercycler/RefDiff/Show_case` powered by `tests/comprehensive_{old,new}.wiki`) to rollout gates and deployment auditor |
| **Step R.19** | Test Timeout Hardening & Watchdog Architecture | High | 🔮 Future | TODO: Implement strict multi-tier timeouts across all live integration & benchmark suites (`tests/test_live_benchmarks.py`, `tests/test_live_cdp.py`) to prevent unbounded WebSocket receives and infinite test hangs |
| **Step R.24** | Complementary Tools Ecosystem Review (`AI Source Verification`, `CNfirmed`) | Normal | ⏳ TODO (Next Step) | Curate and publish complementary tools directory (AI claim verification, citation discovery, diffedit) once on-wiki documentation stabilizes |
| **Step R.25** | Clean Suffix Binding (`{{rp}}`) & Deterministic Brace Tokenizer | Normal | ⏳ TODO | Transition from regex exclusion of `rp` and lookaround assertions to formal suffix token binding and a deterministic, stack-based brace scanner for nested footnote templates (`{{efn}}`, `{{refn}}`, `{{sfnp}}`) (Zipf's law diff=1379548357 follow-up) |

##### Tier 2: Community Reviewer Scale (50-User Opt-In — Post-Pilot)

| Step | Milestone / Action Item | Priority | Status | Target / Deliverable |
| :---: | :--- | :---: | :---: | :--- |
| **R.2** | Dynamic AJAX / SPA Re-entrancy | High | 🔮 Future | JSDOM test simulating consecutive diff table swaps; Memento leak prevention |
| **R.3** | Tool Non-Interference (Twinkle & Ultraviolet) | High | 🔮 Future | TODO: Check Twinkle rollback buttons and Ultraviolet CVPI overlay compatibility |
| **R.10** | Regex Reevaluation & Parser Architecture | High | 🔮 Future | TODO: Reevaluate regexes (REF_REGEX, TEMPLATE_REF_REGEX) for nesting depth and token scanner alternatives |
| **R.11** | Default Mode Isolation & Wikitext-First Mode Switching | High | ✅ Completed | Fixed Visual Diff defaulting bug: activate RefDiff strictly on wikitext, dim/disable RefDiff in Visual mode, require Wikitext-first transition, and cleanly persist preferences |
| **R.12** | Live On-Wiki Visual Testbed (No Local Visual Test) | High | 🔮 Future | TODO: Retire local HTTP visual inspection in favor of live on-wiki testing |
| **R.13** | Visual Inspection Across All Change Cases | High | ✅ Completed | Comprehensive visual inspection matrix verified & signed off across all change cases |
| **R.4** | Client-Side Observability Mode | Normal | 🔮 Future | Opt-in `?refdiff_debug=1` diagnostic logging mode |

##### Tier 3: Beyond 50-User Goal (Mass Scale, Default Gadget & Multi-Platform)

| Step | Milestone / Action Item | Priority | Status | Target / Deliverable |
| :---: | :--- | :---: | :---: | :--- |
| **R.5** | Accessibility (WCAG 2.1 AA) & Keyboard Nav | High | 🔮 Future | Formal WCAG audit, keyboard focus navigation, contrast ratio validation |
| **R.6** | Legacy Skins & Mobile Guard | Normal | 🔮 Future | Vector 2010 fallback bar, Monobook parity & graceful Minerva mobile auto-disable |
| **R.9** | Default-Enabled Gadget RFC | Low | 🔮 Future | Proposal on `Village pump (technical)` for default-on gadget status (`[default]`) |

#### RefDiff Action Items (Detail)

##### Recent Release Action Items (Completed & Active Rollout)
- [ ] **Step R.26: Phased Rollout of Paragraph Merge Fix (`v1.5.4`) (P0 — Active Rollout ⏳)**
  * **Focus Area:** Production Rollout of v1.5.4 Release Candidate
  * **Scope of Updates Rolled Out:**
    - Paragraph merge boundary normalization (Step R.22): MediaWiki `wikidiff2` suffix matching artifact resolved via Rule 7b in `normalizeDiffTags`, properly balancing closing `&lt;/ref&gt;` tokens across merged paragraphs without affecting prose text or Memento restoration.
    - Wikipedia tone refinements: Updated `refdiff.wiki` Section 1.1 (`Review Challenges in Standard Diffs`) and Section 7 (`Scope and Known Limitations`) with objective, neutral phrasing.
    - Test suite expansion: 140/140 tests passing (including new unit test and JSDOM DOM test) and 6/6 canonical live CDP benchmarks passing (including Leonardo Torres Quevedo `diff=1380356173`).
    - Clean user environment automation: Scripted verification for clean `common.js` baseline and automated logout verification at the conclusion of rollout testing.
  * **Pre-Flight Quality Gate Execution (Cleared ✅):**
    - [x] **Version Manifest Synchronization:** Bumper executed (`node scripts/bump_version.js patch`), synchronizing `v1.5.4` across `package.json`, `package-lock.json`, `refdiff.js`, and `refdiff.wiki`.
    - [x] **Lint & Static Hygiene (`npm run lint`):** 0 ESLint errors, 0 warnings across all sources, tests, and deployment scripts.
    - [x] **Unit & DOM Test Suites (`npm test`):** 140/140 tests passing across all 15 suites in ~250ms.
    - [x] **Deployment Release Gate (`node tests/test_deployment.js`):** 10/10 deployment integrity checks passing.
    - [x] **Live Browser Verification (`npm run test:live`):** 8/8 checks passed in Chromium CDP.
    - [x] **Live Benchmark Suite (`npm run test:bench`):** 6/6 canonical diffs verified with byte-for-byte Memento roundtrip (Bihar, Odoacer, Zagreb 114 refs, Cosmic Inflation, Donnie Brasco, Leonardo Torres Quevedo).
    - [x] **Zero Deployment Automation & Sole Read-Write Exception:** All deployment, on-wiki publishing, and git pushing are strictly manual under maintainer control. The sole and only exception is `scripts/check_toolpage_installer.py` (`npm run check:installer --press` or `--toggle-roundtrip`), which is explicitly authorized to interactively press the Install/Uninstall button on `User:Powercycler/RefDiff` to test that ScriptInstaller triggers proper `common.js` state transitions in the browser DOM.
  * **On-Wiki Rollout Protocol Execution (Pending Ring 1 Sign-Off):**
    - [ ] **Ring 0 (Release Baseline):** Commit and tag `v1.5.4`.
    - [ ] **Ring 1 (Meta-Wiki Script Lead):** Update `m:User:Powercycler/refdiff.js` upon user sign-off.
    - [ ] **Ring 2 (en.WP SHA Pointer Uprev & Lead Docs):** Update `en:User:Powercycler/refdiff.js` SHA pointer and publish `refdiff.wiki` to `en:User:Powercycler/RefDiff`.
    - [ ] **Post-Shipment Live Parity Audit:** Run `npm run check:deploy`.

- [x] **Step R.20: Phased Rollout of Recently Completed Updates (`v1.5.3`) (P0 — Released & Deployed ✅)**
  * **Focus Area:** Production Rollout of v1.5.3 Release Candidate
  * **Scope of Updates Rolled Out:**
    - Visual Diff mode isolation: button visually dimmed (`oo-ui-widget-disabled`, `aria-disabled="true"`, `tabindex="-1"`) and click events suppressed in Visual Diff mode.
    - Wikitext-first mode transition invariant: direct switches from Visual mode to RefDiff halted; requires switching to Wikitext first.
    - Zero vertical shift inline toggle: pixel-perfect CSS alignment between OOUI switcher and native inline diff checkbox across light and dark themes.
    - Inter-template diff alignment (Step R.21): bounded normalization of split diffchange tokens for `{{citation needed|...}}` and `{{cn|...}}` (Eisenhower diff 1380014667).
    - DOM-identifier matching & template list preview format (Step R.23): deterministic DOI/PMID/PMC/ISBN/URL matching for native Reference Previews and formatted list preview card for new/unmatched references.
    - Comprehensive showcase integration: Section 6 added to canonical fixtures `tests/comprehensive_{old,new}.wiki` and `refdiff.wiki` (on-wiki showcase page update deferred).
  * **Pre-Flight Quality Gate Execution (Cleared ✅):**
    - [x] **Version Manifest Synchronization:** Bumper script executed (`node scripts/bump_version.js patch`), synchronizing `v1.5.3` across `package.json`, `package-lock.json`, `refdiff.js`, and `refdiff.wiki`.
    - [x] **Lint & Static Hygiene (`npm run lint`):** 0 ESLint errors, 0 warnings across all sources, tests, and deployment scripts.
    - [x] **Unit & DOM Test Suites (`npm test`):** 138/138 tests passing across all 15 suites in ~250ms.
    - [x] **Deployment Release Gate (`node tests/test_deployment.js`):** 10/10 deployment integrity checks passing (BOM, nowiki, zero console.log, budget < 120 KB, userbox syntax, rollback Memento fidelity, artifact consistency).
    - [x] **Live Browser Verification (`npm run test:live`):** 8/8 checks passed in Chromium CDP (Odoacer diff=1379486498) covering mode switching, visual disabling, inline lock, and dark mode tokens.
    - [x] **Live Benchmark Suite (`npm run test:bench`):** 5/5 canonical diffs verified with byte-for-byte Memento roundtrip (Bihar, Odoacer, Zagreb 114 refs, Cosmic Inflation, Donnie Brasco).
    - [x] **Full Preflight Master Run (`npm run preflight`):** 100% green pass.
  * **On-Wiki Rollout Protocol Execution (Completed ✅):**
    - [x] **Ring 0 (Release Baseline):** Tagged release `v1.5.3` (`commit fa9e7f2`, tag `v1.5.3`) with clean git baseline.
    - [x] **Live User Visual Inspection Gate:** Dedicated interactive Chromium browser environment launched via CDP (`scripts/run_persistent_cdp_patch.py`), reviewed and signed off by user on live diffs (Dwight D. Eisenhower, Showcase, Bihar).
    - [x] **Ring 1 (Meta-Wiki Script Lead):** Updated `m:User:Powercycler/refdiff.js` with local `refdiff.js` (`v1.5.3`, SHA-1: `46c5f070`, Rev `31176975`).
    - [x] **Ring 2 (en.WP Early Testing, SHA Pointer Uprev & Lead Docs):**
      - Verified on `en:User:Powercycler/common.js` (Rev `1380682062`).
      - Updated SHA pointer on `en:User:Powercycler/refdiff.js` (Rev `1380681839`) pinned to Meta-Wiki Rev `31176975`.
      - Updated documentation lead on `en:User:Powercycler/RefDiff` (Rev `1380682190`, `| version = 1.5.3`).
      - Verified 100% synchronized across all Wikimedia targets via `node scripts/check_live_deployment.js`.
      - Showcase diff update (`en:User:Powercycler/RefDiff/Show_case`) deferred to future release cycle.

- [x] **Step R.8: Phased Rollout Protocol Execution (v1.4.3 Release — Completed)**
  * Executed [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) through Ring 0 (cleared), Ring 1 (Meta script lead updated), Ring 2 (Early testing verified on en.WP, SHA pointer published, lead docs published, user space userbox published), and verified 100% synchronized via `npm run check:deploy`.

##### Immediate Pre-Pilot Action Items (P0 — Higher than Tier 1)
- [x] **Step R.15: On-Wiki Documentation, Meta Redirect & Userbox Polish (P0 — Immediate Pre-Pilot — Finished)**
  * **Focus Area:** Comprehensive On-Wiki Documentation Polish
  * **Status:** Finished ✅
  * **Summary of Completed Polish:**
    1. [x] **Beta Notice & AbuseFilter Banner:** Added `{{ai-generated|...}}` banner and declared `| status = Beta` prominently in the infobox on `en:User:Powercycler/RefDiff`.
    2. [x] **English Wikipedia Documentation Lead Polish (`refdiff.wiki` & `en:User:Powercycler/RefDiff`):** Pruned non-existent tracking categories/redlinks, documented agentic coding methodology & formal QA governance, added one-click Script Installer guidance, updated canonical showcase diff link (`diff=1380240829`), updated test suite metrics to 122 tests across 15 modular suites.
    3. [x] **Meta-Wiki Documentation Soft Redirect (`m:User:Powercycler/RefDiff`):** Replaced outdated standalone wikitext with a clean cross-wiki soft redirect pointing to `en:User:Powercycler/RefDiff` per [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) Ring 1.
    4. [x] **Userbox Design & Usability (`userbox.wiki` & `en:User:Powercycler/Userbox RefDiff`):** Deployed category-free, zero-redlink userbox, verified transclusion on `User:Powercycler`, and documented clear usage syntax.
    5. [x] **On-Wiki Parity & Local File Sync:** Re-synchronized local repository file `refdiff.wiki` and `userbox.wiki` with live on-wiki lead documents; full consistency verified by `test_deployment.js`.
- [x] **Step R.21: Inter-Template Diff Fragment Alignment & Boundary Normalization (`{{citation needed|...}}` & `{{cn|...}}`) (P0 — Immediate Pre-Pilot — Finished ✅)**
  * **Customer & Strategic Value:** CNfirmed (by Alaexis) is one of our primary target tools/workflows. Semi-automated workflows (e.g. via `#proveit` or `CNfirmed`) frequently replace unreferenced `{{citation needed|...}}` or `{{cn|...}}` tags with full `<ref>{{cite ...}}</ref>` book/web citations.
  * **Strict Scope Invariant:** **Strictly scoped to `{{citation needed|...}}` and its canonical alias `{{cn|...}}`** (specifically matching parameterized templates such as `{{citation needed|date=...}}`, `{{citation needed|reason=...}}`, `{{cn|date=...}}`, or bare `{{cn}}`). We intentionally avoid generic, unbounded inter-template matching to protect parser performance and prevent unintended side effects on unrelated templates.
  * **Target Revision:** [Dwight D. Eisenhower (diff=1380014667)](https://en.wikipedia.org/w/index.php?title=Dwight_D._Eisenhower&diff=prev&oldid=1380014667) (Edit by Alaexis via CNfirmed).
  * **Root Cause & Diagnosis:**
    - When replacing `{{citation needed|date=August 2025}}` with two full citations `<ref>{{cite book ...}}</ref><ref>{{Cite book ... |date=2011}}</ref>`, MediaWiki's LCS character/word differ (`wikidiff2`) matched identical tokens (`{{`, `|date=`, `}}`) between the maintenance template and the new citation template.
    - As a result, the `<ref>` and `</ref>` tags were individually encapsulated in diffchange spans: `<ins class="diffchange diffchange-inline">&lt;ref&gt;</ins>` and `<ins class="diffchange diffchange-inline">&lt;/ref&gt;</ins>`, while the inner template text was interspersed with unhighlighted wikitext tokens (`{{`, ` |date=`, `}}`).
    - When `REF_REGEX` matched, it matched starting at `&lt;ref&gt;` inside `<ins>`, capturing `</ins>` without the opening `<ins>`.
    - `hasBalancedDiffTags` detected an unbalanced closing `</ins>` and correctly rejected the match to prevent malformed DOM mutations. However, this caused RefDiff to leave the added citations inline in prose without decoupling them into citation rows.
  * **Completed Implementation:**
    1. [x] **Targeted Boundary Normalization (`hasDeletedCn` & `normalizeCnDiffPair`):** Implemented strict scope detection for deleted/modified `{{citation needed|...}}` and `{{cn|...}}` via `hasDeletedCn()`. When detected, `normalizeCnDiffPair()` aligns the deleted template into a single cohesive `<del class="diffchange diffchange-inline">` span and consolidates the added citation block into a cohesive `<ins class="diffchange diffchange-inline">` unit guarded by `isPureRefSequence()` to eliminate any risk of swallowing prose.
    2. [x] **Multi-Layer Defensive Integration:** Wired `normalizeCnDiffPair` into `applyDecoupling` (pre-snapshot/pre-parse alignment), `transformProseCells` (prose cell safety), `normalizeDiffTags(str, delStr)`, and `parseRefs(html, delHtml)`.
    3. [x] **Automated Test Coverage:** Added unit test suites in `tests/test_utils.js` (detecting and normalizing bare/parameterized forms, rejecting unrelated templates like `{{clarification needed}}`), `tests/test_parser.js` (parsing both references from the Eisenhower diff), `tests/test_pipeline.js` (clean prose badge transformation and citation row creation), and `tests/test_jsdom.js` (real DOM decoupling and byte-for-byte Memento restoration). Total suite expanded to **129/129 passed**.
    4. [x] **Live Browser Verification (CDP):** Verified live in Chromium on English Wikipedia against revision `diff=1380014667`: 2 citation rows cleanly decoupled, badges rendered in added prose, clean deletion struck out in deleted prose, and 100% byte-for-byte restoration verified on toggle back to Wikitext.
    5. [x] **Visual Evidence & Screen Capture:** Captured full decoupled diff view to `/tmp/refdiff_screenshots/eisenhower_diff_decoupled.png` and created cropped inspection artifact `eisenhower_diff_crop.png`.
    6. [x] **Showcase Fixture Integration:** Incorporated the CNfirmed / Eisenhower test case as Section 6 in canonical wikitext fixtures [`tests/comprehensive_old.wiki`](tests/comprehensive_old.wiki) and [`tests/comprehensive_new.wiki`](tests/comprehensive_new.wiki), and updated [`refdiff.wiki`](refdiff.wiki) showcase walkthrough.
    7. [x] **Release Packaging & Pre-Flight Uprev:** Stamped release candidate `v1.5.3` via `node scripts/bump_version.js patch`, passing 100% of all pre-flight gates (`npm run preflight`).
    8. [ ] **On-Wiki Showcase Publication (Step R.20):** Update `en:User:Powercycler/RefDiff/Show_case` on English Wikipedia (`diff=1380240829`) with Section 6; Meta showcase retired.
- [x] **Step R.23: Deterministisches DOM-Identifier-Matching für native Reference Previews (P0 — Immediate Pre-Pilot — Finished ✅)**
  * **Leitprinzip:** **Kein eigenes Ref-Parsing!** RefDiff parst keine Zitationsvorlagen (keine Autorenfelder, kein `vauthors`, keine Titel-Zerlegung) und generiert keine eigenen Vorschaufenster. Es überlässt die Fußnotenvorschau zu 100 % MediaWikis nativer Extension **Reference Previews** (`mw.popups`), indem es dem Badge die exakte Sprungmarke `<a href="#cite_note-31">` zuweist.
  * **Kernunterscheidung in der Dokumentation:**
    - **Benannte Einzelnachweise (`<ref name="ABC">`):** Besitzen in MediaWiki feste, vorhersagbare Anker (`id="cite_note-ABC-..."`). RefDiff nimmt direkt den Namen `ABC` (bereits in Step 1 implementiert).
    - **Anonyme (unbenannte) Einzelnachweise (`<ref>...</ref>` ohne `name=`):** MediaWiki nummeriert sie im Gesamtartikel stur von oben nach unten durch (`cite_note-1`, `cite_note-2` ... `cite_note-31`). Im **Teildiff** (z. B. Zeile 141 in [*Respiratory therapist*](https://en.wikipedia.org/w/index.php?title=Respiratory+therapist&diff=1380407169&oldid=1372216818)) sieht RefDiff jedoch nur diesen isolierten Absatz. Das Zitat ist lokal die 7. Quelle der Zeile (`⟨ref7⟩`), im Gesamtartikel aber die **31. Fußnote**. Mangels Namen und mangels globaler Zählung im Teildiff versagt ein reines Zählen.
  * **Target Revision:** [Respiratory therapist (diff=1380407169&oldid=1372216818)](https://en.wikipedia.org/w/index.php?title=Respiratory+therapist&diff=1380407169&oldid=1372216818)
  * **Reported Defect:** "ref7 not working" — Badge rendert als `⟨ref7⟩`, aber ohne Link (`href: null` als `<span>`). Klick springt nicht zur Fußnote, und MediaWikis native Reference Previews (Hovercard-Popup) triggert nicht.
  * **Ursache & Fehler im bisherigen Ansatz:** Der bisherige Code versuchte Zitationsvorlagen manuell per Regex nach Autoren (`author=`, `last=`) und Titeln zu durchsuchen. Bei Zitationsstilen wie Vancouver (`vauthors = Shakespeare J...`) scheiterte dieses manuelle Ref-Parsing komplett.
  * **Completed Implementation (DOM-Identifier-Matching für anonyme Einzelnachweise):**
    - MediaWiki rendert in der Fußnotenliste am Seitenende alle persistenten Kennungen verlässlich als anklickbare Links (`<a href="https://doi.org/10.1183/20734735.0310-2019">...</a>`).
    - Statt Vorlagenfelder zu zerlegen, scannt `findCiteNoteAnchor()` bei anonymen Einzelnachweisen den Rohtext `rawContent` nach **weltweit eindeutigen Identifikatoren**:
      1. **DOI:** `10.\d{4,9}/[^\s|}<>"]+` (z. B. `10.1183/20734735.0310-2019`)
      2. **PMID:** `pmid\s*=\s*(\d+)` (z. B. `31803258`)
      3. **PMC:** `pmc\s*=\s*(?:PMC)?(\d+)` (z. B. `6885340`)
      4. **ISBN:** `isbn\s*=\s*([0-9Xx-]+)` (z. B. `978-0-12-345678-9` $\to$ Match auf `Special:BookSources/...`)
      5. **URL:** `https?://[^\s|}<>"]+`
    - RefDiff führt eine direkte O(1)-DOM-Abfrage aus: `document.querySelector('.references a[href*="' + idVal + '"]')` und nimmt das Eltern-Element `li[id^="cite_note-"]`.
    - Sobald der Badge mit `<a href="#cite_note-31">` gerendert wird, bindet sich MediaWikis native Extension `mw.popups` automatisch an den Link und zeigt die originale Wikipedia-Fußnotenvorschau an.
  * **Verification & Test Coverage:**
    - [x] Unittests in `tests/test_anchor.js` für DOI (`Respiratory therapist`), PMID, PMC und ISBN hinzugefügt.
    - [x] Gesamte Testsuite auf **133/133 Tests grün** erweitert (`npm test`).
    - [x] Linting fehlerfrei (**0 Warnungen, 0 Fehler** via `npm run lint`).
    - [x] Alle 10 Release-Gates in `tests/test_deployment.js` bestanden.

##### Tier 1 Action Items: Early Adopter Pilot (10-User Milestone)
- [ ] **Step R.1: Fail-Open Crash Isolation & Top-Level Boundary (Tier 1 — High)**
  * Wrap `init()` and table mutators in a top-level fail-open `try...catch` block.
  * Guarantee that unhandled runtime exceptions in RefDiff cleanly restore the native diff table and never bubble to `window.onerror` or abort subsequent scripts in `common.js` (e.g. Twinkle, HotCat).
- [ ] **Step R.7: Pilot Cohort Validation & Stability (Tier 1 — Operational)**
  * Track active pilot adoption via `Special:WhatLinksHere/User:Powercycler/Userbox_RefDiff` until reaching $\ge 10$ active patrollers on English Wikipedia.
  * Verify zero P0 runtime exceptions or diff view corruptions across 30 days of real Wikipedia diff reviews per [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) §2.7.
- [ ] **Step R.17: Streamline Rollout Protocol & Version Bump Process (Tier 1 — Normal)**
  * **Focus Area:** Streamline Rollout & Version Bump
  * **Proposed Optimization:** Simplify and streamline the rollout runbook and version bump workflow—focusing on clarity, reduced friction, and painless manual execution without over-engineering complex runners or automation.
  * **TODO:** Streamline the rollout and version bump process (not automate, just streamline):
    1. **Frictionless Runbook Checklist:** Simplify the deployment steps in [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) so the operator has clear, direct, and concise instructions without ambiguous sub-steps or redundant manual calculations.
    2. **Clean Version Bump Cadence:** Refine `scripts/bump_version.js` to handle manifest synchronization cleanly and intuitively for both pre-flight patch uprevs and post-shipment minor bumps without tag drift.
    3. **Straightforward On-Wiki Copy Workflow:** Document exact copy-paste snippets and canonical URLs clearly so publishing to on-wiki targets (Meta script lead, en.WP pointer, docs lead) is fast and error-free without needing extra tooling.
    4. **Clear Verification Sequence:** Streamline the order of manual checks and verification commands (`check_live_deployment.js`) to ensure a smooth, confident release sign-off.
- [ ] **Step R.18: Automated Showcase Test in Rollout Protocol (Tier 1 — Normal)**
  * **Focus Area:** Automated Showcase Test
  * **Proposed Optimization:** Add `en:User:Powercycler/RefDiff/Show_case` (`diff=1380240829`) as target #7 in `check_live_deployment.js` and include a live CDP smoke test verifying all 5 showcase change sections.
  * **TODO:** Integrate formal showcase diff verification into the rollout protocol and deployment auditor:
    1. **Leverage Canonical Test Fixtures:** Reconcile on-wiki showcase diff `en:User:Powercycler/RefDiff/Show_case` (`diff=1380240829&oldid=1380240443`) with its canonical local wikitext sources in [`tests/comprehensive_old.wiki`](tests/comprehensive_old.wiki) and [`tests/comprehensive_new.wiki`](tests/comprehensive_new.wiki).
    2. **Auditor Target Integration (`scripts/check_live_deployment.js`):** Add the en.WP Showcase diff page to `check_live_deployment.js` to automatically verify remote page availability, revision IDs (`1380240829` vs `1380240443`), and diff API health during post-shipment verification.
    3. **Automated Live Smoke Test Gate:** Include a live CDP smoke test verifying that RefDiff boots and decouples citations across all 5 showcase change sections (modified, shortened footnote, pure add, pure del, template variations) as an automated gate in the rollout runbook.
    4. **Documentation Parity:** Verify showcase diff links across `refdiff.wiki`, infoboxes, and English Wikipedia documentation resolve cleanly to the authoritative showcase diff revision.
- [ ] **Step R.19: Test Timeout Hardening & Watchdog Architecture (Tier 1 — High)**
  * **Focus Area:** Test Infrastructure & Automation Resilience
  * **Proposed Optimization:** Standardize the 4-tier timeout architecture proven in `scratch/test_user_exact_8_steps.py` across all integration and pre-flight suites (`tests/test_live_benchmarks.py`, `tests/test_live_cdp.py`).
  * **TODO:** Eliminate unbounded async calls to prevent infinite test execution or hung CI processes:
    1. **CDP Transport Layer Timeout:** Wrap all raw `ws.recv()` calls (e.g. in `tests/test_live_benchmarks.py` line 87) with `asyncio.wait_for(..., timeout=5.0)` to fail fast if WebSocket frames stall or drops occur.
    2. **Condition Polling Watchdog:** Replace bare polling loops with bounded condition waiters (`wait_cond()`, default 5.0s ceiling) that automatically capture and dump URL, readyState, and DOM error state upon expiration.
    3. **Per-Test / Per-Benchmark Deadlines:** Enforce a strict maximum deadline (e.g. 10.0s per benchmark diff, 15.0s per integration scenario) so single slow revisions cannot block test runs.
    4. **Global Suite Timeout:** Wrap master entry points (`npm run test:live`, `npm run test:bench`, `npm run preflight`) in a hard outer timeout (e.g. 60.0s) guaranteeing deterministic process termination.
- [x] **Step R.22: Unbalanced wikidiff2 Paragraph Merge Entanglement (`Leonardo Torres Quevedo diff=1380356173`) (P0 — Immediate Pre-Pilot — Finished ✅)**
  * **Focus Area:** Diff Pre-Normalization & Tag Entanglement Prevention
  * **Target Revision:** [Leonardo Torres Quevedo (diff=1380356173)](https://en.wikipedia.org/w/index.php?title=Leonardo_Torres_Quevedo&diff=prev&oldid=1380356173)
  * **Reported Defect:** "Incomplete ref handling" — the diff rendering left raw wikitext citation tags in prose and failed to decouple citations after an editor merged two consecutive paragraphs ending in `.&lt;/ref&gt;`.
  * **Diagnosis & Root Cause:**
    - An editor deleted the blank newline separator (`\n\n`) between two paragraphs, merging them into one block. Both paragraphs originally ended with `.&lt;/ref&gt;` citations.
    - MediaWiki's `wikidiff2` C++ diff engine computed word/token-level diffs across the merged line. Instead of seeing the newline deletion as a paragraph boundary shift, it matched the trailing suffix `.&lt;/ref&gt;` of the second paragraph with the first paragraph's trailing suffix.
    - Consequently, `wikidiff2` placed `.&lt;/ref&gt;` at the beginning of the inline `<ins class="diffchange diffchange-inline">` span and left `.&lt;/ref&gt;` outside `</ins>` at the end:
      `...No. 90, 2020<ins class="diffchange diffchange-inline">.&lt;/ref&gt; In 1919... &lt;ref&gt;...&lt;/ref&gt; ... October 2008</ins>.&lt;/ref&gt;`
    - RefDiff's tag balancing validator `hasBalancedDiffTags` correctly detected that `<ref>` and `</ref>` tags were split across `<ins>` boundaries and rejected parsing both the preceding and trailing citations to avoid DOM corruption. This left raw wikitext visible in prose and broke citation row decoupling.
  * **Completed Remediation:**
    1. **Rule 7b in `normalizeDiffTags`:** Added targeted boundary-shift normalization in `src/utils.js`:
       ```javascript
       res = res.replace(/<(ins|del)([^>]*)>([.,;:\s]*&lt;\/ref&gt;)((?:(?!<\/\1>)[\s\S])*?)<\/\1>([.,;:\s]*&lt;\/ref&gt;)/gi, function(match, tag, attrs, startToken, body, endToken) {
         return startToken + '<' + tag + attrs + '>' + body + endToken + '</' + tag + '>';
       });
       ```
       This safely realigns the boundary-shifted closing tag token without modifying inner prose text or corrupting Memento snapshot fidelity.
    2. **Automated Unit & Real DOM Test Coverage:**
       - Added unit test in `tests/test_utils.js` verifying the normalization of boundary-shifted `&lt;/ref&gt;` tokens across diffchange spans.
       - Added full DOM test in `tests/test_jsdom.js` verifying real DOM decoupling of the Leonardo Torres Quevedo diff (10 citations decoupled into citation rows, badges created, byte-for-byte Memento roundtrip).
    3. **Canonical Live CDP Benchmark Suite:**
       - Added Leonardo Torres Quevedo (`1380356173`) as Benchmark #6 in `tests/test_live_benchmarks.py`.
       - Verified live in Chromium CDP (10 citation rows decoupled, 26 badges rendered, zero raw wikitext, 100% Memento roundtrip).
    4. **Full Test & Release Gate Pass:**
       - 140/140 unit and DOM tests passing (`npm test`).
       - 0 ESLint errors and 0 warnings (`npm run lint`).
       - 10/10 deployment pre-flight checks passing (`node tests/test_deployment.js`).
       - 6/6 live CDP benchmarks passing (`npm run test:bench`).
       - 8/8 live CDP integration steps passing (`npm run test:live`).
- [ ] **Step R.24: Complementary Citation Tools & Ecosystem Review (Tier 1 — Normal — ⏳ Next Step)**
  * **Focus Area:** Ecosystem Integration & Companion Tools Short List
  * **Tools Short List:**
    - **wikEdDiff** ([`en:User:Cacycle/wikEdDiff`](https://en.wikipedia.org/wiki/User:Cacycle/wikEdDiff)): Inline diff engine with moved-block detection.
    - **diffedit** ([`m:User:Jon Harald Søby/diffedit.js`](https://meta.wikimedia.org/wiki/User:Jon_Harald_S%C3%B8by/diffedit.js)): In-diff section editing on `Special:Diff`.
    - **References segregator** ([`en:User:PleaseStand/References segregator`](https://en.wikipedia.org/wiki/User:PleaseStand/References_segregator)): Edit window citation pane splitter.
    - **RefCruncher** ([`en:User:Guywan/Scripts/RefCruncher`](https://en.wikipedia.org/wiki/User:Guywan/Scripts/RefCruncher)): In-editor ref chip collapsing.
    - **ProveIt** ([`en:Wikipedia:ProveIt`](https://en.wikipedia.org/wiki/Wikipedia:ProveIt)): Graphical citation editing dock.
    - **HarvErrors** ([`en:User:Trappist the monk/HarvErrors`](https://en.wikipedia.org/wiki/User:Trappist_the_monk/HarvErrors)): Shortened footnote and Harvard citation error auditing.
    - **AI Source Verification** ([`en:User:Alaexis/AI Source Verification.js`](https://en.wikipedia.org/wiki/User:Alaexis/AI_Source_Verification.js)): In-browser LLM evaluation of citations against claims.
    - **CNfirmed** ([`en:User:Alaexis/CNfirmed.js`](https://en.wikipedia.org/wiki/User:Alaexis/CNfirmed.js)): Citation discovery for `{{citation needed}}` tags.
  * **TODO:** Verify companion tool compatibility (`diffedit.js`, `wikEdDiff`), test synergies, and curate into an on-wiki guide once documentation stabilizes.
- [ ] **Step R.25: Clean Architecture for Citation Page Suffixes (`{{rp}}`) & Nested Template Tokenization (Tier 1 — Normal — ⏳ TODO)**
  * **Focus Area:** Citation Suffix Tokenization & Deterministic Brace Scanning
  * **Origin & Background:** [Zipf's law (`diff=1379548357`)](https://en.wikipedia.org/w/index.php?title=Zipf%27s_law&diff=prev&oldid=1379548357). Unwrapping an explanatory footnote (`{{efn}}`) caused page suffixes (`{{rp|546}}`) to be misidentified as standalone references (producing phantom `⟨~546~⟩` badges) and merged adjacent braces into `}}}`.
  * **Current Heuristic:** Handled by excluding `rp` from `TEMPLATE_REF_REGEX` and adding regex lookarounds `(?<!\{)` and `(?!\})` in `normalizeDiffTags`. While verified green by existing regression tests, the heuristic could be cleaner and more architectural.
  * **Refactoring Goals (Could Be Cleaner):**
    1. **Formal Suffix Attachment:** Formally model `{{rp|...}}` as a citation page-suffix token bound to its preceding citation unit (`<ref>` or `{{sfn}}`) rather than treating it as ambient prose text or relying on regex exclusion.
    2. **Deterministic Brace Scanner:** Replace brittle regex lookarounds and multi-brace matching with a clean, stack-based brace/template tokenizer. This eliminates edge cases with nested footnote templates (`{{efn}}`, `{{refn}}`, `{{sfnp}}`) and prevents synthetic brace-merge corruption (`}}}`).
    3. **Pipeline Layer Decoupling:** Establish a distinct tokenization stage in `src/parser.js` that outputs an AST-like representation of `(prose_segment | ref_unit[anchor, suffix] | template_unit)` before passing to `pipeline.js`.

##### Tier 2 Action Items: Community Reviewer Scale & Hardening (50-User Milestone)
- [ ] **Step R.2: Dynamic AJAX / SPA Lifecycle Re-entrancy & Memory Isolation (Tier 2 — High)**
  * Add a JSDOM test simulating sequential `wikipage.diff` Ajax re-entrancy (e.g. 10 consecutive diff loads with table swaps).
  * Ensure RefDiff correctly re-initializes on swapped diff tables without leaking Memento snapshots or duplicating DOM controls.
- [ ] **Step R.3: Core Patrol Tool Non-Interference Contract (Tier 2 — High)**
  * **TODO:** Check Twinkle and Ultraviolet compatibility in live reviews and automated test contracts.
  * Add automated assertions verifying that RefDiff mutations are strictly confined to `tbody > tr.diff-deletedline`, `tr.diff-addedline`, and `tr.refdiff-cit-row`.
  * Guarantee that header nodes (`tr.diff-title`, `.diff-otitle`, `.diff-ntitle`, `.diff-notice`, `.diff-multi`) and third-party buttons (Twinkle rollback/vandalism links, Ultraviolet CVPI overlay interface) remain 100% byte-for-byte untouched.
- [ ] **Step R.4: Client-Side Observability & Diagnostic Troubleshooting Mode (Tier 2 — Normal)**
  * Implement opt-in diagnostic logging enabled via URL parameter `?refdiff_debug=1` or `window.refdiffConfig = { debug: true }`.
  * Provide structured diagnostic output (`mw.log.warn` / `console.debug`) detailing revision ID, parsed reference count, paired slots, and execution timings without polluting standard production console.
- [ ] **Step R.10: Regex Reevaluation & Parser Architecture (Tier 2 — High)**
  * **TODO:** Reevaluate regexes across `refdiff.js` (`REF_REGEX` and `TEMPLATE_REF_REGEX`).
  * Audit lookahead bounds, nesting limits on footnote/citation templates, catastrophic backtracking resilience, and evaluate dedicated token-scanner or parser-generator alternatives.
- [x] **Step R.11: Default Mode Isolation & Wikitext-First Mode Switching (Tier 2 — High)**
  * **Bug:** When opening diffs in new tabs or reloading, Visual Diff unexpectedly became the default instead of RefDiff or Wikitext diff; clicking Visual Diff failed to persist `refdiff-active: false`, and capture-phase listeners interfered with VisualEditor's Parsoid diff loading.
  * **Fix:**
    1. **Wikitext-Only Scope:** `init()` checks `isVisual = isVisualDiffActive()` first; RefDiff strictly activates only when wikitext is active (`!isVisual && shouldDecouple`). If Visual Diff is active, RefDiff remains completely dormant with zero DOM mutations.
    2. **Inert/Disabled in Visual Mode:** While Visual Diff mode is active, the RefDiff button is visually dimmed and made inert (`oo-ui-widget-disabled`, `aria-disabled="true"`, `tabindex="-1"`). Direct clicks on the disabled RefDiff button are halted with `stopPropagation()` and ignored.
    3. **Wikitext-First Mode Transition:** Reviewers wishing to inspect decoupled citations from Visual mode switch to native Wikitext diff first, which un-dims the RefDiff button and restores interactive decoupling.
    4. **Deterministic Persistence:** Explicitly selecting `[ 👁 Visual ]` or `[ [[]] Wikitext ]` persists `setRefDiffPreferred(false)`; selecting `[ ⧉ RefDiff ]` persists `setRefDiffPreferred(true)`.
    5. **Clean Event Delegation:** Native VisualEditor controls bubble unhindered in standard propagation; RefDiff isolates event interception strictly to `#refdiff-ooui-btn` in the capture phase.
    6. **Diff Mode Persistence Scope:** MediaWiki VisualEditor's diff mode persistence (`visualeditor-diffmode-historical`) is cleanly synchronized via `new mw.Api().saveOption()` and in-memory options without raw keepalive fetch overhead. Verified in live authenticated session (`Powercycler`) across 8 real navigation steps in Chromium.
- [ ] **Step R.12: Live On-Wiki Visual Inspection Environment (Tier 2 — High)**
  * **TODO:** Retire local visual test server (`http://127.0.0.1:8000/refdiff.js`) in favor of live on-wiki visual inspection.
  * Eliminate local HTTP server dependencies to avoid browser mixed-content restrictions on HTTPS Wikipedia diffs.
  * Establish a seamless live on-wiki testbed workflow (e.g. testing directly via `en:User:Powercycler/common.js` sandbox or authenticated user script test harness) so all visual reviews occur against authentic Wikipedia production CSS, gadgets, and ResourceLoader environments.
- [x] **Step R.13: Comprehensive Visual Inspection Across All Change Cases (Tier 2 — High)**
  * Executed, captured, and codified systematic visual inspection across all four primary citation change cases and edge configurations (verified and signed off by user):
    1. **Pure Addition (`isAdd`):**
       - Newly introduced citation definitions appear in the right column (`diff-addedline`) with empty cells on the left (`diff-empty`, `colspan=2`).
       - Citation text body must be clean and unadorned (NO intra-line `<ins class="diffchange">` wrapping around citation text).
       - Badge displays with addition indicator (`⟨+name+⟩` / green styling).
       - Validated on [Bihar diff 1379207737](https://en.wikipedia.org/w/index.php?diff=1379207737&oldid=1379207045) and Section 3 of [Showcase diff 31142550](https://meta.wikimedia.org/w/index.php?title=User:Powercycler/RefDiff/Show_case&diff=31142550&oldid=31142549).
    2. **Pure Deletion (`isDel`):**
       - Removed citation definitions appear in the left column (`diff-deletedline`) with empty cells on the right (`diff-empty`, `colspan=2`).
       - Citation text body must be clean and unadorned (NO intra-line `<del class="diffchange">` wrapping around citation text).
       - Badge displays with deletion indicator (`⟨-name-⟩` / red styling).
       - Validated on deleted citation rows across showcase diffs.
    3. **Intra-Line Modification (`isMod`):**
       - Modified citations appear in both left (`diff-deletedline`) and right (`diff-addedline`) columns with modification badges (`⟨~name~⟩` / amber styling).
       - Native MediaWiki intra-line diff highlighting (`<del class="diffchange">` / `<ins class="diffchange">`) must be strictly preserved on specific changed tokens (e.g. `pages=50–55` $\to$ `pages=80–88`), leaving unchanged tokens unhighlighted.
       - Validated on [Odoacer diff 1379543160](https://en.wikipedia.org/w/index.php?diff=1379543160&oldid=1379308643) and Section 1 of [Showcase diff 31142550](https://meta.wikimedia.org/w/index.php?title=User:Powercycler/RefDiff/Show_case&diff=31142550&oldid=31142549).
    4. **Unchanged / Normalized Citations (`norm`):**
       - Re-ordered or moved reference callouts without content changes must retain normal badge styling without false modification flags.
    5. **Multi-Ref & Composite Rows:**
       - Rows with multiple adjacent references having mixed change types (e.g., one added, one modified, one deleted) render distinct badge callouts in prose and corresponding split/paired citation rows.
    6. **Footnote & Citation Templates:**
       - Full coverage for `{{sfn}}`, `{{harv}}`, `{{efn}}`, and `<references>` block definitions.
    7. **Theme & Skin Invariance:**
       - High-contrast visual clarity across Vector 2022 Light and Dark modes.

##### Tier 3 Action Items: Beyond 50-User Goal (Mass Scale, Default Gadget & Multi-Platform)
- [ ] **Step R.5: Accessibility (WCAG 2.1 AA) & Keyboard Navigation (Tier 3 — Beyond 50 Users)**
  * Add semantic `aria-label` attributes to inline badges (e.g. `aria-label="Citation 1"`, `aria-label="Modified citation: name"`).
  * Ensure keyboard focusability (`tabindex="0"`) and <kbd>Enter</kbd>/<kbd>Space</kbd> keydown navigation from prose badge to citation diff row.
  * Verify color contrast ratios for amber (`#9a6700`) and green (`#14866d`) badges satisfy WCAG 2.1 AA (4.5:1) in Vector 2022 Light and Dark themes.
  * *Rationale for Beyond 50 Users:* Formal WCAG 2.1 AA compliance certification is essential for site-wide default enablement across the general readership and editing community; opt-in reviewers in Tier 2 use existing semantic contrast without blocking gadget candidacy.
- [ ] **Step R.6: Legacy Skin (Vector 2010 / Monobook) & Mobile Self-Disablement (Tier 3 — Beyond 50 Users)**
  * Add automated JSDOM test for legacy skins lacking OOUI button containers, verifying fallback mode bar (`#refdiff-mode-bar`) mounting.
  * Add graceful self-disablement invariant for single-column mobile viewports (`MinervaNeue`).
  * *Rationale for Beyond 50 Users:* Reviewers evaluating NPP/RC diffs operate almost universally on modern desktop (Vector 2022). Legacy skins (Monobook) and mobile web (`MinervaNeue`) are required for universal site default coverage, not 50-user reviewer adoption.
- [ ] **Step R.9: Default-Enabled Gadget RFC & Site-Wide Governance (Tier 3 — Beyond 50 Users)**
  * Prepare and submit a community RFC on `Wikipedia:Village pump (technical)` to propose RefDiff as a default-enabled gadget (`[default]`) on English Wikipedia.
  * Coordinate with MediaWiki interface administrators for inclusion in `MediaWiki:Gadgets-definition`.

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
| **U.7** | Phase 4: Lua / Scribunto Prototype | P2 | 🔲 Planned | `{{#invoke:RefDef&#124;...}}` on-wiki template prototype |
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
| **Multi-Page Citations** | Native `details="..."` and template `{{rp}}` | Fully supports MediaWiki's native Sub-referencing (`details="p. 45"`) as well as in-prose page suffixes (`{{rp&#124;45}}`). |
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
| [Dwight D. Eisenhower](https://en.wikipedia.org/w/index.php?title=Dwight_D._Eisenhower&diff=prev&oldid=1380014667) | `1380014667` | Inter-Template Diff Token Alignment (`{{citation needed}}`) | ✅ Verified | Bounded `normalizeCnDiffPair` strictly scoped to CN templates (Step R.21) | [Dwight D. Eisenhower](#dwight-d-eisenhower-diff1380014667) |
| [Leonardo Torres Quevedo](https://en.wikipedia.org/w/index.php?title=Leonardo_Torres_Quevedo&diff=prev&oldid=1380356173) | `1380356173` | wikidiff2 Paragraph Merge Tag Entanglement (`<ins>.</ref>...</ins>.</ref>`) | ⏳ Triaged / TODO (Step R.22) | Boundary normalization for paragraph-merge diff changes | [Leonardo Torres Quevedo](#leonardo-torres-quevedo-diff1380356173) |
| [Respiratory therapist](https://en.wikipedia.org/w/index.php?title=Respiratory+therapist&diff=1380407169&oldid=1372216818) | `1380407169` | DOM-Identifier-Matching für native Reference Previews (`ref7`) | ✅ Verified (Step R.23) | Deterministisches Identifier-Matching (DOI/PMID/PMC/ISBN/URL) ohne eigenes Ref-Parsing | [Respiratory Therapist](#respiratory-therapist-diff1380407169) |

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
* **Architectural Follow-Up (Step R.25 — Could Be Cleaner):** While the current remediation passes all unit and DOM tests, excluding `rp` from the ref regex and relying on lookarounds `(?<!\{)` is a heuristic patch. Tracked in Step R.25 to replace this with a formal tokenizer: bind citation page suffixes (`{{rp}}`) directly to their parent citation token and parse nested footnote templates with a deterministic stack-based brace scanner.

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

#### Dwight D. Eisenhower (`diff=1380014667`)
* **Article & Revision:** [Dwight D. Eisenhower (diff=1380014667)](https://en.wikipedia.org/w/index.php?title=Dwight_D._Eisenhower&diff=prev&oldid=1380014667)
* **Date Evaluated:** 2026-10-14
* **Status:** ✅ Fully Decoupled & Verified (Step R.21)
* **Focus Area:** Inter-template token alignment (`{{`, `|date=`, `}}`) specifically when replacing `{{citation needed|...}}` or `{{cn|...}}` with `<ref>{{cite ...}}</ref>` citations.
* **Diagnosis:** An editor (`Alaexis` via `CNfirmed`) sourced an unverified statement by replacing `{{citation needed|date=August 2025}}` with two book citations. MediaWiki's LCS diff engine aligned identical wikitext tokens across distinct template types, wrapping only `&lt;ref&gt;` and `&lt;/ref&gt;` in `<ins class="diffchange">` spans while leaving template delimiters unhighlighted. This created unbalanced diffchange spans inside the `<ref>` tag boundaries, causing `hasBalancedDiffTags` to reject the citations and leaving them undecoupled in prose.
* **Resolution & Verification:** Implemented `hasDeletedCn` and `normalizeCnDiffPair` strictly scoped to `{{citation needed|...}}` and `{{cn|...}}` (bare and parameterized). Aligns the deleted template into a single cohesive `<del class="diffchange diffchange-inline">` span and wraps the added `<ref>` citation block into a cohesive `<ins class="diffchange diffchange-inline">` unit guarded by `isPureRefSequence()`. Verified across unit tests (`test_utils.js`, `test_parser.js`), pipeline tests (`test_pipeline.js`), real DOM JSDOM tests (`test_jsdom.js`), and live in Chromium via CDP against `diff=1380014667` with 2 citation rows cleanly decoupled and byte-for-byte Memento restoration.

---

#### Leonardo Torres Quevedo (`diff=1380356173`)
* **Article & Revision:** [Leonardo Torres Quevedo (diff=1380356173)](https://en.wikipedia.org/w/index.php?title=Leonardo_Torres_Quevedo&diff=prev&oldid=1380356173)
* **Date Evaluated:** 2026-10-15
* **Status:** ⏳ Triaged / TODO (Step R.22)
* **Focus Area:** `wikidiff2` paragraph-merge tag boundary entanglement (`<ins>.</ref>...</ins>.</ref>`).
* **Diagnosis:**
  - An editor deleted the blank newline (`\n\n`) between two consecutive paragraphs, merging them into a single prose block. Both paragraphs originally concluded with `<ref>...</ref>` citations.
  - MediaWiki's `wikidiff2` C++ engine computed word-level diffs across the merged line. Instead of seeing the newline deletion as a paragraph boundary shift, it matched the trailing `</ref>` from paragraph 2 with the trailing `</ref>` from paragraph 1.
  - Consequently, `wikidiff2` wrapped the entire second paragraph (including multiple intermediate `<ref>` definitions) inside a single inline `<ins class="diffchange diffchange-inline">` span placed *between* the body of the first reference and its closing `</ref>`:
    `...No. 90, 2020<ins class="diffchange diffchange-inline">.</ref> In 1919... <ref>...</ref> ... 2008</ins>.</ref>`
  - RefDiff's parser sees unbalanced diffchange boundaries crossing `<ref>` and `</ref>` tag markers. The `hasBalancedDiffTags` check detects the split `<ins>` / `</ins>` and rejects parsing, which prevents decoupling and leaves the raw entangled tags visible in prose.
* **Remediation Plan (Step R.22):**
  1. Add boundary pre-normalization in `normalizeDiffTags()` to recognize when `wikidiff2` inserts an inline `<ins>` or `<del>` starting with punctuation and `</ref>` (`<ins class="diffchange diffchange-inline">.</ref>`) followed by unclosed references before a dangling outer `</ref>`.
  2. Shift the closing `</ref>` outside the diff span so that the first citation terminates cleanly, allowing the second paragraph's prose and references to parse as clean additions.
  3. Validate with unit tests in `tests/test_utils.js`, `tests/test_parser.js`, and real DOM JSDOM fixtures.

---

#### Respiratory therapist (`diff=1380407169`)
* **Article & Revision:** [Respiratory therapist (diff=1380407169&oldid=1372216818)](https://en.wikipedia.org/w/index.php?title=Respiratory+therapist&diff=1380407169&oldid=1372216818)
* **Date Evaluated:** 2026-10-15
* **Status:** ✅ Verified / Resolved (Step R.23)
* **Focus Area:** DOM-Identifier-Matching für native Reference Previews bei anonymen (unbenannten) Einzelnachweisen (`ref7`).
* **Diagnosis:**
  - An editor added a journal citation: `<ref>{{cite journal | vauthors = Shakespeare J, Parkes E, Bryce M, Hull JH | title = Advanced roles in respiratory healthcare science: it's not just spirometry | journal = Breathe | doi = 10.1183/20734735.0118-2023 | pmid = 38487190 | ... }}</ref>`.
  - RefDiff created the badge `⟨ref7⟩`, but its `href` resolved to `null` (rendering as a plain `<span>` rather than an anchor link `<a href="#cite_note-31">`). Clicking the badge failed to jump to the footnote, and MediaWikis native Reference Previews (Hovercard-Popup) failed to trigger.
  - **Kernproblem:** Es handelt sich um einen **anonymen (unbenannten) Einzelnachweis** (ohne `name="..."`). MediaWiki nummeriert diese im Gesamtartikel stur durch (`cite_note-1`, `cite_note-2` ... `cite_note-31`). Im Teildiff sieht RefDiff nur die geänderte Zeile und hat keine globale Zählposition. Der bisherige Versuch, Vorlagenfelder (`author=`, `title=`) manuell zu parsen, scheiterte an Vancouver-Syntax (`vauthors`) und Sonderzeichen.
* **Resolution & Verification (Step R.23 — Kein eigenes Ref-Parsing):**
  1. **Persistente Identifikatoren im DOM:** Statt Vorlagen zu parsen, scannt `findCiteNoteAnchor()` bei anonymen Refs nach DOI (`10.\d{4,9}/...`), PMID (`pmid=\d+`), PMC (`pmc=\d+`), ISBN (`isbn=...` $\to$ `Special:BookSources`) oder URL und fragt direkt im DOM `document.querySelector('.references a[href*="..."]')` ab.
  2. **Native Reference Previews:** Durch das Setzen von `<a href="#cite_note-31">` dockt MediaWikis native Extension `mw.popups` automatisch an und blendet die fertige Vorschau ein.
  3. **Automated Test Coverage:** Verifiziert mit Unittests in `tests/test_anchor.js` (u. a. für DOI `10.1183/20734735.0310-2019` $\to$ `#cite_note-31`, PMID, PMC, ISBN). 133/133 Tests grün, 0 ESLint-Warnungen.

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

---

### 2026-10-14: Automated Live On-Wiki Deployment Auditor (`npm run check:deploy`)

* **Context & Motivation:**
  * To verify whether RefDiff release code is actually deployed on-wiki in real-time, implemented an automated live on-wiki deployment auditor script (`scripts/check_live_deployment.js`) wired to `npm run check:deploy`.
* **Automated Audit Functionality:**
  * Directly queries Wikimedia REST/Action APIs on both English Wikipedia (`enwiki`) and Meta-Wiki (`metawiki`).
  * Checks page existence, revision ID, timestamp, byte size, and calculates remote SHA-1 hash to compare byte-for-byte against local release files (`refdiff.js`, `refdiff.wiki`, `userbox_enwiki.wiki`).
  * Validates whether `m:User:Powercycler/refdiff.js` is correctly configured as the 1-line dummy loader forwarding to en.WP.
* **Initial Audit Findings & Live Status:**
  * English Wikipedia (`en.wikipedia.org`): Canonical targets (`User:Powercycler/refdiff.js`, `refdiff-v1.3.0.js`, `RefDiff`, `Template:User RefDiff`) are currently missing (pending initial publish).
  * Meta-Wiki (`meta.wikimedia.org`): Holds an older standalone build from 2026-10-11 (Rev 31149599, 78.4 KB); flagged for migration to the 1-line dummy loader stub.
* **Artifacts Synchronized:**
  * Created [`scripts/check_live_deployment.js`](scripts/check_live_deployment.js) with strict ESLint compliance.
  * Added `npm run check:deploy` script to [`package.json`](package.json).
  * Updated [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) (§5 Runbook Checklist) to require `npm run check:deploy`.

---

### 2026-10-14: Formalized "Git Diff as Quick Review" Protocol in AUDIT_STRATEGY.md

* **Context & Motivation:**
  * Formalized the practice of performing a structured `git diff` review before every commit and release into the engineering audit playbook.
  * Ensures that automated test passes are supplemented by a fast human/maintainer review to guarantee zero debris, complete refactorings, concise hunks, and metric synchronization.
* **Key Provisions & Invariants (`AUDIT_STRATEGY.md` §2.8):**
  * *1. Zero Debris & Scratch Residue:* Diff hunks must contain zero lingering `console.log`, temporary flags, or scratch files.
  * *2. Completeness of Cleanups:* Deprecated paths or files (e.g. `archive/`) must have all references simultaneously removed.
  * *3. Metric & Spec Synchronization:* Test counts (115) and pre-flight gates (10) must update across all docs in lockstep.
  * *4. Hunk Conciseness:* Every changed line must serve a dedicated purpose, avoiding formatting noise or accidental touches.
* **Artifacts Synchronized:**
  * Updated [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) (§1 Executive Summary, §2.8 Protocol, §5 Quality Gates).

---

### 2026-10-14: Delineated 100-User Opt-In Gadget Scale from Beyond-100-User Mass Scale

* **Context & Architectural Refinement:**
  * Reviewed post-v1.3.0 scaling roadmap and clarified that several previously grouped requirements belong **beyond the 100-user goal**.
  * A 100-user opt-in gadget for English Wikipedia patrollers (NPP/RC) requires stability, SPA diff queue re-entrancy (R.2), patrol tool non-interference (R.3), and diagnostic observability (R.4).
  * In contrast, formal WCAG 2.1 AA accessibility audits (R.5), multi-skin fallback (Vector 2010/Monobook) and mobile guard (R.6), default-on gadget status (`[default]` in `MediaWiki:Gadgets-definition`), and upstream MediaWiki parser integration are prerequisites for mass scale / site-wide defaults (> 1,000 users).
* **Key Provisions:**
  * Established a 3-tier scaling progression model across [`LOG.md`](LOG.md) (§2.1) and [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) (§2.7):
    * **Tier 1:** Early Adopter Pilot (10-User Milestone on en.WP; R.1, R.7).
    * **Tier 2:** 100-User Opt-In Gadget Scale (Community gadget candidacy for NPP/RC; R.2, R.3, R.4).
    * **Tier 3:** Beyond 100-User Goal (Mass scale, default gadget & multi-platform; R.5, R.6, R.9, U.1–U.8).

---

### 2026-10-14: Adopted "No Versions in Filenames" Policy for On-Wiki Script Pages

* **Context & Architectural Refinement:**
  * Enforced a strict policy prohibiting version numbers in on-wiki script page titles (eliminating `refdiff-v1.3.0.js` in favor of unversioned `refdiff-canary.js`).
  * In MediaWiki, immutability is natively achieved via revision IDs (`&oldid=...`). Creating distinct page titles per release clutters user space with abandoned pages, breaks permanent loader URLs, and confuses editors about canonical targets.
* **Key Provisions & Invariants:**
  * *Canonical Lead:* `en:User:Powercycler/refdiff.js`.
  * *Staging Canary Channel:* `en:User:Powercycler/refdiff-canary.js` (unversioned permanent staging target for Ring 1 smoke tests).
  * *Immutable Version Pinning:* Documented via MediaWiki's native `&oldid=123456789` parameter in [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) §2.4.
* **Artifacts Synchronized:**
  * Updated [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) (§1 Artifacts Table, §3 Ring 1, §5 Runbook Checklist).
  * Updated [`scripts/check_live_deployment.js`](scripts/check_live_deployment.js) to monitor `refdiff-canary.js`.
  * Updated [`tests/test_deployment.js`](tests/test_deployment.js) with automated regex assertion prohibiting versioned filenames.

---

### 2026-10-14: Refined Community Reviewer Scale to 50-User Milestone

* **Context & Architectural Refinement:**
  * Refined the post-pilot community scaling milestone from an aggressive 100-user target down to a humble, realistic **50-user reviewer milestone** (`Tier 2: Community Reviewer Scale (50-User Milestone)`), with mass deployment goals scoped to `Tier 3: Beyond 50 Users`.
  * For specialized patrol tools like RefDiff on English Wikipedia, 50 active patrollers/reviewers sustained over 60 days represents substantial critical mass before proposing built-in gadget status under `MediaWiki:Gadgets-definition`.
* **Key Provisions:**
  * Updated the 3-tier scaling progression model across [`LOG.md`](LOG.md) (§2.1), [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) (§2.7), and [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) (Ring 3):
    * **Tier 1:** Early Adopter Pilot (10-User Milestone; R.1, R.7).
    * **Tier 2:** Community Reviewer Scale (50-User Milestone; R.2, R.3, R.4).
    * **Tier 3:** Beyond 50 Users (Mass scale, default gadget & multi-platform; R.5, R.6, R.9, U.1–U.8).
* **Artifacts Synchronized:**
  * Updated [`LOG.md`](LOG.md) (§2.1 Scaling Overview table, Dashboard, Tier 2/3 Action Items).
  * Updated [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) (§2.7 Adoption & Scaling Policy).
  * Updated [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) (Ring 3 Gadget Candidacy anchor & text).

---

### 2026-10-14: Enforced Incremental Uprev Cadence & Mandatory Uprev Diff Audit Trigger

* **Context & Architectural Refinement:**
  * Adopted policy requiring smaller, single-focus changes between version uprevs (no monolithic diffs) to prevent reviewer fatigue and ensure rapid, error-free diff verification.
  * Formally established that every version uprev (`package.json`, `refdiff.js`, UserScript header) strictly triggers a mandatory diff audit (`git diff --stat && git diff`) per [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) §2.8 before any ring progression.
* **Key Provisions & Invariants:**
  * *Small Change Batches:* Increments between version bumps must maintain a small, auditable footprint.
  * *Uprev Triggers Audit:* Every version bump automatically invokes the 4-point diff audit invariant checklist (zero debris, complete cleanups, synchronized metrics, concise hunks).
* **Artifacts Synchronized:**
  * Updated [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) (§2 Pre-Flight Gates, §3 Ring 0, §5 Runbook Checklist).
  * Updated [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) (§2.8 Uprev Cadence & Mandatory Diff Audit Trigger, §5 Quality Gates).
  * Updated [`tests/test_deployment.js`](tests/test_deployment.js) with automated assertion verifying uprev policy enforcement.

---

### 2026-10-14: Eliminated Staging Canary Channel in Favor of Direct Production Uprev

* **Context & Architectural Rationale:**
  * Re-evaluated rollout channel complexity following the principle: *"We don't need canary. We just don't uprev in en.WP/refdiff.js during deployment stages until ready."*
  * A separate on-wiki canary page (`refdiff-canary.js`) introduces unnecessary maintenance overhead, extra endpoint verification, and potential editor confusion over canonical script locations.
  * Because all pre-flight quality gates (unit tests, authentic DOM JSDOM fixtures, sub-50ms benchmarks, and live browser CDP automation on port 9222) run deterministically in Ring 0, local verification already provides full pre-release safety. We simply do not uprev `en:User:Powercycler/refdiff.js` during deployment stages until all gates and the diff audit pass.
* **Key Provisions & Invariants:**
  * *Single Script Target:* `en:User:Powercycler/refdiff.js` is the sole, canonical script destination on English Wikipedia.
  * *Frozen Production During Deployment Stages:* `en:User:Powercycler/refdiff.js` is frozen during deployment stages and only uprevved at the final release stage.
  * *Streamlined Rollout Rings:*
    * **Ring 0:** Local Verification & Pre-Flight Gates (unit, DOM, benchmarks, CDP suite).
    * **Ring 1:** Production Publishing on English Wikipedia (lead script, docs, userbox, Meta forwarder).
    * **Ring 2:** Live Smoke Verification on 5 benchmark diffs.
    * **Ring 3:** Community Outreach & Gadget Candidacy.
* **Artifacts Synchronized:**
  * Updated [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) (§1 Artifacts Table, §3 Rings 1–2, §5 Runbook).
  * Updated [`scripts/check_live_deployment.js`](scripts/check_live_deployment.js) (removed canary endpoints).
  * Updated [`tests/test_deployment.js`](tests/test_deployment.js) (asserted absence of canary channel and presence of no-canary policy).
  * Updated [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) (§2.7) and [`LOG.md`](LOG.md) (§2.1 Dashboard & Action Items).

---

### 2026-10-14: Tracked TODO for Twinkle and Ultraviolet Compatibility Verification

* **Context & Architectural Scope:**
  * Added formal tracking item and TODOs across testing, deployment, and audit frameworks to verify RefDiff compatibility and non-interference with the two prominent Wikipedia patrol tools: **WP:Twinkle** (51k+ installs, core diff header rollback/vandalism links) and **WP:Ultraviolet** (~750 installs, CVPI dynamic overlay interface).
* **Key Provisions & Invariants:**
  * *Twinkle Non-Interference:* Diff headers (`tr.diff-title`, `.diff-otitle`, `.diff-ntitle`, `.diff-notice`) and rollback/warning action nodes must remain 100% byte-for-byte untouched.
  * *Ultraviolet Interoperability:* RefDiff DOM transformations and Memento snapshots must not disrupt or collide with Ultraviolet's reactive floating toolbar (`cvpi`).
* **Artifacts Synchronized:**
  * Updated [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) (§5 Runbook Checklist item for live compatibility check).
  * Updated [`LOG.md`](LOG.md) (§2.1 Dashboard & Action Item R.3).
  * Updated [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) (§2.7 Tier 2 Ecosystem Non-Interference).
  * Updated [`TEST_PLAN.md`](TEST_PLAN.md) (§5 Future Test Expansion Roadmap).
  * Updated [`tests/test_deployment.js`](tests/test_deployment.js) (added automated assertion for compatibility check tracking).
  * Updated [`tests/test_jsdom.js`](tests/test_jsdom.js) (added TODO comment for contract tests).

---

### 2026-10-14: Architecture Alignment — Meta Script Lead, en.WP SHA Pointer & Early Testing Harness

* **Context & Architectural Decisions:**
  * Re-architected on-wiki cross-project distribution pipeline based on clear role separation across Wikimedia projects:
    1. **Script Lead (`m:User:Powercycler/refdiff.js`):** Meta-Wiki hosts the authoritative, unminified UserScript codebase (`refdiff.js`) to provide cross-wiki availability across all Wikimedia wikis.
    2. **SHA Pointer (`en:User:Powercycler/refdiff.js`):** English Wikipedia hosts the immutable, release-pinned loader forwarding to Meta-Wiki with target release SHA-1 metadata (`c47b31ff...`).
    3. **Documentation Lead (`en:User:Powercycler/RefDiff`):** English Wikipedia leads the authoritative project documentation (published from `refdiff.wiki`), while Meta-Wiki (`m:User:Powercycler/RefDiff`) is maintained as a soft redirect.
    4. **Early Testing Harness (`en:User:Powercycler/common.js`):** During deployment stages, maintainers smoke-test newly published Meta builds in personal `common.js` before upreving the en.WP SHA pointer. No separate canary page is needed.
* **Streamlined Rollout Deployment Sequence:**
  1. *Update Meta Script Lead:* Publish local `refdiff.js` to `m:User:Powercycler/refdiff.js`.
  2. *Early Testing on en.WP:* Test via `en:User:Powercycler/common.js` across 5 live benchmark diffs.
  3. *Update en.WP SHA Pointer:* Update `en:User:Powercycler/refdiff.js` with new SHA-1 pointer.
  4. *Publish Lead Docs:* Publish `refdiff.wiki` to `en:User:Powercycler/RefDiff` and ensure Meta doc redirect.
  5. *Publish Userbox & Audit:* Create `Template:User RefDiff` (+ `/doc`) and run `npm run check:deploy`.
* **Artifacts Synchronized:**
  * Updated [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) (§1 Artifacts Table, §3 Rings 1–2, §5 Runbook; verified 91 lines < 100 limit).
  * Updated [`scripts/check_live_deployment.js`](scripts/check_live_deployment.js) (auditing Meta script lead, early testing harness, en.WP SHA pointer, and en.WP doc lead).
  * Updated [`tests/test_deployment.js`](tests/test_deployment.js) (asserting destinations for Meta lead, en.WP pointer, early harness, and en.WP doc lead).
  * Updated [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) (§2.4 On-Wiki Distribution Architecture).

---

### 2026-10-14: Enforced Mandatory Live Browser CDP Verification Before Any refdiff.js Update

* **Context & Architectural Invariant:**
  * Codified the strict deployment invariant: **Maintainers and release automation must ALWAYS execute live browser CDP testing (`npm run test:live` on port 9222) before pushing or rolling out any update to `refdiff.js`.**
  * Headless unit and JSDOM DOM tests provide essential regression coverage, but live browser CDP verification remains the non-negotiable safeguard ensuring real Chromium rendering, OOUI element reactivity, Vector 2022 light/dark theme token persistence, and `Extension:Popups` hovercards function without defect before any live deployment.
* **Artifacts Synchronized:**
  * Updated [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) (§2 Pre-Flight Quality Gates, §3 Ring 0, §5 Runbook Checklist; strictly maintained at 91 lines < 100 limit).
  * Updated [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) (§2.3 Real DOM Regression Harness).
  * Updated [`tests/test_deployment.js`](tests/test_deployment.js) (added automated assertion verifying that DEPLOYMENT_PLAN.md mandates CDP before any update to `refdiff.js`).

---

### 2026-10-14: Uprev to v1.4.0 & Codified Mandatory Pre-Deployment Uprev Invariant

* **Context & Architectural Invariant:**
  * Prior to initiating on-wiki deployment, performed a formal minor version uprev from `v1.3.0` to **`v1.4.0`** across all manifests and documentation artifacts.
  * Formally established the deployment invariant: **Maintainers and release automation must ALWAYS assure a formal version uprev is executed across all repository manifests (`package.json`, `package-lock.json`, `refdiff.js`, `refdiff.wiki`, `DEPLOYMENT_PLAN.md`, `AUDIT_STRATEGY.md`) before initiating on-wiki deployment.** Deploying against unbumped version numbers or stale git tags is strictly prohibited.
  * Release scope for `v1.4.0` consolidates major improvements developed since initial v1.3.0:
    - *Inline Modified Refs Mode:* Decouple toggle allowing modified citations to stay in prose with hovercards while keeping pure additions/deletions separated.
    - *XSS-Immune DOM Construction:* Complete replacement of template strings with safe DOM builder `el()` (M1 resolution).
    - *Attribute & Quote Robustness:* Resilient parsing of unclosed quotes, embedded apostrophes, and underscore anchor normalization (Bihar & Donnie Brasco diffs).
    - *Footnote & Template Delimiters:* Robust lookarounds preventing false-positive badges on `{{rp}}` page suffixes and nested footnote templates.
* **Artifacts Synchronized:**
  * Updated [`package.json`](package.json) & [`package-lock.json`](package-lock.json) (`1.4.0`).
  * Updated [`refdiff.js`](refdiff.js) (`// @version 1.4.0`).
  * Updated [`refdiff.wiki`](refdiff.wiki) (`| status = Stable (v1.4.0)`, `| version = 1.4.0`).
  * Updated [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md) (version `1.4.0`, pre-deployment uprev policy, release tag `v1.4.0`; 91 lines `< 100`).
  * Updated [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) (version `1.4.0`, §2.8 pre-deployment uprev policy).
  * Updated [`tests/test_deployment.js`](tests/test_deployment.js) (automated assertion for pre-deployment uprev policy).
  * Updated [`LOG.md`](LOG.md) (Dashboard `v1.4.0` and changelog).

---

### 2026-10-14: Transitioned DEPLOYMENT_PLAN.md to ROLLOUT_PLAN.md ("RefDiff: Rollout and Deployment Plan")

* **Context & Architectural Rationale:**
  * Adopted the cleaner, release-management-aligned filename **`ROLLOUT_PLAN.md`**, while preserving the explicit full title **`# RefDiff: Rollout and Deployment Plan`** in text.
  * In modern release engineering, "Deployment" denotes technical artifact publishing to on-wiki destinations, while "Rollout" denotes the phased ring-based exposure to users (Ring 0 local $\rightarrow$ Ring 1 Meta lead $\rightarrow$ Ring 2 en.WP personal testing & SHA pointer $\rightarrow$ Ring 3 community pilot).
  * Consolidating both under `ROLLOUT_PLAN.md` with in-text title `RefDiff: Rollout and Deployment Plan` provides maximal precision and clarity.
* **Artifacts Synchronized:**
  * Renamed file via git: `DEPLOYMENT_PLAN.md` $\rightarrow$ [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) (verified at 91 lines `< 100`).
  * Updated title in [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md): `# RefDiff: Rollout and Deployment Plan`.
  * Updated [`README.md`](README.md), [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md), and [`scripts/check_live_deployment.js`](scripts/check_live_deployment.js).
  * Updated [`tests/test_deployment.js`](tests/test_deployment.js) (added automated title assertion and path verification).
  * Updated [`LOG.md`](LOG.md) (overview index, dashboard deliverable, step R.8, and changelog).

---

### 2026-10-14: Codified and Automated Version Bump in Rollout and Deployment Plan

* **Context & Architectural Rationale:**
  * Explicitly codified the **Version Bump** step into the phased release workflow within [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md).
  * Formalized the version bump across Section 2 (Pre-Flight Quality Gates), Section 3 (Ring 0: Version Bump, Local Verification & Pre-Flight), and Section 5 (Deployment Runbook Checklist).
  * Created [`scripts/bump_version.js`](scripts/bump_version.js) and added the `npm run bump` npm lifecycle script to automate atomic semver bumps across all manifests (`package.json`, `package-lock.json`, `refdiff.js`, `refdiff.wiki`, `ROLLOUT_PLAN.md`, `AUDIT_STRATEGY.md`) with automated SHA-1 hash recalculation.
* **Artifacts Synchronized:**
  * Created [`scripts/bump_version.js`](scripts/bump_version.js) with `--dry-run` and semver validation.
  * Added `"bump": "node scripts/bump_version.js"` to [`package.json`](package.json).
  * Updated [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) (§2, §3 Ring 0, §5 Checklist; verified at 93 lines `< 100`).
  * Verified 115/115 tests, 10/10 deployment pre-flight gates, and 5/5 live CDP tests.

---

### 2026-10-14: Automated Pre-Flight Live Benchmark Suite via CDP Monkey Patching

* **Context & Architectural Innovation:**
  * Automated the 5 canonical live benchmark diffs (`Bihar` 1379207737, `Odoacer` 1379486498, `Zagreb` 1379409916, `Cosmic Inflation` 1379470949, `Donnie Brasco` 1380017400) directly during **pre-flight testing** via Chrome DevTools Protocol (CDP port 9222) monkey patching.
  * Rather than relying on manual user testing on English Wikipedia with `common.js` modifications, automation directly injects the local `refdiff.js` into live Wikipedia diff pages, validating:
    1. OOUI mode switcher mounting.
    2. Decoupled citation row injection and compact badge rendering.
    3. Interactive footnote anchor discovery (`<sup class="reference refdiff-ref"><a href="...">`).
    4. Bidirectional Memento restoration roundtrip (`selectMode('wikitext')` $\leftrightarrow$ `selectMode('refdiff')`).
    5. Zero uncaught JS exceptions and zero DOM corruption.
* **Artifacts Synchronized:**
  * Created [`tests/test_live_benchmarks.py`](tests/test_live_benchmarks.py) running the 5 live Wikipedia benchmarks in ~8 seconds.
  * Added `npm run test:bench` script to [`package.json`](package.json).
  * Updated [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) (§2 commands, §2 bullets, §5 checklist; verified at 94 lines `< 100`).
  * Executed live run: all 5 benchmarks verified **PASSED**.

---

### 2026-10-14: Codified Two-Phase Version Strategy: Patch Pre-Flight & Minor Post-Deployment

* **Context & Architectural Policy:**
  * Codified the project versioning strategy into [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) and [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) (§2.8):
    1. **Pre-Flight Pass & Feature Completion (Patch Uprev):** Upon completing a feature increment and passing all pre-flight quality gates (CI, DOM fixtures, live CDP, and live benchmark monkey patching), execute a **patch uprev bump** (`node scripts/bump_version.js patch`).
    2. **Post-Deployment Milestone (Minor Uprev):** After on-wiki rollout is completed and verified across all Wikimedia targets (`m:User:Powercycler/refdiff.js`, `en:User:Powercycler/refdiff.js`, docs, userbox; `npm run check:deploy` passes), execute a **minor uprev bump** (`node scripts/bump_version.js minor`) to stamp the deployed milestone.
* **Artifacts Synchronized:**
  * Updated [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) (§2, §3 Ring 0, §3 Ring 3, §5 Checklist; verified at 96 lines `< 100`).
  * Updated [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) (§2.8 Two-Phase Version Strategy).
  * Maintained 115/115 passing tests and 10/10 deployment pre-flight gates with 0 lint warnings.

---

### 2026-10-14: Tracked TODO for Regex Reevaluation and Parser Architecture Hardening

* **Context & Architectural Scope:**
  * Added formal tracking item and roadmap entry to reevaluate the core regular expressions in [`refdiff.js`](refdiff.js) (`REF_REGEX` and `TEMPLATE_REF_REGEX`).
  * Addressed future scalability and robustness concerns regarding:
    1. **Nesting Depth & Recursion:** Handling arbitrarily nested templates (e.g. `{{efn}}` wrapping complex `{{cite web}}` and `{{cite book}}` transclusions).
    2. **Catastrophic Backtracking Resilience:** Guarding against ReDoS edge-cases in user-supplied or malicious wikitext diffs.
    3. **Token Scanner Alternative:** Benchmarking current regex-based parsing against a lightweight, linear-time tokenizer / scanner architecture.
* **Artifacts Synchronized:**
  * Updated [`refdiff.js`](refdiff.js) (added TODO comment at regex definitions).
  * Updated [`TEST_PLAN.md`](TEST_PLAN.md) (§5 Future Test Expansion Roadmap).
  * Updated [`LOG.md`](LOG.md) (§2.1 Dashboard & Action Item Step R.10).
  * Removed operational TODOs from [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) to keep checklist strictly focused on rollout steps (verified at 93 lines `< 100`).

---

### 2026-10-14: Codified User Visual Inspection via Monkey Patching Before Rollout & Automated CDP

* **Context & Architectural Protocol:**
  * Codified the mandatory workflow invariant that prior to automated CDP test suite execution and phased on-wiki rollout, the **user conducts an interactive visual inspection** directly in their browser using monkey patching.
  * Ensures ergonomic, aesthetic, and visual layout issues (e.g. badge truncations, line borders, diff margins) are caught and refined by human review before automated test locking and publishing.
* **Artifacts Synchronized:**
  * Updated [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) (§4 Real-World Diff Verification Lifecycle: expanded to 7-stage funnel with Stage 5 *User Visual Inspection via Monkey Patching* before Stage 6 *CDP Audit* and Stage 7 *Rollout*).
  * Updated [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) (§2 Pre-Flight Quality Gates and §5 Checklist; verified at 96 lines `< 100`).

---

### 2026-10-14: Tracked TODO for Visual Diff Default Activation Bug

* **Context & Issue Description:**
  * Recorded a formal tracking item and TODO for reported behavior where Visual Diff activates as default unexpectedly instead of RefDiff or Wikitext.
  * Architectural scope for investigation:
    1. **Heuristic Detection Timing:** Audit `isVisualDiffActive()` and check if `.ve-init-mw-diffPage-diffMode .oo-ui-buttonOptionWidget:first-child` matches the visual button erroneously under certain skins, gadget configurations, or diff page contexts.
    2. **Event Race Conditions:** Examine `diffModeWidget.on('select')` event timing to prevent initial auto-selection callbacks from prematurely overriding user preference.
    3. **State Persistence:** Verify interaction between `window.mw.storage` and `localStorage` when user preference is initialized or refreshed.
* **Artifacts Synchronized:**
  * Updated [`LOG.md`](LOG.md) (§2.1 Dashboard & Action Item Step R.11).
  * Updated [`TEST_PLAN.md`](TEST_PLAN.md) (§5 Future Test Expansion Roadmap).
  * Ensured `ROLLOUT_PLAN.md` and `refdiff.js` remain clean of TODO items.

---

### 2026-10-14: Automated User Visual Inspection Helper & Rollout Plan Integration

* **Context & Tooling Implementation:**
  * Created dedicated automation script [`scripts/inspect_diff.py`](scripts/inspect_diff.py) and registered `npm run inspect` in `package.json`.
  * The tool provides a unified, zero-friction inspection workflow:
    1. Starts a local CORS-enabled HTTP server on port 8000 serving `refdiff.js` for instant console loading via `mw.loader.load('http://127.0.0.1:8000/refdiff.js')` in any browser.
    2. If Chromium remote debugging (CDP on port 9222) is active, automatically navigates to the target diff (defaulting to Bihar diff 1379207737), injects `refdiff.js`, verifies OOUI mounting, and leaves the tab open for direct human inspection.
    3. Keeps the server alive until the reviewer presses Enter or Ctrl+C.
* **Artifacts Synchronized:**
  * Updated [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) (§2 Pre-Flight Quality Gates and §5 Checklist: integrated `npm run inspect`; verified at 96 lines `< 100`).
  * Updated [`package.json`](package.json) (registered `"inspect": "python3 scripts/inspect_diff.py"`).

---

### 2026-10-14: Tracked TODO for Live On-Wiki Visual Inspection (No Local Visual Testing)

* **Context & Issue Description:**
  * Recorded a formal tracking item and TODO to deprecate local HTTP visual test setups (`http://127.0.0.1:8000/refdiff.js`) in favor of live on-wiki visual inspection.
  * Architectural rationale:
    1. **Mixed-Content Incompatibility:** Modern browsers block HTTP script loading (`mw.loader.load('http://127.0.0.1:8000/refdiff.js')`) inside HTTPS production pages (`https://en.wikipedia.org/...`).
    2. **Authentic Environment Parity:** Visual testing must be conducted against the live Wikipedia ResourceLoader environment, real CSS tokens, and active reviewer gadgets rather than artificial local harnesses.
* **Artifacts Synchronized:**
  * Updated [`LOG.md`](LOG.md) (§2.1 Dashboard & Action Item Step R.12).
  * Maintained strict TODO encapsulation policy (no TODOs in `ROLLOUT_PLAN.md`, `TEST_PLAN.md`, or source code).

---

### 2026-10-14: Tracked TODO for Visual Inspection Matrix Across All Change Cases

* **Context & Issue Description:**
  * User conducted live visual inspection on English Wikipedia diffs and Meta-Wiki Showcase diff (`diff=31142550`), identifying a visual defect where pure additions wrapped entire citation strings in dark blue `<ins class="diffchange">` highlighting instead of reserving intra-line highlights solely for modified words in modified citations (`isMod`).
  * While `refdiff.js` was updated to render added and deleted citations cleanly without `<ins>`/`<del>` wrappers, a formal TODO tracking item was established to enforce comprehensive visual inspection covering all change cases.
* **Architectural Rationale & Coverage Matrix:**
  * Visual inspection must explicitly verify every category of citation diff:
    1. **Pure Addition (`isAdd`):** Clean text body, `+label+` badge, right-side placement with left-side `diff-empty` colspan=2. No `<ins class="diffchange">` wrapping.
    2. **Pure Deletion (`isDel`):** Clean text body, `-label-` badge, left-side placement with right-side `diff-empty` colspan=2. No `<del class="diffchange">` wrapping.
    3. **Intra-Line Modification (`isMod`):** Dual-sided row with `~label~` badge, retaining native MediaWiki intra-line diff highlights (`<del>` / `<ins>`) strictly on changed tokens.
    4. **Normalization & Movement (`norm`):** Callout movement without spurious modification badges.
    5. **High-Density & Multi-Ref Rows:** Mixed addition, modification, and deletion in adjacent callouts.
    6. **Templates vs Tags:** Both `<ref>...</ref>` tags and `{{sfn}}` / footnote templates.
    7. **Color Themes:** Vector 2022 Light and Dark mode readability.
* **Artifacts Synchronized:**
  * Updated [`LOG.md`](LOG.md) (§2.1 Dashboard & Action Item Step R.13).
  * Maintained strict TODO encapsulation policy (all TODOs reside exclusively in `LOG.md`).

---

### 2026-10-14: Comprehensive Visual Inspection Across All Change Cases Verified & Signed Off

* **Context & Audit Execution:**
  * Executed comprehensive visual inspection protocol across all citation change cases using [`scripts/capture_full_audit.py`](scripts/capture_full_audit.py) in Chromium via CDP on port 9222.
  * Generated high-resolution visual evidence across all 5 sections of Meta Showcase diff (`diff=31142550`) and Bihar diff (`diff=1379207737`) in both Vector 2022 Light and Dark modes:
    1. **Pure Addition (`isAdd`):** Clean wikitext body, zero intra-line `<ins class="diffchange">` tags, `+label+` badge on right (`diff-addedline`), `diff-empty` on left.
    2. **Pure Deletion (`isDel`):** Clean wikitext body, zero intra-line `<del class="diffchange">` tags, `-label-` badge on left (`diff-deletedline`), `diff-empty` on right.
    3. **Intra-Line Modification (`isMod`):** Dual-sided row with `~label~` badge, retaining native MediaWiki intra-line diff highlights (`<del>` / `<ins>`) strictly on modified words (e.g. `pages=50–55` $\to$ `pages=80–88`).
    4. **Theme Consistency:** Light and Dark mode contrast and token rendering verified.
  * Human reviewer inspected all visual audit captures and formally confirmed: **"looks good"**.
* **Lower-Level Test Pyramid Expansion:**
  * Unit/Renderer ([`tests/test_renderer.js`](tests/test_renderer.js)): Asserted clean addition/deletion vs intra-line diffchange on modifications.
  * Pipeline ([`tests/test_pipeline.js`](tests/test_pipeline.js)): Asserted `transformProseCells` strips outer ins/del wrappers for `isAdd`/`isDel` while preserving inner tokens for `isMod`.
  * Real MediaWiki DOM / JSDOM ([`tests/test_jsdom.js`](tests/test_jsdom.js)): Asserted diffchange highlight rules across all 5 sections of `comprehensive_test.html`.
  * All 121 tests passed across 15 modular suites (`TEST_PLAN.md` synchronized).
* **Rollout Status:**
  * Step R.13 marked completed.
  * Pre-flight gates cleared; ready for on-wiki deployment execution per [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md).

---

### 2026-10-14: Codified Visual Capture & User Acknowledgment Gate as Rollout Default

* **Context & Policy Directive:**
  * Formally established the protocol ("provide captures and let user acknowledge") as the mandatory **Rollout Default Gate** before any on-wiki release.
  * Ensures that automated tests alone do not trigger deployment; visual captures across all citation change cases must be systematically gathered, formatted, presented to the reviewer, and explicitly acknowledged.
* **Process & Tooling Standard:**
  * Registered standard script in `package.json`: `"capture": "python3 scripts/capture_full_audit.py"`.
  * Script automated across Meta Showcase (`diff=31142550`) sections 1–5 and canonical benchmark diffs in both Vector 2022 Light and Dark themes.
  * Portable output directory configuration: defaults to `tests/screenshots` or honors `ARTIFACTS_DIR`.
* **Artifacts Synchronized:**
  * Updated [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) (§2 Pre-Flight Quality Gates and §5 Checklist; verified at 97 lines `< 100`).
  * Updated [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md) (§4 Stage 5 and §5 Quality Gates table).
  * Updated [`TEST_PLAN.md`](TEST_PLAN.md) (§3 Test Pyramid Level 5 and §4 CI/CD scripts).
  * Updated [`package.json`](package.json) (registered `npm run capture`).
  * Maintained strict TODO encapsulation policy (all TODOs reside exclusively in `LOG.md`).

---

### 2026-10-14: Phased On-Wiki Rollout (v1.4.3) Fully Deployed & Synchronized

* **Context & Deployment Execution:**
  * Completed phased rollout of RefDiff release **v1.4.3** across Meta-Wiki and English Wikipedia according to [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md).
  * **Ring 0 (Cleared):** Release candidate verified clean on `main` and tagged `v1.4.3`.
  * **Ring 1 (Meta Script Lead):** Updated `m:User:Powercycler/refdiff.js` with v1.4.3 payload (Rev 31167174, 92.2 KB); verified 100% in sync with release SHA-1.
  * **Ring 2 (English Wikipedia Deployment):**
    1. *Early Testing Harness:* Verified live functionality on English Wikipedia diffs via `en:User:Powercycler/common.js`.
    2. *SHA Pointer:* Published pinned loader forwarding to Meta-Wiki script lead with release SHA-1 at `en:User:Powercycler/refdiff.js` (Rev 1380226922).
    3. *Documentation Lead:* Published authoritative documentation lead at `en:User:Powercycler/RefDiff` (Rev 1380227024, 29.2 KB).
    4. *User Space Userbox:* Published clean default userbox at `en:User:Powercycler/Userbox RefDiff` (Rev 1380228630).
* **Live Audit Verification:**
  * Automated live on-wiki auditor (`node scripts/check_live_deployment.js`) ran against live Wikimedia APIs and returned:
    **"🎉 ALL TARGETS ARE FULLY DEPLOYED AND SYNCHRONIZED!"**
* **Artifacts Synchronized:**
  * Updated [`LOG.md`](LOG.md) (§2.1 Dashboard & Action Item Step R.8).
  * Maintained strict TODO encapsulation policy (all TODOs reside exclusively in `LOG.md`).

---

### 2026-10-14: Tracked TODO for Better Userbox Design & Usability (Consolidated into Step R.15)

* **Context & Issue Description:**
  * Recorded a formal tracking item and TODO for improving the RefDiff userbox (`User:Powercycler/Userbox RefDiff`).
  * While the initial rollout deployed a minimal, robust default userbox in user space with zero redlink categories, future iterations will refine:
    1. **Aesthetics & Skin Invariance:** High-DPI icon/badge styling with automatic Vector 2022 light/dark theme adaptation.
    2. **Customization vs Simplicity:** Sensible optional parameters without cluttering default usage.
    3. **Category Governance:** Setting up proper tracking categories or maintaining clean category-free transclusion.
    4. **Stack & Babel Integration:** Seamless layout in `{{Userboxtop}}` and multi-userbox columns.
* **Artifacts Synchronized:**
  * Consolidated into [`LOG.md`](LOG.md) Immediate P0 Action Item Step R.15 (part of doc cleanup).
  * Maintained strict TODO encapsulation policy (all TODOs reside exclusively in `LOG.md`).

---

### 2026-10-14: Tracked TODO for On-Wiki Tool Documentation, Meta Redirect & Userbox Polish (Step R.15 — P0)

* **Context & Issue Description:**
  * Recorded a formal tracking item and TODO (Step R.15) elevated to **P0 (Immediate Pre-Pilot Priority — higher than Tier 1)** for comprehensive on-wiki documentation polish across English Wikipedia and Meta-Wiki:
    1. **Beta Notice Banner & Status:** Add standard Wikipedia beta notice (`{{Caution}}` banner at top of doc page) and set `| status = Beta` in `{{Infobox user script}}` to clearly alert reviewers that RefDiff is undergoing active pilot testing.
    2. **Userbox Transclusion & Parameter Parity:** Align references from legacy `User:Powercycler/User RefDiff` to canonical `User:Powercycler/Userbox RefDiff`, removing obsolete parameter documentation that no longer matches the simplified user space template.
    3. **Link Verification & Redlink Elimination:** Ensure all wiki links, category references, and showcase anchors resolve cleanly without dead links or red categories.
    4. **Test Metrics & QA Synchronization:** Update test suite figures (121 tests passing across 15 test suites) in the infobox and QA sections.
    5. **On-Wiki Parity:** Re-sync local `refdiff.wiki` with `en:User:Powercycler/RefDiff` via deployment audit tools.
* **Artifacts Synchronized:**
  * Updated [`LOG.md`](LOG.md) (§2.1 Dashboard & Action Item Step R.15 as Immediate P0).
  * Maintained strict TODO encapsulation policy (all TODOs reside exclusively in `LOG.md`).

---

### 2026-10-14: Tracked TODO for Meta-Wiki Documentation Soft Redirect (Consolidated into Step R.15)

* **Context & Issue Description:**
  * Recorded a formal tracking item and TODO for resolving outdated/missing documentation on Meta-Wiki (`m:User:Powercycler/RefDiff`).
  * While English Wikipedia hosts the authoritative, publication-ready documentation lead (`en:User:Powercycler/RefDiff`, 29.2 KB), `m:User:Powercycler/RefDiff` currently retains legacy standalone wikitext from earlier development (Rev 31144013, 14.1 KB).
  * Action items to address (as part of the P0 doc update Step R.15):
    1. **Establish Canonical Soft Redirect or Synchronized Mirror:** Deploy a clean cross-wiki soft redirect template (e.g. `{{Soft redirect|en:User:Powercycler/RefDiff}}` or prominent banner) directing Meta-Wiki visitors to the authoritative English Wikipedia documentation lead, or mirror the complete v1.4.3 documentation.
    2. **Interwiki Link Alignment:** Harmonize cross-wiki links between `m:User:Powercycler/RefDiff/Show_case`, `m:User:Powercycler/refdiff.js`, and `en:User:Powercycler/RefDiff`.
    3. **Auditor Target Verification:** Confirm `scripts/check_live_deployment.js` recognizes the updated redirect or mirrored page state cleanly.
* **Artifacts Synchronized:**
  * Consolidated into [`LOG.md`](LOG.md) Immediate P0 Action Item Step R.15 (part of doc update).
  * Maintained strict TODO encapsulation policy (all TODOs reside exclusively in `LOG.md`).

---

### 2026-10-14: Tracked TODO for Rollout Protocol & Version Bump Streamlining

* **Context & Issue Description:**
  * Recorded a formal tracking item and TODO (Step R.17) for streamlining the phased rollout protocol and version bump workflow (focusing on manual process streamlining and reduced friction, rather than over-engineered automation).
  * During the v1.4.3 rollout, several multi-step manual friction points were identified to streamline:
    1. **Frictionless Runbook Checklist:** Simplify the deployment steps in [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) so the operator has clear, direct, and concise instructions without ambiguous sub-steps or redundant manual calculations.
    2. **Clean Version Bump Cadence:** Refine `scripts/bump_version.js` to handle manifest synchronization cleanly and intuitively for both pre-flight patch uprevs and post-shipment minor bumps without tag drift.
    3. **Straightforward On-Wiki Copy Workflow:** Document exact copy-paste snippets and canonical URLs clearly so publishing to on-wiki targets (Meta script lead, en.WP pointer, docs lead) is fast and error-free without needing extra tooling.
    4. **Clear Verification Sequence:** Streamline the order of manual checks and verification commands (`check_live_deployment.js`) to ensure a smooth, confident release sign-off.
* **Artifacts Synchronized:**
  * Updated [`LOG.md`](LOG.md) (§2.1 Dashboard & Action Item Step R.17).
  * Maintained strict TODO encapsulation policy (all TODOs reside exclusively in `LOG.md`).

---

### 2026-10-14: Tracked TODO for Automated Showcase Test in Rollout Protocol

* **Context & Issue Description:**
  * Recorded a formal tracking item and TODO (Step R.18) for incorporating the reference Showcase diff (`m:User:Powercycler/RefDiff/Show_case` / `diff=31142550`) into automated rollout testing and the deployment auditor.
  * The canonical wikitext for the showcase diff is already tracked locally in [`tests/comprehensive_old.wiki`](tests/comprehensive_old.wiki) (Rev 31142549) and [`tests/comprehensive_new.wiki`](tests/comprehensive_new.wiki) (Rev 31142550), but the live on-wiki showcase verification was omitted from the automated rollout pipeline:
    1. **Auditor Endpoint Integration:** Incorporate `m:User:Powercycler/RefDiff/Show_case` into `scripts/check_live_deployment.js` to audit page availability and diff revision integrity during post-shipment verification.
    2. **Automated Rollout Pre-Flight Smoke Test:** Verify RefDiff boots and decouples citations cleanly on the live showcase diff as part of automated pre-flight quality gates.
    3. **Cross-Wiki Link Integrity:** Ensure showcase diff links in documentation leads (`en:User:Powercycler/RefDiff`) resolve seamlessly.
* **Artifacts Synchronized:**
  * Updated [`LOG.md`](LOG.md) (§2.1 Dashboard & Action Item Step R.18).

---

### 2026-10-14: Executed Post-Shipment Feature Bump to v1.5.0

* **Context & Execution:**
  * Following successful live deployment and 100% synchronization of release `v1.4.3` across all Wikimedia endpoints (Meta script lead, en.WP SHA pointer, lead documentation, userbox), executed the post-shipment feature uprev per [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) (§3 Ring 3 & §5 Deployment Runbook Checklist).
  * Ran `node scripts/bump_version.js minor` to advance version from `1.4.3` to `1.5.0`.
  * Synchronized manifests and headers across repository artifacts:
    1. [`package.json`](package.json): version bumped to `1.5.0`.
    2. [`package-lock.json`](package-lock.json): root and lockfile versions bumped to `1.5.0`.
    3. [`refdiff.js`](refdiff.js): UserScript metadata header updated to `@version 1.5.0`.
    4. [`refdiff.wiki`](refdiff.wiki): Infobox metadata updated to `| version = 1.5.0` and `| status = Stable (v1.5.0)`.
* **Verification & Quality Gates:**
  * Ran full automated test suite (`npm test && node tests/test_deployment.js`): 121/121 unit, integration, benchmark, and JSDOM DOM tests passed.
  * Verified all 10 release deployment pre-flight checks passed (version synchronization, packaging, zero console pollution, bundle size budget).
  * Code hygiene check: `npm run lint` passed with 0 ESLint errors and 0 warnings.
  * Maintained strict TODO encapsulation policy (all TODOs reside exclusively in `LOG.md`).

---

### 2026-10-14: Userbox Template Consolidation & Documentation Polish (`userbox.wiki`)

* **Context & Rationale:**
  * Consolidated the two divergent userbox template files (`userbox.wiki` and `userbox_enwiki.wiki`) into a single, clean, canonical template file: [`userbox.wiki`](userbox.wiki).
  * Removed `userbox_enwiki.wiki` and updated all deployment gates, verification scripts, and documentation references (`tests/test_deployment.js`, `scripts/check_live_deployment.js`, `ROLLOUT_PLAN.md`, `README.md`).
* **Design & Usability Enhancements:**
  * **Zero Redlinks:** Replaced non-existent link `[[Wikipedia:Template camouflage]]` with direct canonical documentation section link `[[User:Powercycler/RefDiff#The Problem: Template Camouflage|template camouflage]]`.
  * **Native Dark-Mode Support:** Removed hardcoded white/cream backgrounds (`info-c`, `id-c`, `info-fc`, `id-fc`) so `Template:Userbox/styles.css` seamlessly handles light and dark mode transitions across Vector 2022 tokens.
  * **Unbent Bounding Box:** Constrained `⟨~ref~⟩` badge (`id-s = 8`, `font-size: 0.75em`, `padding: 1px 2px`) to ~39px width, preserving MediaWiki's exact 45px × 45px square ID cell without horizontal distortion.
  * **Category Hygiene:** Removed non-existent categories (`Category:Wikipedians who use RefDiff`, `Category:Software user templates`).
* **Verification & Quality Gates:**
  * All test suites passing (`npm test`, 121/121).
  * Maintained strict TODO encapsulation policy (all TODOs reside exclusively in `LOG.md`).

---

### 2026-10-14: Documentation Lead Cleanup & Parity Sync (`refdiff.wiki`)

* **Context & Execution:**
  * Cleaned up [`refdiff.wiki`](refdiff.wiki) to align with live on-wiki status on English Wikipedia ([`User:Powercycler/RefDiff`](https://en.wikipedia.org/wiki/User:Powercycler/RefDiff)):
    1. **Preserved AI Attribution Badge:** Retained `{{ai-generated|userscript page|reason=[[Special:AbuseLog/45390145|AbuseLog/45390145]]|date=October 2026}}` at the top of the documentation lead alongside the Beta caution banner.
    2. **Shortened Userbox Transclusion Section:** Streamlined `== Userbox ==` from 70 lines of sprawling parameter tables to a clean 18-line mention featuring standard transclusion syntax `{{User:Powercycler/Userbox RefDiff}}` and the unbent, dark-mode-ready live preview.
    3. **Commented Out Complementary Tools & Proposals Section:** Wrapped `== Complementary Tools & Proposals ==` in a comment block marked as a TODO item pending review and curation.
    4. **Pruned Non-Wiki File References:** Removed local repository filename `TEST_PLAN.md` from `== See Also ==`.
    5. **Retained AI Companion Script:** Maintained `[[:en:User:Alaexis/AI Source Verification.js|User:Alaexis/AI Source Verification]]` under `== See Also ==`.
    6. **Zero Dead Categories:** Removed manual category tags (`Category:Wikipedia scripts`, `Category:JavaScript`), ensuring no redlink or dead categories appear.
* **Verification & Quality Gates:**
  * Automated pre-flight suite passed (`npm test` 121/121).
  * Linter passed with 0 errors/warnings (`npm run lint`).
  * On-wiki parse API confirmed zero dead categories and zero invalid template transclusions.

---

### 2026-10-14: English Wikipedia Showcase Diff Migration & Parity Alignment

* **Context & Execution:**
  * Migrated the reference showcase diff from Meta-Wiki to English Wikipedia at [`en:User:Powercycler/RefDiff/Show_case`](https://en.wikipedia.org/wiki/User:Powercycler/RefDiff/Show_case) ([`diff=1380240829&oldid=1380240443`](https://en.wikipedia.org/w/index.php?title=User:Powercycler/RefDiff/Show_case&diff=1380240829&oldid=1380240443)):
    1. **Live On-Wiki Parity:** Synchronized local test fixtures [`tests/comprehensive_old.wiki`](tests/comprehensive_old.wiki) and [`tests/comprehensive_new.wiki`](tests/comprehensive_new.wiki) to match remote revisions `1380240443` and `1380240829`.
    2. **Citation Lint Fix:** Resolved `Module:Citation/CS1` lint error (`explicit use of et al. in |author=`) by replacing with standard `|author=Müller, H. |display-authors=etal` in section 3.
    3. **References Section Anchor:** Added standard `== References ==` and `{{reflist}}` to anchor footnotes cleanly in rendered view.
    4. **Documentation Links Synchronized:** Updated showcase diff links in [`refdiff.wiki`](refdiff.wiki) (infobox and walkthrough) and [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md) to reference the canonical English Wikipedia diff directly.
* **Verification & Quality Gates:**
  * Automated test suite passing (`npm test`, 121/121).
  * Code linter passing with 0 errors / 0 warnings (`npm run lint`).
  * `ROLLOUT_PLAN.md` verified under line budget (97 lines).

---

### 2026-10-14: Meta-Wiki CDN & Tools Page Specification (`meta_refdiff.wiki`)

* **Context & Execution:**
  * Created lightweight, canonical tools page [`meta_refdiff.wiki`](meta_refdiff.wiki) for deployment at [`m:User:Powercycler/RefDiff`](https://meta.wikimedia.org/wiki/User:Powercycler/RefDiff):
    1. **Primary Reference to en.WP:** Intro section explicitly refers readers to the authoritative documentation, showcase diffs, and talk page at [`en:User:Powercycler/RefDiff`](https://en.wikipedia.org/wiki/User:Powercycler/RefDiff).
    2. **Meta CDN Role Defined:** Explicitly documents Meta-Wiki's architectural role as the central distribution hub and CDN hosting [`User:Powercycler/refdiff.js`](https://meta.wikimedia.org/wiki/User:Powercycler/refdiff.js) for cross-wiki transclusion.
    3. **Global Script Loader:** Provides concise installation snippet for [[m:Special:MyPage/global.js|global.js]].
    4. **Toolchain Integration:** Integrated `meta_refdiff.wiki` into [`tests/test_deployment.js`](tests/test_deployment.js), [`scripts/check_live_deployment.js`](scripts/check_live_deployment.js), and [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md).
  * Added `== Feedback & Bug Reports ==` section to [`refdiff.wiki`](refdiff.wiki) with direct link to [`User talk:Powercycler/RefDiff`](https://en.wikipedia.org/wiki/User_talk:Powercycler/RefDiff).
  * Refined entire [`refdiff.wiki`](refdiff.wiki) for a professional, descriptive encyclopedic tone:
    1. **Strict Focus on Template Camouflage:** Centered the problem statement, review rationale, and editorial governance exclusively on eliminating template camouflage on `Special:Diff`.
    2. **Straight, Concise Technical Specifications:** Streamlined the QA section to straightforward, factual bullet points summarizing [`ARCHITECTURE.md`](ARCHITECTURE.md), [`AUDIT_STRATEGY.md`](AUDIT_STRATEGY.md), [`ROLLOUT_PLAN.md`](ROLLOUT_PLAN.md), and [`TEST_PLAN.md`](TEST_PLAN.md) without inflated or corporate phrasing.
* **Verification & Quality Gates:**
  * Test suite passing: 121/121 tests (`npm test`).
  * Linter clean: 0 errors / 0 warnings (`npm run lint`).
  * Strict line budget maintained: `ROLLOUT_PLAN.md` at 97 lines (< 100).
---

### 2026-10-14: Root Cause Analysis: Visual Diff Defaulting Race Condition & OOUI Inline Integration

* **Problem Statement & Bug Description:**
  * When opening a diff in a new tab, setting the view mode to RefDiff, closing or navigating away from the page, and subsequently opening another diff, **Visual Diff unexpectedly becomes the active default** instead of RefDiff or Wikitext diff.

* **Technical Root Cause (`ext.visualEditor.diffPage.init`):**
  1. **Persistent Server/Client Option:**
     * When an editor clicks "Visual" on any MediaWiki diff, VisualEditor persists this state to the server and local profile:
       `mw.user.options.set('visualeditor-diffmode-historical', 'visual');`
       `new mw.Api().saveOption('visualeditor-diffmode-historical', 'visual');`
     * When switching to RefDiff, RefDiff historically only set its own local storage key (`refdiff-active`), leaving `visualeditor-diffmode-historical` set to `'visual'`.
  2. **VisualEditor Initialization Logic:**
     * On new diff loads, VisualEditor checks:
       `let initMode = originalUrl.searchParams.get('diffmode') || mw.user.options.get('visualeditor-diffmode-historical') || 'source';`
     * If `'visual'`, VisualEditor triggers:
       `reviewModeButtonSelect.selectItemByData('visual');`
       initiating Parsoid visual diff generation and hiding the wikitext diff table.
  3. **RefDiff Passive Back-Off:**
     * RefDiff's `isVisualDiffActive()` inspects the Visual button's CSS classes (`oo-ui-optionWidget-selected`). Seeing that VisualEditor initialized the Visual button as active, RefDiff assumed the user intentionally requested a visual diff and aborted decoupling (`shouldDecouple = false`), allowing Visual Diff to dominate.
  4. **DOM Replacement Race (`.empty()`):**
     * VisualEditor's `mw.hook('wikipage.diff')` handler executes:
       `$('.ve-init-mw-diffPage-diffMode').empty().append(reviewModeButtonSelect.$element);`
     * Any DOM elements injected by RefDiff before VisualEditor finishes initializing or during dynamic re-renders get destroyed by `.empty()`.

* **Architectural Resolution & Inline OOUI Strategy:**
  1. **Zero Added Height (Single-Row Flex Container):**
     * MediaWiki's `.mw-diff-table-prefix` has ~640px of unused horizontal space at a native 34px height.
     * All controls fit on a single row without adding vertical height:
       `[ 👁 Visual ] [ [[]] Wikitext ] [ ⧉ RefDiff ]   [✓] Inline modified refs   Inline [switch]`
  2. **Active Mode & Preference Assertion:**
     * When `isRefDiffPreferred()` is true on page load, RefDiff proactively sets in-memory `mw.user.options.set('visualeditor-diffmode-historical', 'source')` and selects source mode in VisualEditor before visual diff rendering starts, preventing the automatic switch to Visual.
  3. **Immunity from `.empty()` Destruction:**
     * RefDiff mounts `refdiff-inline-mod-layout` (the OOUI `CheckboxInputWidget` inside `FieldLayout`) outside `.ve-init-mw-diffPage-diffMode` (as a sibling between `diffMode` and `inlineToggleContainer`), making it immune to VisualEditor's container clearing.
     * RefDiff protects the segmented `[ ⧉ RefDiff ]` button inside `.oo-ui-buttonSelectWidget` via sequential `mw.hook('wikipage.diff')` execution and a fallback `MutationObserver` on `diffMode` that instantly re-attaches the button if `.empty()` is called.
  4. **Native OOUI Tokens & Dual-Theme Consistency:**
     * Uses native OOUI widgets (`OO.ui.ButtonOptionWidget`, `OO.ui.CheckboxInputWidget`, `OO.ui.FieldLayout`), automatically inheriting Vector 2022 light and dark mode styles without custom CSS hacks.

---

### 2026-10-14: Comprehensive Path Analysis: Cascading RefDiff Mode Coordinator & State Persistence

#### 1. Core Architectural Axiom & Design Invariants

```
                +-------------------------------------------+
                |           User On Wikipedia Diff          |
                +-------------------------------------------+
                                      |
                           [ Page Load / Reload ]
                                      |
                     Is Visual Diff Active (VE Mode)?
                                  /       \
                             YES /         \ NO (Wikitext Mode)
                                v           v
              +--------------------+     Is RefDiff Preferred?
              | Visual Mode Active |          /        \
              | (RefDiff DORMANT)  |     YES /          \ NO
              +--------------------+        v            v
                                      +-----------+  +---------------+
                                      |  RefDiff  |  |   Standard    |
                                      | Decoupled |  | Wikitext Diff |
                                      +-----------+  +---------------+
```

* **Axiom 1: RefDiff Activates ONLY When Wikitext Is Active (`!isVisualDiffActive()`)**
  RefDiff is strictly an enhancement for wikitext diffs. If MediaWiki loads or is set to Visual Diff (`isVisualDiffActive() === true`), RefDiff remains completely dormant. It does NOT hijack, overwrite, or mutate the page.
* **Axiom 2: The Cascading Pattern (Visual $\to$ Wikitext $\to$ RefDiff)**
  Clicking `[ ⧉ RefDiff ]` while in Visual mode cascades through MediaWiki's native architecture: it requests VisualEditor switch to Wikitext/source mode first (`selectItemByData('source')`), and once Wikitext is active, RefDiff decouples citations on the wikitext table.
* **Axiom 3: Non-Interfering Event Delegation (Bubble Phase)**
  Native VisualEditor buttons (`[ 👁 Visual ]` and `[ [[]] Wikitext ]`) are handled in the standard bubble phase without capture-phase interception (`useCapture: false`). VisualEditor receives its own click events unhindered. Only `#refdiff-ooui-btn` halts propagation (`stopPropagation()` / `preventDefault()`).
* **Axiom 4: Deterministic Storage & Inactivity Persistence**
  Whenever the user explicitly selects `[ 👁 Visual ]` or `[ [[]] Wikitext ]`, RefDiff persists `setRefDiffPreferred(false)`. Whenever the user selects `[ ⧉ RefDiff ]`, RefDiff persists `setRefDiffPreferred(true)`.

---

#### 2. Complete State Transition Matrix

| Current Active Mode | Trigger Event | Resulting Mode | `refdiff-active` Stored | DOM & Pipeline Actions | VE Interaction |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Any (Cold Load)** | `diffmode=visual` or VE visual active | **Visual** | *(unchanged)* | RefDiff dormant; inline toggle disabled; buttons: `[Visual: ON, Wiki: OFF, Ref: OFF]` | None (VE renders visual diff natively) |
| **Any (Cold Load)** | Wikitext active + `stored=true` | **RefDiff** | `true` | `applyDecoupling(table)`; inline toggle active; buttons: `[Visual: OFF, Wiki: OFF, Ref: ON]` | None (Wikitext diff active) |
| **Any (Cold Load)** | Wikitext active + `stored=false` | **Wikitext** | `false` | Clean standard diff; inline toggle enabled; buttons: `[Visual: OFF, Wiki: ON, Ref: OFF]` | None (Wikitext diff active) |
| **RefDiff** | Click `[ 👁 Visual ]` | **Visual** | `false` | `restoreOriginal(table)`; inline toggle disabled; buttons: `[Visual: ON, Wiki: OFF, Ref: OFF]` | Bubble to VE; VE loads Parsoid diff |
| **RefDiff** | Click `[ [[]] Wikitext ]` | **Wikitext** | `false` | `restoreOriginal(table)`; inline toggle enabled; buttons: `[Visual: OFF, Wiki: ON, Ref: OFF]` | Bubble to VE; standard diff displayed |
| **Visual** | Click `[ ⧉ RefDiff ]` | **RefDiff** | `true` | **CASCADE**: Switch VE to source $\to$ `applyDecoupling(table)`; buttons: `[Visual: OFF, Wiki: OFF, Ref: ON]` | Programmatic `selectItemByData('source')` guarded by `state.cascadingToSource` |
| **Wikitext** | Click `[ ⧉ RefDiff ]` | **RefDiff** | `true` | `applyDecoupling(table)`; inline toggle active; buttons: `[Visual: OFF, Wiki: OFF, Ref: ON]` | None |
| **Visual** | Click `[ [[]] Wikitext ]` | **Wikitext** | `false` | Wikitext table unhidden; inline toggle enabled; buttons: `[Visual: OFF, Wiki: ON, Ref: OFF]` | Bubble to VE; VE switches to source diff |
| **Wikitext** | Click `[ 👁 Visual ]` | **Visual** | `false` | Table restored clean; inline toggle disabled; buttons: `[Visual: ON, Wiki: OFF, Ref: OFF]` | Bubble to VE; VE loads Parsoid diff |

---

#### 3. Detailed Path Analysis (All 10 Execution Flows)

##### Path 1: Cold Page Load — Diff in Visual Mode
* **Precondition:** User opens a diff URL where MediaWiki defaults to Visual Diff (`diffmode=visual` query param, or `mw.user.options.get('visualeditor-diffmode-historical') === 'visual'`).
* **Trace:**
  1. `init()` checks `isVisual = isVisualDiffActive()`.
  2. Because `isVisualDiffActive()` inspects the OOUI button group, `.ve-ui-diffElement`, and URL query parameters, it evaluates to `true`.
  3. `init()` evaluates `if (isVisual)` FIRST (before checking `shouldDecouple`).
  4. `selectMode('visual', table)` executes:
     - Sets button active classes: `visualBtn` active, `refBtn` inactive, `wikiBtn` inactive.
     - Disables the RefDiff inline modified refs toggle (`refdiff-inline-container`).
     - RefDiff decoupling is **NOT executed**.
* **Invariant:** Visual Diff displays cleanly without any DOM tampering or Parsoid hook collisions.

##### Path 2: Cold Page Load — Diff in Wikitext Mode with RefDiff Preferred
* **Precondition:** User opens a diff in Wikitext mode, with `refdiff-active === 'true'` (or default first visit).
* **Trace:**
  1. `init()` checks `isVisual = isVisualDiffActive()` $\implies$ `false`.
  2. `init()` checks `shouldDecouple = isRefDiffPreferred()` $\implies$ `true`.
  3. `selectMode('refdiff', table)` executes:
     - Buttons: `refBtn` active, `wikiBtn` inactive, `visualBtn` inactive.
     - Sets inline toggle enabled according to user preference.
     - Calls `applyDecoupling(table)` and `notifyBodyUpdate(table)`.
* **Invariant:** Prose and citation rows decoupled cleanly in single-line inline layout.

##### Path 3: Cold Page Load — Diff in Wikitext Mode with Wikitext Preferred
* **Precondition:** User previously clicked `[ [[]] Wikitext ]` (`refdiff-active === 'false'`).
* **Trace:**
  1. `init()` checks `isVisualDiffActive()` $\implies$ `false`.
  2. `init()` checks `isRefDiffPreferred()` $\implies$ `false`.
  3. `selectMode('wikitext', table)` executes:
     - Buttons: `wikiBtn` active, `refBtn` inactive, `visualBtn` inactive.
     - Enables native MediaWiki inline diff switch.
     - Standard MediaWiki wikitext diff remains untouched.
* **Invariant:** Zero alteration of standard wikidiff2 output.

##### Path 4: User Action — Switching from RefDiff to Visual (`[ 👁 Visual ]` Clicked)
* **Precondition:** RefDiff is currently active. User clicks `[ 👁 Visual ]`.
* **Trace:**
  1. Click event fires on `Visual` button option in `diffModeContainer`.
  2. Because delegated listener uses standard bubble phase (`useCapture: false`), the event bubbles naturally to VisualEditor's native handler.
  3. RefDiff's delegated listener catches the event in bubble phase:
     - Detects eye icon / visual label.
     - Calls `selectMode('visual', table)`.
  4. Inside `selectMode('visual', table)`:
     - Calls `restoreOriginal(table)` restoring clean wikitext HTML (Memento).
     - Calls `setRefDiffPreferred(false)` $\implies$ **persists inactivity to `mw.storage` / `localStorage`**.
     - Updates button highlights: `visualBtn` active, `refBtn` inactive.
     - Disables inline toggle checkbox.
     - Does NOT call `notifyBodyUpdate(table)` (prevents disruptive hook fires while VE mounts Parsoid diff).
  5. VisualEditor's native code finishes fetching Parsoid HTML and displays `.ve-ui-diffElement`.
* **Invariant:** Visual diff loads successfully; preference `false` is stored so future loads do not hijack.

##### Path 5: User Action — Switching from Visual to RefDiff (`[ ⧉ RefDiff ]` Clicked: The Cascade)
* **Precondition:** Visual Diff is currently active. User clicks `[ ⧉ RefDiff ]`.
* **Trace:**
  1. Click event fires on `#refdiff-ooui-btn`.
  2. Delegated listener catches click:
     - Calls `e.preventDefault()` and `e.stopPropagation()` (MediaWiki VisualEditor is not aware of `refdiff-ooui-btn` and ignores it).
     - Calls `selectMode('refdiff', table)`.
  3. Inside `selectMode('refdiff', table)`:
     - Detects `isVisualDiffActive() === true`.
     - **The Cascade Trigger:** Sets `state.cascadingToSource = true` to guard the OOUI widget select handler.
     - Programmatically requests source mode: `widget.selectItemByData('source')` (or clicks `wikiBtn`).
     - Updates historical option: `mw.user.options.set('visualeditor-diffmode-historical', 'source')`.
     - Resets `state.cascadingToSource = false`.
     - VisualEditor hides `.ve-ui-diffElement` and unhides the wikitext `table.diff`.
     - Calls `setRefDiffPreferred(true)` $\implies$ **persists active state to storage**.
     - Calls `applyDecoupling(table)` and `notifyBodyUpdate(table)`.
     - Updates button highlights: `refBtn` active, `visualBtn` inactive, `wikiBtn` inactive.
* **Invariant:** Seamless transition from Visual diff directly into decoupled RefDiff without page reload or manual intermediate clicks.

##### Path 6: User Action — Switching from RefDiff to Wikitext (`[ [[]] Wikitext ]` Clicked)
* **Precondition:** RefDiff is currently active. User clicks `[ [[]] Wikitext ]`.
* **Trace:**
  1. Click event fires on `Wikitext` button option.
  2. Bubbles to VisualEditor and RefDiff listener:
     - Calls `selectMode('wikitext', table)`.
  3. Inside `selectMode('wikitext', table)`:
     - Calls `restoreOriginal(table)` $\implies$ reverses all prose badge and citation row transformations via Memento pattern.
     - Unhides all body rows and calls `notifyBodyUpdate(table)`.
     - Calls `setRefDiffPreferred(false)` $\implies$ **persists standard wikitext preference**.
     - Enables native inline diff switch.
     - Buttons: `wikiBtn` active, `refBtn` inactive.
* **Invariant:** Instantaneous, byte-for-byte restoration of standard MediaWiki wikitext diff table.

##### Path 7: User Action — Switching from Wikitext to RefDiff (`[ ⧉ RefDiff ]` Clicked)
* **Precondition:** Standard Wikitext diff is active. User clicks `[ ⧉ RefDiff ]`.
* **Trace:**
  1. Click intercepted on `#refdiff-ooui-btn` (`preventDefault()`, `stopPropagation()`).
  2. `selectMode('refdiff', table)` executes:
     - `setRefDiffPreferred(true)` persists to storage.
     - `applyDecoupling(table)` decouples references into structured citation rows.
     - `notifyBodyUpdate(table)` synchronizes hooks.
     - Buttons: `refBtn` active, `wikiBtn` inactive.
* **Invariant:** Pure client-side transformation in <10ms.

##### Path 8 & 9: Direct Toggles Between Native Visual & Wikitext Modes
* **Precondition:** RefDiff button is unselected. User toggles directly between `Visual` and `Wikitext`.
* **Trace:**
  1. Events bubble directly to MediaWiki VisualEditor without interference.
  2. RefDiff listener observes the mode change:
     - For `visual`: ensures `setRefDiffPreferred(false)` and dims inline toggle.
     - For `wikitext`: ensures `setRefDiffPreferred(false)` and restores clean table.
* **Invariant:** RefDiff never interferes with native MediaWiki diff mode switching when inactive.

##### Path 10: Asynchronous Parsoid/VE DOM Re-render (`.empty()` Recovery)
* **Precondition:** VisualEditor invokes `mw.hook('wikipage.diff')` or re-renders the mode container during asynchronous Parsoid parsing.
* **Trace:**
  1. If VisualEditor empties `.ve-init-mw-diffPage-diffMode`, `#refdiff-ooui-btn` is temporarily detached.
  2. The registered `MutationObserver` on `diffModeContainer` observes childList removal.
  3. `init()` re-executes safely:
     - Re-evaluates `isVisualDiffActive()`.
     - Re-appends `refBtn` to the button group.
     - If Visual mode is active, remains dormant (`selectMode('visual')`).
     - If Wikitext mode is active and RefDiff is preferred, re-establishes RefDiff state.
* **Invariant:** Zero broken UI states or missing buttons regardless of VisualEditor re-render timing.

---

#### 4. Summary of Verification & Test Alignment

| Path | Invariant | Verified By Test |
| :--- | :--- | :--- |
| **Path 1 (Visual Cold Load)** | RefDiff stays dormant; Visual diff active | `tests/test_mode_coordinator.js`, JSDOM live visual diff |
| **Path 2 (RefDiff Cold Load)**| RefDiff decouples citations on load | `tests/test_jsdom.js`, `test_pipeline.js` |
| **Path 4 (VE Select & Storage)**| `setRefDiffPreferred(false)` persisted; VE click unblocked | Unit storage tests, CDP live suite |
| **Path 5 (Cascade VE $\to$ RefDiff)**| Cascades via `selectItemByData('source')` without loops | `tests/test_mode_coordinator.js`, CDP live suite |
| **Path 6 (Wikitext Restoration)**| Byte-for-byte Memento restoration | `tests/test_memento.js`, `test_jsdom.js` |
| **Path 10 (Re-render Recovery)**| MutationObserver re-attaches button | `tests/test_init.js` |

---

### 2026-10-14: OOUI Theme Engine Model Synchronization & Visual Diff Mode Persistence Analysis

* **White `[[]]` Icon Inversion Resolution:**
  * **Symptom:** When cascading from Visual Diff to RefDiff, the Wikitext button's `[[]]` icon (`.oo-ui-icon-wikiText`) intermittently inverted to white (`oo-ui-image-invert`), rendering it faint or invisible against the light button background.
  * **Root Cause Discovery:** OOUI manages icon variants (`oo-ui-image-invert`) through an asynchronous, debounced queue (`OO.ui.Theme.prototype.updateQueuedElementClasses`). When RefDiff commanded `widget.selectItemByData('source')` during the cascade, OOUI marked the source button selected in its internal model. Merely clearing DOM element classes (`classList.remove(...)`) was insufficient because OOUI's queued theme engine inspects the underlying JavaScript widget object (`$(el).data('oo-ui-optionWidget').isSelected()`). When the debounced queue flushed ~500ms later, it re-evaluated `variants.invert = true` and re-applied `oo-ui-image-invert`.
  * **Implementation:**
    1. In `setElementActive()`, explicitly synchronized the underlying OOUI model:
       ```javascript
       const opt = $(el).data('oo-ui-optionWidget') || $(el).data('oo-ui-buttonWidget');
       if (opt) {
         if (typeof opt.setSelected === 'function' && typeof opt.isSelected === 'function' && opt.isSelected() !== active) {
           opt.setSelected(active);
         }
         if (typeof opt.setActive === 'function' && typeof opt.isActive === 'function' && opt.isActive() !== active) {
           opt.setActive(active);
         }
       }
       ```
    2. In `selectMode('refdiff')`, cleanly unselected all parent widget items via `widget.selectItem(null)` and flushed queued theme updates via `OO.ui.theme.updateQueuedElementClasses()`.
  * **Live CDP Verification:** Validated via CDP runtime evaluation on English Wikipedia: `wikiIconClasses: "oo-ui-iconElement-icon oo-ui-icon-wikiText"` (dark, crisp icon with zero `oo-ui-image-invert`).

* **Visual Diff Mode Persistence Architecture Analysis:**
  * **Observed Behavior:** Selecting Visual diff mode in a diff, navigating to `User:Powercycler/RefDiff`, and clicking a diff link resulted in Wikitext mode being selected instead of Visual mode.
  * **Underlying MediaWiki Architecture (`ext.visualEditor.diffPage.init`):**
    * MediaWiki initializes diff mode via:
      `let initMode = originalUrl.searchParams.get('diffmode') || mw.user.options.get('visualeditor-diffmode-historical') || 'source';`
    * Mode choices are saved via:
      `new mw.Api().saveOption('visualeditor-diffmode-historical', mode);`
  * **Authentication Constraints (Anon & Temporary Accounts):**
    * For anonymous/unregistered visitors, `new mw.Api().saveOption(...)` rejects with `'notloggedin'`.
    * For temporary accounts (`~202X-...`), MediaWiki blocks option saving with `InvalidArgumentException: UserOptionsManager::saveOptionsInternal was called on IP or temporary user` because temporary accounts do not have persistent `user_properties` database records.
    * VisualEditor contains no client-side `localStorage` or cookie fallback for the diff mode choice.
    * Therefore, anonymous and temporary sessions will always default back to `'source'` (Wikitext) on fresh diff links lacking `?diffmode=visual`.
  * **Rollout Testing Strategy:**
    * Confirmed that true cross-page persistence of Visual diff mode operates exclusively for authenticated permanent accounts where `user_properties` are stored on the MediaWiki backend.
    * Agreed with user: Full verification of cross-page Visual mode persistence will be executed by logging into the CDP test session once during the final rollout phase.

### 2026-10-14: Doc Polish Finished (Step R.15) & Added Rollout TODO (Step R.20)
* **Step R.15 (Doc Polish) Marked Finished:**
  * Synchronized local [`refdiff.wiki`](refdiff.wiki) with the authoritative live documentation lead on English Wikipedia ([`en:User:Powercycler/RefDiff`](https://en.wikipedia.org/wiki/User:Powercycler/RefDiff)), incorporating the user's online edits (AbuseFilter banner `Special:AbuseLog/45390145`, one-click Script Installer guidance, canonical showcase link `diff=1380240829`, agentic coding and QA governance architecture section, and userbox transclusion syntax).
  * Stamped local [`refdiff.wiki`](refdiff.wiki) with version `1.5.2` and updated test metrics to 122 tests.
  * Verified 10/10 deployment integrity checks in [`tests/test_deployment.js`](tests/test_deployment.js) and 122/122 unit tests passing.
  * Marked Step R.15 as `✅ Finished` across dashboard tables and detailed action item lists.
* **Step R.20 (Rollout of Recently Completed Updates) Tracked as P0 TODO:**
  * Created formal action item **Step R.20** (`Active Release Action Item`) to roll out `v1.5.2` release candidate across Wikimedia endpoints:
    - Scope includes: Visual Diff mode button dimming/disabling, Wikitext-first mode transition invariant, zero-shift OOUI inline toggle CSS alignment, logged-in user test harness, and version bump `v1.5.2`.
    - Planned rollout sequence: Ring 0 (tag baseline), Ring 1 (Meta script lead `m:User:Powercycler/refdiff.js`), Ring 2 (en.WP SHA pointer `en:User:Powercycler/refdiff.js` and doc version bump), verified via `npm run check:deploy`.

### 2026-10-14: Tracked TODO for Inter-Template Diff Fragment Alignment (Dwight D. Eisenhower diff=1380014667 — Step R.21)
* **Evaluation & Diagnosis:**
  * Analyzed [Dwight D. Eisenhower (diff=1380014667)](https://en.wikipedia.org/w/index.php?title=Dwight_D._Eisenhower&diff=prev&oldid=1380014667), an edit by editor `Alaexis` using `CNfirmed` where an unreferenced statement with `{{citation needed|date=August 2025}}` was sourced with two book citations: `<ref>{{cite book |title=Steven Zaloga...}}</ref><ref>{{Cite book |last=Zaloga... |date=2011...}}</ref>`.
  * MediaWiki diff engine aligned identical wikitext tokens (`{{`, `|date=`, and `}}`) across the different template types. This caused the opening `<ref>` and closing `</ref>` tag markers to be individually wrapped in `<ins class="diffchange diffchange-inline">` spans (`<ins>&lt;ref&gt;</ins>` and `<ins>&lt;/ref&gt;</ins>`), while inner template content was split across multiple `<ins>` spans.
  * When `REF_REGEX` matched `&lt;ref&gt;</ins>...`, the match contained an unclosed `</ins>`, causing `hasBalancedDiffTags` to reject the match and leaving the newly added citations undecoupled in prose.
* **Tracking & Action Item:**
  * Created formal action item **Step R.21** elevated to **P0 (Immediate Pre-Pilot Priority)** in [`LOG.md`](LOG.md) to implement boundary normalization for individually wrapped `<ref>` markers and add unit regression tests.
  * Cataloged in Section 3.3 Real-World Diff Verification Register as a P0 Pre-Pilot Blocker for key customer CNfirmed.

### 2026-10-14: Implementation & Verification of Step R.21 (Dwight D. Eisenhower diff=1380014667 / CNfirmed)
* **Strict Scope Architecture:**
  * Implemented `hasDeletedCn(delHtml)` strictly scoped to deleted/modified `{{citation needed|...}}` and `{{cn|...}}` maintenance templates (both parameterized and bare), intentionally avoiding generic or unbounded inter-template transformations.
  * Built `normalizeCnDiffPair(delHtml, addHtml)`:
    - Normalizes the deleted template into a single cohesive `<del class="diffchange diffchange-inline">` block.
    - Consolidates the added citation unit into a cohesive `<ins class="diffchange diffchange-inline">` block.
    - Guarded with `isPureRefSequence()` to strictly guarantee that no adjacent prose can ever be swallowed.
  * Integrated defensively across `applyDecoupling`, `transformProseCells`, `normalizeDiffTags(str, delStr)`, and `parseRefs(html, delHtml)`.
* **Automated Verification:**
  * Added unit tests in `tests/test_utils.js` (detecting and normalizing bare/parameterized forms, negative tests on unrelated templates).
  * Added parser tests in `tests/test_parser.js` verifying that both citations from the Eisenhower diff extract cleanly.
  * Added pipeline tests in `tests/test_pipeline.js` asserting proper prose badge substitution and citation row decoupling.
  * Added real-DOM tests in `tests/test_jsdom.js` validating JSDOM table transformation and byte-for-byte Memento restoration.
  * Total test suite expanded to **129/129 passed** (0 failed). All 10 deployment integrity checks green.
* **Live CDP Verification:**
  * Verified live in Chromium on English Wikipedia against revision `diff=1380014667`:
    - Decoupled both citations into dedicated citation rows (`totalCitRows: 2`).
    - Rendered added badges in added prose (`rowHasBadges: 2`).
    - Struck out `{{citation needed|date=August 2025}}` cleanly in deleted prose.
    - Verified byte-for-byte Memento restoration back to Wikitext mode.
    - Screenshot archived to `/tmp/refdiff_screenshots/eisenhower_diff_decoupled.png`.
* **Milestone Status:** Step R.21 marked `✅ Finished`. All pre-pilot blockers resolved.

### 2026-10-15: Pre-Flight Verification Passed & Version Bump to v1.5.3 (Step R.20 Candidate)
* **Manifest Synchronization & Uprev (`v1.5.3`):**
  - Executed `node scripts/bump_version.js patch` to bump release candidate to `v1.5.3`.
  - Verified manifest sync across `package.json`, `package-lock.json`, `refdiff.js` (`@version 1.5.3` and `const VERSION = '1.5.3'`), and `refdiff.wiki` (`| version = 1.5.3`).
* **Full Pre-Flight Quality Gate Execution (`npm run preflight`):**
  - `npm run lint`: **0 errors, 0 warnings** across all JavaScript files.
  - `npm test`: **129/129 passed** (0 failed) across all 15 modular test suites.
  - `node tests/test_deployment.js`: **10/10 passed** verifying zero BOM, nowiki encapsulation, zero `console.log`, file size budget (<120 KB), userbox template syntax, and byte-for-byte Memento restoration.
  - `npm run test:live`: **8/8 checks passed** in Chromium via CDP on [Odoacer `diff=1379486498`](https://en.wikipedia.org/w/index.php?diff=1379486498) (mode switching, Visual Diff disabling, inline toggle lock, anchor discovery, light/dark mode tokens).
  - `npm run test:bench`: **5/5 live benchmark diffs passed** with byte-for-byte Memento roundtrip (Bihar Legislative Assembly, Odoacer, Zagreb Airport 114 refs, Cosmic Inflation, Donnie Brasco).
* **Release Status:** Step R.20 Phase 1 (Pre-Flight Testing) cleared; candidate is fully verified and prepared for Ring 0–2 on-wiki deployment per `ROLLOUT_PLAN.md`.

### 2026-10-15: Triaged & Documented Real-World Edge Cases: Paragraph Merge Diff Entanglement (Leonardo Torres Quevedo) & Vancouver Anchor Resolution (Respiratory Therapist)
* **Triaged Leonardo Torres Quevedo ([diff=1380356173](https://en.wikipedia.org/w/index.php?title=Leonardo_Torres_Quevedo&diff=prev&oldid=1380356173)):**
  - **Symptom:** User reported "This looks broken". Diff rendering fails to decouple citations cleanly and produces corrupted diff spans.
  - **Root Cause:** Deleting `\n\n` between two paragraphs ending with citations prompted MediaWiki's `wikidiff2` to match the trailing `</ref>` from paragraph 2 with that from paragraph 1. This wrapped paragraph 2's wikitext and intermediate `<ref>` tags inside an `<ins class="diffchange diffchange-inline">` starting after the body of ref 1 (`...No. 90, 2020<ins>.</ref> In 1919... <ref>...</ref> ... 2008</ins>.</ref>`). RefDiff's tag balance validator rejected the split tags, preventing decoupling.
  - **Remediation Assigned:** Tracked as **Step R.22** (Tier 1 — High) to implement paragraph-merge pre-normalization in `normalizeDiffTags()`.
* **Resolved Respiratory Therapist ([diff=1380407169&oldid=1372216818](https://en.wikipedia.org/w/index.php?title=Respiratory+therapist&diff=1380407169&oldid=1372216818) — Step R.23 ✅):**
  - **Symptom:** User reported "ref7 not working". The badge rendered as `⟨ref7⟩`, but its `href` was `null` (plain `<span>`), so clicking did not jump and hovercard popups did not activate.
  - **Kernursache:** Anonymer (unbenannter) Einzelnachweis im Teildiff. MediaWiki nummeriert anonyme Einzelnachweise im Gesamtartikel sequentiell (`cite_note-1`, `cite_note-2` ... `cite_note-31`). Im Teildiff (Zeile 141) ist das Zitat lokal die 7. Quelle der Zeile (`⟨ref7⟩`), global aber Nummer 31.
  - **Lösungsarchitektur:** **Zweistufiges System ohne bibliographisches Ref-Parsing:**
    1. **Stufe 1 (Bestehende Quellen mit DOM-Treffern):** RefDiff überlässt die Vorschau vollständig MediaWikis nativer Extension **Reference Previews** (`mw.popups`). Statt Vorlagenfelder (`author=`, `title=`) fehleranfällig zu parsen, scannt `findCiteNoteAnchor()` bei anonymen Refs nach persistenten Identifikatoren (DOI, PMID, PMC, ISBN, URL) und matcht sie direkt im DOM gegen `a[href*="..."]` in `.references li[id^="cite_note-"]`.
    2. **Stufe 2 (Nicht-Treffer & neu hinzugefügte Quellen — "Listenformat in der Preview"):** Wenn `findCiteNoteAnchor()` `null` liefert, zerlegt `parseTemplateList(rawContent)` Zitationsvorlagen (`{{cite journal}}`, `{{cite web}}`, `{{sfn}}`) unter Beachtung verschachtelter Klammern deterministisch in Vorlagenname und `• key: val`-Listenzeilen. Die Vorschau wird sowohl als mehrzeiliger `title`-Tooltip als auch über eine elegante schwebende `.refdiff-preview-card` (`role="tooltip"`, `<ul><li>`-Listenstruktur, dark-mode-ready) bereitgestellt, wobei während der Vorschaukarten-Anzeige native OS-Tooltips unterdrückt werden, um Überlagerungen zu verhindern.
  - **Implementierung & Verifikation:**
    - Step 3 in `findCiteNoteAnchor()` um DOI-, PMID-, PMC-, ISBN- und URL-Suche erweitert.
    - `parseTemplateList()`, `createProseBadgeElement()`, `showBadgePreview()` und `hideBadgePreview()` in `refdiff.js` implementiert.
    - 4 neue Unittests in `tests/test_anchor.js` (DOI `10.1183/20734735.0310-2019` $\to$ `#cite_note-31`, PMID, PMC, ISBN).
    - 5 neue Unittests in `tests/test_renderer.js` (`parseTemplateList`, `{{sfn}}`, `title`-Listenformat, `.refdiff-preview-card` Toggle & OS-Tooltip-Unterdrückung).
    - Gesamte Testsuite auf **138/138 Tests grün** ausgebaut (`npm test`).
    - Linting fehlerfrei (**0 ESLint-Warnungen, 0 Fehler** via `npm run lint`).
    - 10/10 Deployment-Release-Gates bestanden (`node tests/test_deployment.js`).
    - Step R.23 in Immediate Pre-Pilot Priority (P0) als `✅ Finished` signiert.
 
### 2026-10-15: Pre-Flight Quality Gates Fully Passed (Stage 5 & Stage 6) for v1.5.3 Release Candidate
* **Stage 5 (Visual Inspection & Audit Capture):**
  - Executed `npm run inspect` (`scripts/inspect_diff.py`): Injected cleanly into Chromium (CDP port 9222) on Bihar diff (`diff=1379207737`), confirmed OOUI button mounting and decoupled citation rows in 1.78 s.
  - Executed `npm run capture` (`scripts/capture_full_audit.py`): Captured full visual audit across Meta Showcase diff (31142550) and Bihar diff (1379207737) in Light and Dark modes.
  - Fixed CSS ID selector escaping (`[id="..."]`) for row IDs containing colons in `scripts/capture_full_audit.py`.
  - All **14/14 PNG screenshots** captured cleanly in 16.37 s.
* **Stage 6 (Automated Pre-Flight Gate `npm run preflight`):**
  - **Syntax & Linting (`npm run lint`):** Passed with **0 errors and 0 warnings**.
  - **Headless Unit & DOM Tests (`npm test`):** **138/138 passed** (0 failed) in < 250ms across all 15 test suites.
  - **Deployment Integrity Checks (`node tests/test_deployment.js`):** **10/10 passed** (nowiki, zero BOM, zero `console.log`, size budget < 120 KB, version sync, rollback Memento fidelity).
  - **Live Browser CDP Tests (`npm run test:live`):** **8/8 checks passed** in live Chromium on Odoacer diff (Visual Diff disabling, Wikitext-first switching, badge href anchor discovery, Memento roundtrip, inline switch lock, dark mode tokens).
  - **Live CDP Benchmarks (`npm run test:bench`):** **5/5 canonical diffs passed** with byte-for-byte Memento roundtrip (Bihar, Odoacer, Zagreb Airport 114 refs, Cosmic Inflation, Donnie Brasco).
* **Release Gate Status:** Pre-Flight Quality Gate is **100% COMPLETE & CLEARED**. Candidate `v1.5.3` is ready for Ring 0–2 rollout per `ROLLOUT_PLAN.md`.

### 2026-10-17: Production Release & Cross-Wiki Rollout of RefDiff v1.5.3 (Rings 0–2 Fully Deployed)
* **Ring 0 (Release Baseline & Git Tagging):**
  - Git working tree committed clean and tagged: `git tag -a v1.5.3 -m "Release v1.5.3"` (`commit fa9e7f2`).
  - Release SHA-1 for [`refdiff.js`](refdiff.js) (`v1.5.3`, 117.9 KB): `46c5f070399d89dc1f330dafeea0c58bb46901a2` (Short: `46c5f070`).
  - Full test suite verified green: 138/138 unit/JSDOM tests and 10/10 deployment integrity checks passing.
* **Live User Visual Inspection Gate (Interactive Sign-Off):**
  - Replaced automated visual capture shortcuts with live human inspection in Chromium on port 9222 via persistent CDP daemon (`scripts/run_persistent_cdp_patch.py`).
  - User directly reviewed live interactive diffs in browser:
    - [Dwight D. Eisenhower (`diff=1380014667`)](https://en.wikipedia.org/w/index.php?title=Dwight_D._Eisenhower&diff=prev&oldid=1380014667): Verified Step R.21 boundary decoupling of `{{citation needed}}` from `<ref>` tags, zero prose swallowed, and Memento restoration.
    - [RefDiff Showcase (`diff=1380240829`)](https://en.wikipedia.org/w/index.php?title=User:Powercycler/RefDiff/Show_case&diff=1380240829&oldid=1380240443): Verified zero-shift inline toggle alignment, Visual Diff mode disabling/dimming (Step R.11), and Wikitext-first switching.
    - [Bihar Legislative Assembly (`diff=1379207737`)](https://en.wikipedia.org/w/index.php?diff=1379207737): Verified apostrophe attribute parsing and underscore anchor discovery.
* **Ring 1 (Meta-Wiki Script Lead Deployment):**
  - Updated `m:User:Powercycler/refdiff.js` with local `refdiff.js` (`v1.5.3`, SHA-1: `46c5f070`).
  - Live Meta-Wiki Revision ID: **`31176975`** (Saved 2026-10-17 06:17 UTC).
* **Ring 2 (English Wikipedia Early Testing, SHA Pointer Uprev & Documentation):**
  - Early-tested and verified via `en:User:Powercycler/common.js` (Rev **`1380682062`**).
  - Updated canonical SHA pointer on `en:User:Powercycler/refdiff.js` (Rev **`1380681839`**):
    ```javascript
    // [[m:User:Powercycler/refdiff.js]] (Release SHA-1: 46c5f070, oldid: 31176975)
    mw.loader.load('https://meta.wikimedia.org/w/index.php?title=User:Powercycler/refdiff.js&oldid=31176975&action=raw&ctype=text/javascript');
    ```
    *(Strictly omitted `<nowiki>` comment wrappers; enforced 2-line pure JS loader).*
  - Updated authoritative documentation lead on `en:User:Powercycler/RefDiff` (Rev **`1380682190`**): updated version badge to `1.5.3`, documented identifier matching for native hovercards, and added template list preview specs.
  - Showcase diff update deferred on-wiki: existing showcase diff (`diff=1380240829` covering sections 1–5) remains authoritative for current reviewer tours.
* **Live Deployment Audit (`scripts/check_live_deployment.js`):**
  - All 6 target endpoints verified 100% synchronized and in parity across Wikimedia APIs:
    - `m:User:Powercycler/refdiff.js`: `Rev 31176975` (v1.5.3)
    - `en:User:Powercycler/refdiff.js`: `Rev 1380681839` (Pinned to Meta `31176975`)
    - `en:User:Powercycler/common.js`: `Rev 1380682062` (Production install)
    - `en:User:Powercycler/RefDiff`: `Rev 1380682190` (v1.5.3 Lead docs)
    - `m:User:Powercycler/RefDiff`: `Rev 31167426` (Soft redirect)
    - `en:User:Powercycler/Userbox RefDiff`: `Rev 1380238970` (User space userbox)




