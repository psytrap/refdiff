# Ticket 016: Paragraph-Merge and Sentence-Append Boundary Shift Normalization (Rule 7b)

* **Status:** Done
* **Date:** 2026-10-17
* **Scope & Relevant Files:** `refdiff.js` (`src/utils.js`), `tests/test_utils.js`, `tests/test_jsdom.js`, `tests/test_live_benchmarks.py`

## Description & Context
In [Leonardo Torres Quevedo (`diff=1380356173`)](https://en.wikipedia.org/w/index.php?title=Leonardo_Torres_Quevedo&diff=prev&oldid=1380356173) and [Benny Indra Ardhianto (`diff=1337298010`)](https://en.wikipedia.org/w/index.php?title=Benny_Indra_Ardhianto&diff=prev&oldid=1337298010), a severe diff entanglement defect occurred:
1. An editor merged two paragraphs ending in citations (or appended a new sentence with a citation after an existing citation).
2. MediaWiki's `wikidiff2` C++ engine matched the trailing `</ref>` token of the second reference with that of the first reference.
3. Consequently, `wikidiff2` placed `.&lt;/ref&gt;` at the beginning of an inline `<ins class="diffchange diffchange-inline">` span and left `.&lt;/ref&gt;` outside `</ins>` at the end:
   `...No. 90, 2020<ins class="diffchange diffchange-inline">.&lt;/ref&gt; In 1919... &lt;ref&gt;...&lt;/ref&gt; ... October 2008</ins>.&lt;/ref&gt;`
4. RefDiff's tag balancing validator `hasBalancedDiffTags` detected that `<ref>` and `</ref>` tags were split across `<ins>` boundaries and rejected parsing both the preceding and trailing citations.
5. This left raw wikitext citation tags visible in prose and broke citation row decoupling.

## Criteria
- [x] Implement **Rule 7b** in `normalizeDiffTags()` (`src/utils.js`): detect when `wikidiff2` places a boundary-shifted `&lt;/ref&gt;` at the start of an inline `<ins>` or `<del>` span and shift the closing tag outside the diff span so the first citation terminates cleanly.
- [x] Ensure Rule 7b operates strictly on boundary tags without mutating inner prose text or corrupting Memento snapshot fidelity.
- [x] Add unit test in `tests/test_utils.js` verifying boundary-shift normalization.
- [x] Add authentic real-DOM test in `tests/test_jsdom.js` validating complete decoupling of Leonardo Torres Quevedo (10 citation rows decoupled, 26 badges rendered, byte-for-byte Memento restoration).
- [x] Add Leonardo Torres Quevedo (`1380356173`) as Benchmark #6 in `tests/test_live_benchmarks.py`.
- [x] Verify on Benny Indra Ardhianto (`diff=1337298010`): confirms 2 citation rows (`⟨+ref2+⟩`, `⟨+ref3+⟩`), 0 raw ref markup in prose, and 100% byte-for-byte Memento roundtrip.
- [x] Expand test suite to **140/140 tests passing** with 0 ESLint warnings.

## Execution Notes
1. **Rule 7b Implementation (`src/utils.js`):**
   ```javascript
   res = res.replace(/<(ins|del)([^>]*)>([.,;:\s]*&lt;\/ref&gt;)((?:(?!<\/\1>)[\s\S])*?)<\/\1>([.,;:\s]*&lt;\/ref&gt;)/gi, function(match, tag, attrs, startToken, body, endToken) {
     return startToken + '<' + tag + attrs + '>' + body + endToken + '</' + tag + '>';
   });
   ```
2. **Leonardo Torres Quevedo Verification:**
   - 10 citation rows cleanly decoupled.
   - 26 badges rendered with interactive jump links.
   - Memento restoration confirmed byte-for-byte in real DOM.
3. **Benny Indra Ardhianto Verification:**
   - Evaluated `diff=1337298010`. Rule 7b cleanly separated the unchanged Metro TV reference from added prose and the Detik.com reference (even though the editor omitted `{{...}}` around `Cite web`).
   - All 3 references discovered footnote anchors (`#cite_note-4`, `#cite_note-5`, `#cite_note-6`).
   - Memento restoration confirmed exact byte-for-byte match (`true`).
4. **Automated Test Results:**
   - Unit and DOM suites: 140/140 passing.
   - Live CDP benchmarks: 6/6 passing.
