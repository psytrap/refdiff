# Ticket 027: Dynamic AJAX / SPA Lifecycle Re-entrancy & Memory Isolation

- **Status:** Todo
- **Priority:** High
- **Tier / Phase:** Tier 2: Community Reviewer Scale (50-User Milestone)
- **Scope & Relevant Files:**
  - `refdiff.js`
  - `tests/test_jsdom.js`
  - `tests/test_init.js`

---

## Description & Context
On modern MediaWiki skins (Vector 2022) and user scripts (Navigation Popups, QuickDiff, Twinkle Diff preview), diff tables can be dynamically reloaded or swapped via AJAX/SPA hooks without full page refreshes.
1. Add JSDOM simulation of sequential `wikipage.diff` Ajax re-entrancy (e.g. 10 consecutive diff loads with table swaps).
2. Ensure RefDiff correctly re-initializes on swapped diff tables without leaking Memento snapshots or duplicating DOM controls (#refdiff-ooui-btn, #refdiff-mode-bar).
3. Ensure old event listeners and observers are cleanly garbage collected or unbound before attaching to new diff DOM nodes.

---

## Criteria
- [ ] Implement JSDOM multi-cycle diff reload test simulating 10 consecutive table swaps
- [ ] Verify zero duplicate button or UI container elements injected across reloads
- [ ] Verify Memento registry properly releases old table snapshots to prevent memory leaks
- [ ] All test suites passing (`npm test`)
- [ ] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
