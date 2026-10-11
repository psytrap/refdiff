# References & Citations: Diff-Optimized & Section-Modular Management

This repository contains the architecture, specifications, and tools for diff-optimized citation management in MediaWiki wikitext and Git-versioned documentation projects.

## Overview

Traditional inline citations (`<ref>...</ref>`) cause severe diff pollution, messy code reviews, and frequent merge conflicts in Git.

This project introduces a model that decouples **Source Organization** (section-modular definition blocks via `<references hidden>`) from **Frontend Presentation** (unified, continuous global numbering at document end via `<references />`).

## Documentation & Resources

* 💡 **[PROPOSAL.md](proposal/PROPOSAL.md)** – Ready-to-submit Phabricator task proposal (clean feature focus, visual diff table, mechanics).
* 📄 **[CONCEPT.md](proposal/CONCEPT.md)** – Comprehensive architecture document with detailed technical pathways, AST analyses, and ecosystem impact.
* 🏛️ **[ARCHITECTURE.md](ARCHITECTURE.md)** – Technical architecture and design document (subsystems, state machine, Memento pattern, algorithms).
* 🔍 **[REFDIFF.md](REFDIFF.md)** – Tool design specification for **RefDiff** (*The Ref-Differentiator*), the diff-decoupling engine for reviewers (`Special:Diff` gadget).
* 🧪 **[TEST_PLAN.md](TEST_PLAN.md)** – Comprehensive test plan, coverage evaluation (100% headless / 100% browser runtime), test pyramid, and modular test suite architecture.
* 🌐 **[refdiff.wiki](refdiff.wiki)** – Publication-ready on-wiki documentation page (Wikitext) for creating `User:YourUsername/RefDiff` on Wikipedia (installation, visual walkthrough, badge legend).
* 📝 **[POST.md](proposal/POST.md)** – Ready-to-use Wiki post Anschreiben for English Wikipedia ([Wikipedia talk:Citing sources](https://en.wikipedia.org/wiki/Wikipedia_talk:Citing_sources)).
* 📋 **[LOG.md](LOG.md)** – Chronological decision register, activity log, and planned roadmap.

## Tooling: RefDiff (The Ref-Differentiator)

RefDiff eliminates "template camouflage" by decoupling human prose edits from citation metadata changes directly in MediaWiki's diff view (`Special:Diff`).

### 1. Wikipedia User Script / Gadget (`refdiff.js`)

A zero-loss in-place diff-decoupling gadget for MediaWiki `Special:Diff`. It operates directly on Wikipedia's native 2-column diff table (`table.diff`), preserving 100% of revision metadata headers, line numbers (`Line 101:`), and context rows:

* **Seamless Native UI:** Integrates directly into Wikipedia's native OOUI diff mode switcher alongside Wikitext: `[ 👁 Visual ] [ [[]] Wikitext ] [ ⧉ RefDiff ] [ ] Inline modified refs`.
* **Mathematical Angle Bracket Badges:** Uses `⟨ref1⟩` and `⟨~ref3~⟩` to prevent syntactic conflict with Wikipedia's external links `[...]` and wikilinks `[[...]]`.
* **Subtle, Ergonomic Badge Highlighting:** Unmodified citations use native subtle secondary text (`var(--color-subtle, #72777d)` / `#8c9196`, normal font weight) with zero blue highlight, so only genuine modifications (amber `⟨~ref3~⟩`) draw the reviewer's attention.
* **Prefixed Citation Diff Rows:** Inserts citation diffs directly below the affected prose row, prefixed with their corresponding amber badge (`⟨~ref3~⟩ <ref>...`).
* **Interactive Reference Badges & Native Reference Previews:** Badges are rendered as semantic `<sup class="reference">` links. Hovering over a badge displays Wikipedia's standard **Reference Preview popup** from Read mode (`Extension:Popups`), and clicking modified badges jumps straight to their citation diff row.
* **Instant Installation:** Add this one line to your `Special:MyPage/common.js` on English Wikipedia (or any MediaWiki wiki):
  ```javascript
  // [[File:refdiff.js]] - Decoupled citation diffs for Special:Diff
  mw.loader.load('https://cdn.jsdelivr.net/gh/m-k/einzelnachweise@main/refdiff.js');
  ```
* Also compatible with Tampermonkey, Violentmonkey, and Greasemonkey. Full native support for Vector 2022 Light and Dark modes.

### 2. Supplementing Tools & Ecosystem Compatibility

RefDiff is engineered for zero-collision interoperability with Wikipedia's editing and citation ecosystem:

* ⚡ [**diffedit**](https://meta.wikimedia.org/wiki/User:Jon_Harald_S%C3%B8by/diffedit) ([`m:User:Jon Harald Søby/diffedit.js`](https://meta.wikimedia.org/wiki/User:Jon_Harald_S%C3%B8by/diffedit.js)): In-line editing companion on `Special:Diff` that lets editors edit sections directly inside the diff view. RefDiff isolates citation row classes to prevent line-enumeration conflicts and automatically restores native wikitext whenever `diffedit` enters edit mode.
* ✍️ [**References Segregator**](https://en.wikipedia.org/wiki/User:PleaseStand/References_segregator) ([`User:PleaseStand/segregate-refs.js`](https://en.wikipedia.org/wiki/User:PleaseStand/segregate-refs.js)): The editor companion for `Special:Edit` that temporarily splits editing into two panes—clean prose above and reference definitions below.
* 🔍 [**HarvErrors**](https://en.wikipedia.org/wiki/User:Trappist_the_monk/HarvErrors) ([`User:Trappist the monk/HarvErrors.js`](https://en.wikipedia.org/wiki/User:Trappist_the_monk/HarvErrors.js)): Footnote integrity checker that flags broken or orphaned Harvard / shortened citations (`{{sfn}}`) lacking matching bibliography anchors.

Together with RefDiff on `Special:Diff`, these scripts form a complete, non-destructive citation audit and editing workflow.

### 3. Automated Testing & Verification

RefDiff enforces 100% test pass rate across 13 modular unit and component test suites, benchmark stress tests, and live browser automation (see [**TEST_PLAN.md**](TEST_PLAN.md)):

```bash
# 1. Run ESLint code quality & style checks (0 warnings allowed)
npm run lint

# 2. Run the fast headless unit & component test suite (79 tests in ~20ms)
npm test

# 3. Run combined CI checks
npm run ci

# 4. Run an individual test file in isolation (e.g. parser tests)
node tests/test_parser.js

# 5. Run live Chromium CDP browser integration suite (port 9222)
npm run test:live
```

### 4. Archived: Python Prototype (`archive/python-prototype/`)

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
