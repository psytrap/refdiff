# Ticket 053: Decompose Monolithic `refdiff.js` into Modular `src/` Files with Build Pipeline

- **Status:** Done
- **Priority:** High
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `src/` (new directory with modular ES/CommonJS components)
  - `scripts/build.js` (bundler producing production distribution `refdiff.js`)
  - `package.json` (add `build` script, update `lint` glob to include `src/**/*.js`)
  - `refdiff.js` (generated bundle with `<nowiki>` header, userscript metadata, and UMD wrapper)
  - `tests/test_deployment.js` (add Gate checking zero build drift between `src/` and `refdiff.js`)
  - `tickets/INDEX.md`

---

## Description & Context
Currently, `refdiff.js` is a monolithic file of 3,058 lines. Although it simulates modularity via an in-file "Virtual File Hierarchy" (comment boundaries for `src/constants.js`, `src/parser.js`, `src/pipeline.js`, etc.), maintaining the entire codebase in a single massive file introduces significant friction for both human reviewers and AI agents:
1. **Agent Attention Dilution & Paging:** Large files exceed tool view limits (800 lines/step) and dilute LLM attention across unrelated subsystems during bug fixes.
2. **Editing Tool Fragility:** Exact string matching in `replace_file_content` is more error-prone in a 3,000-line file than in a focused, 250-line module.
3. **Subagent Merge Collisions:** Multiple autonomous subagents cannot modify different features simultaneously without git merge conflicts in `refdiff.js`.

This ticket establishes a physical `src/` architecture and a fast, deterministic build step while keeping Wikipedia deployment zero-loss and seamless:

1. **Extract Modular `src/` Files:** Decompose the 12 virtual file sections of `refdiff.js` into real, physical files in `src/`:
   - `src/constants.js` — Regex patterns, selectors, CSS classes, storage keys.
   - `src/state.js` — State management, preference storage, memento registry.
   - `src/utils.js` — String sanitization, diff tag normalization, entity extraction.
   - `src/parser.js` — Unified reference and template parser (`parseRefs`).
   - `src/pairing.js` — 3-pass heuristic reference pairing engine.
   - `src/anchor.js` — Footnote anchor discovery and Reference Preview hovercard integration.
   - `src/renderer.js` — Badge creation, preview cards, citation diff row DOM elements.
   - `src/memento.js` — DOM row snapshot and byte-for-byte restore memento.
   - `src/pipeline.js` — Transformation pipeline and table mutator.
   - `src/dom_helpers.js` — DOM queries, categorization, and hook dispatchers.
   - `src/mode_coordinator.js` — 3-way mode switching (visual/wikitext/refdiff).
   - `src/init.js` — Page detection, UI button wiring, lifecycle auto-start.
   - `src/exports.js` — Module entry point assembling the factory and exports.

2. **Deterministic Build Pipeline (`scripts/build.js`):**
   - Author a lightweight, zero-dependency Node build script (`node scripts/build.js` / `npm run build`) that compiles `src/` into the production `refdiff.js` bundle.
   - Ensure the generated `refdiff.js` preserves the exact userscript header (`/* <nowiki> */`, `@match`, metadata), UMD wrapper, and size constraint (< 120 KB).

3. **Build Drift Pre-Flight Gate:**
   - Add a pre-flight check in `tests/test_deployment.js` verifying that `refdiff.js` is byte-identical to `npm run build` output (preventing unbuilt changes to `src/` from slipping into releases).

4. **Lint & Test Verification:**
   - Update `package.json` `"lint"` script to check `src/**/*.js`.
   - Verify that all 141 tests continue to pass with 0 failures and 0 ESLint warnings.

---

## Criteria
- [x] Create `src/` directory and extract all 12 modules from `refdiff.js`
- [x] Author `scripts/build.js` that deterministically bundles `src/` into `refdiff.js`
- [x] Add `"build": "node scripts/build.js"` to `package.json` and update `"lint"` to include `src/**/*.js`
- [x] Add build synchronization check to `tests/test_deployment.js` to prevent drift
- [x] Generated `refdiff.js` satisfies all packaging constraints (`<nowiki>`, UMD, < 120 KB)
- [x] All 141 existing test suite assertions passing (`npm test`)
- [x] Zero ESLint errors or warnings across `src/`, `refdiff.js`, `tests/`, and `scripts/` (`npm run lint`)

---

## Execution Notes

1. **Modular Decomposition (`src/`):**
   - Created `src/` directory and extracted all 13 canonical sections from `refdiff.js`:
     - `src/constants.js` (455 lines)
     - `src/state.js` (22 lines)
     - `src/utils.js` (349 lines)
     - `src/parser.js` (99 lines)
     - `src/pairing.js` (95 lines)
     - `src/anchor.js` (191 lines)
     - `src/renderer.js` (448 lines)
     - `src/memento.js` (64 lines)
     - `src/pipeline.js` (312 lines)
     - `src/dom_helpers.js` (46 lines)
     - `src/mode_coordinator.js` (485 lines)
     - `src/init.js` (357 lines)
     - `src/exports.js` (67 lines)
   - Preserved all inline documentation, parameter annotations, and section boundaries.

2. **Deterministic Build Pipeline (`scripts/build.js`):**
   - Created zero-dependency Node build script `scripts/build.js` exporting `build(options)`.
   - Concatenates UserScript metadata banner (`/* <nowiki> */`, `@match`, UMD factory opening), canonical `src/` modules in sequence, and UMD closing footer (`/* </nowiki> */`).
   - Achieves 100% byte-for-byte equality between `npm run build` output and existing `refdiff.js` (118.7 KB, strictly within 120 KB distribution budget).

3. **Tooling & Configuration (`package.json`, `.eslintrc.json`):**
   - Added `"build": "node scripts/build.js"` to `package.json`.
   - Updated `"lint"` script to `eslint refdiff.js src/**/*.js tests/**/*.js scripts/**/*.js`.
   - Added `.eslintrc.json` override for `src/**/*.js` enabling `globalReturn` and accommodating concatenated script scope while preserving all code style, quote, and semicolon checks.

4. **Zero-Drift Gate (`tests/test_deployment.js`):**
   - Added `validates build synchronization: zero drift between src/ modules and refdiff.js` in `tests/test_deployment.js`.
   - Verifies existence of all canonical modules in `src/` and checks strict string equality against `build()`.

5. **Test & Lint Verification:**
   - 142/142 tests passing across all suites (`npm test`).
   - 0 ESLint errors or warnings across entire repository (`npm run lint`).
