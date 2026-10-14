# Community Discussion Draft: Wiki Post Anschreiben

A ready-to-use template for starting discussions and RFCs on Wikimedia discussion pages and community forums.

---

* **Target Venue:** English Wikipedia ([en.wikipedia.org/wiki/Wikipedia_talk:Citing_sources](https://en.wikipedia.org/wiki/Wikipedia_talk:Citing_sources))
* **Section Title / Subject:** `Proposal: Section-scoped reference definitions (<ref def name="...">) for cleaner wikitext and better diffs`

---

## Post Body (Markdown)

Hi all,

I would like to propose a feature idea to improve reference management in wikitext: introducing a tag-level definition attribute (working title: `<ref def name="...">`) that keeps citations near the text without breaking prose flow.

### What it looks like

```wikitext
== 1. Geology of Venus ==
The surface of Venus is dominated by intense volcanism.<ref name="schmidt2020" />
Radar imaging reveals thousands of volcanic structures.<ref name="nasa-radar" />

<!-- Standalone definitions (no container required) -->
<ref def name="schmidt2020">{{Cite book |author=Schmidt, Rainer |title=Volcanism on Terrestrial Planets |year=2020 |pages=45–48}}</ref>
<ref def name="nasa-radar">{{Cite web |author=NASA JPL |url=https://example.org/venus-radar |title=Venus Radar Mapping Project |access-date=2026-10-08}}</ref>

<!-- Optional container wrapper (e.g. for sections with many citations):
<references def>
  <ref name="schmidt2020">...</ref>
  <ref name="nasa-radar">...</ref>
</references>
-->

== References ==
<references />
```

### Why this helps

1. **Readable wikitext with references still nearby:** Paragraphs in raw wikitext stay fluent and readable without 500-character citation templates cluttering sentences. Unlike purely global reference lists at the bottom of the article, citations remain right at hand within the section where they belong.
2. **Clean, isolated diffs:** Rewording a sentence touches only the sentence line. Updating a URL or page number touches only that single reference line.
3. **No edit conflicts between sections:** Two editors working on different sections never collide in a shared reference list at the bottom of the page.
4. **Better claim verification & vandalism patrolling:** Reviewers can check the section's source inventory at a glance to verify whether factual assertions are backed by reliable sources, without wading through template markup.
5. **Same reader experience:** Footnotes continue to display at the very bottom with continuous global numbering (`[1]`, `[2]`, …) as usual.

### Diff Comparison

#### Current (Inline Citations)

<div style="background: #0f141c; padding: 16px; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #cdd9e5; line-height: 1.5; margin: 12px 0; border: 1px solid #2d333b;">
<table style="width: 100%; border-collapse: separate; border-spacing: 12px 5px; border: none; margin: 0;">
  <thead>
    <tr>
      <th style="text-align: left; color: #ffffff; font-size: 13px; font-weight: bold; padding-left: 20px;">Line 1 (Old):</th>
      <th style="text-align: left; color: #ffffff; font-size: 13px; font-weight: bold; padding-left: 20px;">Line 1 (New):</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="vertical-align: top;">
        <div style="display: flex; align-items: flex-start;">
          <span style="width: 16px; color: #768390; font-weight: bold; font-size: 14px; text-align: center; margin-right: 4px;">−</span>
          <div style="flex: 1; background: #1a1614; border: 1px solid #543b1f; border-radius: 4px; padding: 6px 10px; color: #e6edf3;">
            The atmosphere consists mostly of carbon dioxide&lt;ref&gt;{{Cite book |author=Schmidt, Rainer |title=Planetary Atmospheres |year=2020 |pages=112–115 |isbn=978-3-12-345678-9 |publisher=Springer}}&lt;/ref&gt;, creating an <span style="background: #5a3814; color: #ffd8a8; font-weight: bold; padding: 1px 4px; border-radius: 3px;">extreme</span> greenhouse effect that heats the surface.
          </div>
        </div>
      </td>
      <td style="vertical-align: top;">
        <div style="display: flex; align-items: flex-start;">
          <span style="width: 16px; color: #768390; font-weight: bold; font-size: 14px; text-align: center; margin-right: 4px;">+</span>
          <div style="flex: 1; background: #121a24; border: 1px solid #1f3d5c; border-radius: 4px; padding: 6px 10px; color: #e6edf3;">
            The atmosphere consists mostly of carbon dioxide&lt;ref&gt;{{Cite book |author=Schmidt, Rainer |title=Planetary Atmospheres |year=2020 |pages=112–115 |isbn=978-3-12-345678-9 |publisher=Springer}}&lt;/ref&gt;, creating an <span style="background: #1f3f6d; color: #a5d6ff; font-weight: bold; padding: 1px 4px; border-radius: 3px;">runaway</span> greenhouse effect that heats the surface.
          </div>
        </div>
      </td>
    </tr>
  </tbody>
</table>
</div>

#### Proposed (`<ref def name="...">`)

<div style="background: #0f141c; padding: 16px; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #cdd9e5; line-height: 1.5; margin: 12px 0; border: 1px solid #2d333b;">
<table style="width: 100%; border-collapse: separate; border-spacing: 12px 5px; border: none; margin: 0;">
  <thead>
    <tr>
      <th style="text-align: left; color: #ffffff; font-size: 13px; font-weight: bold; padding-left: 20px;">Line 1 (Old):</th>
      <th style="text-align: left; color: #ffffff; font-size: 13px; font-weight: bold; padding-left: 20px;">Line 1 (New):</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="vertical-align: top;">
        <div style="display: flex; align-items: flex-start;">
          <span style="width: 16px; color: #768390; font-weight: bold; font-size: 14px; text-align: center; margin-right: 4px;">−</span>
          <div style="flex: 1; background: #1a1614; border: 1px solid #543b1f; border-radius: 4px; padding: 6px 10px; color: #e6edf3;">
            The atmosphere consists mostly of carbon dioxide&lt;ref name="schmidt2020" /&gt;, creating an <span style="background: #5a3814; color: #ffd8a8; font-weight: bold; padding: 1px 4px; border-radius: 3px;">extreme</span> greenhouse effect that heats the surface.
          </div>
        </div>
      </td>
      <td style="vertical-align: top;">
        <div style="display: flex; align-items: flex-start;">
          <span style="width: 16px; color: #768390; font-weight: bold; font-size: 14px; text-align: center; margin-right: 4px;">+</span>
          <div style="flex: 1; background: #121a24; border: 1px solid #1f3d5c; border-radius: 4px; padding: 6px 10px; color: #e6edf3;">
            The atmosphere consists mostly of carbon dioxide&lt;ref name="schmidt2020" /&gt;, creating an <span style="background: #1f3f6d; color: #a5d6ff; font-weight: bold; padding: 1px 4px; border-radius: 3px;">runaway</span> greenhouse effect that heats the surface.
          </div>
        </div>
      </td>
  </tbody>
</table>
</div>

### Mechanics & Trade-Offs

* `<ref def name="...">` does not render an in-situ footnote marker `[1]` where it sits—it simply registers the citation definition in the parser citation registry.
* The standard `<references />` tag at the bottom outputs everything in appearance order.
* **Fault tolerance:** The parser resolves definitions page-wide. If someone moves a sentence to another section and forgets to move the definition, the page does not break. Bots can later clean up and migrate misplaced definitions.
* **Trade-off (Diff review):** Because prose and source definitions are decoupled, they form separate hunks within the section rather than on the same line. Section-scoping keeps this physical distance minimal (within the same section) while leaving raw wikitext clean and readable.

The full proposal for Phabricator is documented in [PROPOSAL.md](PROPOSAL.md), and the comprehensive technical specification is in [CONCEPT.md](CONCEPT.md).

I'd love to hear your thoughts and feedback before filing/linking the Phabricator task!
