# Ticket 037: Upstream `<ref def>` Phase 3: Automated Re-Scoping Bot Prototype

- **Status:** Todo
- **Priority:** P3
- **Tier / Phase:** Upstream Phase 3 (Tooling)
- **Scope & Relevant Files:**
  - `proposal/CONCEPT.md`
  - `scripts/`

---

## Description & Context
Develop a prototype re-scoping bot/script to demonstrate automated migration of articles to section-scoped definitions:
1. Scan articles with inline reference clutter and identify multi-use references.
2. Hoist reference definitions to section headers or section container blocks (`<ref def name="...">` or `<references def>`).
3. Replace inline definitions with clean callout tags (`<ref name="..." />`).
4. Assert zero net change in the article's rendered HTML and footnote numbering.

---

## Criteria
- [ ] Create standalone Python/Node prototype script demonstrating reference hoisting
- [ ] Verify rendered HTML output equivalence between original and hoisted wikitext
- [ ] Document bot operating rules and safety constraints in `proposal/CONCEPT.md` §4

---

## Execution Notes
<!-- Populated during Step 5 of the Ticket Protocol -->
