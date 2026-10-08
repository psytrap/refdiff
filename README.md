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

## Tooling: RefDiff Engine (`refdiff.py`)

A zero-dependency Python 3 prototype engine that isolates prose edits from citation metadata changes:

```bash
# Compare two wikitext revisions in terminal
python3 refdiff.py tests/fixtures/venus_v1.wiki tests/fixtures/venus_v2.wiki

# Show compact diffstat summary
python3 refdiff.py --stat tests/fixtures/venus_v1.wiki tests/fixtures/venus_v2.wiki

# Emit structured JSON payload (for gadgets & CI)
python3 refdiff.py --json tests/fixtures/venus_v1.wiki tests/fixtures/venus_v2.wiki

# Run unit test suite
python3 -m unittest discover tests
```

### Key Pillars
1. **Readable Wikitext, References Still Nearby:** Sentences stay free of template clutter, yet full citations remain conveniently close within the same section.
2. **Focused Diffs:** Text edits and citation updates produce strictly isolated, minimal diff hunks.
3. **Section Locality:** Sources are defined locally within the section where they are relevant (no split-hunk jumping to the bottom of the file).
4. **Conflict-Free Collaboration:** Authors working concurrently on different sections experience 0% merge conflicts in citations.
5. **Author Freedom & Simple Bot Cleanup:** Authors place definition blocks naturally; automated bots clean up, consolidate, and migrate misplaced references asynchronously.
6. **Auditing Against "AI Slop":** Separating prose from section source inventories allows reviewers to scrutinize factual claims and verify source quality at a glance.
