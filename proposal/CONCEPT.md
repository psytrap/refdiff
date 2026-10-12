# Concept: Diff-Optimized & Section-Modular Reference Management

This document details the architectural concept, syntax specification, and operational workflows for managing citations and references in MediaWiki wikitext and Git-versioned documentation repositories.

Its primary objectives are to **radically improve diff readability**, **prevent merge conflicts**, **streamline human review against AI-generated filler ("AI slop")**, and **provide a modular authoring experience**.

---

## 1. Motivation & Problem Statement

### 1.1 Status Quo: Standard Inline References
In MediaWiki wikitext (including Wikipedia), citations are traditionally embedded directly inside sentences using inline `<ref>` tags:

```wikitext
The surface of Venus is dominated by intense volcanism.<ref>{{Cite book |author=Schmidt, Rainer |title=Volcanism on Terrestrial Planets |year=2020 |pages=45–48}}</ref> Radar imaging reveals thousands of volcanic structures.<ref name="nasa">{{Cite web |author=NASA JPL |url=https://example.org/venus-radar |title=Venus Radar Mapping Project |access-date=2026-10-08}}</ref>
```

### 1.2 Flaws in Version Control & Collaborative Workflows
1. **Diff Pollution (Noise):**
   When a reference is updated (e.g. fixing a URL, updating an access date, or correcting a typo in a book title), Git marks the entire sentence and paragraph as modified. In code reviews, it is virtually impossible to quickly distinguish whether actual factual claims changed or merely bibliographic metadata.
2. **Artificial Edit & Merge Conflicts:**
   If Author A edits the prose (*"The surface of Venus is largely shaped by..."*) while Author B simultaneously updates the URL of the citation in the same sentence, Git triggers a merge conflict—even though text and source metadata are conceptually orthogonal.
3. **The "Split Hunk" Problem of Document-End Lists:**
   Moving all reference definitions into a single, global `<references>` block at the very end of a document forces every commit to span two disjoint, widely separated diff hunks (e.g. line 30 for the text anchor and line 900 for the citation definition). If multiple contributors work on different chapters, everyone edits the bottom of the file simultaneously, creating inevitable merge conflicts.
4. **Cascading Failures on Section Reorganization:**
   When using named references (`<ref name="xyz">full definition...</ref>` and subsequent `<ref name="xyz" />`), moving or deleting the first paragraph where the full reference was defined breaks all subsequent callouts across the article (*"Cite error: Invalid `<ref>` tag; no text was provided for refs named xyz"*).

### 1.3 Fact-Checking & Auditing Against "AI Slop"
The proliferation of Large Language Models (LLMs) fundamentally changes documentation maintenance:
* **The Threat of AI-Generated Filler:** LLMs can generate massive amounts of superficially plausible, grammatically fluent text that is subtly inaccurate, repetitive, or hallucinated.
* **Increased Demand for Rigorous Source Auditing:** Reviewers spend less time evaluating raw writing speed and far more time verifying that factual claims are backed by solid, authoritative primary sources.
* **Cognitive Load of Inline Clutter:** When 500-character citation templates are stuffed into every sentence, human reviewers suffer from cognitive fatigue and struggle to evaluate the core claims against the sources.
* **Section-Level Source Inventories:** Isolating citations into section-level blocks gives reviewers an immediate, high-level inventory of all sources backing that specific topic (academic books vs. low-quality websites) without syntax noise.

### 1.4 Trade-Off Analysis: Acknowledged Downside of Decoupled Diffs
Decoupling prose from citation definitions resolves diff pollution and eliminates merge conflicts, but introduces an acknowledged trade-off for diff inspection:
* **Separation of Claim and Source in Diffs:** In standard line-based diff tools (`wikidiff2`, Git diff), modifying a sentence produces a diff hunk at the sentence, while the citation definition remains untouched in `<references hidden>`. If an editor changes a fact without updating the citation anchor `<ref name="..." />`, a reviewer reviewing only the diff hunk does not see the citation metadata inline.
* **Mitigation via Section Locality:** While this is a real downside compared to traditional inline citations, section-scoped blocks minimize the cognitive gap: definitions are located immediately at the end of the same section (typically 10–30 lines away), rather than at the bottom of the entire article (thousands of lines away).
* **Zero Tooling Dependency:** No modifications to diff engines (`wikidiff2`) or review tools are required. The proposal works 100% out-of-the-box with MediaWiki's existing diff infrastructure.

---

## 2. Core Architecture: The Two-Tier Model

The concept relies on a strict **Separation of Storage and Presentation**:

```
+-----------------------------------------------------------------------+
| TIER 1: Source & Git Storage (Section Modularity)                     |
|                                                                       |
|  == Section A ==                                                      |
|  Claim 1.<ref name="ref-a1" />                                        |
|                                                                       |
|  <references hidden>                                                  |
|    <ref name="ref-a1">Full citation for A1...</ref>                   |
|  </references>                                                        |
|                                                                       |
|  == Section B ==                                                      |
|  Claim 2.<ref name="ref-b1" />                                        |
|                                                                       |
|  <references hidden>                                                  |
|    <ref name="ref-b1">Full citation for B1...</ref>                   |
|  </references>                                                        |
+-----------------------------------------------------------------------+
                                  │
                  [Parser Aggregation & Rendering]
                                  ▼
+-----------------------------------------------------------------------+
| TIER 2: Frontend & Reader Presentation (Unified Global Output)        |
|                                                                       |
|  Section A: Claim 1.[1]                                               |
|  Section B: Claim 2.[2]                                               |
|                                                                       |
|  == References ==                                                     |
|  [1] Full citation for A1...                                          |
|  [2] Full citation for B1...                                          |
+-----------------------------------------------------------------------+
```

1. **In the Source Code (Git):** Definitions are declared locally within the section where they are used. Prose and sources reside in close physical proximity.
2. **For the Reader (Frontend):** All citations are aggregated and displayed globally at the bottom of the article under `== References ==`, with continuous `[1], [2], ...` numbering. For the reader, the familiar, uniform Wikipedia/MediaWiki experience is 100% preserved.

---

## 3. Concrete Diff Analyses (Before vs. After)

### 3.1 Scenario A: Prose Update (Proofreading / Rewording Across Citations)

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
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Current (Inline) ==</div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Current (Inline) ==</div></td>
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
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Proposed (Section-Scoped) ==</div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Proposed (Section-Scoped) ==</div></td>
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
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">&lt;references hidden&gt;</div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">&lt;references hidden&gt;</div></td>
    </tr>
  </tbody>
</table>
</div>

---

### 3.2 Scenario B: Citation Metadata Update (e.g. Page Number or Access Date)

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
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Current (Inline) ==</div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Current (Inline) ==</div></td>
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
            The surface of Venus is dominated by intense volcanism.&lt;ref&gt;{{Cite book |author=Schmidt, Rainer |title=Volcanism on Terrestrial Planets |year=2020 |pages=45–<span style="background: #5a3814; color: #ffd8a8; font-weight: bold; padding: 1px 4px; border-radius: 3px;">48</span>}}&lt;/ref&gt;
          </div>
        </div>
      </td>
      <td style="vertical-align: top;">
        <div style="display: flex; align-items: flex-start;">
          <span style="width: 16px; color: #768390; font-weight: bold; font-size: 14px; text-align: center; margin-right: 4px;">+</span>
          <div style="flex: 1; background: #121a24; border: 1px solid #1f3d5c; border-radius: 4px; padding: 6px 10px; color: #e6edf3;">
            The surface of Venus is dominated by intense volcanism.&lt;ref&gt;{{Cite book |author=Schmidt, Rainer |title=Volcanism on Terrestrial Planets |year=2020 |pages=45–<span style="background: #1f3f6d; color: #a5d6ff; font-weight: bold; padding: 1px 4px; border-radius: 3px;">52</span>}}&lt;/ref&gt;
          </div>
        </div>
      </td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Proposed (Section-Scoped) ==</div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">== Proposed (Section-Scoped) ==</div></td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; height: 14px;"></div></td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">&lt;references hidden&gt;</div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">&lt;references hidden&gt;</div></td>
    </tr>
    <tr>
      <td style="vertical-align: top;">
        <div style="display: flex; align-items: flex-start;">
          <span style="width: 16px; color: #768390; font-weight: bold; font-size: 14px; text-align: center; margin-right: 4px;">−</span>
          <div style="flex: 1; background: #1a1614; border: 1px solid #543b1f; border-radius: 4px; padding: 6px 10px; color: #e6edf3;">
            &lt;ref name="schmidt2020"&gt;{{Cite book |author=Schmidt, Rainer |title=Volcanism on Terrestrial Planets |year=2020 |pages=45–<span style="background: #5a3814; color: #ffd8a8; font-weight: bold; padding: 1px 4px; border-radius: 3px;">48</span>}}&lt;/ref&gt;
          </div>
        </div>
      </td>
      <td style="vertical-align: top;">
        <div style="display: flex; align-items: flex-start;">
          <span style="width: 16px; color: #768390; font-weight: bold; font-size: 14px; text-align: center; margin-right: 4px;">+</span>
          <div style="flex: 1; background: #121a24; border: 1px solid #1f3d5c; border-radius: 4px; padding: 6px 10px; color: #e6edf3;">
            &lt;ref name="schmidt2020"&gt;{{Cite book |author=Schmidt, Rainer |title=Volcanism on Terrestrial Planets |year=2020 |pages=45–<span style="background: #1f3f6d; color: #a5d6ff; font-weight: bold; padding: 1px 4px; border-radius: 3px;">52</span>}}&lt;/ref&gt;
          </div>
        </div>
      </td>
    </tr>
    <tr>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">&lt;/references&gt;</div></td>
      <td><div style="background: #181d26; border: 1px solid #2d333b; border-radius: 4px; padding: 4px 10px; color: #adbac7;">&lt;/references&gt;</div></td>
    </tr>
  </tbody>
</table>
</div>

* **Current Inline:** The entire body sentence is flagged as modified. `git blame` attributes the body text to whoever updated the citation page range.
* **Section-Modular:** The body text remains 100% untouched (`git blame` integrity preserved). The diff is localized strictly to that single citation definition line.

---

### 3.3 Scenario C: Collaborative Multi-Author Editing

* **Without Section Blocks (Global `<references>` list):**
  Contributor A edits Chapter 1 and appends a citation at line 900.
  Contributor B edits Chapter 4 and also appends a citation at line 900.
  *Result:* **Merge conflict at document end.**
* **With Section-Modular Blocks:**
  Contributor A edits lines 20–35 (Chapter 1 + its local `<references hidden>`).
  Contributor B edits lines 120–140 (Chapter 4 + its local `<references hidden>`).
  *Result:* **0% conflict surface.** Git cleanly merges automatically.

---

### 3.4 Scenario D: Atomic Refactoring (Moving or Deleting Sections)

* When Section 2 is deleted, both its prose and citation definitions are removed together in a single atomic hunk. No orphaned citations clutter the bottom of the article.
* When Section 2 is relocated, its complete package of text and supporting evidence moves together cleanly.

---

## 4. Author Ergonomics & Scoping Rules

To maintain author freedom while keeping repositories clean:

1. **Authoring Freedom:**
   Authors can place `<references hidden>` blocks naturally within sections, subsections, or lead paragraphs without worrying about strict structural constraints.
2. **Bots Clean Up:**
   Automated maintenance bots and linters consolidate multiple local definition blocks into one canonical `<references hidden>` per section, keeping the wikitext clean and standardized.
3. **Lead Section & Infobox References:**
   Citations placed in the lead intro or infoboxes (before the first `== Heading ==`) are defined in a `<references hidden>` block placed at the end of the lead section.

---

## 5. Technical Implementation Pathways

Four technical pathways exist for realizing this model:

### Pathway A: Git Preprocessor / Clean-Smudge Filter
* **How it works:** Authors edit and version section-modular wikitext in Git. A lightweight pre-commit hook, CI job, or Git filter compiles the text into standard wikitext (moving definitions to the global `<references>` tag) before pushing or uploading to MediaWiki.
* **Pros:** Works out-of-the-box with **any** existing MediaWiki or Wikipedia instance without server permissions or extensions.
* **Cons:** Requires a tool in the local Git workflow.

### Pathway B: MediaWiki Scribunto Lua Module
* **How it works:** A Lua module (e.g. `{{#invoke:RefDef|...}}`) registers references during page parsing without rendering HTML, and dumps them at the document end.
* **Pros:** Runs directly on the wiki server without local preprocessors.
* **Cons:** Requires template/module editing rights on the wiki.

### Pathway C: MediaWiki `Extension:Cite` Native Support
* **How it works:** A native hook or patch in `Extension:Cite` directly supports the `hidden` attribute on `<references>` within the parser pipeline, registering definitions while suppressing immediate HTML rendering.
* **Pros:** Cleanest long-term native integration in MediaWiki core.
* **Cons:** Requires server administrator deployment.

### Pathway D: On-the-Fly Reformatting Compatibility Layer (Dynamic LDR Hoisting)
* **How it works:** On unpatched MediaWiki instances or third-party wikis running older versions of `Extension:Cite`, a lightweight server hook in `ParserBeforeInternalParse` (or a micro-extension `CiteHiddenCompat`) dynamically extracts `<references hidden>` blocks and hoists the enclosed `<ref>` definitions into the document-end `<references>` tag as standard List-Defined References (LDR) in memory before `Extension:Cite` parses tags:
  ```php
  // LocalSettings.php — Dynamic Reformatting Compatibility Layer
  $wgHooks['ParserBeforeInternalParse'][] = function ( Parser $parser, string &$text ) {
      $collectedDefs = [];
      // 1. Extract definitions and strip section <references hidden> blocks
      $text = preg_replace_callback(
          '/<references\s+hidden\s*>(.*?)<\/references>/is',
          function ( $matches ) use ( &$collectedDefs ) {
              $collectedDefs[] = trim( $matches[1] );
              return ''; // Suppress in-situ HTML completely
          },
          $text
      );
      // 2. Append collected definitions into the bottom <references> block as standard LDR
      if ( !empty( $collectedDefs ) ) {
          $defsBlock = "\n" . implode( "\n", $collectedDefs ) . "\n";
          if ( preg_match( '/<references\s*\/>/i', $text ) ) {
              $text = preg_replace( '/<references\s*\/>/i', "<references>{$defsBlock}</references>", $text, 1 );
          } elseif ( preg_match( '/<references\b(.*?)>(.*?)<\/references>/is', $text ) ) {
              $text = preg_replace( '/<references\b(.*?)>(.*?)<\/references>/is', "<references$1>$2{$defsBlock}</references>", $text, 1 );
          }
      }
  };
  ```
* **Pros:**
  1. **Zero Core Modifications:** Can be dropped into `LocalSettings.php` on any MediaWiki release (1.35 to 1.43+) without waiting for core software upgrades.
  2. **100% Backward-Compatible Output:** Because `Extension:Cite` receives pure 2008-standard LDR wikitext, it never encounters an unpatched tag, completely eliminating in-situ `<ol>` lists, premature citation buffer flushes, and parameter error banners.
  3. **Wikitext Storage Integrity:** Database revisions remain clean, modern, and section-modular for Git diffs and human editing.
* **Cons:** In-memory regular expression scan on parse time (negligible overhead for standard pages).

---

## 6. Nomenclature & Syntax Discussion

| Candidate | Example | Evaluation |
| :--- | :--- | :--- |
| **`<references hidden>`** *(Primary Working Title)* | `<references hidden>`<br>`  <ref name="id">...</ref>`<br>`</references>` | **Optimal Web Standard & Tooling Reuse:** Uses the native HTML5 boolean attribute `hidden` on the existing `<references>` tag. Reuses existing AST parsers (`mwparserfromhell`, `wikitextparser`, Parsoid AST) and bots without registering a new XML tag. Quote-free, clean wikitext ergonomics (`<references hidden>`). |
| **`<references-def>`** *(Dedicated XML Tag Alternative)* | `<references-def>`<br>`  <ref name="id">...</ref>`<br>`</references-def>` | **Strict Declaration Separation:** Clearly separates *definition/declaration* (`def`) from *rendering* (`references`). Eliminates any risk of accidental footnote rendering on unpatched legacy third-party wikis. |
| **`<references display="none">`** *(CSS Property-Value Alternative)* | `<references display="none">`<br>`  <ref name="id">...</ref>`<br>`</references>` | **CSS Property Alignment:** 1:1 match with the standard CSS rule `display: none;`. More verbose than boolean `hidden` due to required attribute quotes and value. |
| **`<references definition="true">`** / **`<references define>`** *(Functional Role)* | `<references definition="true">`<br>`  <ref name="id">...</ref>`<br>`</references>` | **Tooling Continuity:** Explicitly names the container's purpose. Reuses the existing `<references>` tag; existing AST parsers, bots (AWB), and regexes instantly recognize the block. |
| **`<references scope="section">`** | `<references scope="section">`<br>`  <ref name="id">...</ref>`<br>`</references>` | **Ambiguous Scope:** Suggests that references are strictly isolated to the section, contradicting the desired page-wide fault tolerance. |
| **`<references-sub>`** | `<references-sub>`<br>`  <ref name="id">...</ref>`<br>`</references-sub>` | **Confusing:** Risks collision with MediaWiki's existing "sub-referencing" feature (`details="..."`). |

---

### 6.1 HTML5 Boolean Attribute (`<references hidden>`) vs. Dedicated Tag (`<references-def>`)

A central architectural decision is whether to adopt the native HTML5 boolean attribute on the existing tag (**`<references hidden>`**) or introduce a **new dedicated parser tag** (`<references-def>`):

#### Advantages of the HTML5 Boolean Attribute (`<references hidden>`)
Tool and bot maintainers (AWB, Refill, ProveIt, Pywikibot, user scripts) often express fatigue when new XML tags are added to wikitext because every grammar, syntax highlighter, and regex pipeline must be updated. Reusing `<references>` with the standard HTML5 boolean `hidden` attribute offers major benefits:
1. **HTML5 Semantic Standard:**
   In the HTML5 specification (§3.2.6), the `hidden` boolean attribute indicates that an element is not currently relevant and must be hidden from visual presentation. MediaWiki tags frequently adopt HTML5 attribute conventions.
2. **AST & Parser Continuity:**
   Python and Node.js wikitext parsers (`mwparserfromhell`, `wikitextparser`, Parsoid AST) already treat `<references>...</references>` as a known node that encapsulates `<ref>` definitions (due to List-Defined References). No grammar changes are required.
3. **Regex & Bot Compatibility:**
   Scripts and bot pipelines searching for reference containers using expressions like `/<references(?:\s+[^>]*)?>.*?<\/references>/is` automatically capture section definition blocks without code modifications.
4. **Wikitext Brevity & Ergonomics:**
   Unlike `<references display="none">` or `<references definition="true">`, a boolean attribute requires no value or quotes: editors type simply `<references hidden>`. This minimizes keystrokes, syntax errors, and visual noise in wikitext.

#### Trade-Offs & Counter-Arguments
1. **Fallback on Unpatched Parsers (Mitigated via Dynamic Reformatting):**
   In standard unpatched MediaWiki today, `<references>` ignores or errors on unrecognized attributes and executes its default `<ol>` render method. However, this is completely mitigated by the **On-the-Fly Reformatting Compatibility Layer (Pathway D)**: a 15-line hook in `LocalSettings.php` transpiles `<references hidden>` to standard LDR at parse time on third-party wikis. Furthermore, Wikimedia export filters (`Special:Export`, database dumps for Kiwix and mirrors) automatically transpile wikitext to standard LDR on export, ensuring external consumers and mirrors never encounter unrecognized syntax.
2. **Action vs. Declaration Mental Model:**
   For human editors, `<references />` has historically meant an *action* ("render the bibliography here"). Some editors find `<references-def>` more intuitive because the `-def` suffix clearly communicates that it is a *declaration block* rather than a display element.

**Recommendation:** The proposal adopts **`<references hidden>`** as its primary working title solution for maximum tooling reuse and syntax brevity, while formally presenting `<references-def>` (for strict parser separation) and `<references display="none">` (for explicit CSS alignment) as evaluated alternatives.

---

## 7. Resilience & Edge Cases

### 7.1 Relocated Sentences & Fault Tolerance
* **The Challenge:** An author moves a sentence containing `<ref name="ref1" />` from Section 1 to Section 4, but forgets to move the definition from Section 1's `<references hidden>`.
* **Guaranteed Fault Tolerance:** The page **never breaks**. Because the parser aggregates definitions page-wide, the reference resolves seamlessly and renders correctly at the document bottom.
* **Bots Clean Up:** Maintenance bots asynchronously detect that `<ref name="ref1" />` is only referenced in Section 4, and automatically migrate its definition into Section 4's `<references hidden>`.

### 7.2 Cross-Section References & Deletion Hazards
A frequent scenario in long-form articles is cross-section reference reuse:
* **The Scenario:** Editor A defines `<ref name="Smith2020">` in the `== Early life ==` section. Editor B reuses `<ref name="Smith2020" />` three sections down in `== Legacy ==`.
* **The Hazard:** Months later, another contributor refactors, deletes, or splits `== Early life ==` without realizing that downstream sections rely on that definition, potentially causing a classic `cite_error_references_no_text` ("Cite error: The named reference Smith2020 was defined multiple times or was not defined at all").

#### Comparison with Status Quo
This vulnerability is not new to `<references hidden>`; it is the **exact same failure mode that plagues inline references today**, where the primary definition is buried inside an upstream paragraph. In fact, status-quo inline refs make this worse: an editor deleting a paragraph rarely inspects the inline citation tags to determine if it is the primary definition or just an invocation.

#### Architectural Mitigations with `<references hidden>`:
1. **Global Parser Aggregation:** Definitions inside `<references hidden>` are parsed into the global citation pool, so cross-section reuses resolve transparently without error.
2. **Tiered Source Placement:**
   * *Section-local sources:* Placed in the section's `<references hidden>`.
   * *Ubiquitous / Cross-cutting sources:* Can be placed in a top-level or article-end `<references hidden>` block (near `== References ==`), signaling to editors that these citations are global dependencies.
3. **Parser Idempotency (Safe Duplication):**
   * If an editor in `== Legacy ==` wants their section to be 100% self-contained and atomic against upstream deletions, they can safely define `<ref name="Smith2020">...</ref>` in their own `<references hidden>` block as well. As long as the definition matches, the parser deduplicates it idempotently without throwing a duplicate-key error.
4. **Edit-Time Linter & VisualEditor Diagnostics:**
   * Because definitions reside in dedicated, parseable `<references hidden>` blocks, section edit previews and Parsoid linters can easily inspect the document AST. If an editor removes `<ref name="Smith2020">` while another section still calls `<ref name="Smith2020" />`, the editor is alerted before saving:
     > ⚠️ *"Reference 'Smith2020' removed in this section is still cited in 'Legacy'. Hoist to article-level references?"*
5. **Automated Bot Hoisting:**
   * Citation maintenance bots (e.g. AnomieBOT) can inspect revision diffs and automatically hoist orphaned `<references hidden>` entries to the downstream section or the global reference block.

### 7.3 Deterministic Formatting for Zero-Diff Commits
To maximize Git efficiency:
* Each `<ref name="...">...</ref>` inside `<references hidden>` is formatted as a single compact line.
* Inside `<references hidden>`, entries are sorted alphabetically by `name="..."`, ensuring that adding a new citation never shifts or reorders neighboring lines.

### 7.4 Multi-Page Reference Reuse (Citing the Same Source with Different Pages)
A very common real-world scenario in Wikipedia is citing the same large monograph or report across multiple claims, but referencing different page numbers each time (e.g. citing *Schmidt 2020* on page 45, page 112, and page 240).

Section-scoped blocks harmonize cleanly with both native MediaWiki features and community templates:

1. **Direct In-Prose Sub-Referencing (`<ref name="..." details="..." />`):**
   * The core work is defined **once** in `<references hidden>`, and prose callouts specify the exact location via `details="..."`:
     ```wikitext
     The surface of Venus is dominated by intense volcanism.<ref name="schmidt2020" details="p. 45" />
     Later radar maps confirmed extensive lava plains.<ref name="schmidt2020" details="pp. 112–115" />

     <references hidden>
     <ref name="schmidt2020">{{Cite book |author=Schmidt, Rainer |title=Volcanism on Terrestrial Planets |year=2020 |isbn=978-3-12-345678-9 |publisher=Springer}}</ref>
     </references>
     ```
   * **Advantage:** Native MediaWiki standard out-of-the-box.
   * **Limitation:** If a page number is corrected (e.g. `p. 45` → `p. 52`), the diff hunk touches the prose line in Git.

2. **Full Three-Tier Decoupling: Derived Sub-References in `<references hidden>` (*Maximum Git-Blame Protection*) — *Optimal***
   * To achieve 100% diff isolation even when correcting page numbers, derived references can be declared with their own ID inside `<references hidden>`:
     ```wikitext
     == 1. Geology of Venus ==
     The surface of Venus is dominated by intense volcanism.<ref name="schmidt2020_p45" />
     Later radar maps confirmed extensive lava plains.<ref name="schmidt2020_p112" />

     <references hidden>
     <!-- Base monograph (declared once) -->
     <ref name="schmidt2020">{{Cite book |author=Schmidt, Rainer |title=Volcanism on Terrestrial Planets |year=2020 |isbn=978-3-12-345678-9 |publisher=Springer}}</ref>

     <!-- Page-specific derived references -->
     <ref name="schmidt2020_p45" parent="schmidt2020" details="p. 45" />
     <ref name="schmidt2020_p112" parent="schmidt2020" details="pp. 112–115" />
     </references>
     ```
   * **Result:**
     * **Prose Tier:** Completely immaculate. Sentences contain only lightweight, immutable reference anchors (`<ref name="schmidt2020_p45" />` or semantic anchors like `<ref name="venus-lava-depth" />`).
     * **Definition Tier:** Correcting a page number (e.g. `p. 45` → `p. 52`) modifies **strictly the single line in `<references hidden>`**. The prose sentence remains 100% untouched (`git blame` integrity preserved).
     * **Rendering Tier:** Aggregated seamlessly in the global `<references />` list.

3. **Community Template Alternative: In-Prose Page Suffix (`{{rp|...}}`) — *Legacy / en.wiki***
   * On wikis that do not use native sub-referencing, the community template `{{rp}}` (*Reference Page*) appends superscript page numbers in prose:
     ```wikitext
     The surface of Venus is dominated by intense volcanism.<ref name="schmidt2020" />{{rp|45}}
     Later radar maps confirmed extensive lava plains.<ref name="schmidt2020" />{{rp|112–115}}
     ```
   * **Result:** Renders as `[1]:45` and `[1]:112–115`. Fully supported alongside `<references hidden>`.

4. **Shortened Footnotes (`{{sfn}}`) & Global Bibliography**
   * For articles employing separate `== Bibliography ==` sections, `<references hidden>` works seamlessly with short-citation templates (`{{sfn|Schmidt|2020|p=45}}`), allowing editors to consolidate local citations without scattering templates into paragraph text.

### 7.5 Section Editing & Tool Locality: Synergies with ProveIt and Community Wishlist W190
A major structural pain point in current MediaWiki citation management is highlighted by **[Community Wishlist W190](https://meta.wikimedia.org/wiki/Community_Wishlist/W190)** (*"Reference editing"*, [Phabricator T356471](https://phabricator.wikimedia.org/T356471)):
* **The Failure Mode:** When an editor edits an individual section, any reference defined outside that section—either in another section or in a global List-Defined References (LDR) block at the bottom—is reduced to an uneditable callout stub (`<ref name="foo" />`). Editors cannot inspect or update the citation without opening the entire article.
* **Impact on Tooling ([ProveIt](https://en.wikipedia.org/wiki/Wikipedia:ProveIt)):** Client-side tools like ProveIt (`Gadget-ProveIt.js`) parse only the wikitext inside the section's edit box (`#wpTextbox1`). When definitions live elsewhere, ProveIt's graphical form and Citoid auto-filling cannot edit the reference.
* **The `<references hidden>` Solution:** By defining references locally within the section where they are used, the full citation markup is inherently present inside `#wpTextbox1` during section editing. Tools like ProveIt can immediately parse, display, and edit the source definitions without requiring complex cross-section asynchronous API rewrites.

---

## 8. Ecosystem Impact & Affected Tooling

Introducing section-scoped reference blocks interacts with several components across the MediaWiki and Wikipedia toolchains:

### 8.1 MediaWiki Core & Parser Pipeline
* **`Extension:Cite`:** The foundational extension powering references. Must recognize the boolean `hidden` attribute on `<references>`, register definitions in the page's citation registry, and suppress immediate HTML output.
* **Parsoid:** MediaWiki's bidirectional wikitext ↔ HTML parser. Requires round-trip schema awareness so that saving visual edits does not alter or misplace definition blocks.
* **Page Previews / Reference Tooltips:** The hovercards displaying footnote previews when readers mouse over `[1]`. Because definitions remain registered within the internal Cite pool, hovercards resolve citations transparently without frontend changes.

### 8.2 Diff Engines & Review Workflows (Zero Changes Required)
* **Out-of-the-Box Compatibility with `wikidiff2`:** Existing diff tools (`wikidiff2`, Git, Gerrit, Phabricator) require **no modifications**. Edits to prose and edits to `<references hidden>` render naturally as standard, independent diff hunks within the same section.
* **Acknowledged Downside / Trade-Off:** Because claim and citation definition are not on the same line, reviewers must inspect the section's `<references hidden>` block if they wish to verify the full citation metadata of a modified sentence. However, section-locality keeps the definition in close physical proximity (typically within the same screen or diff fold), drastically outperforming document-end citation lists.
* **Optional Future Ideas (Non-Blocking):** In the future, diff tools or gadgets *could* optionally offer reference hovercards or linked hunks as a quality-of-life improvement. However, this is strictly optional and **not a prerequisite** for adopting `<references hidden>`.

### 8.3 Editors & User Interfaces
* **VisualEditor (VE):** Needs an authoring option or schema rule to place new reference definitions into the current section's `<references hidden>` rather than inline.
* **Wikitext 2017 / SyntaxHighlighter:** Syntax styling already recognizes `<references>` naturally; highlighting rules can style the `hidden` attribute as a recognized keyword.
* **IDE & Language Tools:** Wikitext LSP extensions (VS Code, Vim) can leverage section-scoped blocks for localized autocomplete of `ref name="..."`.
* **Wikitext Decluttering Scripts (References Segregator, RefCruncher, ProveIt):** Community user scripts built to reduce inline citation clutter client-side (by splitting panes or collapsing tags into chips) gain native data-model support, as wikitext is already cleanly partitioned.

### 8.4 Bots & Maintenance Automation
* **Pywikibot:** The standard Python framework for Wikipedia bots. Citation normalization and dead link detection scripts will target section blocks directly.
* **InternetArchiveBot (IABot):** Replaces broken links with web archives. Operates directly inside `<references hidden>`, producing clean, localized diffs.
* **AutoWikiBrowser (AWB):** Semi-automated editing rules and cleanup plugins already support `<references>` containers; adjustments only needed to preserve section blocks during bot passes.

### 8.5 Parsers & Offline Readers
* **AST Parsers (`mwparserfromhell`, `wikitextparser`):** Python libraries used across scientific research and bot pipelines already parse `<references>...</references>` without modification (via LDR support). Extraction scripts can inspect the `hidden` attribute directly.
* **Offline Readers & Converters (Kiwix / Pandoc):** ZIM scrapers and multi-format converters (Markdown/LaTeX exports) will parse the consolidated global references list automatically, with zero impact on offline readers.

---

## 9. Rollback, Automated De-migration & Historical Revision Compatibility

A crucial requirement for adopting any new structural wikitext markup in Wikimedia is an unconditional, non-destructive rollback guarantee. Because wikitext is immutable and permanently preserved across millions of database revisions, any proposal must answer two critical operational questions:
1. *If a community decides to dismiss the feature, how do we clean up existing articles without manual editor labor?*
2. *Years after the feature is retired, what happens when a reader or researcher inspects older revisions (`oldid=...`)?*

### 9.1 Automated Wikitext De-migration (Dismissal Clean-Up)

In the event that `<references hidden>` is rejected by community consensus or decommissioned on a specific wiki, the transition back to legacy wikitext is 100% automated:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FEATURE DISMISSAL DECREED                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
│     Path A: Loss-less Hoisting        │ │     Path B: In-Prose Restoration      │
│      (To List-Defined References)     │ │        (To Inline References)         │
├───────────────────────────────────────┤ ├───────────────────────────────────────┤
│ • Extract <ref> from <references      │ │ • Locate 1st in-prose <ref name="X" />│
│   hidden>                             │ │ • Replace with full definition        │
│ • Append to bottom <references> block │ │ • Remove <references hidden> block    │
│ • PROSE TEXT REMAINS 100% UNTOUCHED   │ │ • Returns to traditional inline style │
│ • Zero risk of sentence merge conflict│ │                                       │
└───────────────────────────────────────┘ └───────────────────────────────────────┘
```

1. **Tracking Scope:**
   * All pages containing `<references hidden>` are indexed automatically via `Category:Pages that use hidden reference blocks` (or section-scoped reference definitions) (managed transparently via `Special:TrackingCategories`).
2. **Automated Migration Tooling (`cleanupReferencesHidden.php` / Pywikibot):**
   * **Path A (Loss-less Hoisting to LDR — Default / Recommended):**
     The migration bot parses the page AST, extracts every `<ref name="...">...</ref>` entry from all section-scoped `<references hidden>` blocks, appends them into the article's existing document-end `<references>` block, and removes the section blocks.
     * *Key Benefit:* **Prose sentences are completely untouched.** All inline `<ref name="X" />` callouts remain unchanged, eliminating any possibility of accidental prose corruption, broken punctuation, or merge conflicts.
   * **Path B (In-Prose Restoration — Optional per wiki policy):**
     For wikis with strict editorial rules against List-Defined References, the bot substitutes each definition into its first in-prose callout (`<ref name="X">...</ref>`), leaving subsequent callouts as `<ref name="X" />`.
3. **Decommissioning Milestone:**
   * Automated bot passes run until the tracking category count drops to 0.

### 9.2 Multi-Year Parser Legacy Support for Historical Revisions

Even after all current revisions of every article on a wiki have been migrated back to legacy syntax, millions of historical revisions (`oldid=...`) and historical diff views will forever contain `<references hidden>` markup.

If the parser hook were simply deleted from MediaWiki, viewing an older revision would result in:
* Catastrophic citation failures (`cite_error_references_no_text`) for every reused reference.
* Unrecognized XML tags spilling into prose or rendering as raw text.
* Broken academic and legal permalinks citing Wikipedia revisions from that era.

#### The Passive Fallback Hook Solution:
To prevent this, `Extension:Cite` maintains a permanent, ultra-lightweight **Passive Fallback Hook** (~5 lines of code) as part of MediaWiki core's long-term LTS compatibility:

```php
// Passive Fallback in Extension:Cite parser hook for <references> (read-only LTS compatibility)
if ( isset( $args['hidden'] ) ) {
    // 1. Parse and register enclosed <ref> definitions into the page's global citation registry
    $parser->recursiveTagParse( $content, $frame );
    // 2. Suppress in-situ HTML rendering completely (return empty string)
    return '';
}
```

* **Zero Operational Overhead:** The fallback hook performs no database writes, loads no external CSS/JS assets, and requires no UI maintenance.
* **Archival Fidelity:** When an editor, researcher, or automated scraper loads `index.php?title=Article&oldid=123456`, the parser registers the citations silently and renders the global footnotes list at the bottom of the page seamlessly.
* **Diff Integrity:** Comparing revisions across the transition period displays clean, readable diffs with zero parser error banners.
