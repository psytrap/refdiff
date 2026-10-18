# Ticket 029: Client-Side Observability & Diagnostic Troubleshooting Mode

- **Status:** Todo
- **Priority:** Normal
- **Tier / Phase:** Tier 2: Community Reviewer Scale (50-User Milestone)
- **Scope & Relevant Files:**
  - `refdiff.js`
  - `tests/test_init.js`
  - `refdiff.wiki`

---

## Description & Context
Implement a structured, opt-in diagnostic troubleshooting mode for reviewers and maintainers investigating complex diff parsing or skin anomalies:
1. Enable via URL parameter `?refdiff_debug=1` or configuration object `window.refdiffConfig = { debug: true }`.
2. Provide structured output via `mw.log` / `console.debug` detailing:
   - MediaWiki revision IDs and diff mode detected
   - Parsed citation counts, types (add, del, mod), and pairing slot allocations
   - Execution timings (pipeline parse, transform, DOM injection in ms)
   - Fallback and anchor resolution paths
3. Strictly maintain production hygiene: zero `console.log` in production mode, passing `tests/test_deployment.js`.

---

## Criteria
- [ ] Implement `?refdiff_debug=1` parameter detection and structured diagnostic logger
- [ ] Ensure diagnostic logger is completely silent in standard production runs
- [ ] Verify `test_deployment.js` zero-console-log check passes without violation
- [ ] All test suites passing (`npm test`)
- [ ] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
