# Ticket 026: Test Timeout Hardening & Watchdog Architecture

- **Status:** Todo
- **Priority:** High
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `tests/test_live_benchmarks.py`
  - `tests/test_live_cdp.py`
  - `package.json`

---

## Description & Context
Standardize a robust 4-tier timeout and watchdog architecture across all live browser integration and pre-flight suites (`tests/test_live_benchmarks.py`, `tests/test_live_cdp.py`) to eliminate unbounded async calls and prevent hung test processes:
1. CDP Transport Layer Timeout: Wrap all raw `ws.recv()` calls with `asyncio.wait_for(..., timeout=5.0)` to fail fast if WebSocket frames stall or network drops occur.
2. Condition Polling Watchdog: Replace bare polling loops with bounded condition waiters (`wait_cond()`, default 5.0s ceiling) that capture and dump URL, readyState, and DOM error state upon expiration.
3. Per-Test / Per-Benchmark Deadlines: Enforce a strict maximum deadline (e.g. 10.0s per benchmark diff, 15.0s per integration scenario).
4. Global Suite Timeout: Ensure master entry points (`npm run test:live`, `npm run test:bench`, `npm run preflight`) enforce deterministic process termination.

---

## Criteria
- [ ] Wrap all WebSocket receives in `asyncio.wait_for(..., timeout=5.0)` across Python CDP test scripts
- [ ] Implement bounded condition wait helper with diagnostic DOM dump on timeout
- [ ] Verify benchmark suite exits cleanly with descriptive error if browser connection stalls
- [ ] All test suites passing (`npm test`)
- [ ] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
