# RefDiff: The Ref-Differentiator
### User Script & Gadget Documentation for MediaWiki `Special:Diff`

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](refdiff.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI Status](https://img.shields.io/badge/CI-passing-brightgreen.svg)](tests/)
[![Supported Skins](https://img.shields.io/badge/skins-Vector%202022%20%7C%20Legacy%20%7C%20Timeless%20%7C%20Monobook-informational.svg)](#supported-skins--themes)

**RefDiff** (*The Ref-Differentiator*) is a zero-loss citation decoupling gadget and user script for Wikipedia and MediaWiki `Special:Diff`. It eliminates **"template camouflage"** by virtually separating human prose edits from citation metadata changes directly inside Wikipedia's native diff table.

---

## Quick Navigation
* [The Problem: Template Camouflage](#the-problem-template-camouflage)
* [How It Works](#how-it-works)
* [Visual Walkthrough](#visual-walkthrough)
* [Installation Guide](#installation-guide)
* [UI Controls & Modes](#ui-controls--modes)
* [Complementary Tools (RefDiff vs. References Segregator)](#complementary-tools)
* [Supported Skins & Themes](#supported-skins--themes)
* [Wikitext for On-Wiki Documentation Page](#wikitext-for-on-wiki-documentation-page)
* [Technical Specifications](#technical-specifications)

---

## The Problem: Template Camouflage

On Wikipedia, **over 90% of quality control, vandalism patrolling, and editorial review happens in the diff view (`Special:Diff`)**.

When an article uses standard inline references (`<ref>{{cite book |author=... |title=... |url=...}}</ref>`), citations often contain 300–600 characters of bibliographic parameters. When an editor modifies a single word in a sentence:

### Standard MediaWiki Diff (`wikidiff2`):
```text
Line 42:
[- The atmosphere consists mostly of carbon dioxide<ref>{{Cite book |author=Schmidt, Rainer |title=Planetary Atmospheres |year=2020 |pages=112–115 |isbn=978-3-12-345678-9 |publisher=Springer}}</ref>, creating an extreme greenhouse effect. -]
{+ The atmosphere consists mostly of carbon dioxide<ref>{{Cite book |author=Schmidt, Rainer |title=Planetary Atmospheres |year=2020 |pages=112–115 |isbn=978-3-12-345678-9 |publisher=Springer}}</ref>, creating a runaway greenhouse effect. +}
```

### The Consequences:
1. **Camouflaged Vandalism:** Subtle vandalism (changing numbers, altering dates, or inserting defamatory words) easily hides within the visual noise of untouched template parameters.
2. **Misleading Diffs on Citation Fixes:** Updating a broken URL or changing a page number marks the entire surrounding paragraph as modified, misleading reviewers into thinking factual claims were rewritten.
3. **Reviewer Fatigue:** Editors spend excessive mental effort mentally filtering out template syntax to see what changed in the prose.

---

## How It Works

RefDiff runs client-side in your browser and operates directly upon Wikipedia's native two-column diff table (`table.diff`):

1. **Zero-Loss Integrity:** Preserves 100% of native MediaWiki diff elements:
   * Revision comparison headers, timestamps, and editor usernames.
   * Line number anchors (`Line 42:`).
   * Context lines and native inline diff toggling (`Inline ( )`).
2. **Prose Cleanliness:** Replaces inline `<ref>` tags with lightweight, non-distracting angle bracket badges (`⟨ref1⟩`, `⟨~ref2~⟩`).
3. **Dedicated Citation Diff Rows:** When citation metadata is added, deleted, or altered, RefDiff creates an isolated citation diff row directly beneath the affected sentence.
4. **False-Positive Elimination:** If an edit *only* updated citation metadata and did not alter any prose, RefDiff automatically converts the prose row to context appearance (calm gray, no diff markers). Patrollers instantly know the text itself was untouched!

---

## Visual Walkthrough

### 1. The Badge System

RefDiff uses mathematical angle brackets (`⟨...⟩`) to avoid collisions with external links (`[...]`) and wikilinks (`[[...]]`):

| Badge | Meaning | Visual Appearance | Reviewer Action |
| :--- | :--- | :--- | :--- |
| `⟨ref1⟩` | **Unmodified Reference** | Subtle neutral gray text (`var(--color-subtle)`), normal weight | **Ignore:** Identical on both sides; zero prose distraction |
| `⟨~ref2~⟩` | **Modified Reference** | Warm amber highlight (`#9a6700` / `#ffd043`), bold, hover tooltip | **Review:** Bibliographic metadata changed; see citation row below |
| `⟨+ref3+⟩` | **Added Reference** | Crisp green badge (`.ref-badge-add`), bold | **Verify:** New citation introduced |
| `⟨-ref4-⟩` | **Removed Reference** | Crisp red badge (`.ref-badge-del`), bold, strikethrough | **Verify:** Citation removed from text |

### 2. Side-by-Side Comparison

#### Standard Diff (Before RefDiff):
![Standard Wikipedia diff showing noisy template parameters inside deleted and added lines](file:///home/mik/Documents/Bastel/2023-/einzelnachweise/tests/comprehensive_test.html)

#### Decoupled Diff (With RefDiff active):
```text
Line 42:
  The atmosphere consists mostly of carbon dioxide ⟨ref1⟩, creating an
  [- extreme -] {+ runaway +} greenhouse effect.

  ⟨~ref1~⟩  − <ref>{{Cite book |... |pages=112–115}}</ref>
            + <ref>{{Cite book |... |pages=112–125}}</ref>
```

---

## Installation Guide

RefDiff can be installed as a personal user script on any MediaWiki wiki or via a browser extension userscript manager.

### Option A: Install on English Wikipedia (Recommended)

1. Log into your Wikipedia account.
2. Open your personal script file: [**Special:MyPage/common.js**](https://en.wikipedia.org/wiki/Special:MyPage/common.js) (or click "Edit" on that page).
3. Add the following line:
   ```javascript
   // [[File:refdiff.js]] - RefDiff: Decoupled citation diff view for Special:Diff
   mw.loader.load('https://cdn.jsdelivr.net/gh/m-k/einzelnachweise@main/refdiff.js');
   ```
4. Save the page and bypass your browser cache (`Ctrl+F5` on Linux/Windows, `Cmd+Shift+R` on macOS).

### Option B: Install on German Wikipedia (`de.wikipedia.org`)

Add to [**de:Special:MyPage/common.js**](https://de.wikipedia.org/wiki/Special:MyPage/common.js):
```javascript
// RefDiff: Entkoppelte Einzelnachweis-Diffs
mw.loader.load('https://cdn.jsdelivr.net/gh/m-k/einzelnachweise@main/refdiff.js');
```

### Option C: Install via Tampermonkey / Violentmonkey / Greasemonkey

If you prefer a browser extension that works automatically across all Wikimedia projects without logging in:
1. Open your userscript manager dashboard.
2. Click **Create a new script** or **Install from URL**.
3. Use the raw GitHub URL:
   ```text
   https://raw.githubusercontent.com/m-k/einzelnachweise/main/refdiff.js
   ```
4. Enable the script. It matches all `*wikipedia.org*diff=*`, `*wikimedia.org*diff=*`, etc.

---

## UI Controls & Modes

### Native OOUI Diff Mode Switcher Integration
On modern skins (Vector 2022, Vector legacy), RefDiff automatically registers as a native button inside Wikipedia's diff mode selector:

```text
┌──────────────────────────────────────────────────────────────┐
│ [ 👁 Visual ]  [ [[]] Wikitext ]  [ ⧉ RefDiff ]   Inline ( ) │
└──────────────────────────────────────────────────────────────┘
```

* **Instant 1-Click Toggle:**
  * Click **`Wikitext`** to return to standard MediaWiki diff view.
  * Click **`RefDiff`** to re-apply citation decoupling instantly (< 5ms execution, zero page reloads).
* **Inline Diff Compatibility:**
  * RefDiff fully respects the native `Inline ( )` checkbox, working seamlessly in both two-column side-by-side mode and single-column unified mode.
* **Fallback Mode Bar:**
  * On legacy skins without the OOUI diff header (e.g. Monobook), RefDiff displays an unobtrusive mode switcher bar directly above the diff table:
    `Diff view: Decoupled (RefDiff) • Standard Wikidiff`

---

## Complementary Tools

RefDiff is part of a complete ecosystem for citation management:

| Dimension | Tool | Target User | What It Does |
| :--- | :--- | :--- | :--- |
| **Reviewing / Diffs** | **RefDiff** (`refdiff.js`) | Reviewers, patrollers, fact-checkers | Decouples citations in the **`Special:Diff`** view |
| **Writing / Editing** | [**References Segregator**](https://en.wikipedia.org/wiki/User:PleaseStand/References_segregator) | Writers, copyeditors | Splits citations into a second pane in the **edit window**; re-inlines upon save |
| **Storage Concepts** | **Section-Scoped References** (`<references hidden>` / `<ref hidden>`) | Proposed Wikitext syntax | Concepts for section-scoped reference definitions in raw wikitext |

> [!TIP]
> **Recommended Editor Workflow:** Use **References Segregator** when writing or editing articles, and **RefDiff** when reviewing diffs and recent changes. Together, they provide a seamless decoupled citation experience without modifying raw database wikitext or conflicting with `WP:CITEVAR`.

---

## Supported Skins & Themes

RefDiff is engineered to be 100% skin- and theme-aware:

* **Vector 2022:** Full native support for Light Mode and Dark Mode (`skin-theme-clientpref-night`).
* **OS Dark Mode:** Responds dynamically to system dark mode preferences (`@media (prefers-color-scheme: dark)`).
* **Legacy Vector (2010):** Full support.
* **Timeless & Monobook:** Automatic fallback mode switcher bar.
* **Mobile / Minerva:** Adapts cleanly to mobile diff tables.

---

## Wikitext for On-Wiki Documentation Page

If you wish to create a dedicated user documentation page on English Wikipedia (e.g. at `User:YourUsername/RefDiff`), copy and paste the following ready-to-use wikitext:

```wikitext
{{User script
| name = RefDiff
| desc = Zero-loss citation decoupling gadget for Special:Diff. Separates prose edits from template clutter.
| author = [[User:YourUsername|YourUsername]]
| date = 2026-10-09
| status = stable
| source = https://github.com/m-k/einzelnachweise/blob/main/refdiff.js
| skin = Vector 2022, Vector, Timeless, Monobook
}}

'''RefDiff''' (''The Ref-Differentiator'') is a user script that decouples inline citation templates from sentences in MediaWiki's diff view ({{mono|Special:Diff}}).

== The Problem: Template Camouflage ==
When a sentence contains a 500-character {{tag|ref}} template, changing a single word forces the diff engine to display the entire paragraph as modified. Vandalism, date changes, and subtle errors easily hide inside untouched citation parameters.

== What RefDiff Does ==
* '''Clean Prose Diffs:''' Replaces inline {{tag|ref}} tags with clean badges (e.g. {{mono|⟨ref1⟩}} or {{mono|⟨~ref2~⟩}}).
* '''Dedicated Citation Rows:''' When a citation is changed, RefDiff displays an isolated citation diff row directly underneath the affected sentence.
* '''Zero Loss:''' Preserves 100% of Wikipedia's native diff table (line numbers, revision headers, context lines, inline diff toggle).
* '''Native UI Integration:''' Adds a {{mono|[ RefDiff ]}} button directly inside Wikipedia's native diff mode selector.

== Installation ==
Add the following line to your [[Special:MyPage/common.js|common.js]] page:

<source lang="javascript">
// [[File:refdiff.js]] - RefDiff: Decoupled citation diffs for Special:Diff
mw.loader.load('https://cdn.jsdelivr.net/gh/m-k/einzelnachweise@main/refdiff.js');
</source>

Then bypass your browser cache ({{kbd|Ctrl}}+{{kbd|F5}} or {{kbd|Cmd}}+{{kbd|Shift}}+{{kbd|R}}).

== Badge Legend ==
{| class="wikitable"
! Badge !! Meaning !! Appearance
|-
| {{mono|⟨ref1⟩}} || Unmodified citation || Subtle gray (no visual distraction)
|-
| {{mono|⟨~ref2~⟩}} || Modified citation metadata || Amber highlight (hover tooltip with details)
|-
| {{mono|⟨+ref3+⟩}} || Added citation || Crisp green badge, bold
|-
| {{mono|⟨-ref4-⟩}} || Removed citation || Crisp red badge, bold, strikethrough
|}

== See Also ==
* [[User:PleaseStand/References segregator]] – Complementary script that decouples citations in the wikitext edit window.
* [[Wikipedia:Diff]] – Understanding MediaWiki diffs.

[[Category:Wikipedia user scripts]]
```

---

## Technical Specifications

* **File Size:** ~21 KB unminified (~6 KB gzipped).
* **Execution Time:** ~2–5 ms on typical 100-hunk diff pages.
* **Architecture:** Universal Module Definition (UMD) with pure-function exports for Node.js testability.
* **Testing:** 100% automated test coverage across:
  * Unit tests: [`tests/test_pairing.js`](tests/test_pairing.js) (entity handling, 3-pass heuristic pairing, appearance sorting).
  * Real MediaWiki fixtures: [`tests/comprehensive_test.html`](tests/comprehensive_test.html) (actual `wikidiff2` output).
  * End-to-end browser automation: [`tests/test_live_cdp.py`](tests/test_live_cdp.py) (Chromium DevTools Protocol verification in Light & Dark modes).
* **Repository:** [https://github.com/m-k/einzelnachweise](https://github.com/m-k/einzelnachweise)
* **License:** MIT License
