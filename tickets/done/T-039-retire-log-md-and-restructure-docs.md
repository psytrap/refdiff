# Ticket 039: Retire Misleading LOG.md and Restructure Project Documentation

- **Status:** Done
- **Priority:** High
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `LOG.md` $\to$ `ROADMAP.md`
  - `ROLLOUT_PLAN.md` $\to$ `RELEASE_RUNBOOK.md`
  - `REFDIFF.md` $\to$ `DESIGN.md`
  - `TEST_PLAN.md` $\to$ `TESTING.md`
  - `AUDIT_STRATEGY.md` $\to$ `REVIEW_GUIDE.md`
  - `TICKET_PROTOCOL.md` $\to$ `tickets/README.md`
  - `ARCHITECTURE.md`
  - `proposal/CONCEPT.md`
  - `README.md`
  - `tests/test_deployment.js`

---

## Description & Context
Currently, `LOG.md` acts as a historical hybrid document containing an amalgam of disparate concerns: static ticket indices, architectural decisions (ADRs), security audit findings, real-world diff test registers, and scaling milestones. In addition, the repository's root documentation suffered from ambiguous naming and overlapping scopes:
1. **Misleading Nomenclature & Purpose:** `LOG.md` is neither an execution log nor a standard changelog; having a monolithic file duplicate ticket metadata undermines the Ticket Protocol where the filesystem (`tickets/todo/`, `tickets/in_progress/`, `tickets/done/`) serves as the single source of truth.
2. **Conflation of Generic Rollout Gates vs. Specific Scaling Strategy:** Generic deployment mechanics (Ring 0 local pre-flights, Ring 1 sandbox testing, Ring 2 opt-in user rollout, Ring 3 global deployment, and rollback runbooks) belong in a release runbook. In contrast, specific scaling strategy milestones (Tier 1: 10-user early adopter pilot, Tier 2: 50-user opt-in gadget, Tier 3: beyond-50 mass deployment, and Upstream `<ref def>` Phases 1–4) require a dedicated strategic roadmap.
3. **Redundant & Ambiguous File Taxonomy:** Filenames like `REFDIFF.md` inside the `refdiff` repository are redundant with `README.md`; `TEST_PLAN.md` and `AUDIT_STRATEGY.md` mix static policies with active developer guides; and `TICKET_PROTOCOL.md` sits loose in the root rather than co-located with the `tickets/` directory. Selecting **`REVIEW_GUIDE.md`** locks in an intuitive, developer- and patroller-friendly document that unites codebase security review with Wikipedia editorial diff review.

This ticket plans the complete retirement of `LOG.md` and executes a comprehensive documentation taxonomy redesign to provide clean, self-describing entry points for developers and Wikipedia maintainers.

---

## Document Naming & Taxonomy Redesign

The following side-by-side taxonomy matrix defines the rationalized structure, establishing clear boundaries between operational release mechanics, product design, testing, code/diff review, and long-term scaling:

| Current File | Proposed Target | Rationale & Scope Distinction |
| :--- | :--- | :--- |
| `LOG.md` | **`ROADMAP.md`**<br>*(alt: `SCALING_ROADMAP.md`)* | Replaces the misleading "log" label with a focused scaling & adoption trajectory: Tier 1 (10-user pilot) $\to$ Tier 2 (50-user gadget) $\to$ Tier 3 (site-wide default) $\to$ Upstream `<ref def>` Phases 1–4. Avoids `EXECUTION_STRATEGY.md` which sounds like JS runtime execution engine. |
| `ROLLOUT_PLAN.md` | **`RELEASE_RUNBOOK.md`**<br>*(alt: `DEPLOYMENT.md`)* | Defines the **generic, repeatable release procedure**: Ring 0 pre-flight checks, Ring 1 Meta-Wiki staging, Ring 2 opt-in pilot, Ring 3 production, and automated rollback runbooks. Kept strictly distinct from project adoption milestones. *(Note: requires updating target paths in `tests/test_deployment.js`)*. |
| `REFDIFF.md` | **`DESIGN.md`**<br>*(alt: `UX_SPEC.md`)* | Eliminates project-name redundancy in repository root. Establishes the authoritative product UX specification: badge visual ergonomics (`⟨~ref~⟩`), diff row decoupling behavior, popover preview cards, and patroller interaction workflows, separating UX from code internals in `ARCHITECTURE.md`. |
| `TEST_PLAN.md` | **`TESTING.md`** | Adopts standard open-source conventions for test suite architecture, JSDOM harness setup, coverage invariants, and houses the §5.1 Real-World Diff Verification Register (linking to `tickets/done/002`–`016`). |
| `AUDIT_STRATEGY.md` | **`REVIEW_GUIDE.md`** | Unifies engineering code review and editorial diff review into a cohesive verification guide: (1) **Codebase Review & Security Invariants** (K1/M1/M6/M7 findings, XSS-safe DOM construction, supply-chain SHA pinning, anti-test-smell rules, and strict zero-deployment boundaries), and (2) **Editorial Diff Review Playbook** (how Wikipedia patrollers review diffs to catch citation camouflage and AI hallucinations). |
| `TICKET_PROTOCOL.md` | **`tickets/README.md`**<br>*(symlink or link from root)* | Renders the 7-step Ticket Protocol automatically when maintainers browse the `tickets/` directory on GitHub, removing clutter from root while preserving visibility. |
| `ARCHITECTURE.md` | **`ARCHITECTURE.md`** *(Retained)* | Retained as the authoritative technical spec for module design, runtime state, and ADRs (§3.1). |
| `README.md` | **`README.md`** *(Retained)* | Master overview table updated to index the new taxonomy. |

---

## Criteria
- [x] Author `ROADMAP.md` containing the specific scaling progression (Tier 1 10-user pilot, Tier 2 50-user opt-in gadget, Tier 3 beyond-50 mass deployment, and Upstream `<ref def>` Phases 1–4)
- [x] Rename `ROLLOUT_PLAN.md` to `RELEASE_RUNBOOK.md`, keeping it strictly focused on generic release rings (Ring 0 to Ring 3), pre-flight gates, rollback runbooks, and deployment endpoints
- [x] Update `tests/test_deployment.js` to reference `RELEASE_RUNBOOK.md` instead of `ROLLOUT_PLAN.md`
- [x] Rename `REFDIFF.md` to `DESIGN.md` focusing strictly on UX specifications, badge ergonomics, and reviewer workflows
- [x] Rename `TEST_PLAN.md` to `TESTING.md`, embedding §5.1 Real-World Diff Verification Register and updating references to `tickets/done/002`–`016`
- [x] Rename `AUDIT_STRATEGY.md` to `REVIEW_GUIDE.md`, consolidating security review findings (K1, M1, M6, M7), supply-chain invariants, zero-deployment review policies, and the editorial diff-review playbook
- [x] Relocate `TICKET_PROTOCOL.md` to `tickets/README.md` (with root README linkage)
- [x] Relocate §3.1 Architectural Decision Records (ADRs) to `ARCHITECTURE.md` (client-side) and `proposal/CONCEPT.md` (upstream syntax)
- [x] Remove static ticket status tables from documentation so `tickets/{todo,in_progress,done}/` directory state machine remains the sole source of truth
- [x] Safely retire `LOG.md` (replaced by clean `ROADMAP.md` with registers redistributed to canonical documents)
- [x] Update `README.md` master documentation table reflecting all renamed files
- [x] Verify that all cross-document markdown links resolve cleanly across the entire repository (0 broken links verified across 11 governing documents)
- [x] Verify test suite passes completely (`npm test`: 140/140 passed) and linter is clean (`npm run lint`: 0 errors, 0 warnings)

---

## Execution Notes
* **Execution Date:** 2026-10-17
* **Execution Scope:** Ticket 039 — Document Restructuring & Taxonomy Overhaul
* **Actions Taken:**
  1. **File Migrations:**
     - `LOG.md` $\to$ `ROADMAP.md`: Authored dedicated scaling roadmap document containing the 3-tier scaling progression, upstream `<ref def>` phases, and ticket directory pointers without static tables.
     - `AUDIT_STRATEGY.md` $\to$ `REVIEW_GUIDE.md`: Unified codebase quality review (Pillar 1) and editorial diff review playbook (Pillar 2). Embedded the authoritative K1/M1/M6/M7 findings register in §2.1.
     - `TEST_PLAN.md` $\to$ `TESTING.md`: Expanded §5.1 to embed the full Real-World Diff Verification Register (12 diffs including *Benny Indra Ardhianto* `diff=1337298010`) and all 12 detailed diagnostic subsections.
     - `ROLLOUT_PLAN.md` $\to$ `RELEASE_RUNBOOK.md`: Maintained strict focus on generic release rings (Rings 0–3), pre-flight gates, and rollback runbooks.
     - `REFDIFF.md` $\to$ `DESIGN.md`: Established product UX specification, badge visual ergonomics, and reviewer interaction models.
     - `TICKET_PROTOCOL.md` $\to$ `tickets/README.md`: Co-located the 7-step Ticket Protocol inside the `tickets/` directory with relative link updates.
  2. **Register Redistribution (Zero Information Loss):**
     - §3.1 ADRs: Embedded RefDiff client decisions (including i18n deliberate omission rationale) into `ARCHITECTURE.md` §10 and upstream `<ref def>` storage decisions into `proposal/CONCEPT.md` §6.2.
     - §3.2 Findings: Consolidated K1, M1, M6, M7 into `REVIEW_GUIDE.md` §2.1 linking to Ticket 007.
     - §3.3 Real-World Diffs: Transferred 100% of diff triage history and diagnostics into `TESTING.md` §5.1.
  3. **Test & Link Verification:**
     - Updated `tests/test_deployment.js` to reference `RELEASE_RUNBOOK.md` and `TESTING.md`. Passed 10/10 pre-flight checks.
     - Updated `scripts/check_live_deployment.js` and `scripts/check_toolpage_installer.py`.
     - Executed automated link validation script: verified 0 broken markdown links across all 11 governing documents.
     - Executed full test suite: 140/140 tests passing (0 failures), 0 ESLint warnings.
  4. **Git Boundary:** Zero commits created; all changes remain in working directory for reviewer staging.
