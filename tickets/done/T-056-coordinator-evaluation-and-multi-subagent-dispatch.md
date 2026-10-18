# Ticket 056: Codify Coordinator Ticket Evaluation and Multi-Subagent Dispatch Architecture

- **Status:** Done
- **Priority:** High
- **Tier / Phase:** Immediate Pre-Pilot (P0 — Higher than Tier 1)
- **Scope & Relevant Files:**
  - `.agent/rules/ticket-first-workflow.md`
  - `tickets/README.md`
  - `REVIEW_GUIDE.md`
  - `tickets/INDEX.md`

---

## Description & Context
Refine the root coordinator agent's ticket handling responsibilities in the Ticket-First Workflow.

Previously, ticket execution assumed a 1:1 mapping where a single subagent was dispatched for every ticket. As the codebase grows modular (with physical `src/` files and distinct subsystems), complex tickets can benefit significantly from specialized or parallel subagent execution.

This ticket formalizes a mandatory **Pre-Dispatch Evaluation** step performed by the coordinator agent prior to initiating execution:

1. **Pre-Dispatch Scope & Coupling Evaluation:**
   Before launching subagents, the coordinator agent must inspect the ticket, examine scoped files, and evaluate the optimal agent concurrency model:
   - **Single-Subagent Execution (Default / Linear):**
     - Sized for cohesive, localized, or sequential changes (e.g. single module edits, simple bug fixes, documentation-only updates).
     - A single autonomous subagent encapsulates the full 7-step lifecycle.
   - **Multi-Subagent Execution (Parallel / Specialized):**
     - Sized for multi-faceted tickets with decoupled, non-overlapping concerns.
     - Examples of multi-agent topologies:
       1. *Implementation + Verification Split:* One subagent implements the source code changes in `src/`, while a second subagent concurrently prepares/runs browser automation tests (CDP) or benchmarks.
       2. *Orthogonal Module Decomposition:* Two subagents concurrently modify non-overlapping files (e.g. Subagent A updates `src/parser.js` while Subagent B updates `src/renderer.js`), leveraging branched workspaces or independent paths to prevent git conflicts.
       3. *Code + Documentation Split:* One subagent updates code and tests, while another updates architectural documentation and walkthroughs.

2. **Coordinator Synthesis & Gate Verification:**
   - In a multi-subagent execution, the coordinator acts as the integrating conductor:
     - Defines discrete, bounded work packages for each subagent.
     - Receives intermediate completion reports.
     - Synthesizes changes and guarantees conflict-free git integration.
     - Runs the final unified gate checks (`npm test && npm run lint`) before transitioning the ticket to `tickets/done/`.

3. **Codification in Governance Documentation:**
   - Update [`.agent/rules/ticket-first-workflow.md`](.agent/rules/ticket-first-workflow.md) Section 2.
   - Update [`tickets/README.md`](tickets/README.md) to document the Pre-Dispatch Evaluation and Multi-Subagent topology.
   - Update [`REVIEW_GUIDE.md`](REVIEW_GUIDE.md) Section 1 (Agentic Pair Programming Governance).

---

## Criteria
- [x] Codify Pre-Dispatch Evaluation (single vs. multi-subagent sizing) in `.agent/rules/ticket-first-workflow.md`
- [x] Codify coordinator synthesis and multi-subagent dispatch patterns in `tickets/README.md`
- [x] Codify the multi-agent governance protocol in `REVIEW_GUIDE.md`
- [x] All local test suites passing (`npm test`)
- [x] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
1. **Pre-Dispatch Evaluation & Concurrency Sizing Codification:**
   - Updated [`.agent/rules/ticket-first-workflow.md`](.agent/rules/ticket-first-workflow.md) Section 2 with explicit pre-dispatch evaluation requirements:
     - *Single-Subagent Execution (Default / Linear):* Dedicated to cohesive, localized, or sequential tasks where one subagent encapsulates steps 1–7 end-to-end.
     - *Multi-Subagent Execution (Parallel / Specialized):* Dedicated to multi-faceted tickets with orthogonal, non-overlapping concerns (e.g. implementation + CDP verification, orthogonal `src/` modules, code + documentation synchronization).
     - Codified Coordinator Synthesis & Integration duties: discrete work packaging, progress synthesis, collision resolution, and unified pre-flight quality verification.
2. **Workflow Guide Alignment:**
   - Updated [`tickets/README.md`](tickets/README.md) Section 2 to detail the Coordinator Pre-Dispatch Evaluation, multi-subagent concurrency topologies, synthesis duties, and the 7-step lifecycle.
3. **Review Guide Governance Synchronization:**
   - Updated [`REVIEW_GUIDE.md`](REVIEW_GUIDE.md) Sections 1.1 and 1.2 to codify Pre-Dispatch Evaluation, multi-subagent sizing, and conductor synthesis across agent pair programming invariants.
4. **Verification & Quality Gate Execution:**
   - Executed full test and lint suites (`npm test && npm run lint`):
     - 142/142 tests passing across unit, DOM, integration, benchmark, and deployment pre-flight suites.
     - 0 ESLint errors and 0 warnings.
