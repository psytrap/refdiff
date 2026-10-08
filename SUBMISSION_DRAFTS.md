# Community Discussion Draft: Wiki Post Anschreiben

A ready-to-use template for starting discussions and RFCs on Wikimedia discussion pages and community forums.

---

* **Target Venue:** English Wikipedia ([en.wikipedia.org/wiki/Wikipedia_talk:Citing_sources](https://en.wikipedia.org/wiki/Wikipedia_talk:Citing_sources))
* **Section Title / Subject:** `Proposal: Section-scoped reference blocks (<references-def>) for cleaner wikitext and better diffs`

---

## Post Body (Markdown)

Hi all,

I would like to propose a feature idea to improve reference management in wikitext: introducing a section-scoped definition block (working title: `<references-def>`) that keeps citations near the text without breaking prose flow.

### What it looks like

```wikitext
== 1. Geology of Venus ==
The surface of Venus is dominated by intense volcanism.<ref name="schmidt2020" />
Radar imaging reveals thousands of volcanic structures.<ref name="nasa-radar" />

<references-def>
<ref name="schmidt2020">{{Cite book |author=Schmidt, Rainer |title=Volcanism on Terrestrial Planets |year=2020 |pages=45–48}}</ref>
<ref name="nasa-radar">{{Cite web |author=NASA JPL |url=https://example.org/venus-radar |title=Venus Radar Mapping Project |access-date=2026-10-08}}</ref>
</references-def>

== References ==
<references />
```

### Why this helps

1. **Readable wikitext with references still nearby:** Paragraphs in raw wikitext stay fluent and readable without 500-character citation templates cluttering sentences. Unlike purely global reference lists at the bottom of the article, citations remain right at hand within the section where they belong.
2. **Clean, isolated diffs:** Rewording a sentence touches only the sentence line. Updating a URL or page number touches only that single reference line.
3. **No edit conflicts between sections:** Two editors working on different sections never collide in a shared reference list at the bottom of the page.
4. **Better claim auditing:** Reviewers can check the section's source inventory at a glance against hallucinated or unverified text ("AI slop").
5. **Same reader experience:** Footnotes continue to display at the very bottom with continuous global numbering (`[1]`, `[2]`, …) as usual.

### Diff Comparison

**Status Quo (Inline Citations):**
```diff
- The atmosphere consists mostly of carbon dioxide<ref>{{Cite book |author=Schmidt, Rainer |title=Planetary Atmospheres |year=2020 |pages=112–115 |isbn=978-3-12-345678-9 |publisher=Springer}}</ref>, creating an extreme greenhouse effect that heats the surface.
+ The atmosphere consists mostly of carbon dioxide<ref>{{Cite book |author=Schmidt, Rainer |title=Planetary Atmospheres |year=2020 |pages=112–115 |isbn=978-3-12-345678-9 |publisher=Springer}}</ref>, creating a runaway greenhouse effect that heats the surface.
```

**Proposed (`<references-def>`):**
```diff
- The atmosphere consists mostly of carbon dioxide<ref name="schmidt2020" />, creating an extreme greenhouse effect that heats the surface.
+ The atmosphere consists mostly of carbon dioxide<ref name="schmidt2020" />, creating a runaway greenhouse effect that heats the surface.
```

### Mechanics & Trade-Offs

* `<references-def>` does not render HTML where it sits—it simply registers definitions in the parser citation registry.
* The standard `<references />` tag at the bottom outputs everything in appearance order.
* **Fault tolerance:** The parser resolves definitions page-wide. If someone moves a sentence to another section and forgets to move the definition, the page does not break. Bots can later clean up and migrate misplaced definitions.
* **Trade-off (Diff review):** Because prose and source definitions are decoupled, they form separate hunks within the section rather than on the same line. Section-scoping keeps this physical distance minimal (within the same section) while leaving raw wikitext clean and readable.

The full proposal for Phabricator is documented in [PROPOSAL.md](PROPOSAL.md), and the comprehensive technical specification is in [CONCEPT.md](CONCEPT.md).

I'd love to hear your thoughts and feedback before filing/linking the Phabricator task!
