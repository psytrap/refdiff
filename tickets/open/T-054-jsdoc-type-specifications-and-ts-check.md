# Ticket 054: JSDoc Type Specifications, `// @ts-check`, and Static Type Verification

- **Status:** Todo
- **Priority:** High
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `src/**/*.js` (modular source files extracted in T-053)
  - `jsconfig.json` (compiler configuration for pure JS type-checking)
  - `package.json` (add `"typecheck": "tsc --noEmit"`)
  - `tickets/INDEX.md`

---

## Description & Context
Following the decomposition of `refdiff.js` into modular files under `src/` (T-053), both autonomous AI agents and human contributors benefit substantially from explicit, machine-verifiable interface contracts. 

Rather than incurring the build complexity, source-map overhead, and MediaWiki debugging friction of a full TypeScript transpiler, this ticket introduces **Typed JavaScript via JSDoc annotations and `// @ts-check`**:

1. **JSDoc Typed Contracts:**
   - Define formal `@typedef` declarations for core domain models:
     - `ParsedReference` (`raw`, `clean`, `tag`, `name`, `group`, `isShortenedFootnote`, `isSfn`, `isR`, `isEfn`, `isHarv`, `params`, `sfnAuthorYear`, `pageSuffix`)
     - `DiffHunk` / `PairingSlot` (`oldRef`, `newRef`, `status`, `diffType`)
     - `BadgeDescriptor` (`label`, `kind`, `anchorId`, `citeNoteId`, `previewJson`)
     - `DecoupleOptions` (`separateChanged`, `inlineModified`, `debug`)
     - `MementoSnapshot` (`table`, `rows`, `restored`)
   - Annotate all exported function signatures in `src/` with `@param` and `@returns`.

2. **Enable Static Type-Checking (`// @ts-check` & `jsconfig.json`):**
   - Place `// @ts-check` at the top of pure `src/` modules (`src/constants.js`, `src/utils.js`, `src/parser.js`, `src/pairing.js`, `src/renderer.js`, `src/memento.js`, `src/pipeline.js`).
   - Create a lightweight `jsconfig.json` targeting standard DOM and ES2022 libraries with `checkJs: true` and `noEmit: true`.

3. **CI & Developer Feedback Loop:**
   - Add `"typecheck": "tsc --noEmit"` to `package.json` `scripts`.
   - Incorporate `npm run typecheck` into local pre-flight checks and CI validation.

4. **Zero-Runtime Overhead:**
   - Preserves 100% native, un-transpiled JavaScript in `src/` and the compiled `refdiff.js` bundle (< 120 KB distribution budget).

---

## Criteria
- [ ] Create `jsconfig.json` configured for pure JavaScript static type-checking (`checkJs: true`, `noEmit: true`)
- [ ] Add `@typedef` contracts for core RefDiff domain data structures
- [ ] Add comprehensive JSDoc `@param` and `@returns` annotations across `src/` modules
- [ ] Add `// @ts-check` to modular source files in `src/`
- [ ] Add `"typecheck": "tsc --noEmit"` to `package.json`
- [ ] `npm run typecheck` passes with zero diagnostics/errors
- [ ] All 142 existing tests passing (`npm test`)
- [ ] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
*(To be populated by executing subagent)*
