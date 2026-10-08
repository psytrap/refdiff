# Submission Drafts: Community & Technical Outreach

Ready-to-use text templates for posting the proposal to Wikimedia technical and community venues.

---

## 1. Wikimedia Phabricator Task

* **Submission URL:** [phabricator.wikimedia.org/maniphest/task/edit/form/1/](https://phabricator.wikimedia.org/maniphest/task/edit/form/1/)
* **Title:** `Proposal: Section-scoped reference definition blocks (<references-def>) for clean diffs and citation locality`
* **Projects / Tags:** `#extension-cite`, `#Parsoid`, `#MediaWiki-Parser`

### Summary
We propose introducing a section-scoped citation definition block (`<references-def>`) to decouple inline reference callouts from citation template definitions, optimizing Git and wikitext diffs while preserving citation locality.

### The Proposed Syntax
Instead of embedding heavy citation templates directly inside prose, wikitext separates callouts from source definitions across three tiers:

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

### Goals & Benefits
* **Clean, Focused Diffs:** Editing prose changes only the prose line. Updating citations changes only that single reference line.
* **Readable Wikitext, References Still Nearby:** Sentences stay free of template clutter, yet full citations remain conveniently close within the same section.
* **Zero Merge Conflicts:** Multiple editors modifying different sections concurrently never collide in a single global reference list.
* **Resilience Against "AI Slop":** Allows reviewers to audit the chapter's source inventory and evaluate factual claims at a glance.
* **Unaltered Reader Experience:** Continuous `[1]`, `[2]`, … numbering at document bottom remains 100% preserved.

### Diff Comparison

<div style="background: #0f141c; padding: 16px; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #cdd9e5; line-height: 1.5; margin: 12px 0; border: 1px solid #2d333b;">
<table style="width: 100%; border-collapse: separate; border-spacing: 12px 5px; border: none; margin: 0;">
  <thead>
    <tr>
      <th style="text-align: left; color: #ffffff; font-size: 13px; font-weight: bold; padding-left: 20px;">Line 1:</th>
      <th style="text-align: left; color: #ffffff; font-size: 13px; font-weight: bold; padding-left: 20px;">Line 1:</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Current ==</div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Current ==</div></td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
    </tr>
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
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Proposed ==</div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Proposed ==</div></td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
    </tr>
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
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">&lt;references-def&gt;</div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">&lt;references-def&gt;</div></td>
    </tr>
  </tbody>
</table>
</div>

### Mechanics & Rules
1. **Render Suppression:** `<references-def>` registers definitions in the parser citation registry but suppresses in-place HTML rendering.
2. **Global Aggregation:** `<references />` collects all definitions page-wide in document appearance order.
3. **Fault Tolerance & Bot Cleanup:** Definitions resolve page-wide, so moving a sentence across sections never causes a missing-reference error. Maintenance bots can asynchronously migrate misplaced definitions to their respective section.

### Affected Components (Overview)
* **MediaWiki Core / Parser:** `Extension:Cite` (tag registration & suppressed rendering), `Parsoid` (round-tripping), `Page Previews` (hovercards resolve transparently).
* **Diff Tools (`wikidiff2`):** Zero modifications required (works out-of-the-box with existing MediaWiki diffs; hunk separation within sections is an acknowledged trade-off).
* **Editors:** `VisualEditor` (option to append definitions to section blocks), `SyntaxHighlighter`.
* **Ecosystem:** `Pywikibot`, `InternetArchiveBot`, `AutoWikiBrowser`.

---

## 2. Community Discussion Draft (MediaWiki & Wikipedia Forums)

* **Primary Venue (MediaWiki.org):** [mediawiki.org/wiki/Extension_talk:Cite](https://www.mediawiki.org/wiki/Extension_talk:Cite)
* **Wikipedia Discussion Pages:** `en:Wikipedia talk:Citing sources` (or `de:Wikipedia Diskussion:Einzelnachweise`)
* **Subject / Section Title:** `Proposal: Section-scoped reference blocks (<references-def>) for cleaner wikitext and better diffs`

### Post Body

Hi all,

I would like to propose a feature idea to improve reference management in wikitext: introducing a section-scoped definition block (working title: `<references-def>`) that keeps citations near the text without breaking prose flow.

#### What it looks like

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

#### Why this helps

1. **Readable wikitext with references still nearby:** Paragraphs in raw wikitext stay fluent and readable without 500-character citation templates cluttering sentences. Unlike purely global reference lists at the bottom of the article, citations remain right at hand within the section where they belong.
2. **Clean, isolated diffs:** Rewording a sentence touches only the sentence line. Updating a URL or page number touches only that single reference line.
3. **No edit conflicts between sections:** Two editors working on different sections never collide in a shared reference list at the bottom of the page.
4. **Better claim auditing:** Reviewers can check the section's source inventory at a glance against hallucinated or unverified text.
5. **Same reader experience:** Footnotes continue to display at the very bottom with continuous global numbering (`[1]`, `[2]`, …) as usual.

#### Diff Comparison

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

#### Mechanics & Trade-Offs

* `<references-def>` does not render HTML where it sits—it simply registers definitions in the parser citation registry.
* The standard `<references />` tag at the bottom outputs everything in appearance order.
* **Fault tolerance:** The parser resolves definitions page-wide. If someone moves a sentence to another section and forgets to move the definition, the page does not break. Bots can later clean up and migrate misplaced definitions.
* **Trade-off (Diff review):** Because prose and source definitions are decoupled, they form separate hunks within the section rather than on the same line. Section-scoping keeps this physical distance minimal (within the same section) while leaving raw wikitext clean and readable.

I'd love to hear your thoughts and feedback before filing/linking the Phabricator task!
