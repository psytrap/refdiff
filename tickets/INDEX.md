# 📋 RefDiff Ticket Index: Active & Backlog

This document provides a live dashboard and structured overview of all open tickets for the RefDiff project (`tickets/open/`).

- For ticket development workflow, state machine rules, and the 7-step execution protocol, see [**`tickets/README.md`**](README.md).
- For historical records of completed and archived tickets, see [**`tickets/DONE.md`**](DONE.md).
- For overall project milestones and adoption trajectories, see [**`ROADMAP.md`**](../ROADMAP.md).

---

## 1. 🟡 Active In-Progress Tickets (`Status: In Progress`)

| Ticket | Title | Priority | Phase / Milestone | Scope & Deliverables |
| :---: | :--- | :---: | :--- | :--- |
| [**T-018**](open/T-018-phased-rollout-v1-5-6.md) | Phased Production Rollout of RefDiff v1.5.6 | 🔴 **P0** | 🟡 Release Ring 2 / Pilot | Safe promotion to en.WP & Meta with verification |
| [**T-048**](open/T-048-publish-to-github-remote-and-tag.md) | Publish RefDiff Baseline and Release Tags to GitHub Remote | 🟠 **High** | 🔵 Tier 1 / Pilot | Final release commit, annotated tag v1.5.6, and GitHub remote publication |

---

## 2. ⏳ Prioritized Backlog (`Status: Backlog` / `Status: Open`)

Backlog tickets in `tickets/open/` are structured and scheduled strictly according to canonical project phases. Within each phase, tickets are ordered by priority (**P0** $\to$ **High** $\to$ **Normal** $\to$ **Low**) and ascending ticket number.

### 2.1 🟡 Immediate Pre-Pilot (`P0 — Higher than Tier 1`)
*Focus: Author self-testing on `en:User:Powercycler/common.js`, on-wiki documentation lead (`refdiff.wiki`), userbox readiness, language standards, and P0 real-world diff parser hardening.*

*All foundational Pre-Pilot tickets are currently complete. See [**T-041**](done/T-041-restore-pre-pilot-stage-in-roadmap.md), [**T-042**](done/T-042-codify-ticket-first-default-rule.md), and [**T-043**](done/T-043-purge-buzzwords-and-jargon.md) in [`DONE.md`](DONE.md).*

---

### 2.2 🔵 Tier 1: Early Adopter Pilot (10-User Milestone)
*Focus: Core parsing stability, fail-open boundaries, byte-for-byte Memento restoration, test timeout hardening, and onboarding the initial 10-patroller test group.*

| Ticket | Title | Priority | Scope & Deliverables |
| :---: | :--- | :---: | :--- |
| [**T-021**](open/T-021-suffix-binding-and-brace-tokenizer.md) | Clean Architecture for Citation Page Suffixes (`{{rp}}`) & Nested Template Tokenization | 🔴 **P0** | Lexical tokenizer for citation page numbers without regex edge cases |
| [**T-019**](open/T-019-surface-live-deployment-drift.md) | Surface Live Deployment Drift in Version Bumps & Pre-Flight Checks | 🟠 **High** | Surface hash discrepancies between local bundle and live Wikipedia endpoints |
| [**T-022**](open/T-022-fail-open-crash-boundary.md) | Fail-Open Crash Isolation & Top-Level Boundary | 🟠 **High** | Top-level try-catch fail-open wrapper preventing script crashes from breaking diffs |
| [**T-026**](open/T-026-test-timeout-hardening-and-watchdog.md) | Test Timeout Hardening & Watchdog Architecture | 🟠 **High** | Watchdog timer and execution timeout bounds across test runner & CDP scripts |
| [**T-020**](open/T-020-complementary-tools-ecosystem-review.md) | Complementary Citation Tools & Ecosystem Review | 🔵 **Normal** | Ecosystem assessment against ProveIt, VisualEditor, and CitationStyle1 tools |
| [**T-023**](open/T-023-pilot-cohort-validation.md) | Pilot Group Validation & Stability (10-User Milestone) | 🔵 **Normal** | Formal verification and feedback loop across first 10 active Wikipedia patrollers |
| [**T-024**](open/T-024-streamline-rollout-and-bump-process.md) | Streamline Rollout Protocol & Version Bump Process | 🔵 **Normal** | Automated single-step version bump script synchronizing all distribution files |
| [**T-025**](open/T-025-automated-showcase-test-in-rollout.md) | Automated Showcase Test in Rollout Protocol | 🔵 **Normal** | Automated CDP visual regression test on showcase diff before production bump |

---

### 2.3 🔵 Tier 2: Community Reviewer Scale (50-User Milestone)
*Focus: Scale adoption across active Wikipedia patrol teams (NPP, AfC, Recent Changes), non-interference with patrol gadgets (Twinkle, Ultraviolet), fast string matcher scanner, and preview cards.*

| Ticket | Title | Priority | Scope & Deliverables |
| :---: | :--- | :---: | :--- |
| [**T-027**](open/T-027-ajax-spa-lifecycle-reentrancy.md) | Dynamic AJAX / SPA Lifecycle Re-entrancy & Memory Isolation | 🟠 **High** | Re-entrancy handling across `wikipage.diff` navigation and dynamic diff reloads |
| [**T-028**](open/T-028-patrol-tool-non-interference-contract.md) | Core Patrol Tool Non-Interference Contract (Twinkle & Ultraviolet) | 🟠 **High** | Verify zero DOM or event collisions with major patrolling user scripts |
| [**T-030**](open/T-030-first-level-string-matcher-and-regex-parser.md) | First-Level String Matcher & Regex Parser Architecture (Phases 1–3) | 🟠 **High** | Transition from heuristic regex passes to fast substring gatekeepers and scanner |
| [**T-031**](open/T-031-live-on-wiki-visual-testbed.md) | Live On-Wiki Visual Inspection Environment | 🟠 **High** | Live testbed page for community reviewers to visually audit badge ergonomics |
| [**T-029**](open/T-029-client-side-observability-debug-mode.md) | Client-Side Observability & Diagnostic Troubleshooting Mode | 🔵 **Normal** | Opt-in diagnostic console logging via `?refdiff_debug=1` query parameter |

---

### 2.4 🔵 Tier 3: Mass Deployment (Beyond 50 Users)
*Focus: Default-enabled gadget RFC on English Wikipedia (`MediaWiki:Gadgets-definition`), WCAG 2.1 AA accessibility certification, and legacy skin parity.*

| Ticket | Title | Priority | Scope & Deliverables |
| :---: | :--- | :---: | :--- |
| [**T-032**](open/T-032-wcag-accessibility-and-keyboard-nav.md) | Accessibility (WCAG 2.1 AA) & Keyboard Navigation | 🟠 **High** | ARIA attributes, keyboard focus traversal, and screen-reader navigable badges |
| [**T-033**](open/T-033-legacy-skins-and-mobile-guard.md) | Legacy Skin Support (Vector 2010 / Monobook) & Mobile Guard | 🔵 **Normal** | Multi-skin stylesheet adaptation and graceful mobile view self-disablement |
| [**T-034**](open/T-034-default-enabled-gadget-rfc.md) | Default-Enabled Gadget RFC & Site-Wide Governance | ⚪ **Low** | Village Pump technical RFC proposal for site-wide default gadget status |

---

### 2.5 🏛️ Upstream `<ref def>` Strategy (Phases 1–4)
*Focus: Upstream MediaWiki core and Extension:Cite native section-modular reference definitions (`<ref def name="...">`), community RFC outreach, re-scoping bot, and Lua/Scribunto prototype.*

| Ticket | Title | Priority | Scope & Deliverables |
| :---: | :--- | :---: | :--- |
| [**T-035**](open/T-035-upstream-phase1-outreach.md) | Upstream `<ref def>` Phase 1: Phabricator Task, Cite Discussion & Wishlist | 🟠 **P1** | Community RFC formulation on English and German Wikipedia talk pages |
| [**T-036**](open/T-036-upstream-phase2-feedback-and-spec.md) | Upstream `<ref def>` Phase 2: Feedback Synthesis & Specification Refinement | 🟠 **P1** | Synthesize community feedback into formal MediaWiki RFC specification |
| [**T-037**](open/T-037-upstream-phase3-rescoping-bot.md) | Upstream `<ref def>` Phase 3: Automated Re-Scoping Bot Prototype | 🔵 **P3** | Prototype Pywikibot script migrating inline refs to section-level `<ref def>` |
| [**T-038**](open/T-038-upstream-phase4-lua-and-cite-patch.md) | Upstream `<ref def>` Phase 4: Lua / Scribunto Prototype & MediaWiki Extension:Cite Patch | 🟠 **P1** | Reference implementation in Lua and patch proposal for MediaWiki Extension:Cite |
