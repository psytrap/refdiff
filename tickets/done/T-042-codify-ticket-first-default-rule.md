# Ticket 042: Codify "Ticket-Only by Default" Rule and Phase-Based Backlog Sorting

- **Status:** Done
- **Priority:** P0
- **Tier / Phase:** Immediate Pre-Pilot (P0 — Higher than Tier 1)
- **Scope & Relevant Files:**
  - `.agent/rules/ticket-first-workflow.md` (workspace-level Antigravity rule automatically injected into agent context in every session)
  - `tickets/README.md` (add Golden Rule: Default to Ticket Creation Only, and formalize Phase-Based Backlog Sorting rules)
  - `tickets/INDEX.md` (when created by Ticket 040: structure and sort backlog sections strictly by project phase)
  - `REVIEW_GUIDE.md` (§1 Specification-Driven Agentic Coding Governance)
  - `README.md` (Documentation & Project Governance)

---

## Description & Context
The project operates strictly under a ticket-driven architecture where all changes, bug fixes, feature ideas, and documentation updates must be codified as tickets prior to implementation. The user established the Golden Rule:
> *"Rule. When I ask you something. then only create a ticket without further action"*

Currently, this behavior exists only in conversational context. Furthermore, tickets in the backlog must be organized and sorted strictly by project phases to reflect chronological execution priority and strategic delivery milestones.

This ticket unites both governance requirements into a single canonical ticket:
1. **Ticket-Only by Default Rule:**
   - Formalize a workspace rule at `.agent/rules/ticket-first-workflow.md` using Antigravity's rule discovery system so every agent session automatically adheres to this invariant.
   - Codify the "Ticket-Only by Default" Golden Rule in `tickets/README.md` as the foundational principle preceding the 7-step Ticket Execution Protocol.
   - Update governance sections in `REVIEW_GUIDE.md` (§1) and `README.md` describing how agents and developers must interact with the ticket state machine.
2. **Project-Phase Backlog Sorting:**
   - Formalize the phase-based sorting structure in `tickets/README.md` and `tickets/INDEX.md`.
   - Organize tickets strictly by canonical project phases:
     1. `Immediate Pre-Pilot (P0 — Higher than Tier 1)`
     2. `Tier 1: Early Adopter Pilot (10-User Milestone)`
     3. `Tier 2: Community Reviewer Scale (50-User Milestone)`
     4. `Tier 3: Mass Deployment (Beyond 50 Users)`
     5. `Upstream <ref def> Strategy (Phases 1–4)`
   - Within each phase, order tickets by priority (`P0` $\to$ `High` $\to$ `Normal` $\to$ `Low`) and numerical ticket ID.

---

## Criteria
- [x] Create workspace rule .agent/rules/ticket-first-workflow.md enforcing that any user request, bug report, or feature idea defaults strictly to creating a ticket in tickets/backlog/ (or tickets/todo/) without executing code/doc changes unless the user explicitly asks to work on / execute a specific ticket
- [x] Document the "Ticket-Only by Default" Golden Rule at the top of tickets/README.md alongside the 7-step Ticket Execution Protocol
- [x] Formalize and document phase-based backlog sorting in tickets/README.md and tickets/INDEX.md, structuring backlog tickets strictly by canonical project phases in execution order:
  1. Immediate Pre-Pilot (P0 — Higher than Tier 1)
  2. Tier 1: Early Adopter Pilot (10-User Milestone)
  3. Tier 2: Community Reviewer Scale (50-User Milestone)
  4. Tier 3: Mass Deployment (Beyond 50 Users)
  5. Upstream <ref def> Strategy (Phases 1–4)
- [x] Within each project phase, order tickets by priority (P0 -> High -> Normal -> Low) and ticket number
- [x] Document the ticket-based agentic workflow and phase governance in REVIEW_GUIDE.md §1 and README.md
- [x] Verify all markdown links and run npm test && npm run lint

---

## Execution Notes
* **Execution Date:** 2026-10-17
* **Execution Scope:** Ticket 042 — Codify Ticket-Only by Default Rule & Phase-Based Backlog Governance
* **Actions Taken:**
  1. Authored `.agent/rules/ticket-first-workflow.md` defining the workspace rule for AI agents: default strictly to ticket creation upon receiving user requests/ideas, with implementation restricted exclusively to explicit execution commands (`Execute ticket NNN`).
  2. Added Section 0 (**The "Ticket-Only by Default" Golden Rule**) at the top of `tickets/README.md` preceding the 7-step Ticket Execution Protocol.
  3. Added Section 5 (**Phase-Based Backlog Organization**) to `tickets/README.md` formalizing strict ordering by canonical project phase (Immediate Pre-Pilot $\to$ Tier 1 $\to$ Tier 2 $\to$ Tier 3 $\to$ Upstream Phases 1–4) and priority (`P0` $\to$ `High` $\to$ `Normal` $\to$ `Low`).
  4. Updated `REVIEW_GUIDE.md` §1 to document the specification-driven agentic coding governance framework, ticket boundaries, and phase prioritization.
  5. Updated `README.md` master documentation directory entries for `tickets/README.md` and `tickets/` describing the Golden Rule and phase governance.
  6. Verified link integrity (0 broken links) and ran full test and lint suite (140/140 passed, 0 ESLint warnings).
