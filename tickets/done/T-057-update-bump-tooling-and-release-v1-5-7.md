# Ticket 057: Update Version Bump Tooling for `src/constants.js` & Release `v1.5.7`

- **Status:** Done
- **Priority:** High
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `scripts/bump_version.js`
  - `src/constants.js`
  - `package.json`
  - `package-lock.json`
  - `refdiff.js`
  - `refdiff.wiki`
  - `tickets/INDEX.md`
  - `tickets/DONE.md`

---

## Description & Context
Following the decomposition of `refdiff.js` into modular `src/` files (T-053), the automated version bump script (`scripts/bump_version.js`) must be updated to maintain the new source of truth in `src/constants.js` and rebuild `refdiff.js` deterministically:

1. **Update `scripts/bump_version.js`:**
   - Synchronize `const VERSION = 'X.Y.Z'` in `src/constants.js`.
   - Invoke `build()` from `scripts/build.js` so that `refdiff.js` is automatically rebuilt with updated headers and module content.
   - Maintain synchronization across `package.json`, `package-lock.json`, and `refdiff.wiki`.
2. **Execute Patch Release (`1.5.7`):**
   - Execute `node scripts/bump_version.js patch` to advance from `1.5.6` to `1.5.7`.
3. **Verify Quality Gates:**
   - Run `npm test && npm run lint` to guarantee all 142 assertions pass, zero build drift (Gate 7), and ticket parity (Gate 11).
4. **Commit, Tag & Push:**
   - Commit changes: `chore(release): v1.5.7 baseline with modular src/ architecture and build pipeline`.
   - Create annotated tag: `git tag -a v1.5.7 -m "Release v1.5.7"`.
   - Push `main` branch and tags to GitHub remote `origin`.

---

## Criteria
- [x] Update `scripts/bump_version.js` to update `src/constants.js` and trigger `build()`
- [x] Advance version to `1.5.7` across all manifests and documentation
- [x] All 142 test suite assertions passing (`npm test`)
- [x] Zero ESLint errors or warnings across all files (`npm run lint`)
- [x] Verified zero build drift between `src/` and `refdiff.js`
- [x] Create annotated git tag `v1.5.7`
- [x] Push `main` and release tags to GitHub `origin`

---

## Execution Notes
1. **Tooling Modernization (`scripts/bump_version.js`):**
   - Updated `scripts/bump_version.js` to import `{ build } = require('./build.js')` and target `src/constants.js`.
   - Updated synchronization pipeline:
     1. `package.json` (`"version": "1.5.7"`)
     2. `package-lock.json` (`version` fields)
     3. `src/constants.js` (`const VERSION = '1.5.7';`)
     4. Deterministic bundle rebuild via `build(true)`, updating `refdiff.js` headers and module constants with SHA-1 digest logging (`ae4c08ef`)
     5. `refdiff.wiki` (`| version = 1.5.7`)
2. **Release Execution (`v1.5.7`):**
   - Executed `node scripts/bump_version.js patch` to cleanly advance repository baseline from `v1.5.6` to `v1.5.7`.
3. **Quality Gates Verification:**
   - Ran `npm test` passing all 142 test suite assertions across all 15 test suites.
   - Gate 7 strictly verified byte-for-byte build parity with zero drift between modular `src/` files and `refdiff.js`.
   - Gate 11 confirmed bidirectional ticket parity across `tickets/open/` and `tickets/done/`.
   - Ran `npm run lint` with 0 errors and 0 warnings.
4. **Git Staging, Commit & Annotated Tag:**
   - Staged all scoped files, committed under `chore(release): v1.5.7 baseline with modular src/ architecture and build pipeline`.
   - Created annotated tag `v1.5.7` with message `"Release v1.5.7"`.
   - Pushed `main` and release tags to GitHub remote `origin`.
