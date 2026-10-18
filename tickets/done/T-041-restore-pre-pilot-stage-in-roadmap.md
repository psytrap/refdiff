# Ticket 041: Restore Immediate Pre-Pilot Stage Before Tiers 1–3 in ROADMAP.md

- **Status:** Done
- **Priority:** P0
- **Tier / Phase:** Immediate Pre-Pilot (P0 — Higher than Tier 1)
- **Scope & Relevant Files:**
  - `ROADMAP.md`
  - `README.md`
  - `tickets/INDEX.md` / `tickets/DONE.md` (when created by Ticket 040)

---

## Description & Context
In the original project execution tracking (formerly `LOG.md` lines 57–65), there was an explicit **Immediate Pre-Pilot (`P0 — Higher than Tier 1`)** milestone positioned *before* Tier 1 (10-User Early Adopter Pilot), Tier 2 (50-User Community Reviewer Scale), and Tier 3 (Beyond 50 Users Mass Deployment). During the documentation restructuring in Ticket 039, this Pre-Pilot stage was inadvertently omitted from `ROADMAP.md`'s Mermaid diagram, milestones table, and progression text, creating a mismatch against historical execution tracking.

This ticket restores and formalizes the **Immediate Pre-Pilot** stage in `ROADMAP.md`:
1. **Pre-Pilot Scope:** Author self-testing on `en:User:Powercycler/common.js`, on-wiki documentation lead and userbox readiness (`refdiff.wiki`), zero-drift verification across local and live environments, and P0 real-world diff parser hardening (handling edge cases from live Wikipedia diffs before expanding to outside editors).
2. **Clear Boundary from Tier 1:** Tier 1 represents the first 10 external early adopters onboarding onto RefDiff, whereas Pre-Pilot represents author-contained validation and tooling foundation.
3. Update `ROADMAP.md` (Mermaid diagram, milestones table, and progression details) and `README.md` roadmap summaries.

---

## Criteria
- [x] Restore the "Immediate Pre-Pilot (P0 — Higher than Tier 1)" stage before Tiers 1–3 in ROADMAP.md's Mermaid diagram, §1.1 Progression Milestones table, and §1.2 Progression Details
- [x] Clearly distinguish Pre-Pilot (author self-testing on en:User:Powercycler/common.js, on-wiki documentation lead & userbox readiness, and P0 real-world diff parser fixes like T-012, T-013, T-016, T-014, T-018) from Tier 1 (10-User Early Adopter Pilot)
- [x] Update README.md roadmap summary to mention Pre-Pilot + Tiers 1–3
- [x] Verify all markdown links and run npm test && npm run lint

---

## Execution Notes
* **Execution Date:** 2026-10-17
* **Execution Scope:** Ticket 041 — Restore Immediate Pre-Pilot Stage in ROADMAP.md
* **Actions Taken:**
  1. Updated `ROADMAP.md` §1 overview, inserting the **Immediate Pre-Pilot (`P0 — In Progress`)** node at the front of the Mermaid adoption flow graph leading to Tier 1.
  2. Added the **Immediate Pre-Pilot (P0)** row to §1.1 Progression Milestones table with explicit target audience (`en:User:Powercycler/common.js`), distribution, and exit criteria.
  3. Added the dedicated `#### Immediate Pre-Pilot: Author Self-Testing & P0 Edge Cases (P0 — Higher than Tier 1)` subsection under §1.2 detailing author self-testing, `wikidiff2` boundary fixes (T-012, T-013, T-016, T-014, T-018), and fail-open verification.
  4. Updated `README.md` master documentation table entry for `ROADMAP.md` reflecting the restored Pre-Pilot stage.
  5. Verified link integrity and ran test suite: 140/140 tests passing, 0 ESLint warnings.
