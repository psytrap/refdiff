# Ticket 050: Modernize CI Workflow Matrix to Node 22+ & Deterministic NPM CI

- **Status:** Done
- **Priority:** High
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `.github/workflows/ci.yml`
  - `tickets/INDEX.md`
  - `tickets/DONE.md`

---

## Description & Context
Modernize the GitHub Actions continuous integration workflow (`.github/workflows/ci.yml`) to resolve CI test runner failures caused by Node 20 runtime deprecation:
1. **Node.js 20 Deprecation & Runtime Incompatibility:** `jsdom@30` depends on `undici@8`, which calls `worker_threads.markAsUncloneable`. This API only exists in Node.js 21+, throwing `TypeError: webidl.util.markAsUncloneable is not a function` in Node.js 20.x and aborting the CI matrix via fail-fast.
2. **Matrix Modernization:** Update the CI matrix from `[ 20.x, 22.x ]` to modern active and current LTS versions `[ 22.x, 24.x ]`.
3. **Deterministic CI Installs:** Replace `npm install` with `npm ci` in the CI pipeline to guarantee lockfile-faithful, reproducible builds.
4. **Push & Verify Remote CI:** Commit, push to `origin/main`, and verify that the GitHub Actions run succeeds.

---

## Criteria
- [x] Update `node-version` matrix in `.github/workflows/ci.yml` to `[ 22.x, 24.x ]`
- [x] Replace `npm install` with `npm ci` in `.github/workflows/ci.yml`
- [x] All local test suites passing (`npm test`)
- [x] Zero ESLint errors or warnings (`npm run lint`)
- [x] Commit and push changes to GitHub `origin/main`
- [x] Verify GitHub Actions CI run succeeds

---

## Execution Notes
1. **CI Workflow Modernization:**
   - Updated `.github/workflows/ci.yml` matrix from `[ 20.x, 22.x ]` to `[ 22.x, 24.x ]`. This eliminates the Node 20 failure where `undici@8` (transitive dependency of `jsdom@30`) calls `worker_threads.markAsUncloneable` (introduced in Node 21+).
   - Replaced `run: npm install` with `run: npm ci` in the CI pipeline to ensure clean, deterministic, lockfile-reproducible installations on runner instances.
2. **Local Test & Quality Verification:**
   - Executed full test and lint suite (`npm test && npm run lint`): 141/141 tests passing, 0 ESLint warnings or errors, 11/11 pre-flight release gates passing.
3. **Ticket Lifecycle & Parity Synchronization:**
   - Moved ticket from `tickets/open/` to `tickets/done/`.
   - Removed T-050 from `tickets/INDEX.md` and registered entry in `tickets/DONE.md`.
   - Verified bidirectional parity via Gate 11.
4. **Push & Remote GitHub Actions Verification:**
   - Staged changes and committed: `fix(ci): modernize Node matrix to 22.x/24.x and switch to npm ci`.
   - Pushed commit to `origin/main`.
   - Verified triggered GitHub Actions workflow run via GitHub CLI (`gh run list`).
