# Ticket 010: Visual Diff Isolation and Wikitext-First Mode Switching

* **Status:** Done
* **Date:** 2026-10-14
* **Scope & Relevant Files:** `refdiff.js` (`src/init.js`, `src/mode_coordinator.js`, `src/events.js`), `tests/test_mode_coordinator.js`, `tests/test_live_cdp.py`

## Description & Context
During live multi-diff testing, a serious interaction defect emerged with MediaWiki's VisualEditor diff view:
1. When opening diffs in new tabs or reloading, Visual Diff unexpectedly became the default mode instead of RefDiff or standard Wikitext diff.
2. Clicking Visual Diff failed to persist `refdiff-active: false`, causing preference desynchronization.
3. RefDiff's capture-phase event listeners interfered with VisualEditor's Parsoid diff loading.
4. If a user switched from Visual Diff directly into RefDiff, the wikitext table DOM was missing or corrupted.

## Criteria
- [x] Restrict RefDiff activation strictly to Wikitext diffs (`init()` checks `isVisualDiffActive()`; if active, RefDiff remains completely dormant).
- [x] Visually dim and disable the RefDiff button while in Visual Diff mode (`oo-ui-widget-disabled`, `aria-disabled="true"`, `tabindex="-1"`); intercept and halt direct click events with `stopPropagation()`.
- [x] Enforce a **Wikitext-First** mode transition invariant: reviewers inspecting decoupled citations must switch from Visual mode to native Wikitext diff first, which un-dims the button and enables clean decoupling.
- [x] Deterministically persist user diff preferences: selecting Visual or Wikitext diff sets `refdiffPreferred = false`; selecting RefDiff sets `refdiffPreferred = true`.
- [x] Synchronize diff mode persistence cleanly with MediaWiki's native `visualeditor-diffmode-historical` setting.
- [x] Validate across live authenticated browser navigation in Chromium CDP.

## Execution Notes
1. **Mode Invariants (`src/init.js`, `src/mode_coordinator.js`):**
   - Added `isVisualDiffActive()` detecting `.ve-init-mw-diffPage-diffMode-visual` and related OOUI state.
   - Refactored `init()`: if Visual Diff is active, mounts the disabled button and exits immediately without DOM mutation.
2. **Event Delegation & Preference Sync (`src/events.js`):**
   - RefDiff button clicks in disabled state are immediately suppressed.
   - Synchronized preference updates via `setRefDiffPreferred()` without interfering with native VisualEditor event bubbling.
3. **Verification:**
   - Unit tests added in `tests/test_mode_coordinator.js`.
   - Verified live in Chromium CDP across an 8-step navigation lifecycle: mode persistence, clean Visual $\to$ Wikitext $\to$ RefDiff transitions, and zero Parsoid interference.
