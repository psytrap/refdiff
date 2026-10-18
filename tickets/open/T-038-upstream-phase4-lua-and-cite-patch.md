# Ticket 038: Upstream `<ref def>` Phase 4: Lua / Scribunto Prototype & MediaWiki Extension:Cite Patch

- **Status:** Todo
- **Priority:** P1
- **Tier / Phase:** Upstream Phase 4 (Implementation)
- **Scope & Relevant Files:**
  - `proposal/CONCEPT.md`
  - `proposal/PROPOSAL.md`

---

## Description & Context
Develop proof-of-concept implementations for native MediaWiki support:
1. Lua / Scribunto Prototype (T-038 Milestone 1): Author a Scribunto module (`Module:RefDef`) implementing client-side/template-side `<ref def>` emulation on wikis without core Cite extension modifications.
2. MediaWiki Extension:Cite Gerrit Patch (T-038 Milestone 2): Prepare and submit a formal Gerrit patch for `mediawiki/extensions/Cite`:
   - Implement `def` boolean attribute parsing in `Cite.php` / `CiteHooks.php`.
   - Register reference definitions in citation map without outputting in-text superscripts `[1]`.
   - Implement passive fallback hook to preserve compatibility on older MediaWiki versions.

---

## Criteria
- [ ] Document Lua Scribunto emulation module in `proposal/CONCEPT.md`
- [ ] Draft PHP patch for `Extension:Cite` supporting `def` attribute on `<ref>` tags
- [ ] Document automated PHPUnit test cases verifying reference registration without superscript emission

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
