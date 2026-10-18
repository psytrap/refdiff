# Ticket 019: Surface Live Deployment Drift in Version Bumps & Pre-Flight Checks

- **Status:** Todo
- **Priority:** High
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `scripts/bump_version.js`
  - `scripts/check_live_deployment.js`
  - `package.json`
  - `RELEASE_RUNBOOK.md`

---

## Description & Context
Following the resolution of real-world edge cases (such as the wikidiff2 paragraph-merge boundary shift in T-016), the version bumper bumped the manifest to v1.5.4 and subsequently v1.5.5. While local offline tests passed cleanly (140/140 tests passing), on-wiki endpoints (m:User:Powercycler/refdiff.js and en:User:Powercycler/refdiff.js) remained on v1.5.3 under the repository's Strict Zero Deployment Automation Policy. Because npm test and tests/test_deployment.js only validate local offline consistency, maintainers experienced silent multi-bump drift—believing a fix was live when Wikipedia patrollers were still executing older code.

This ticket introduces automated drift awareness during version bumping and pre-flight verification without breaking offline test guarantees.

---

## Criteria
- [ ] Integrate a non-blocking live deployment drift check into `scripts/bump_version.js` that warns when local version or SHA-1 is ahead of `m:User:Powercycler/refdiff.js`
- [ ] Add optional live audit flag or guidance in `npm run preflight` pointing to `npm run check:deploy`
- [ ] Ensure `npm test` and `node tests/test_deployment.js` remain strictly offline with zero external network requests
- [ ] All unit and DOM test suites passing (`npm test`)
- [ ] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
