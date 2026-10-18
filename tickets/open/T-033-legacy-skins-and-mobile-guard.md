# Ticket 033: Legacy Skin Support (Vector 2010 / Monobook) & Mobile Guard

- **Status:** Todo
- **Priority:** Normal
- **Tier / Phase:** Tier 3: Mass Deployment (Beyond 50 Users)
- **Scope & Relevant Files:**
  - `refdiff.js`
  - `tests/test_init.js`
  - `tests/test_jsdom.js`

---

## Description & Context
Expand skin compatibility beyond Vector 2022 and establish safe mobile guards:
1. Vector 2010 & Monobook: Provide graceful fallback button bar (`#refdiff-mode-bar`) when MediaWiki's OOUI button group is absent. Ensure table styling and line markers align cleanly.
2. MinervaNeue (Mobile Web): Detect mobile skin (`skin === 'minerva'`) and cleanly self-disable with zero DOM mutations to prevent mobile diff layout corruption.
3. Timeless: Verify diff table decoupling on Timeless skin.

---

## Criteria
- [ ] Verify fallback mode bar mounts cleanly on Vector 2010 and Monobook fixtures in JSDOM
- [ ] Verify self-disablement when `skin-minerva` class or mobile viewport is active
- [ ] Add unit tests in `tests/test_init.js` asserting mobile guard behavior
- [ ] All test suites passing (`npm test`)
- [ ] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
