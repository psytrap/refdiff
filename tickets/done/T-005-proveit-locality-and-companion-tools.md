# Ticket 005: ProveIt Section Locality and Companion Tools Analysis

* **Status:** Done
* **Date:** 2026-10-12
* **Scope & Relevant Files:** `proposal/CONCEPT.md`, `LOG.md` (§2.1 T-020, §4), `REFDIFF.md`

## Description & Context
Community Wishlist proposal [W190](https://meta.wikimedia.org/wiki/Community_Wishlist/W190) and the widely used [ProveIt](https://en.wikipedia.org/wiki/Wikipedia:ProveIt) gadget (`MediaWiki:Gadget-Global-ProveIt.js`) highlight a critical limitation in current wikitext workflows:
- When citations are declared using List-Defined References (LDR) at the bottom of an article, editors editing a single section (`#wpTextbox1`) cannot access or edit citation bodies because the definition lives in a different section.
- Section-scoped reference definitions (`<references def>` / `<ref def>`) solve this by colocating citation definitions within the active section.

Additionally, patrollers use a diverse suite of companion tools (diff enhancers, fact-checkers, citation splitters) that must be audited for architectural compatibility and ecosystem synergy.

## Criteria
- [x] Analyze ProveIt section-editing mechanics and formally demonstrate that section-scoped references eliminate ProveIt's section-editing blind spot.
- [x] Survey and audit the complementary citation and patrol tool ecosystem on English Wikipedia:
  - **wikEdDiff** (`User:Cacycle/wikEdDiff`): inline diff engine with moved-block detection.
  - **diffedit** (`User:Jon Harald Søby/diffedit.js`): in-diff section editing on `Special:Diff`.
  - **References segregator** (`User:PleaseStand/References segregator`): edit window pane splitter.
  - **RefCruncher** (`User:Guywan/Scripts/RefCruncher`): in-editor ref chip collapsing.
  - **HarvErrors** (`User:Trappist the monk/HarvErrors`): shortened footnote error auditing.
  - **AI Source Verification** (`User:Alaexis/AI Source Verification.js`): LLM claim verification.
  - **CNfirmed** (`User:Alaexis/CNfirmed.js`): citation discovery for `{{citation needed}}`.
- [x] Document tool synergies and non-interference requirements in [`proposal/CONCEPT.md`](../../proposal/CONCEPT.md) and [`tickets/DONE.md`](../DONE.md).

## Execution Notes
1. **ProveIt Section Locality Proof:**
   - Evaluated ProveIt DOM integration against MediaWiki `#wpTextbox1`.
   - Confirmed that keeping citation definitions at section boundaries allows ProveIt to parse and update citations without requiring whole-page edit locks.
2. **Companion Tools Ecosystem Directory:**
   - Documented the 8 primary companion tools in `LOG.md` (§2.1 T-020).
   - Confirmed that RefDiff's Memento architecture and isolated row classes (`refdiff-cit-row`) prevent interference with diffedit and wikEdDiff.
