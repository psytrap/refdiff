# Ticket 002: Shortened Footnotes Support and Odoacer Benchmark

* **Status:** Done
* **Date:** 2026-10-10
* **Scope & Relevant Files:** `refdiff.js` (`src/parser.js`, `src/anchor.js`), `tests/test_parser.js`

## Description & Context
Traditional English Wikipedia articles frequently rely on shortened footnote templates (`{{sfn}}`, `{{r}}`, `{{efn}}`, `{{harvnb}}`) linking to an author-year bibliography rather than inline `<ref>` tags.
In [Odoacer (`diff=1379486498`)](https://en.wikipedia.org/w/index.php?diff=1379486498), high-density reference rewrites containing shortened footnotes broke naive `<ref>` parsing:
1. Shortened footnotes were ignored by `<ref>` regexes or truncated prematurely.
2. Badges could not display human-readable author-year labels (e.g. `⟨Castritius 2005⟩`).
3. Badges failed to link to MediaWiki's `#cite_note-FOOTNOTE*` anchors, disabling native `Extension:Popups` reference preview hovercards.

## Criteria
- [x] Extend the citation parser to extract shortened footnote templates (`{{sfn}}`, `{{r}}`, `{{efn}}`, `{{harvnb}}`) in sequential document order alongside `<ref>` tags.
- [x] Implement `extractSfnInfo()` parameter tokenizer supporting 1 to 4+ authors, publication year, and page parameters.
- [x] Integrate `cite_note-FOOTNOTE*` anchor resolution in `findCiteNoteAnchor()` for native `Extension:Popups` hovercard integration.
- [x] Verify full decoupling and hovercard resolution on Odoacer (`diff=1379486498`) in unit tests and live Chromium CDP.

## Execution Notes
1. **Parser Implementation (`extractSfnInfo`):**
   - Implemented template parameter parsing in `src/parser.js` extracting up to 4 positional author parameters, `|year=`, `|date=`, and `|p=` / `|pp=` / `|loc=`.
   - Formatted badge labels compactly into `⟨Author Year⟩` (or `⟨Author1 & Author2 Year⟩`).
2. **Anchor Discovery (`findCiteNoteAnchor`):**
   - Added author-year text matching scanning `.references li[id^="cite_note-"]` for matching author surname and publication year, resolving `#cite_note-FOOTNOTE...` anchors.
3. **Verification:**
   - Added unit test coverage in `tests/test_parser.js`.
   - Verified live in headless Chromium CDP on English Wikipedia against Odoacer (`diff=1379486498`): clean badge decoupling and working native popups hovercards.
