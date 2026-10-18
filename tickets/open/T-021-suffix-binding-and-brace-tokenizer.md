# Ticket 021: Clean Architecture for Citation Page Suffixes ({{rp}}) & Nested Template Tokenization

- **Status:** Todo
- **Priority:** P0
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `refdiff.js`
  - `tests/test_parser.js`
  - `tests/test_pipeline.js`
  - `tests/test_utils.js`

---

## Description & Context
Originating from Zipf's law (diff=1379548357), unwrapping an explanatory footnote ({{efn}}) caused page suffixes ({{rp|546}}) to be misidentified as standalone references (producing phantom badges) and merged adjacent braces into `}}}`.
While currently stabilized by regex exclusions and lookaround assertions `(?<!{)` in `normalizeDiffTags`, the heuristic should be replaced with clean architecture:
1. Formally model `{{rp|...}}` as a citation page-suffix token bound to its preceding citation unit (`<ref>` or `{{sfn}}`) rather than treating it as ambient prose.
2. Replace brittle regex lookarounds with a deterministic stack-based brace/template tokenizer, preventing edge cases with nested footnote templates (`{{efn}}`, `{{refn}}`, `{{sfnp}}`).
3. Establish a distinct tokenization stage in the pipeline outputting structured AST tokens `(prose_segment | ref_unit[anchor, suffix] | template_unit)`.

---

## Criteria
- [ ] Implement formal suffix binding where `{{rp|...}}` binds to preceding citation without generating an independent badge
- [ ] Implement deterministic brace scanning for templates, handling nested templates without regex lookaround fragility
- [ ] Add regression test cases in `tests/test_parser.js` and `tests/test_pipeline.js` for complex nested footnotes
- [ ] All test suites passing (`npm test`)
- [ ] Zero ESLint errors or warnings (`npm run lint`)

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
