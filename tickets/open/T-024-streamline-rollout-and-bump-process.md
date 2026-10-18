# Ticket 024: Streamline Rollout Protocol & Version Bump Process

- **Status:** Todo
- **Priority:** Normal
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `RELEASE_RUNBOOK.md`
  - `scripts/bump_version.js`
  - `scripts/check_live_deployment.js`

---

## Description & Context
Simplify and streamline the rollout runbook and version bump workflow—focusing on clarity, reduced friction, and painless manual execution without over-engineering complex runners:
1. Frictionless Runbook Checklist: Simplify deployment steps in `RELEASE_RUNBOOK.md` so the operator has clear, direct instructions without ambiguous sub-steps.
2. Clean Version Bump Cadence: Refine `scripts/bump_version.js` to handle manifest synchronization cleanly and intuitively for both pre-flight patch uprevs and post-shipment minor bumps without tag drift.
3. Straightforward On-Wiki Copy Workflow: Document exact copy-paste snippets and canonical URLs so publishing to on-wiki targets (Meta script lead, en.WP pointer, docs lead) is fast and error-free.
4. Clear Verification Sequence: Streamline the order of manual checks and verification commands (`check_live_deployment.js`) to ensure confident release sign-off.

---

## Criteria
- [ ] Streamline `RELEASE_RUNBOOK.md` into an unambiguous, linear checklist
- [ ] Ensure `scripts/bump_version.js` supports clean two-phase cadence (pre-flight patch, post-shipment minor)
- [ ] Document clear manual copy-paste instructions for Meta-Wiki and en.WP endpoints
- [ ] All test suites passing (`npm test`)
- [ ] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
