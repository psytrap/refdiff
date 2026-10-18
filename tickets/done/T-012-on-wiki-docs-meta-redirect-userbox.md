# Ticket 012: On-Wiki Documentation, Meta Redirect, and Userbox Polish

* **Status:** Done
* **Date:** 2026-10-14
* **Scope & Relevant Files:** `refdiff.wiki`, `meta_refdiff.wiki`, `userbox.wiki`, `AUDIT_STRATEGY.md`, `tests/test_deployment.js`

## Description & Context
To ensure transparency, prevent policy friction, and establish clear community guidance, T-012 executed a comprehensive documentation and user space polish:
1. **AI Disclosure & Beta Declaration:** In compliance with Wikipedia AI governance, add explicit AI assistance disclosures (`{{ai-generated|...}}`) and mark the tool status as `Beta`.
2. **Authoritative Lead Docs (`refdiff.wiki`):** Clean up non-existent tracking categories and redlinks, document agentic engineering methodologies and formal QA governance, and provide one-click ScriptInstaller guidance.
3. **Meta-Wiki Soft Redirect (`meta_refdiff.wiki`):** Replace duplicate or fragmented documentation on Meta-Wiki with a clean cross-wiki soft redirect pointing to English Wikipedia lead docs.
4. **Userbox Usability (`userbox.wiki`):** Deploy a category-free, zero-redlink userbox for early adopters (`{{User:Powercycler/Userbox RefDiff}}`).

## Criteria
- [x] Add `{{ai-generated|...}}` banner and declare `| status = Beta` prominently in the infobox on `refdiff.wiki` / `en:User:Powercycler/RefDiff`.
- [x] Document agentic coding methodology, testing pyramid, and formal QA governance in `refdiff.wiki` and `AUDIT_STRATEGY.md`.
- [x] Prune all non-existent tracking categories, redlinks, and broken template calls from `refdiff.wiki` and `userbox.wiki`.
- [x] Implement one-click ScriptInstaller guidance and update the authoritative showcase diff link (`diff=1380240829`).
- [x] Create `meta_refdiff.wiki` providing a clean cross-wiki soft redirect pointing to `en:User:Powercycler/RefDiff` per `ROLLOUT_PLAN.md` Ring 1.
- [x] Deploy and verify `userbox.wiki` in user space without unwanted category pollution.
- [x] Verify complete synchronization between local `.wiki` files and live on-wiki lead documents via `tests/test_deployment.js`.

## Execution Notes
1. **Documentation Lead (`refdiff.wiki`):**
   - Added AI disclosure notice, `| status = Beta`, and dynamic version placeholder.
   - Documented the test suite metrics (122 tests across 15 suites).
   - Added installation instructions via `User:Powercycler/common.js` and ScriptInstaller.
2. **Meta Soft Redirect (`meta_refdiff.wiki`):**
   - Structured `meta_refdiff.wiki` as a central distribution and soft-redirect hub pointing to English Wikipedia.
3. **Userbox Deployment (`userbox.wiki`):**
   - Stripped automatic category assignments to avoid polluting user pages; styled compact 45px userbox with green `⟨RefDiff⟩` badge.
4. **Verification:**
   - Pre-flight deployment check `node tests/test_deployment.js` confirmed 10/10 checks passing with 0 redlink or category warnings.
