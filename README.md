# References & Citations: Diff-Optimized & Section-Modular Management

This repository contains the architecture, specifications, and tools for diff-optimized citation management in MediaWiki wikitext and Git-versioned documentation projects.

## Overview

Traditional inline citations (`<ref>...</ref>`) cause severe diff pollution, messy code reviews, and frequent merge conflicts in Git.

This project introduces a model that decouples **Source Organization** (section-modular definition blocks via `<ref def>` / `<references hidden>`) from **Frontend Presentation** (unified, continuous global numbering at document end via `<references />`).

## Documentation & Project Governance

* 🏛️ **[ARCHITECTURE.md](ARCHITECTURE.md)** – Technical architecture and design document (subsystems, state machine, Memento pattern, algorithms, and §10 ADR).
* 🧭 **[CODE_WALKTHROUGH.md](CODE_WALKTHROUGH.md)** – Step-by-step architectural code walkthrough for contributors and reviewers tracing a representative diff execution case from page detection to DOM rollback.
* 🎨 **[DESIGN.md](DESIGN.md)** – Product UX, visual design, and reviewer specification for **RefDiff** (*The Ref-Differentiator*), mathematical badge ergonomics, and reviewer interaction workflows.
* 🛡️ **[REVIEW_GUIDE.md](REVIEW_GUIDE.md)** – Comprehensive review guide: specification-driven agentic coding governance, codebase/security review (K1/M1/M6/M7 findings register, clean code & anti-test-smell rules, JSDOM real DOM harness, ResourceLoader compliance), and editorial review playbook (anti-template-camouflage, anti-AI-slop fact-checking, 3-way triage).
* 🧪 **[TESTING.md](TESTING.md)** – Comprehensive test plan, quality gates, test pyramid, modular test suite architecture, and §5.1 Real-World Diff Verification Register (12 verified diffs).
* 🧭 **[ROADMAP.md](ROADMAP.md)** – Multi-tier scaling progression overview (Immediate Pre-Pilot, Tier 1 10-user pilot, Tier 2 50-user opt-in gadget, Tier 3 site-wide mass scale), upstream `<ref def>` roadmap phases, and ticket-driven execution pointer.
* 🚀 **[RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md)** – Multi-ring rollout plan, pre-flight quality gates, automated rollback protocol, and operator release runbook.
* 🎫 **[tickets/README.md](tickets/README.md)** – Formal ticket lifecycle, "Ticket-Only by Default" Golden Rule, phase-based backlog governance, directory state machine, and development protocol (`tickets/backlog/`, `tickets/in_progress/`, `tickets/done/`).
* 📋 **[tickets/INDEX.md](tickets/INDEX.md)** – Live index of active (`in_progress/`) and prioritized backlog (`backlog/`) tickets categorized by project phase.
* ✅ **[tickets/DONE.md](tickets/DONE.md)** – Historical register of completed and archived tickets (`done/`).
* 📁 **[tickets/](tickets/)** – Project work items directory organized by project phase (`tickets/backlog/` for upcoming tasks, `tickets/in_progress/` for active work, `tickets/done/` for completed tickets with execution notes).
* 🌐 **[refdiff.wiki](refdiff.wiki)** – Publication-ready on-wiki documentation page (Wikitext) for creating `User:YourUsername/RefDiff` on Wikipedia (installation, visual walkthrough, badge legend).
* 🗃️ **[userbox.wiki](userbox.wiki)** – Userbox template and documentation (`{{User:Powercycler/Userbox RefDiff}}`).

## Tooling: RefDiff (The Ref-Differentiator)

RefDiff eliminates "template camouflage" by decoupling human prose edits from citation metadata changes directly in MediaWiki's diff view (`Special:Diff`).

### 1. Wikipedia User Script / Gadget (`refdiff.js`)

A zero-loss in-place diff-decoupling gadget for MediaWiki `Special:Diff`. It operates directly on Wikipedia's native 2-column diff table (`table.diff`), preserving 100% of revision metadata headers, line numbers (`Line 101:`), and context rows:

* **Native UI Integration:** Integrates directly into Wikipedia's native OOUI diff mode switcher alongside Wikitext: `[ ] Inline modified refs  [ 👁 Visual ] [ [[]] Wikitext ] [ ⧉ RefDiff ]`.
* **Mathematical Angle Bracket Badges:** Uses `⟨ref1⟩` and `⟨~ref3~⟩` to prevent syntactic conflict with Wikipedia's external links `[...]` and wikilinks `[[...]]`.
* **Subtle, Ergonomic Badge Highlighting:** Unmodified citations use native subtle secondary text (`var(--color-subtle, #72777d)` / `#8c9196`, normal font weight) with zero blue highlight, so only genuine modifications (amber `⟨~ref3~⟩`) draw the reviewer's attention.
* **Prefixed Citation Diff Rows:** Inserts citation diffs directly below the affected prose row, prefixed with their corresponding amber badge (`⟨~ref3~⟩ <ref>...`).
* **Interactive Reference Badges & Native Reference Previews:** Badges are rendered as semantic `<sup class="reference">` links. Hovering over a badge displays Wikipedia's standard **Reference Preview popup** from Read mode (`Extension:Popups`), and clicking modified badges jumps straight to their citation diff row.
* **Instant Installation:** Add this one line to your `Special:MyPage/common.js` on English Wikipedia (or any MediaWiki wiki; note that `en:User:Powercycler/refdiff.js` is also available as a release-pinned SHA pointer on en.WP):
  ```javascript
  // [[m:User:Powercycler/refdiff.js]] - Decoupled citation diffs for Special:Diff across all wikis
  mw.loader.load('https://meta.wikimedia.org/w/index.php?title=User:Powercycler/refdiff.js&action=raw&ctype=text/javascript');
  ```
* Also compatible with Tampermonkey, Violentmonkey, and Greasemonkey. Full native support for Vector 2022 Light and Dark modes.
* **Userbox:** Display your usage on English Wikipedia with `{{User:Powercycler/Userbox RefDiff}}` (see [**userbox.wiki**](userbox.wiki)).

### 2. Supplementing Tools & Ecosystem Compatibility

RefDiff is engineered for zero-collision interoperability with Wikipedia's editing and citation ecosystem:

* ⚡ [**diffedit**](https://meta.wikimedia.org/wiki/User:Jon_Harald_S%C3%B8by/diffedit) ([`m:User:Jon Harald Søby/diffedit.js`](https://meta.wikimedia.org/wiki/User:Jon_Harald_S%C3%B8by/diffedit.js)): In-line editing companion on `Special:Diff` that lets editors edit sections directly inside the diff view. RefDiff isolates citation row classes to prevent line-enumeration conflicts and automatically restores native wikitext whenever `diffedit` enters edit mode.
* 🔀 [**wikEdDiff**](https://en.wikipedia.org/wiki/User:Cacycle/wikEdDiff) ([`User:Cacycle/wikEdDiff.js`](https://en.wikipedia.org/wiki/User:Cacycle/wikEdDiff.js)): Improved inline diff engine for MediaWiki featuring word- and character-level comparisons, moved text block detection, syntax highlighting, and visual cleanup. While wikEdDiff provides an alternative inline layout for general wikitext changes, RefDiff specifically eliminates citation camouflage on the native diff view by decoupling references from prose.
* ✍️ [**References Segregator**](https://en.wikipedia.org/wiki/User:PleaseStand/References_segregator) ([`User:PleaseStand/segregate-refs.js`](https://en.wikipedia.org/wiki/User:PleaseStand/segregate-refs.js)): The editor companion for `Special:Edit` that temporarily splits editing into two panes—clean prose above and reference definitions below.
* 📦 [**RefCruncher**](https://en.wikipedia.org/wiki/User:Guywan/Scripts/RefCruncher) ([`User:Guywan/Scripts/RefCruncher.js`](https://en.wikipedia.org/wiki/User:Guywan/Scripts/RefCruncher.js)): In-editor decluttering script for `Special:Edit` that collapses ("crunches") verbose inline `<ref>...</ref>` tags into compact, interactive inline chips to keep wikitext readable while editing prose.
* 🔍 [**HarvErrors**](https://en.wikipedia.org/wiki/User:Trappist_the_monk/HarvErrors) ([`User:Trappist the monk/HarvErrors.js`](https://en.wikipedia.org/wiki/User:Trappist_the_monk/HarvErrors.js)): Footnote integrity checker that flags broken or orphaned Harvard / shortened citations (`{{sfn}}`) lacking matching bibliography anchors.
* 🤖 [**AI Source Verification**](https://en.wikipedia.org/wiki/User:Alaexis/AI_Source_Verification.js) ([`User:Alaexis/AI Source Verification.js`](https://en.wikipedia.org/wiki/User:Alaexis/AI_Source_Verification.js)): LLM-powered citation checker (Gemini, Claude, GPT) that validates whether cited sources actually support article claims, helping patrollers spot hallucinations and misattributed sources.
* 🔎 [**CNfirmed**](https://en.wikipedia.org/wiki/User:Alaexis/CNfirmed.js) ([`User:Alaexis/CNfirmed.js`](https://en.wikipedia.org/wiki/User:Alaexis/CNfirmed.js)): Discovers and verifies candidate references for `{{citation needed}}` claims using Internet Archive APIs and AI evaluation.
* 🛠️ [**ProveIt**](https://en.wikipedia.org/wiki/Wikipedia:ProveIt) ([`MediaWiki:Gadget-Global-ProveIt.js`](https://www.mediawiki.org/wiki/MediaWiki:Gadget-Global-ProveIt.js)): Popular GUI citation manager for the wikitext source editor with TemplateData form fields and Citoid auto-filling. While ProveIt traditionally cannot edit out-of-section or list-defined citations during section editing (Community Wishlist [W190](https://meta.wikimedia.org/wiki/Community_Wishlist/W190) / [T356471](https://phabricator.wikimedia.org/T356471)), section-modular references (`<references hidden>`) restore local visibility, enabling ProveIt to find and edit references directly within section scope.
* 🔗 [**SmartDiff**](https://en.wikipedia.org/wiki/User:Nardog/SmartDiff) ([`User:Nardog/SmartDiff.js`](https://en.wikipedia.org/wiki/User:Nardog/SmartDiff.js)): Native diff linkifier for `Special:Diff` that transforms wikilinks, external URLs, and template/module invocations directly into clickable links with red-link checking. Co-exists alongside RefDiff on diff tables without interfering with decoupled citation rows or mathematical badges.

Together with RefDiff on `Special:Diff`, these scripts form a complete, non-destructive citation audit and editing workflow.

### 3. Automated Testing & Verification

RefDiff enforces a 100% test pass rate across 15 modular unit, component, deployment, and real DOM test suites, benchmark stress tests, and live browser automation (see [**TESTING.md**](TESTING.md) and [**REVIEW_GUIDE.md**](REVIEW_GUIDE.md)):

```bash
# 1. Run ESLint code quality & style checks (0 warnings allowed)
npm run lint

# 2. Run the fast headless unit, component, deployment & JSDOM test suite (140 tests in ~250ms)
npm test

# 3. Run combined CI checks
npm run ci

# 4. Run an individual test file in isolation (e.g. deployment checks, parser, or real DOM)
node tests/test_deployment.js
node tests/test_parser.js
node tests/test_jsdom.js

# 5. Run live Chromium CDP browser integration suite (port 9222)
npm run test:live
```


### Key Pillars
1. **Readable Wikitext, References Still Nearby:** Sentences stay free of template clutter, yet full citations remain conveniently close within the same section.
2. **Focused Diffs:** Text edits and citation updates produce strictly isolated, minimal diff hunks.
3. **Section Locality:** Sources are defined locally within the section where they are relevant (no split-hunk jumping to the bottom of the file).
4. **Conflict-Free Collaboration:** Authors working concurrently on different sections experience 0% merge conflicts in citations.
5. **Author Freedom & Simple Bot Cleanup:** Authors place definition blocks naturally; automated bots clean up, consolidate, and migrate misplaced references asynchronously.
6. **Auditing Against "AI Slop":** Separating prose from section source inventories allows reviewers to scrutinize factual claims and verify source quality at a glance.
