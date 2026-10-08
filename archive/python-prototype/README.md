# Archived: Python Prototype (`refdiff.py` & `git-refdiff`)

> [!NOTE]
> This folder preserves the initial proof-of-concept Python prototype for RefDiff, developed during early exploration. 
> The project has transitioned to the native in-browser MediaWiki UserScript / gadget ([`refdiff.js`](../../refdiff.js)), which operates directly on Wikipedia's live `Special:Diff` interface without external runtime dependencies.

---

## Historical Contents

* **`refdiff.py`**: Standalone zero-dependency Python 3 engine (stdlib only) providing:
  * Word-level prose diffing with tokenized citation sentinels (`⟦ref:name⟧`).
  * Raw citation tag isolation and diffing.
  * ANSI color terminal formatter, `--stat` summary, and `--json` serialization.
  * Live Wikipedia revision fetching via MediaWiki Action API (`action=compare`).
* **`git-refdiff`**: Symlink configured as a Git external diff driver.
* **`tests/test_refdiff.py`**: Unit test suite for tokenization, XML attributes, diff grouping, and JSON output.

---

## Running the Archived Prototype

```bash
# Run CLI help
python3 refdiff.py --help

# Diff two local wikitext files
python3 refdiff.py old.wiki new.wiki

# Run unit tests
PYTHONPATH=. python3 -m unittest discover tests
```
