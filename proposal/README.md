# 🏛️ Upstream Proposal: Section-Scoped Reference Definitions (`<ref def>`)

This directory contains the complete upstream proposal dossier for introducing native, section-modular reference definitions (`<ref def name="...">` and `<references def>`) to MediaWiki core and `Extension:Cite`.

While **RefDiff** addresses citation clutter and template camouflage on the client side at diff inspection time, this upstream initiative addresses the root cause at the MediaWiki storage and wikitext tier.

---

## 📋 Dossier Artifacts Index

The proposal documentation is organized into three primary artifacts tailored to different stages of upstream review, technical architecture, and community discussion:

| Artifact | Type | Description | Target Venue |
| :--- | :--- | :--- | :--- |
| 💡 [**`PROPOSAL.md`**](PROPOSAL.md) | Task Specification | Ready-to-submit Phabricator task proposal with clean feature focus, visual diff comparison table, and exact syntax mechanics. | [Wikimedia Phabricator](https://phabricator.wikimedia.org/) (`#extension-cite`, `#Parsoid`) |
| 📄 [**`CONCEPT.md`**](CONCEPT.md) | Architectural Whitepaper | Comprehensive architecture document detailing technical pathways, AST analyses, parser interactions, ecosystem tool compatibility, and migration bots. | Wikimedia Architecture / RfC Repository |
| 📝 [**`POST.md`**](POST.md) | Community Draft | Ready-to-use discussion draft and Anschreiben for initiating community dialogue and gathering editor feedback. | [en:Wikipedia talk:Citing sources](https://en.wikipedia.org/wiki/Wikipedia_talk:Citing_sources) |

---

## 💡 Core Concept & Architecture

### The Problem: Storage-Tier Citation Clutter
In standard MediaWiki wikitext, citation templates (`{{cite web}}`, `{{cite book}}`) are embedded directly into prose inside `<ref>...</ref>` tags:
- **Template Camouflage:** Bibliographic metadata clutters the editing window and produces noisy diffs where prose changes are obscured by formatting changes.
- **Merge Conflicts:** Concurrent edits to prose and citations in the same sentence or global list cause unnecessary Git and wikitext merge conflicts.
- **Review Fatigue:** Reviewers inspecting changes against generated filler or unverified citations cannot easily audit a section's source inventory at a glance.

### The Solution: Decoupled Section-Scoped Definitions
This proposal decouples **source organization** from **frontend presentation**:

1. **Prose Callouts (`<ref name="..." />`):** Lightweight inline anchors placed next to the claim in the prose text.
2. **Section Definitions (`<ref def name="...">...</ref>`):** Dedicated definition tags placed at the section boundary, registering citation metadata without rendering an in-situ footnote marker `[1]`.
3. **Optional Section Container (`<references def>`):** An optional wrapper for grouping multiple references at section ends.
4. **Global Rendering Anchor (`<references />`):** The standard tag at the bottom of the article that renders the continuous, globally numbered footnote list.

```wikitext
== Geology ==
The surface of Venus is dominated by intense volcanism.<ref name="schmidt2020" />
Radar imaging reveals thousands of volcanic structures.<ref name="nasa-radar" />

<!-- Section-scoped definitions (no in-situ [1] rendered) -->
<ref def name="schmidt2020">{{Cite book |author=Schmidt, Rainer |title=Volcanism on Terrestrial Planets |year=2020}}</ref>
<ref def name="nasa-radar">{{Cite web |author=NASA JPL |url=https://example.org/venus |title=Radar Mapping}}</ref>

== References ==
<references />
```

---

## 🧭 Strategic Roadmap Integration

The upstream execution roadmap and its phases are tracked centrally in the repository roadmap:

* 🧭 [**`../ROADMAP.md#2-upstream-ref-def-strategy-roadmap`**](../ROADMAP.md#2-upstream-ref-def-strategy-roadmap) — Multi-phase upstream strategy:
  * **Phase 1:** Community Outreach & Wishlist formulation ([`POST.md`](POST.md), [`PROPOSAL.md`](PROPOSAL.md)).
  * **Phase 2:** Feedback Synthesis & Formal Specification ([`CONCEPT.md`](CONCEPT.md), Phabricator task).
  * **Phase 3:** Automated Re-Scoping Bot Prototype (Pywikibot migration script).
  * **Phase 4:** Lua / Scribunto Prototype (`Module:RefDef`) and `Extension:Cite` PHP patch.
* 📋 [**`../tickets/INDEX.md`**](../tickets/INDEX.md) — Open work items for upstream phases (Tickets `T-035` through `T-038`).
