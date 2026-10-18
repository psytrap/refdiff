# Ticket 001: Inception and Two-Tier Architecture Proposal

* **Status:** Done
* **Date:** 2026-10-08
* **Scope & Relevant Files:** `proposal/PROPOSAL.md`, `proposal/CONCEPT.md`, `proposal/POST.md`

## Description & Context
Traditional inline references (`<ref>...</ref>`) suffer from systemic architectural defects on MediaWiki:
1. **Diff Pollution:** Complex citation metadata and sentence text are entangled into massive diff hunks, obscuring simple copyedits and inflating review overhead.
2. **Reviewing "AI Slop":** The surge of generative AI content requires reviewers to quickly audit factual prose claims separately from bibliographic source inventories.
3. **Artificial Merge Conflicts:** Editing two sentences in the same section generates conflicting citation blocks.
4. **The Split-Hunk Problem:** Moving citation definitions to the document-end list creates disjointed diffs and section-editing blind spots.

The goal is to design an architectural solution that decouples inline callouts from section-level citation definitions without breaking global continuous numbering.

## Criteria
- [x] Formulate a Two-Tier Architecture decoupling source storage (Tier 1: section-level definitions) from presentation (Tier 2: global continuous `[1], [2]` numbering aggregated at document end).
- [x] Establish the **Page-Wide Scope** principle ensuring that moving sentences between sections never causes red citation errors (`<ref name="..." />` resolves globally).
- [x] Codify the **"Bots Clean Up"** principle: allow human editors to edit freely while automated bots asynchronously handle block consolidation and re-scoping.
- [x] Evaluate syntax options (`<ref def name="...">`, `<references def>`, `<references hidden>`) and 4 implementation pathways (Git clean/smudge preprocessor, Scribunto Lua module, native `Extension:Cite` hooks, and dynamic LDR hoisting).
- [x] Publish concise feature proposal [`proposal/PROPOSAL.md`](../../proposal/PROPOSAL.md), detailed technical specification [`proposal/CONCEPT.md`](../../proposal/CONCEPT.md), and community consultation draft [`proposal/POST.md`](../../proposal/POST.md).

## Execution Notes
1. **Two-Tier Model Definition:**
   - Tier 1 (Storage): Section-modular reference definitions declared inside definition blocks or `<ref def>` attributes within the section of use.
   - Tier 2 (Presentation): Standard `<references />` list at article bottom maintaining familiar continuous reader numbering.
2. **Resilience & Scoping Decisions:**
   - Evaluated strict section scoping vs. page-wide fallback. Selected **page-wide scope** to guarantee high human fault tolerance against broken footnotes when paragraphs are moved.
   - Formalized the "Bots clean up" asynchronous migration algorithm.
3. **Artifacts Delivered:**
   - `proposal/PROPOSAL.md`: Concise, feature-focused proposal.
   - `proposal/CONCEPT.md`: In-depth specification covering Parsoid lifecycle, VisualEditor interactions, mobile rendering, and performance budgets.
   - `proposal/POST.md`: Ready-to-use consultation text for `en:Wikipedia talk:Citing sources`.
