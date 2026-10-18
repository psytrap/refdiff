# Ticket 014: Two-Tier DOM Identifier Matching and List-Format Preview

* **Status:** Done
* **Date:** 2026-10-15
* **Scope & Relevant Files:** `refdiff.js` (`src/anchor.js`, `src/renderer.js`), `tests/test_anchor.js`, `tests/test_renderer.js`

## Description & Context
In [Respiratory therapist (`diff=1380407169&oldid=1372216818`)](https://en.wikipedia.org/w/index.php?title=Respiratory+therapist&diff=1380407169&oldid=1372216818), an editor added a Vancouver-style medical citation.
A defect was reported: *"ref7 not working"*—the badge rendered as `⟨ref7⟩`, but its `href` was `null` (rendering as a plain `<span>`). Clicking the badge did nothing, and MediaWiki's native Reference Previews hovercard failed to trigger.

**Root Cause:**
1. The reference is **anonymous** (lacks `name="..."`). MediaWiki numbers anonymous citations sequentially from top to bottom across the entire article (`cite_note-1` ... `cite_note-31`). In a partial diff (line 141), RefDiff only sees the changed paragraph and lacks global ordinal positioning.
2. Prior code attempted to parse template fields (`author=`, `title=`) via regex. On Vancouver citations (`vauthors = Shakespeare J...`), manual template parsing failed completely.
3. Attempting to build a full custom bibliographic parser in client-side JavaScript would bloat the script, fail on obscure citation styles, and duplicate MediaWiki's native `mw.popups` extension.

## Criteria
- [x] Establish a **Two-Tier Architecture Without Ref-Parsing**:
  - **Tier 1 (Native Reference Previews):** For existing citations, delegate 100% of footnote preview generation to MediaWiki's native `Extension:Popups` (`mw.popups`) by discovering and assigning the exact jump anchor (`<a href="#cite_note-31">`).
  - **Tier 2 (Template List-Format Preview Fallback):** For unmatched or newly added references (where no `#cite_note-*` element exists on the page), provide deterministic template list formatting (`• key: val`) via a multi-line `title` tooltip and an accessible floating `.refdiff-preview-card`.
- [x] Implement persistent identifier scanning in `findCiteNoteAnchor()`:
  - **DOI:** `10.\d{4,9}/[^\s|}<>"]+`
  - **PMID:** `pmid\s*=\s*(\d+)`
  - **PMC:** `pmc\s*=\s*(?:PMC)?(\d+)`
  - **ISBN:** `isbn\s*=\s*([0-9Xx-]+)` $\to$ matches `Special:BookSources/...`
  - **URL:** `https?://[^\s|}<>"]+`
- [x] Perform an $O(1)$ query in the rendered footnote list (`document.querySelector('.references a[href*="' + idVal + '"]')`) and retrieve the parent `li[id^="cite_note-"]`.
- [x] Implement `parseTemplateList(rawContent)` rendering structured parameter lists (`• key: val`), suppressing native OS tooltips during `.refdiff-preview-card` display.
- [x] Add automated unit tests in `tests/test_anchor.js` and `tests/test_renderer.js`, expanding the test suite to **140/140 tests passing**.

## Execution Notes
1. **Tier 1 Identifier Discovery (`src/anchor.js`):**
   - Added regex patterns for DOI, PMID, PMC, ISBN, and URL.
   - Queries rendered footnote anchor links in `.references li`. Once `<a href="#cite_note-31">` is attached, MediaWiki's native `mw.popups` binds automatically.
2. **Tier 2 Fallback Card (`src/renderer.js`):**
   - Implemented `parseTemplateList()` parsing templates and extracting key-value pairs.
   - Built floating DOM card `.refdiff-preview-card` with dark-mode styling and `role="tooltip"`.
3. **Verification:**
   - Unit tests in `tests/test_anchor.js` validating DOI resolution for `Respiratory therapist` (`10.1183/20734735.0310-2019` $\to$ `#cite_note-31`), PMID, PMC, and ISBN.
   - Unit tests in `tests/test_renderer.js` validating `parseTemplateList` and hovercard DOM generation.
   - All 140/140 tests passing, 0 ESLint warnings.
