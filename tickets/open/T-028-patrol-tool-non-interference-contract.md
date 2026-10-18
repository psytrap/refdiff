# Ticket 028: Core Patrol Tool Non-Interference Contract (Twinkle & Ultraviolet)

- **Status:** Todo
- **Priority:** High
- **Tier / Phase:** Tier 2: Community Reviewer Scale (50-User Milestone)
- **Scope & Relevant Files:**
  - `tests/test_jsdom.js`
  - `TESTING.md`
  - `refdiff.js`

---

## Description & Context
Establish automated regression test contracts ensuring RefDiff operates in complete harmony with English Wikipedia's primary patrolling tools (Twinkle and Ultraviolet):
1. Assert that RefDiff mutations are strictly confined to `tbody > tr.diff-deletedline`, `tr.diff-addedline`, and injected `tr.refdiff-cit-row`.
2. Guarantee that header nodes (`tr.diff-title`, `.diff-otitle`, `.diff-ntitle`, `.diff-notice`, `.diff-multi`) and third-party buttons (Twinkle rollback/vandalism links, Ultraviolet CVPI overlay interface) remain 100% byte-for-byte untouched.
3. Test that Twinkle inline diff operations and rollback button clicks work unimpeded when RefDiff is active.

---

## Criteria
- [ ] Add JSDOM test fixture containing simulated Twinkle action links and Ultraviolet CVPI toolbar in diff header
- [ ] Assert that header rows and third-party tool DOM nodes undergo zero mutations during decoupling and rollback
- [ ] Verify event bubbling from third-party buttons is not suppressed or halted by RefDiff
- [ ] All test suites passing (`npm test`)
- [ ] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
