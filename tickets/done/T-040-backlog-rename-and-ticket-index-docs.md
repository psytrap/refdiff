# Ticket 040: Streamline Ticket State Machine to tickets/open and tickets/done with T-NNN Taxonomy

- **Status:** Done
- **Priority:** High
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `tickets/open/` & `tickets/done/` directory architecture
  - `tickets/INDEX.md` (dashboard of all tickets in `tickets/open/`)
  - `tickets/DONE.md` (register of all completed tickets in `tickets/done/`)
  - `tickets/README.md` (streamline 7-step Ticket Protocol to `tickets/open/` $\to$ `tickets/done/` and standardize on `T-NNN`)
  - Repository-wide documentation (`README.md`, `ROADMAP.md`, `REVIEW_GUIDE.md`, `TESTING.md`, `.agent/rules/ticket-first-workflow.md`)

---

## Description & Context
To improve project visibility, eliminate broken links during active development, and provide a streamlined two-tier ticket state machine:
1. Standardize repository task architecture on two canonical directories:
   - `tickets/open/`: Houses all uncompleted tickets (`Status: In Progress` and `Status: Backlog` / `Status: Open`). Eliminates directory moves during active work, keeping markdown link paths 100% stable.
   - `tickets/done/`: Houses all completed and verified tickets.
2. Adopt canonical ticket identifier syntax: `T-NNN` (e.g. `T-001`, `T-018`, `T-040`) for filenames (`T-NNN-slug.md`) and in-text cross-references.
3. Completely purge legacy step labels (`Step R.xx`, `Step U.xx`, "Legacy Step") across all repository documentation, ticket headers, and scripts.
4. Establish two canonical overview dashboards:
   - `tickets/INDEX.md`: Live index of active in-progress and prioritized backlog tickets categorized by project phase.
   - `tickets/DONE.md`: Historical register of completed tickets.
5. Update `tickets/README.md` and repository guidelines to formalize the streamlined Ticket Protocol.

---

## Criteria
- [x] Streamline ticket directories into tickets/open/ (all active and backlog tickets) and tickets/done/ (completed tickets)
- [x] Standardize ticket filenames on T-NNN-slug.md across tickets/open/ and tickets/done/
- [x] Completely purge legacy step labels (Step R.xx, Step U.xx, Legacy Step) across all documentation and ticket files in favor of T-NNN
- [x] Create tickets/INDEX.md providing a structured overview of all tickets in tickets/open/, sorted by project phase and priority
- [x] Create tickets/DONE.md providing a chronological register of all completed tickets in tickets/done/
- [x] Update tickets/README.md directory diagram and 7-step Ticket Protocol reflecting tickets/open/ and tickets/done/
- [x] Update references across repository docs (README.md, ROADMAP.md, REVIEW_GUIDE.md, TESTING.md, .agent/rules/ticket-first-workflow.md)
- [x] Verify all markdown links and run npm test && npm run lint

---

## Execution Notes
* **Execution Date:** 2026-10-17
* **Execution Scope:** Ticket 040 — Streamline Ticket Architecture to tickets/open & tickets/done with T-NNN Taxonomy
* **Actions Taken:**
  1. Reorganized tickets into a streamlined 2-directory state machine: `tickets/open/` (housing both active in-progress tickets and backlog items) and `tickets/done/` (housing completed tickets). This guarantees markdown link stability during active work without in-flight file path churn.
  2. Standardized all ticket filenames across `tickets/open/` and `tickets/done/` to the canonical `T-NNN-slug.md` format.
  3. Completely eliminated all legacy step labels (`Step R.xx`, `Step U.xx`, "Legacy Step") repo-wide across markdown documents, ticket headers, and test scripts, standardizing exclusively on `T-NNN`.
  4. Authored `tickets/INDEX.md` as the live dashboard indexing `tickets/open/` items, categorized strictly by canonical project phase and priority.
  5. Authored `tickets/DONE.md` as the completion register for `tickets/done/` items with completion dates, titles, and resolution summaries.
  6. Updated `tickets/README.md` (the Ticket Protocol) reflecting the two-directory model and `T-NNN` naming conventions.
  7. Updated references across `README.md`, `ROADMAP.md`, `REVIEW_GUIDE.md`, `TESTING.md`, and `.agent/rules/ticket-first-workflow.md`.
  8. Verified link integrity and ran test suite: 140/140 unit and DOM tests passing, 0 ESLint warnings.
