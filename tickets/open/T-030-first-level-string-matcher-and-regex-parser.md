# Ticket 030: First-Level String Matcher & Regex Parser Architecture (Phases 1–3)

* **Status:** Todo
* **Date:** 2026-10-17
* **Priority:** High
* **Tier / Phase:** Tier 2: Community Reviewer Scale (50-User Milestone)
* **Scope & Relevant Files:** `refdiff.js`, `tests/test_parser.js`, `tests/test_utils.js`

## Description & Context
Implement the 3-phase architectural transition from fragile heuristic regex passes to a First-Level String Matcher / Scanner (as formulated in `ARCH-REPORT-2026-10-17-REGEX`):

1. **Phase 1 (Level 1A Fast Substring Gatekeepers):**
   - In `normalizeDiffTags`: Early return `str` if `!str.includes('<ins') && !str.includes('<del') && (!delStr || !delStr.includes('<del'))`.
   - Wrap internal regex passes with fast substring guards:
     - Only execute Rules 1–4 and Rule 7b if `res.includes('&lt;ref') || res.includes('&lt;/ref')`.
     - Only execute Rules 5–6 if `res.includes('{') || res.includes('}')`.
     - Only execute Rules 7 and 8 if `res.includes('</ins>') || res.includes('</del>')`.
   - In `parseRefs`: Early return `[]` if `!html || (!html.includes('&lt;ref') && !html.includes('{'))`.

2. **Phase 2 (Level 1B Linear Template Brace Scanner):**
   - Replace regex-based footnote template matching in `src/parser.js` with a linear depth-counting scanner pattern using `indexOf('{{', i)` and a `depth` counter (`+2` on `{{`, `-2` on `}}`).
   - Support arbitrary template nesting depth ($\ge 4$ levels, e.g. `{{efn|Level 1 {{cite web|title={{lang|de|{{small|Titel}}}}|url=...}}}}`) without ReDoS risk.
   - **Edge Case Handling (Zipf's Law Unwrapped Footnotes):**
     - If candidate `raw = normalized.slice(start, j)` fails `hasBalancedDiffTags(raw)` (e.g. `<del>{{efn|</del>...<del>}}</del>`), advance `i = start + 2` (NOT `i = j`) so valid inner templates or tokens inside the unwrapped template are still discovered.
     - If candidate is not a recognized footnote template (`sfn|sfnp|sfnm|sfnmp|efn|efn-[a-z0-9_-]+|r|harv|harvnb|harvtxt|harvp`), advance `i = start + 2`; only advance `i = j` when a balanced footnote template is matched.

3. **Phase 3 (Linear `<ref>` Scanner & `lastIndex` Cascade Prevention):**
   - In `src/parser.js`: When `REF_REGEX.exec(normalized)` finds a match `m` where `!hasBalancedDiffTags(m[0])`, reset `REF_REGEX.lastIndex = m.index + 7` instead of letting `lastIndex` skip to the end of the rejected candidate. This ensures any subsequent `<ref>` tag starting inside the rejected span is never skipped.
   - Structurally match `<ref>` and `</ref>` tags to immunize RefDiff from `wikidiff2` boundary-shifting artifacts.

4. **Size Budget & API Compatibility Constraints:**
   - Maintain `refdiff.js` bundle size strictly under **120.0 KB** (`122,880` bytes) per `tests/test_deployment.js`.
   - Preserve exported `REF_REGEX` and `TEMPLATE_REF_REGEX` in `src/constants.js` for backwards test compatibility.

## Criteria
- [ ] Implement Level 1A fast gatekeepers in `normalizeDiffTags` and `parseRefs` (`tests/test_utils.js`).
- [ ] Implement Level 1B linear template brace scanner supporting $\ge 4$ levels of template nesting (`tests/test_parser.js`).
- [ ] Implement `lastIndex` cascade immunity in `REF_REGEX` parsing loop (`tests/test_parser.js`).
- [ ] Maintain 100% backward compatibility for Rules 1–8 and public constants `REF_REGEX` and `TEMPLATE_REF_REGEX`.
- [ ] Verify that all canonical benchmarks (including Leonardo and Benny) pass with byte-for-byte Memento roundtrip.
- [ ] Keep `refdiff.js` size under 120.0 KB.
- [ ] All test suites passing (`npm test`, 0 ESLint warnings).

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol when implemented -->
