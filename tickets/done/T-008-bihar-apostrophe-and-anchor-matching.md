# Ticket 008: Bihar Assembly Embedded Apostrophe and Anchor Normalization

* **Status:** Done
* **Date:** 2026-10-14
* **Scope & Relevant Files:** `refdiff.js` (`src/parser.js`, `src/anchor.js`), `tests/test_parser.js`, `tests/test_anchor.js`, `tests/test_jsdom.js`

## Description & Context
During real-world evaluation of [Bihar Legislative Assembly (`diff=1379207737`)](https://en.wikipedia.org/w/index.php?title=Bihar_Legislative_Assembly&diff=prev&oldid=1379207737), two defects prevented proper reference badge rendering and anchor linking:
1. **Embedded Apostrophe Truncation:** Reference tags with embedded apostrophes inside double quotes (`name="From teen in RSS shakha to Speaker's Chair: Bihar BJP leader Prem Kumar's long journey"`) were truncated prematurely at `"Speaker"`. This occurred because `extractName`'s regex used a mixed delimiter character class `["']`, causing the apostrophe `'` inside the title to be treated as a closing quote delimiter.
2. **Space-to-Underscore Footnote Anchor Failure:** MediaWiki converts spaces in reference names into underscores when generating footnote element IDs (`cite_note-From_teen_in_RSS_shakha_to_Speaker's_Chair:...-4`). However, `findCiteNoteAnchor` queried the DOM using the raw, space-delimited string, failing to match the anchor and dropping native popups integration.

## Criteria
- [x] Update `extractName` in `src/parser.js` with symmetric paired-quote alternatives:
  - Preserve embedded apostrophes inside double quotes (`(?:"|&quot;)(.*?)(?:"|&quot;|\/|&gt;|>|\s*$)`).
  - Preserve embedded double quotes inside single quotes (`(?:'|&apos;)(.*?)(?:'|&apos;|\/|&gt;|>|\s*$)`).
  - Maintain backward tolerance for unclosed quotes.
- [x] Enhance `findCiteNoteAnchor()` in `src/anchor.js` to automatically generate underscore-normalized candidate lookups (`name.trim().replace(/\s+/g, '_')`) alongside a fallback scan across all `[id^="cite_note-"]`.
- [x] Verify complete decoupling, full title preservation, and accurate footnote anchor resolution on Bihar Legislative Assembly (`diff=1379207737`).

## Execution Notes
1. **Attribute Extraction Hardening:**
   - Updated `extractName` in `src/parser.js` using symmetric quote matching, cleanly capturing the full 94-character news headline name without premature truncation.
2. **Anchor Resolution Enhancement:**
   - In `src/anchor.js`, added candidate generation replacing whitespace with underscores and escaping CSS query selectors.
   - Added fallback linear scan through `.references li` if direct selector query returns null.
3. **Automated Test Coverage:**
   - Added unit test in `tests/test_parser.js` validating embedded apostrophes.
   - Added anchor resolution test in `tests/test_anchor.js`.
   - Added full DOM test in `tests/test_jsdom.js`.
   - Total test suite expanded to **103/103 tests passing**.
