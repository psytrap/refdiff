# Ticket 046: Document Agent Environment Settings & CDP Browser Skill

- **Status:** Done
- **Priority:** Normal
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `REVIEW_GUIDE.md` (§1 Governance Framework & Environment Settings)
  - `TESTING.md` (§3 Live Browser Testing with Chromium CDP)
  - `tickets/INDEX.md`

---

## Description & Context
Document the governing agent execution environment settings and the Chrome DevTools Protocol (`chromium-remote-debug`) browser automation skill within project specifications:
1. **Agent Environment Settings:** Formalize the environment invariants in `REVIEW_GUIDE.md` (§1):
   - **Writing Style & Natural Language:** Concise, natural, and professional tone in clear, plain, and precise technical English without colloquial jargon or buzzwords.
   - **Visual Indicators & Documentation Scannability:** Clean visual emojis and status indicators (📊, 📋, 🧭, 🎯, 🛡️, 🟢, 🟡, 🔴, 🔵) in headings, status tables, and lists.
   - **Question-Answering Scope:** Direct, immediate answers without unsolicited file modifications or command side-effects.
   - **Design Document / Implementation Plan Prerequisite:** Architectural intent, criteria, and plan formulated prior to executing code modifications.
2. **Chromium Remote Debugging (CDP) Skill Integration:** Formally document the `chromium-remote-debug` procedure in `REVIEW_GUIDE.md` and `TESTING.md`:
   - Dedicated launch command: `/snap/bin/chromium --remote-debugging-port=9222 --user-data-dir=/tmp/chromium-agent --no-first-run --no-default-browser-check`.
   - HTTP/WebSocket DevTools endpoints (`/json/version`, `/json/new`, `/json/list`, `/json/activate`, `/json/close`) for controlling running tabs without browser restarts.
   - Persistent CDP monkey-patching workflow ([`scripts/run_persistent_cdp_patch.py`](scripts/run_persistent_cdp_patch.py)) used to stage and evaluate real Wikipedia diffs interactively before release sign-off.
   - Linux/Snap confinement and networking invariants.

---

## Criteria
- [x] Document agent execution environment settings (writing style, visual indicators, question-answering boundaries, design prerequisites) in `REVIEW_GUIDE.md` §1
- [x] Document `chromium-remote-debug` procedure, launch commands, and HTTP DevTools endpoints in `REVIEW_GUIDE.md` and `TESTING.md`
- [x] Document persistent CDP monkey-patching runner workflow (`scripts/run_persistent_cdp_patch.py`) for live maintainer inspection
- [x] Verify all markdown links across updated documentation
- [x] All test suites passing (`npm test`)
- [x] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
1. **Agent Environment Settings Integration:**
   - Formalized `### 1.2 🧭 Development Environment & Agent Execution Invariants` in [`REVIEW_GUIDE.md`](../../REVIEW_GUIDE.md), capturing:
     - Writing style and technical English language standards (zero buzzwords, conversational filler, or meta-fluff).
     - Strategic visual indicators and emojis (📊, 📋, 🧭, 🎯, 🛡️, 🟢, 🟡, 🔴, 🔵) in documentation and tables.
     - Question-answering scope (direct, immediate chat answers without unsolicited code changes).
     - Architectural design plan prerequisite prior to code modifications.
2. **Chromium Remote Debugging (`chromium-remote-debug`) Procedure Documentation:**
   - Documented isolated launch syntax (`/snap/bin/chromium --remote-debugging-port=9222 --user-data-dir=/tmp/chromium-agent --no-first-run --no-default-browser-check`) across [`REVIEW_GUIDE.md`](../../REVIEW_GUIDE.md) §2.3 and [`TESTING.md`](../../TESTING.md) §3 (Level 4).
   - Documented REST endpoints table (`/json/version`, `/json/new?<URL>`, `/json/list`, `/json/activate/<id>`, `/json/close/<id>`) for headless or interactive tab orchestration.
   - Clarified Linux Snap confinement boundaries and loopback networking on port 9222.
3. **Persistent CDP Monkey-Patching Workflow:**
   - Documented [`scripts/run_persistent_cdp_patch.py`](../../scripts/run_persistent_cdp_patch.py) mechanics: `Target.setAutoAttach` flattening, remote script blocking via `Network.setBlockedURLs` (`*refdiff.js*`), `Page.addScriptToEvaluateOnNewDocument` injection, automated `restoreOriginal()` cleanup, and `Page.frameNavigated` re-injection.
   - Added command reference in [`TESTING.md`](../../TESTING.md) §4.
4. **Synchronized Test Counts & Gates:**
   - Updated test metrics in [`TESTING.md`](../../TESTING.md) to 141 tests reflecting Gate 11.
   - Verified 141/141 tests passing (`npm test`) and zero ESLint errors/warnings (`npm run lint`).
