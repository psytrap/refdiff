# Ticket 058: Resolve URLs and Bibliographic Identifiers to Links via Parameter Whitelist & Hover-Bridge

- **Status:** Todo
- **Priority:** High
- **Tier / Phase:** Tier 1: Early Adopter Pilot (10-User Milestone)
- **Scope & Relevant Files:**
  - `src/constants.js` (update `.refdiff-preview-card` to `pointer-events: auto;`, add `.refdiff-preview-link` light/dark mode CSS)
  - `src/renderer.js` (render parameter values as interactive `<a>` links when resolvable; track active badge for title restoration)
  - `src/pipeline.js` (implement 200ms hover-bridge between badge and preview card)
  - `src/utils.js` (implement `resolveParameterLink(key, val)` with strict clean-definition matching and protocol validation)
  - `tests/test_renderer.js` (unit tests for clean definitions, malformed/messy definitions falling back to plain text, and safe protocols)
  - `tickets/INDEX.md`

---

## Description & Context
Currently, when a citation tooltip / preview card (`refdiff-preview-card`) is displayed for a reference without a matching on-page footnote, parameters are listed as plain text strings (`src/renderer.js` line ~305):
```javascript
const li = el('li', null, el('span', { class: CLASSES.PREVIEW_KEY }, `${p.key}: `), p.val);
```
Furthermore, `.refdiff-preview-card` has `pointer-events: none;` and disappears instantly on badge `mouseout`, preventing any user interaction with tooltip contents.

This ticket implements key-driven identifier link resolution combined with a resilient 200ms hover-bridge, adhering to a **strict clean-definition policy (zero heuristic sanitization)**:

### 1. Strict Clean-Definition Matching Only (`resolveParameterLink(key, val)`)
Rather than attempting heuristic sanitization or partial extraction on messy values, RefDiff enforces a strict rule: **if the parameter value does not cleanly match the canonical identifier format, ignore it and leave it as plain text.**

- **Key Whitelist:** Matching keys are case-insensitive (`key.trim().toLowerCase()`):
  - **Direct URLs (`url`, `chapter-url`, `contribution-url`, `conference-url`, `archive-url`, `lay-url`, `transcript-url`):**
    - Clean definition: `^https?://[^\s"<>]+$`
    - Target: Exact URL `cleanVal`
  - **DOI (`doi`, `doi-broken-date`):**
    - Clean definition: `^10\.\d{4,9}/[^\s"<>]+$` (or `^https?://(?:dx\.)?doi\.org/(10\.\d{4,9}/[^\s"<>]+)$`)
    - Target: `https://doi.org/${doi}`
  - **PubMed (`pmid`):**
    - Clean definition: `^\d+$`
    - Target: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
  - **PubMed Central (`pmc`):**
    - Clean definition: `^(?:PMC)?\d+$`
    - Target: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${digits}/`
  - **ISBN (`isbn`, `isbn13`):**
    - Clean definition: `^[0-9Xx -]+$` with cleaned digit count of 10 or 13
    - Target: `https://en.wikipedia.org/wiki/Special:BookSources/${cleanDigits}`
  - **arXiv (`arxiv`, `eprint`):**
    - Clean definition: `^(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?$`
    - Target: `https://arxiv.org/abs/${id}`
- **Fallback / Rejection:**
  - Any value containing bracket markup (`[http...]`), comments (`<!-- ... -->`), trailing notes (`(hardcover)`), or commas/multiple values fails the clean definition match and returns `null` (rendered as plain text).
  - All non-whitelisted keys (`title`, `author`, `journal`, `date`, `publisher`, `volume`, positional numbers `1`, `2`, etc.) return `null` and remain **100% plain text**.

### 2. The 200ms Hover-Bridge & Interactive Popover Architecture
- **Pointer Events:** Change `.refdiff-preview-card` from `pointer-events: none;` to `pointer-events: auto;`.
- **Debounced Hide Timer:** On badge `mouseout`, start a 200ms timer before calling `hideBadgePreview()`.
- **Card Hover Retention:** When mouse enters `#refdiff-preview-card`, clear the hide timer so the card stays visible while the reviewer reads or clicks links.
- **Card Mouseout:** When mouse leaves `#refdiff-preview-card`, start a 200ms timer.
- **Instant Dismiss:** Clear timer and hide immediately on window scroll, outside click, or `Escape` key.
- **Title Restoration:** Track `activeBadge` so badge `title` attributes are restored reliably regardless of whether the hide was triggered by badge or card exit.

### 3. Secure DOM Rendering (M1 Security Invariant)
- Validate target URLs: strictly enforce protocol guard requiring `https://`, `http://`, or `/wiki/`. Reject `javascript:` or unknown schemes.
- Construct DOM via `el('a', { href: safeUrl, target: '_blank', rel: 'noopener noreferrer', class: CLASSES.PREVIEW_LINK }, p.val)`.

### 4. Theme-Aware Link Styling
- Add clean styling for `.refdiff-preview-link`:
  - Light mode: `#3366cc` / underline on hover.
  - Dark mode (`skin-theme-clientpref-night` and `skin-theme-clientpref-os`): `#6d9eeb` or `var(--color-progressive, #6d9eeb)`.

---

## Criteria
- [ ] Implement `resolveParameterLink(key, val)` in `src/utils.js` (anchored clean definitions for URL, DOI, PMID, PMC, ISBN, arXiv; zero sanitization; reject non-clean values)
- [ ] Enforce protocol safety guard (only `http:`, `https:`, and `/wiki/` permitted; reject `javascript:`)
- [ ] Update `src/constants.js`: set `.refdiff-preview-card` to `pointer-events: auto;` and add `.refdiff-preview-link` light/dark CSS
- [ ] Implement 200ms hover-bridge in `src/pipeline.js` / `src/renderer.js` supporting smooth cursor transition from badge to card
- [ ] Add card mouseenter/mouseleave handlers and outside-click / scroll dismissal
- [ ] Track `activeBadge` for reliable `title` attribute restoration
- [ ] Update `src/renderer.js` to render resolvable clean values as `<a target="_blank" rel="noopener noreferrer">`
- [ ] Add unit tests in `tests/test_renderer.js` validating clean definitions, messy/unclean values remaining plain text, and safe protocols
- [ ] Rebuild `refdiff.js` via `npm run build` with zero build drift
- [ ] All test suite assertions passing (`npm test`)
- [ ] Zero ESLint errors or warnings across all files (`npm run lint`)

---

## Execution Notes
*(To be populated by executing subagent)*
