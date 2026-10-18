# Ticket 052: Create Proposal Directory README and Clean Up Top-Level Documentation Index

- **Status:** Done
- **Priority:** Normal
- **Tier / Phase:** Upstream <ref def> Strategy (Phases 1–4)
- **Scope & Relevant Files:**
  - `README.md`
  - `proposal/README.md`
  - `ROADMAP.md`
  - `tickets/INDEX.md`
  - `tickets/DONE.md`

---

## Description & Context
Currently, the top-level repository `README.md` contains multiple direct links to upstream proposal artifacts (`PROPOSAL.md`, `CONCEPT.md`, `POST.md`). The upstream `<ref def>` proposal is an architectural initiative beyond client-side RefDiff and belongs in the project Roadmap (`ROADMAP.md`) and a dedicated `proposal/README.md`, leaving the root `README.md` focused purely on RefDiff:

1. **Clean Up Top-Level `README.md`:** Remove all direct references to `proposal/PROPOSAL.md`, `proposal/CONCEPT.md`, and `proposal/POST.md` from the root documentation index.
2. **Create `proposal/README.md`:** Author a structured overview and index for the `proposal/` directory:
   - `CONCEPT.md`: Deep technical and conceptual architecture for section-level reference definitions in wikitext.
   - `PROPOSAL.md`: Ready-to-submit formal Phabricator task / MediaWiki RFC proposal specification.
   - `POST.md`: Ready-to-use community discussion draft and Anschreiben for Wikipedia talk venues.
3. **Link Proposal via `ROADMAP.md`:** Update `ROADMAP.md` Section 2 (Upstream `<ref def>` Strategy Roadmap) to explicitly reference `proposal/README.md` as the central upstream proposal hub.
4. **Verification:** Ensure all quality gates and test suites pass (`npm test && npm run lint`).

---

## Criteria
- [x] Remove all proposal links (`PROPOSAL.md`, `CONCEPT.md`, `POST.md`) from top-level `README.md`
- [x] Create `proposal/README.md` indexing `CONCEPT.md`, `PROPOSAL.md`, and `POST.md`
- [x] Ensure `ROADMAP.md` Section 2 references `proposal/README.md` as the upstream proposal documentation hub
- [x] All local test suites passing (`npm test`)
- [x] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes

### 1. Front-Door Overview (`proposal/README.md`)
- Authored a dedicated front-door document `proposal/README.md` introducing the upstream `<ref def>` architecture initiative.
- Documented the core concept: section-scoped reference definitions (`<ref def name="...">` and `<references def>`) that decouple source organization from frontend presentation, eliminating template camouflage and citation merge conflicts at the MediaWiki storage tier.
- Indexed all three dossier artifacts in an overview table:
  - `PROPOSAL.md` – Ready-to-submit Phabricator task proposal (clean feature focus, visual diff table, mechanics).
  - `CONCEPT.md` – Comprehensive architecture whitepaper detailing parser interactions, AST analyses, and ecosystem impact.
  - `POST.md` – Ready-to-use community discussion draft and Anschreiben for Wikipedia talk venues (e.g. `Wikipedia talk:Citing sources`).
- Added links back to `ROADMAP.md#2-upstream-ref-def-strategy-roadmap` and `tickets/INDEX.md` (Tickets `T-035`–`T-038`).

### 2. Root Documentation Decoupling (`README.md`)
- Removed direct proposal links (`PROPOSAL.md`, `CONCEPT.md`, `POST.md`) from the root `## Documentation & Project Governance` list.
- Kept root `README.md` strictly focused on RefDiff the client-side tool, while pointing to `ROADMAP.md` for upstream strategic tracks.

### 3. Roadmap Cross-Reference (`ROADMAP.md`)
- Updated Section 2 ("Upstream `<ref def>` Strategy Roadmap") to explicitly reference `proposal/README.md` as the comprehensive dossier index.

### 4. Verification & Quality Gates
- All 141 tests across 15 modular test suites passed with 0 failures (`npm test`).
- Gate 11 verified ticket registry integrity and directory synchronization.
- ESLint checks passed with 0 errors and 0 warnings (`npm run lint`).
