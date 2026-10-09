# References & Citations: Diff-Optimized & Section-Modular Management

This repository contains the architecture, specifications, and tools for diff-optimized citation management in MediaWiki wikitext and Git-versioned documentation projects.

## Overview

Traditional inline citations (`<ref>...</ref>`) cause severe diff pollution, messy code reviews, and frequent merge conflicts in Git.

This project introduces a model that decouples **Source Organization** (section-modular definition blocks via `<references hidden>`) from **Frontend Presentation** (unified, continuous global numbering at document end via `<references />`).

## Documentation & Resources

* 💡 **[PROPOSAL.md](PROPOSAL.md)** – Ready-to-submit Phabricator task proposal (clean feature focus, visual diff table, mechanics).
* 📄 **[CONCEPT.md](CONCEPT.md)** – Comprehensive architecture document with detailed technical pathways, AST analyses, and ecosystem impact.
* 🔍 **[REFDIFF.md](REFDIFF.md)** – Tool design specification for **RefDiff** (*The Ref-Differentiator*), the diff-decoupling engine for reviewers (`Special:Diff` gadget & CLI).
* 📖 **[TOOL_DOCS.md](TOOL_DOCS.md)** – User script & gadget documentation page for **RefDiff** (installation, visual walkthrough, badge legend).
* 🌐 **[RefDiff.wiki](RefDiff.wiki)** – Publication-ready on-wiki documentation page (Wikitext) for creating `User:YourUsername/RefDiff` on Wikipedia.
* 📝 **[POST.md](POST.md)** – Ready-to-use Wiki post Anschreiben for English Wikipedia ([Wikipedia talk:Citing sources](https://en.wikipedia.org/wiki/Wikipedia_talk:Citing_sources)).
* 📋 **[LOG.md](LOG.md)** – Chronological decision register, activity log, and planned roadmap.

## Tooling: RefDiff (The Ref-Differentiator)

RefDiff eliminates "template camouflage" by decoupling human prose edits from citation metadata changes across both the web and the command line.

### 1. Wikipedia User Script / Gadget (`refdiff.js`)

A zero-loss in-place diff-decoupling gadget for MediaWiki `Special:Diff`. It operates directly on Wikipedia's native 2-column diff table (`table.diff`), preserving 100% of revision metadata headers, line numbers (`Line 101:`), and context rows:

* **Seamless Native UI:** Integrates directly into Wikipedia's native OOUI diff mode switcher alongside Wikitext: `[ 👁 Visual ] [ [[]] Wikitext ] [ ⧉ RefDiff ] Inline ( )`.
* **Mathematical Angle Bracket Badges:** Uses `⟨ref1⟩` and `⟨~ref3~⟩` to prevent syntactic conflict with Wikipedia's external links `[...]` and wikilinks `[[...]]`.
* **Subtle, Ergonomic Badge Highlighting:** Unmodified citations use native subtle secondary text (`var(--color-subtle, #72777d)` / `#8c9196`, normal font weight) with zero blue highlight, so only genuine modifications (amber `⟨~ref3~⟩`) draw the reviewer's attention.
* **Prefixed Citation Diff Rows:** Inserts citation diffs directly below the affected prose row, prefixed with their corresponding amber badge (`⟨~ref3~⟩ <ref>...`).
* **Instant Installation:** Add this one line to your `Special:MyPage/common.js` on English Wikipedia (or any MediaWiki wiki):
  ```javascript
  // [[File:refdiff.js]] - Decoupled citation diffs for Special:Diff
  mw.loader.load('https://cdn.jsdelivr.net/gh/m-k/einzelnachweise@main/refdiff.js');
  ```
* Also compatible with Tampermonkey, Violentmonkey, and Greasemonkey. Full native support for Vector 2022 Light and Dark modes.

### 2. The Editor Companion: References Segregator

While **RefDiff** addresses the **reviewing / diff** experience on `Special:Diff`, the complementary problem for the **editing** window is handled by PleaseStand's user script:

* ✍️ [**References Segregator**](https://en.wikipedia.org/wiki/User:PleaseStand/References_segregator) ([`User:PleaseStand/segregate-refs.js`](https://en.wikipedia.org/wiki/User:PleaseStand/segregate-refs.js)): Temporarily splits the wikitext editing window into two textareas—clean prose in the main editor and reference definitions in a secondary pane below. Upon saving or previewing, it automatically re-inlines the citations, keeping the raw database wikitext untouched and compliant with `WP:CITEVAR`.

Together, they form a complete virtual decoupling workflow:
* **Writing / Editing:** [References Segregator](https://en.wikipedia.org/wiki/User:PleaseStand/References_segregator)
* **Reviewing / Diffs:** **RefDiff** ([`refdiff.js`](refdiff.js))

### 3. Archived: Python Prototype (`archive/python-prototype/`)

The repository includes the archived proof-of-concept Python 3 engine and Git external diff driver in [`archive/python-prototype/`](archive/python-prototype/):

```bash
# Compare local wikitext revisions via archived CLI
python3 archive/python-prototype/refdiff.py old.wiki new.wiki

# Show compact diffstat summary
python3 archive/python-prototype/refdiff.py --stat old.wiki new.wiki

# Run archived prototype tests
PYTHONPATH=archive/python-prototype python3 -m unittest discover archive/python-prototype/tests
```


### Key Pillars
1. **Readable Wikitext, References Still Nearby:** Sentences stay free of template clutter, yet full citations remain conveniently close within the same section.
2. **Focused Diffs:** Text edits and citation updates produce strictly isolated, minimal diff hunks.
3. **Section Locality:** Sources are defined locally within the section where they are relevant (no split-hunk jumping to the bottom of the file).
4. **Conflict-Free Collaboration:** Authors working concurrently on different sections experience 0% merge conflicts in citations.
5. **Author Freedom & Simple Bot Cleanup:** Authors place definition blocks naturally; automated bots clean up, consolidate, and migrate misplaced references asynchronously.
6. **Auditing Against "AI Slop":** Separating prose from section source inventories allows reviewers to scrutinize factual claims and verify source quality at a glance.
