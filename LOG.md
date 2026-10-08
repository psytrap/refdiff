# Project Log & Planned Steps

This log records the rationale, architectural decisions, completed milestones, and upcoming action items for the **Section-Scoped References (`<references-def>`)** initiative.

---

## 1. Project Overview & Current Status

* **Status:** Ready for Community & Upstream Outreach (Phase 1)
* **Goal:** Eliminate diff pollution, avoid cross-section merge conflicts, and preserve wikitext readability by decoupling inline reference callouts from section-level citation definitions.
* **Core Artifacts:**
  * 💡 **[PROPOSAL.md](PROPOSAL.md):** 70-line concise proposal (pure feature focus).
  * 📄 **[CONCEPT.md](CONCEPT.md):** Comprehensive technical specification and architecture paper.
  * 📝 **[POST.md](POST.md):** Ready-to-use Wiki post Anschreiben for English Wikipedia ([Wikipedia talk:Citing sources](https://en.wikipedia.org/wiki/Wikipedia_talk:Citing_sources)).
  * 📖 **[README.md](README.md):** Repository introduction and index.

---

## 2. Planned Steps & Action Items (Roadmap)

### Phase 1: Community & Technical Outreach (Immediate Next Steps)
- [ ] **Step 1.1: Submit Wikimedia Phabricator Task**
  * Submit draft to [phabricator.wikimedia.org](https://phabricator.wikimedia.org/maniphest/task/edit/form/1/) tagged with `#extension-cite`, `#Parsoid`, `#MediaWiki-Parser`.
  * Record Phabricator task ID (e.g. `Txxxxxx`) in this log.
- [ ] **Step 1.2: Post to Cite Discussion Pages**
  * Post to `mw:Extension talk:Cite` (MediaWiki.org) and/or `en:Wikipedia talk:Citing sources` (or `de:Wikipedia Diskussion:Einzelnachweise`).
  * Link the discussion to the Phabricator task.
- [ ] **Step 1.3: Community Wishlist Submission**
  * Submit a focused proposal to [meta:Community Wishlist](https://meta.wikimedia.org/wiki/Community_Wishlist) to gather editor endorsements and votes.

### Phase 2: Feedback Synthesis & Specification Iteration
- [ ] **Step 2.1: Monitor Community & Developer Reactions**
  * Track feedback on tag naming (`<references-def>` vs `<references scope="section">`).
  * Note community questions regarding VisualEditor UX and mobile rendering.
- [ ] **Step 2.2: Refine Specification**
  * Incorporate edge cases and consensus items into [CONCEPT.md](CONCEPT.md) and [PROPOSAL.md](PROPOSAL.md).

### Phase 3: Proof of Concept (PoC) Prototype
- [ ] **Step 3.1: Python CLI Demonstration Tool (`ref-scope`)**
  * Build a standalone Python script in this repository using `mwparserfromhell` or `wikitextparser`.
  * Capabilities:
    1. Parse a standard Wikipedia wikitext article.
    2. Extract inline `<ref>` tags and relocate them into section `<references-def>` blocks.
    3. Generate before/after git diff statistics on real Wikipedia sample articles.
- [ ] **Step 3.2: Automated Re-Scoping Bot Prototype**
  * Implement the basic "bot cleanup" algorithm: detect moved `<ref name="..." />` anchors and auto-migrate definitions between `<references-def>` blocks.

### Phase 4: Upstream MediaWiki Integration
- [ ] **Step 4.1: Lua / Scribunto Prototype**
  * Provide a lightweight template/module implementation (`{{#invoke:RefDef|...}}`) for wikis that want to test the workflow without server modifications.
- [ ] **Step 4.2: MediaWiki Extension:Cite Patch (Gerrit)**
  * Work with Wikimedia developers on an experimental patch for `Extension:Cite`.

---

## 3. Architectural Decision Register (ADR)

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| **Primary Tag Name** | `<references-def>` | Clearly indicates declaration/definition without implying immediate HTML rendering. Avoids collision with Extension:Cite's nested "sub-references". |
| **Reader View** | Unified global list at document bottom | Preserves the familiar Wikipedia reader experience and continuous `[1], [2], ...` footnote numbering. |
| **Fault Tolerance** | Page-wide resolution scope | Moving sentences between sections never causes red citation errors; ensures high resilience for human editors. |
| **Bot Philosophy** | "Bots clean up" (simple, async) | Avoids frustrating authors with strict lint errors. Normalization and block consolidation happen asynchronously. |
| **Formatting** | Single-line per `<ref>` inside definition block | Prevents excessive vertical file bloat and ensures atomic, 1-line Git diff hunks per source update. |
| **Diff Tooling Scope** | Zero changes required (`wikidiff2` untouched) | Avoids scope creep and maintainer pushback. Decoupling of claim and source in diff hunks is documented as an acknowledged trade-off mitigated by section locality. |
| **Multi-Page Citations** | Native `details="..."` and template `{{rp}}` | Fully supports MediaWiki's native Sub-referencing (`details="p. 45"`) as well as in-prose page suffixes (`{{rp|45}}`). |

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
  * **Tooling-Friendly Syntax Evaluation (`<references display="no">` / `<references definition="true">`):** Evaluated reusing the existing `<references>` tag with an attribute to address tooling/bot fatigue. Documented that `display="no"` (or `display="none"`) directly resolves human cognitive friction ("why is `<references>` here if it does not display footnotes?") by explicitly suppressing output, matching familiar CSS (`display: none`) and template idioms, while allowing existing AST parsers (`mwparserfromhell`, `wikitextparser`), bots (AWB), and regexes to parse definition blocks without new tag registration, in `PROPOSAL.md` (Section 2) and `CONCEPT.md` (Section 6 & 6.1).
