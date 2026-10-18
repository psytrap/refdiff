# Ticket 051: Document GitHub Repository in `refdiff.wiki`

- **Status:** Done
- **Priority:** High
- **Tier / Phase:** Immediate Pre-Pilot (P0 — Higher than Tier 1)
- **Scope & Relevant Files:**
  - `refdiff.wiki`
  - `meta_refdiff.wiki`
  - `tickets/INDEX.md`
  - `tickets/DONE.md`

---

## Description & Context
Now that RefDiff is published on GitHub at `https://github.com/psytrap/refdiff`, the on-wiki documentation (`refdiff.wiki` for English Wikipedia and `meta_refdiff.wiki` for Meta-Wiki) should document the repository so Wikipedia editors, gadget reviewers, and script developers can find the open-source repository, automated test suites, CI workflows, and issue tracker:

1. **Infobox (`refdiff.wiki`):** Add `| github = psytrap/refdiff` and/or `| repository = [https://github.com/psytrap/refdiff psytrap/refdiff]` to `{{Infobox user script}}`.
2. **Quality Assurance & Testing / Development (`refdiff.wiki`):** Mention that development and automated test suites (141 tests across Node 22/24) are open-source and continuously integrated on GitHub Actions at `https://github.com/psytrap/refdiff`.
3. **Feedback & Bug Reports (`refdiff.wiki`):** Retain on-wiki talk page `[[User talk:Powercycler/RefDiff]]` exclusively as the user feedback channel (do NOT mention or link GitHub Issues).
4. **See Also (`refdiff.wiki` & `meta_refdiff.wiki`):** Include a direct link to the GitHub repository.

---

## Criteria
- [x] Add GitHub repository link to `{{Infobox user script}}` in `refdiff.wiki`
- [x] Document GitHub repository and automated CI testing in `refdiff.wiki`
- [x] Ensure Feedback & Bug Reports remains on-wiki only (no GitHub issues link)
- [x] Add GitHub repository link to `meta_refdiff.wiki`
- [x] All local test suites passing (`npm test`)
- [x] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
1. **Infobox (`refdiff.wiki`):**
   - Added `| github      = psytrap/refdiff` to `{{Infobox user script}}` in `refdiff.wiki` for direct integration with Wikipedia's user script infobox template.
2. **Quality Assurance & Testing (`refdiff.wiki`):**
   - Updated the section narrative to note that RefDiff is developed open-source on GitHub at `https://github.com/psytrap/refdiff` through agentic pair programming.
   - Updated the unit & integration test count to 141 tests and documented automated CI workflows running on GitHub Actions across Node.js 22.x and 24.x.
3. **Feedback & Bug Reports (`refdiff.wiki`):**
   - Maintained strict on-wiki bug reporting and feedback exclusively on `[[User talk:Powercycler/RefDiff]]` per explicit maintainer directive, omitting any external GitHub Issues links or mentions from the feedback section.
4. **See Also Links (`refdiff.wiki` & `meta_refdiff.wiki`):**
   - Added `* [https://github.com/psytrap/refdiff GitHub repository] – Source code, automated test suites, and CI workflows` to `== See Also ==` in `refdiff.wiki`.
   - Added `* [https://github.com/psytrap/refdiff GitHub repository (psytrap/refdiff)] – Open-source repository and automated test suites` to `== See Also ==` in `meta_refdiff.wiki`.
5. **Verification:**
   - Ran `npm test` verifying all 141 tests pass across 15 test suites and 11 pre-flight release gates.
   - Ran `npm run lint` verifying 0 ESLint errors and 0 warnings.
