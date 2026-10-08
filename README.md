# References & Citations: Diff-Optimized & Section-Modular Management

This repository contains the architecture, specifications, and tools for diff-optimized citation management in MediaWiki wikitext and Git-versioned documentation projects.

## Overview

Traditional inline citations (`<ref>...</ref>`) cause severe diff pollution, messy code reviews, and frequent merge conflicts in Git.

This project introduces a model that decouples **Source Organization** (section-modular definition blocks via `<references hidden>`) from **Frontend Presentation** (unified, continuous global numbering at document end via `<references />`).

## Documentation & Resources

* 💡 **[PROPOSAL.md](PROPOSAL.md)** – Ready-to-submit Phabricator task proposal (clean feature focus, visual diff table, mechanics).
* 📄 **[CONCEPT.md](CONCEPT.md)** – Comprehensive architecture document with detailed technical pathways, AST analyses, and ecosystem impact.
* 🔍 **[REFDIFF.md](REFDIFF.md)** – Tool design specification for **RefDiff** (*The Ref-Differentiator*), the diff-decoupling engine for reviewers (`Special:Diff` gadget & CLI).
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

### 2. Standalone Python Engine & Git Driver (`refdiff.py`)

A zero-dependency Python 3 engine (stdlib only) that calculates granular word-level diffs on both prose and citation tags:

```bash
# Fetch and diff live Wikipedia revisions directly by URL
python3 refdiff.py "https://en.wikipedia.org/w/index.php?title=Solar_System&diff=1372329011"

# Compare local wikitext revisions in terminal
python3 refdiff.py old.wiki new.wiki

# Show compact diffstat summary
python3 refdiff.py --stat old.wiki new.wiki

# Emit structured JSON payload (for CI / bots)
python3 refdiff.py --json old.wiki new.wiki

# Run unit test suite
python3 -m unittest discover tests
```

### 3. Git External Diff Driver (`git-refdiff`)
Use RefDiff natively inside Git repositories for wikitext and documentation:
```bash
git config diff.wikitext.command "python3 /path/to/einzelnachweise/refdiff.py"
echo "*.wiki diff=wikitext" >> .gitattributes
```


### Key Pillars
1. **Readable Wikitext, References Still Nearby:** Sentences stay free of template clutter, yet full citations remain conveniently close within the same section.
2. **Focused Diffs:** Text edits and citation updates produce strictly isolated, minimal diff hunks.
3. **Section Locality:** Sources are defined locally within the section where they are relevant (no split-hunk jumping to the bottom of the file).
4. **Conflict-Free Collaboration:** Authors working concurrently on different sections experience 0% merge conflicts in citations.
5. **Author Freedom & Simple Bot Cleanup:** Authors place definition blocks naturally; automated bots clean up, consolidate, and migrate misplaced references asynchronously.
6. **Auditing Against "AI Slop":** Separating prose from section source inventories allows reviewers to scrutinize factual claims and verify source quality at a glance.
