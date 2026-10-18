# Ticket 006: Unwrapped Footnotes, Unclosed Quotes, and Bold Markup Invariance

* **Status:** Done
* **Date:** 2026-10-13
* **Scope & Relevant Files:** `refdiff.js` (`src/constants.js`, `src/parser.js`, `src/utils.js`), `tests/test_constants.js`, `tests/test_parser.js`, `tests/test_pipeline.js`

## Description & Context
Three distinct edge cases from live Wikipedia diff reviews challenged parser robustness:
1. **Unwrapped Footnotes & Citation Suffixes ([Zipf's law `diff=1379548357`]):**
   An editor unwrapped an explanatory footnote (`{{efn}}`), exposing an internal citation with a page suffix (`{{rp|546}}`). RefDiff misidentified `{{rp|546}}` as an independent citation and paired it with the deleted `{{efn}}`, generating a phantom modified badge `⟨~546~⟩` and corrupting adjacent braces into `}}}`.
2. **Unclosed Attribute Quotes ([Donnie Brasco `diff=1380017400`]):**
   An editor omitted the closing quote in a reference attribute (`<ref name="mojo_2>`). MediaWiki's parser tolerates missing quotes before `>` and produces `id="cite_note-mojo_2-4"`. RefDiff's strict attribute regex returned `null`, falling back to anonymous `ref1` and breaking hovercards.
3. **Prose Bold Formatting Invariance ([Karl-Heinz Riedle `diff=1380008554`]):**
   Adding nickname bolding (`'''"Kalle"'''`) in prose adjacent to unchanged citations must leave diff highlighting (`<ins class="diffchange">''' "'''Kalle'''" '''</ins>`) untouched without creating spurious citation rows.

## Criteria
- [x] Exclude `rp` from `TEMPLATE_REF_REGEX` so citation page suffixes (`{{rp|...}}`) remain attached to preceding badges rather than generating phantom rows.
- [x] Extend template brace matching up to 2 levels of nesting and add lookaround assertions `(?<!\{)` and `(?!\})` in `normalizeDiffTags` to prevent brace collapse into `}}}`.
- [x] Implement `hasBalancedDiffTags` to validate that candidate citation tokens do not cross unbalanced `<del>` or `<ins>` diff spans.
- [x] Harden `extractName` regex to tolerate unclosed quotes bounded by `/`, `&gt;`, `>`, or string end, correctly extracting `"mojo_2"`.
- [x] Confirm prose bold markup edits remain 100% intact with byte-for-byte Memento restoration.

## Execution Notes
1. **Zipf's Law Resolution:**
   - Updated `TEMPLATE_REF_REGEX` in `src/constants.js` to strictly match footnote templates (`sfn`, `efn`, `r`, `harvnb`) while excluding suffix templates like `rp`.
   - Added `hasBalancedDiffTags` check in `src/utils.js` ensuring diffchange boundaries balance within each candidate tag.
2. **Donnie Brasco Resolution:**
   - Updated `extractName` in `src/parser.js` with fallback boundary regex:
     `/(?:&quot;|["']|&apos;)(.*?)(?:&quot;|["']|&apos;|\/|&gt;|>|\s*$)|name\s*=\s*([^\s"'>&]+)/i`
   - Verified that `name="mojo_2>` extracts `"mojo_2"` and resolves the hovercard anchor.
3. **Karl-Heinz Riedle Verification:**
   - Added test asserting that inline prose markup edits adjacent to citations remain completely unmutated.
4. **Automated Test Coverage:**
   - Added 4 regression tests across `tests/test_constants.js`, `tests/test_parser.js`, and `tests/test_pipeline.js`.
