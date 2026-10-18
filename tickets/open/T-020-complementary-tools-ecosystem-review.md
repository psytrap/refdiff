# Ticket 020: Complementary Citation Tools & Ecosystem Review

- **Status:** Todo
- **Priority:** Normal
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `refdiff.wiki`
  - `REVIEW_GUIDE.md`
  - `README.md`

---

## Description & Context
Review, test, and document architectural compatibility and non-interference with complementary Wikipedia tools on Special:Diff. Target tools include:
- wikEdDiff (en:User:Cacycle/wikEdDiff): Inline diff engine with moved-block detection.
- diffedit (m:User:Jon Harald Søby/diffedit.js): In-diff section editing on Special:Diff.
- References segregator (en:User:PleaseStand/References segregator): Edit window citation pane splitter.
- RefCruncher (en:User:Guywan/Scripts/RefCruncher): In-editor ref chip collapsing.
- ProveIt (en:Wikipedia:ProveIt): Graphical citation editing dock.
- HarvErrors (en:User:Trappist the monk/HarvErrors): Shortened footnote and Harvard citation error auditing.
- AI Source Verification (en:User:Alaexis/AI Source Verification.js): In-browser LLM evaluation of citations against claims.
- CNfirmed (en:User:Alaexis/CNfirmed.js): Citation discovery for {{citation needed}} tags.
- SmartDiff (en:User:Nardog/SmartDiff.js): Turns wikilinks, external links, and template/module calls on Special:Diff into clickable links with red-link support.

Curate findings into an on-wiki guide and verify mutual DOM coexistence on diff pages.

---

## Criteria
- [ ] Verify DOM co-existence with wikEdDiff and diffedit on Special:Diff in Chromium CDP
- [ ] Document complementary workflows (e.g. RefDiff for reading diffs + CNfirmed for resolving citations) in `refdiff.wiki` and `README.md`
- [ ] Verify RefDiff controls and badges do not obstruct or collide with third-party tool DOM injections
- [ ] All test suites passing (`npm test`)
- [ ] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
