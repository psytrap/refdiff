# Ticket 032: Accessibility (WCAG 2.1 AA) & Keyboard Navigation

- **Status:** Todo
- **Priority:** High
- **Tier / Phase:** Tier 3: Mass Deployment (Beyond 50 Users)
- **Scope & Relevant Files:**
  - `refdiff.js`
  - `tests/test_renderer.js`
  - `tests/test_jsdom.js`

---

## Description & Context
Ensure RefDiff meets Web Content Accessibility Guidelines (WCAG 2.1 AA) for keyboard users, screen readers, and low-vision editors:
1. Semantic ARIA Attributes: Add semantic `aria-label` attributes to inline badges (e.g. `aria-label="Citation: 1"`, `aria-label="Added citation: name"`).
2. Keyboard Navigation: Ensure all interactive badges (`<sup class="reference refdiff-ref">`) are keyboard-focusable (`tabindex="0"`) and activate jump/scroll on <kbd>Enter</kbd> or <kbd>Space</kbd> keypress.
3. Screen Reader Previews: Ensure `.refdiff-preview-card` has `role="tooltip"` and proper `aria-describedby` linkage.
4. Contrast Compliance: Audit contrast ratios for badge colors (`#14866d` green, `#9a6700` amber, `#b32424` red) in Vector 2022 light and dark themes to ensure >= 4.5:1 ratio against background.

---

## Criteria
- [ ] Add `tabindex="0"` and keyboard event listeners (<kbd>Enter</kbd>/<kbd>Space</kbd>) to all interactive badge elements
- [ ] Add semantic `aria-label` and `role="tooltip"` attributes across badges and preview cards
- [ ] Verify color contrast ratios meet WCAG 2.1 AA standards in light and dark modes
- [ ] All test suites passing (`npm test`)
- [ ] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
