# Ticket 022: Fail-Open Crash Isolation & Top-Level Boundary

- **Status:** Todo
- **Priority:** High
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `refdiff.js`
  - `tests/test_init.js`
  - `tests/test_jsdom.js`

---

## Description & Context
To protect patrollers and reviewers during the Tier 1 Pilot, RefDiff must guarantee zero blast radius on the user's browser environment. If RefDiff encounters an unhandled runtime error (e.g. malformed third-party diff DOM, unexpected skin mutation, or storage exception), it must fail open cleanly:
1. Wrap top-level `init()` and table mutators in a fail-open `try...catch` boundary.
2. Automatically invoke `restoreOriginal(table)` if an exception occurs mid-transformation.
3. Suppress fatal bubbling so subsequent scripts in `common.js` (Twinkle, HotCat, Popups) execute normally without interruption.
4. Log diagnostic information safely via `mw.log.warn` or `console.error`.

---

## Criteria
- [ ] Wrap `init()` and main pipeline entry points in top-level fail-open boundary
- [ ] Verify table rolls back cleanly to native state on simulated injection error
- [ ] Add unit/JSDOM test in `tests/test_init.js` asserting unhandled error is caught and native DOM preserved
- [ ] All test suites passing (`npm test`)
- [ ] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
