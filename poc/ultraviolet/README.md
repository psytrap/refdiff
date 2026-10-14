# PoC: Ultraviolet as a quality benchmark for RefDiff

[Ultraviolet](https://en.wikipedia.org/wiki/Wikipedia:Ultraviolet) (UV, by 10nm, Apache-2.0) is an established English Wikipedia user script that also runs on `Special:Diff`. This folder pulls in **exactly the build that enwiki users run right now**, together with its source, so RefDiff can be compared against it on facts.

Findings: **[COMPARISON.md](COMPARISON.md)**

## Is there a `.js` / `_dev.js` pair?

No. UV is not distributed as a minified `.js` with a readable `_dev.js` next to it:

| What | Where | Readable? |
| :--- | :--- | :--- |
| On-wiki loader | [`User:10nm/beta.js`](https://en.wikipedia.org/wiki/User:10nm/beta.js) → `dist/beta.js` | yes (~60 lines, ES5) |
| Main bundle | `tools-static.wmflabs.org/ultraviolet/builds/<commit>/ultraviolet.js` → `dist/ultraviolet.js` | no (webpack, 38 lines, one line is 296 KB) |
| Source map | `…/ultraviolet.js.map` → `dist/ultraviolet.js.map` | **only partly**: 49 of 155 TS files carry another file's code (see `extract_sources.js`) |
| **Real source** | GitLab at the commit pinned in the loader → `deployed/` | **yes, use this** |

The `_dev.js` / `_readonly.js` pattern you may have in mind comes from `cvpi_dev.js` / `cvpi_readonly.js` (CVPI Interceptor by User:TonySt) in the repo root. That is a different tool.

## Layout

```
poc/ultraviolet/
├── fetch.sh             # downloads the loader, reads the pinned commit, gets the bundle and map, clones and checks out the source
├── extract_sources.js   # rebuilds the TS files from the source map and checks them against deployed/
├── COMPARISON.md        # the comparison with RefDiff
├── dist/                # (git-ignored) what users actually get served
├── repo/                # (git-ignored) full clone; the default branch `vue` is the Vue/Vite rewrite
├── deployed/            # (git-ignored) worktree at the deployed commit 6c65c40 (branch dev, 2026-02-02)
└── sourcemap-src/       # (git-ignored) output of extract_sources.js
```

## Reproduce

```bash
./poc/ultraviolet/fetch.sh               # needs network access to wikipedia.org, tools-static.wmflabs.org and gitlab.wikimedia.org
node poc/ultraviolet/extract_sources.js  # prints: identical 99 / mis-associated 49 / drifted 7
```
