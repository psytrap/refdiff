/* <nowiki> */
// ==UserScript==
// @name         RefDiff
// @namespace    https://github.com/m-k/einzelnachweise
// @version      1.5.4
// @description  Zero-loss citation decoupling gadget for Wikipedia / MediaWiki Special:Diff
// @author       RefDiff Contributors
// @match        https://*.wikipedia.org/*diff=*
// @match        https://*.wikipedia.org/*oldid=*
// @match        https://*.wikipedia.org/wiki/Special:Diff/*
// @match        https://*.wikimedia.org/*diff=*
// @match        https://*.wiktionary.org/*diff=*
// @match        https://*.wikiquote.org/*diff=*
// @grant        none
// @run-at       document-end
// @license      MIT
// ==/UserScript==

/**
 * RefDiff.js - The Ref-Differentiator
 * ------------------------------------------------------------------------------
 * A zero-loss diff-decoupling gadget for MediaWiki Special:Diff.
 * Preserves 100% of Wikipedia's native diff table (revision headers, line numbers,
 * context lines, diff hunks) while decoupling citation templates from prose lines.
 *
 * Repository: https://github.com/m-k/einzelnachweise
 *
 * Virtual File Hierarchy:
 *  1. [src/anchor.js]           (first line: 624)  - Live DOM footnote anchor discovery and popup integration
 *  2. [src/constants.js]        (first line: 53)   - Centralized regex patterns, selectors, CSS classes, hook names, inline styles
 *  3. [src/dom_helpers.js]      (first line: 1146) - DOM query, categorization, and hook notification helpers
 *  4. [src/exports.js]          (first line: 1804) - Public API return and UMD module exports
 *  5. [src/init.js]             (first line: 1529) - Page detection, UI button wiring, and lifecycle auto-start
 *  6. [src/memento.js]          (first line: 825)  - Non-destructive DOM row snapshot and restore memento
 *  7. [src/mode_coordinator.js] (first line: 1193) - 3-way mode switching (visual/wikitext/refdiff) & switch locks
 *  8. [src/pairing.js]          (first line: 528)  - 3-pass heuristic reference pairing engine
 *  9. [src/parser.js]           (first line: 445)  - Unified reference and template parser
 * 10. [src/pipeline.js]         (first line: 890)  - Core decoupling transformation and table mutator pipeline
 * 11. [src/renderer.js]         (first line: 714)  - Badge generation and citation diff row construction
 * 12. [src/state.js]            (first line: 313)  - State management and memento registry
 * 13. [src/utils.js]            (first line: 333)  - String sanitization, entity extraction, boundary normalization
 */

(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    root.RefDiff = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ==========================================================================
     VIRTUAL FILE: src/constants.js
     Description: Centralized regex patterns, storage keys, DOM selectors,
                  CSS classes, MediaWiki hook names, and inline badge styles.
     ========================================================================== */

  /**
   * Current RefDiff semantic version.
   */
  const VERSION = '1.5.4';

  /**
   * Matches HTML-escaped wikitext <ref> tags as output by MediaWiki's diff engine.
   * Handles self-closing tags and opening/closing tags with attributes containing HTML entities.
   */
  const REF_REGEX = /&lt;ref\b((?:(?!&gt;|\/&gt;)[\s\S])*?)(?:\/&gt;|&gt;((?:(?!&lt;ref\b)[\s\S])*?)&lt;\/ref&gt;)/gi;

  /**
   * Matches citation and footnote templates in diff HTML:
   * - {{sfn|...}}, {{sfnp|...}}, {{sfnm|...}}, {{sfnmp|...}} (Shortened footnotes)
   * - {{efn|...}}, {{efn-la|...}}, etc. (Explanatory footnotes)
   * - {{r|...}} (Reference shorthand)
   * - {{harvnb|...}}, {{harv|...}}, etc. (Harvard citations)
   * Supports nested templates (e.g. {{efn|...{{cite book|...}}...}}).
   */
  const TEMPLATE_REF_REGEX = /\{\{\s*(?:<(?:ins|del)[^>]*>)?\s*(sfn|sfnp|sfnm|sfnmp|efn|efn-[a-z0-9_-]+|r|harv|harvnb|harvtxt|harvp)\b((?:[^{}]|\{\{(?:[^{}]|\{\{[^{}]*\}\})*\}\})*?)\}\}/gi;

  const STORAGE_KEY = 'refdiff-active';
  const STORAGE_KEY_SEPARATE = 'refdiff-separate-changed';
  const STORAGE_KEY_INLINE = 'refdiff-inline-modified';
  const MAX_LABEL_LEN = 25;

  /** Centralized CSS selector registry for MediaWiki diff DOM queries. */
  const SELECTORS = {
    DIFF_TABLE: 'table.diff',
    DIFF_HEADER_TITLE: 'tr.diff-title',
    DIFF_MULTI_OR_NOTICE: 'td.diff-multi, td.diff-notice',
    DELETED_LINE: '.diff-deletedline',
    ADDED_LINE: '.diff-addedline',
    DIFF_MARKER: '.diff-marker',
    DIFF_CHANGE: '.diffchange',
    CIT_ROW: 'tr.refdiff-cit-row',
    HIDDEN_ROW: 'tr.oo-ui-element-hidden',
    INLINE_SWITCH: '#mw-diffPage-inline-toggle-switch, .oo-ui-toggleSwitchWidget, input[name="diff-type"]',
    VE_DIFF_CONTAINER: '.ve-init-mw-diffPage-diffMode',
    VE_BUTTON_GROUP: '.ve-init-mw-diffPage-diffMode .oo-ui-buttonGroupWidget, .ve-init-mw-diffPage-diffMode .oo-ui-buttonSelectWidget, .ve-init-mw-diffPage-diffMode > *',
    VE_OPTION_WIDGET: '.ve-init-mw-diffPage-diffMode .oo-ui-optionWidget:not(#refdiff-ooui-btn)',
    VE_DIFF_ELEMENT: '.ve-ui-diffElement, .ve-init-mw-diffPage-diff',
    VE_VISUAL_BUTTON: '.ve-init-mw-diffPage-diffMode .oo-ui-buttonOptionWidget:first-child, .ve-init-mw-diffPage-diffMode .oo-ui-buttonElement:first-child',
    REFDIFF_BTN_OOUI: '#refdiff-ooui-btn',
    REFDIFF_MODE_BAR: '#refdiff-mode-bar',
    REFDIFF_BTN_DECOUPLED: '#refdiff-btn-decoupled',
    REFDIFF_BTN_STANDARD: '#refdiff-btn-standard',
    INLINE_TOGGLE: '#refdiff-inline-toggle, #refdiff-decouple-toggle',
    INLINE_CONTAINER: '#refdiff-inline-container, #refdiff-decouple-container',
    DECOUPLE_TOGGLE: '#refdiff-inline-toggle, #refdiff-decouple-toggle',
    DECOUPLE_CONTAINER: '#refdiff-inline-container, #refdiff-decouple-container',
    STYLE_BADGE: '#refdiff-badge-styles'
  };

  /** Centralized CSS class registry. */
  const CLASSES = {
    CIT_ROW: 'refdiff-cit-row',
    HIDDEN: 'oo-ui-element-hidden',
    BADGE: 'ref-badge',
    BADGE_MOD: 'ref-badge-mod',
    BADGE_ADD: 'ref-badge-add',
    BADGE_DEL: 'ref-badge-del',
    REF_CONTAINER: 'reference refdiff-ref',
    FLASH_CIT: 'refdiff-cit-flash',
    FLASH_TARGET: 'refdiff-target-flash',
    PREVIEW_CARD: 'refdiff-preview-card',
    PREVIEW_TITLE: 'refdiff-preview-title',
    PREVIEW_TPL: 'refdiff-preview-tpl',
    PREVIEW_LIST: 'refdiff-preview-list',
    PREVIEW_KEY: 'refdiff-preview-key',
    DIFF_CONTEXT: 'diff-context',
    DELETED_LINE: 'diff-deletedline',
    ADDED_LINE: 'diff-addedline',
    DIFF_EMPTY: 'diff-empty',
    CIT_ADDED_LINE: 'refdiff-cit-addedline',
    CIT_DELETED_LINE: 'refdiff-cit-deletedline',
    CIT_CONTEXT: 'refdiff-cit-context',
    DIFF_SIDE_DELETED: 'diff-side-deleted',
    DIFF_SIDE_ADDED: 'diff-side-added',
    DIFFCHANGE: 'diffchange',
    DIFFCHANGE_INLINE: 'diffchange-inline',
    OO_BTN_ACTIVE: 'oo-ui-buttonElement-active',
    OO_OPTION_SELECTED: 'oo-ui-optionWidget-selected',
    OO_IMAGE_INVERT: 'oo-ui-image-invert',
    OO_WIDGET_DISABLED: 'oo-ui-widget-disabled',
    OO_WIDGET_ENABLED: 'oo-ui-widget-enabled',
    OO_FIELD_DISABLED: 'oo-ui-fieldLayout-disabled'
  };

  /** MediaWiki hook names. */
  const HOOKS = {
    DIFF_TYPE_SWITCH: 'wikipage.diff.diffTypeSwitch',
    DIFF_PAGE: 'wikipage.diff',
    BODY_UPDATE: 'wikipage.diff.wikitextBodyUpdate'
  };

  const BADGE_STYLES = `
    .refdiff-ref {
      unicode-bidi: isolate;
      white-space: nowrap;
      font-weight: normal;
      font-style: normal;
      font-size: 0.9em;
      vertical-align: baseline;
      line-height: inherit;
      max-width: 100%;
    }
    .refdiff-ref a {
      text-decoration: none;
      cursor: pointer;
    }
    .refdiff-ref a:hover,
    .refdiff-ref a:focus {
      text-decoration: underline;
    }
    .ref-badge {
      font-weight: normal;
      color: #72777d;
      color: var(--color-subtle, #72777d);
      cursor: pointer;
      text-decoration: none;
    }
    .ref-badge,
    .ref-badge-mod,
    .ref-badge-add,
    .ref-badge-del {
      display: inline-block;
      max-width: min(28em, 100%);
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: baseline;
      box-sizing: border-box;
      white-space: nowrap;
    }
    .ref-badge-mod {
      font-weight: bold;
      color: #9a6700;
      background: rgba(255, 215, 0, 0.25);
      border-radius: 2px;
      padding: 0 3px;
      cursor: pointer;
    }
    .ref-badge-add {
      font-weight: bold;
      color: #14866d;
      background: rgba(0, 175, 137, 0.2);
      border-radius: 2px;
      padding: 0 3px;
      cursor: pointer;
      text-decoration: none;
    }
    .ref-badge-del {
      font-weight: bold;
      color: #b32424;
      background: rgba(211, 51, 51, 0.2);
      border-radius: 2px;
      padding: 0 3px;
      cursor: pointer;
      text-decoration: line-through;
    }
    .refdiff-cit-flash {
      animation: refdiff-flash 1.5s ease-out;
    }
    @keyframes refdiff-flash {
      0% { background-color: rgba(255, 215, 0, 0.4); }
      100% { background-color: transparent; }
    }
    .refdiff-target-flash {
      animation: refdiff-target-pulse 2s ease-out;
    }
    @keyframes refdiff-target-pulse {
      0% { background-color: rgba(54, 195, 154, 0.4); }
      100% { background-color: transparent; }
    }
    html.skin-theme-clientpref-night .ref-badge,
    body.skin-theme-clientpref-night .ref-badge {
      color: #8c9196;
      color: var(--color-subtle, #8c9196);
    }
    html.skin-theme-clientpref-night .ref-badge-mod,
    body.skin-theme-clientpref-night .ref-badge-mod {
      color: #ffd043;
      background: rgba(255, 208, 67, 0.2);
    }
    html.skin-theme-clientpref-night .ref-badge-add,
    body.skin-theme-clientpref-night .ref-badge-add {
      color: #36c39a;
      background: rgba(54, 195, 154, 0.2);
    }
    html.skin-theme-clientpref-night .ref-badge-del,
    body.skin-theme-clientpref-night .ref-badge-del {
      color: #ff6e6e;
      background: rgba(255, 110, 110, 0.2);
    }
    @media (prefers-color-scheme: dark) {
      html.skin-theme-clientpref-os .ref-badge,
      body.skin-theme-clientpref-os .ref-badge {
        color: #8c9196;
        color: var(--color-subtle, #8c9196);
      }
      html.skin-theme-clientpref-os .ref-badge-mod,
      body.skin-theme-clientpref-os .ref-badge-mod {
        color: #ffd043;
        background: rgba(255, 208, 67, 0.2);
      }
      html.skin-theme-clientpref-os .ref-badge-add,
      body.skin-theme-clientpref-os .ref-badge-add {
        color: #36c39a;
        background: rgba(54, 195, 154, 0.2);
      }
      html.skin-theme-clientpref-os .ref-badge-del,
      body.skin-theme-clientpref-os .ref-badge-del {
        color: #ff6e6e;
        background: rgba(255, 110, 110, 0.2);
      }
    }
    .refdiff-preview-card {
      position: absolute;
      z-index: 1000;
      max-width: 420px;
      min-width: 240px;
      background: #ffffff;
      color: #202122;
      border: 1px solid #a2a9b1;
      border-radius: 4px;
      padding: 8px 12px;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18);
      font-size: 13px;
      line-height: 1.45;
      font-family: sans-serif;
      pointer-events: none;
      display: none;
      box-sizing: border-box;
    }
    .refdiff-preview-title {
      font-weight: bold;
      margin-bottom: 4px;
      color: #54595d;
      font-size: 12px;
      border-bottom: 1px solid #eaecf0;
      padding-bottom: 3px;
    }
    .refdiff-preview-tpl {
      font-family: monospace, monospace;
      font-size: 12px;
      color: #101418;
      margin-bottom: 4px;
    }
    .refdiff-preview-list {
      margin: 0;
      padding-left: 18px;
      list-style-type: disc;
    }
    .refdiff-preview-list li {
      margin: 2px 0;
      word-break: break-word;
    }
    .refdiff-preview-key {
      font-weight: bold;
      color: #404244;
    }
    html.skin-theme-clientpref-night .refdiff-preview-card,
    body.skin-theme-clientpref-night .refdiff-preview-card {
      background: #202122;
      color: #eaecf0;
      border-color: #54595d;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
    }
    html.skin-theme-clientpref-night .refdiff-preview-title,
    body.skin-theme-clientpref-night .refdiff-preview-title {
      color: #a2a9b1;
      border-bottom-color: #404244;
    }
    html.skin-theme-clientpref-night .refdiff-preview-tpl,
    body.skin-theme-clientpref-night .refdiff-preview-tpl {
      color: #ffffff;
    }
    html.skin-theme-clientpref-night .refdiff-preview-key,
    body.skin-theme-clientpref-night .refdiff-preview-key {
      color: #c8ccd1;
    }
    @media (prefers-color-scheme: dark) {
      html.skin-theme-clientpref-os .refdiff-preview-card,
      body.skin-theme-clientpref-os .refdiff-preview-card {
        background: #202122;
        color: #eaecf0;
        border-color: #54595d;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
      }
      html.skin-theme-clientpref-os .refdiff-preview-title,
      body.skin-theme-clientpref-os .refdiff-preview-title {
        color: #a2a9b1;
        border-bottom-color: #404244;
      }
      html.skin-theme-clientpref-os .refdiff-preview-tpl,
      body.skin-theme-clientpref-os .refdiff-preview-tpl {
        color: #ffffff;
      }
      html.skin-theme-clientpref-os .refdiff-preview-key,
      body.skin-theme-clientpref-os .refdiff-preview-key {
        color: #c8ccd1;
      }
    }
    .refdiff-mode-bar {
      margin: 8px 0 10px 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .refdiff-mode-bar a.active {
      font-weight: bold;
      color: inherit;
      text-decoration: none;
      cursor: default;
    }
    .refdiff-inline-container,
    .refdiff-decouple-container {
      display: inline-flex;
      align-items: center;
      margin: 0 12px 0 8px;
      vertical-align: middle;
      font-size: 0.85em;
      color: #54595d;
      color: var(--color-subtle, #54595d);
      user-select: none;
      transition: opacity 0.15s ease;
    }
    .refdiff-inline-container.oo-ui-widget-disabled,
    .refdiff-decouple-container.oo-ui-widget-disabled {
      opacity: 0.45;
    }
    .refdiff-inline-container.oo-ui-widget-disabled label,
    .refdiff-inline-container.oo-ui-widget-disabled input,
    .refdiff-decouple-container.oo-ui-widget-disabled label,
    .refdiff-decouple-container.oo-ui-widget-disabled input {
      cursor: default;
    }
    .refdiff-inline-label,
    .refdiff-decouple-label {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      margin: 0;
      font-weight: normal;
    }
    .refdiff-inline-checkbox,
    .refdiff-decouple-checkbox {
      cursor: pointer;
      margin: 0;
      vertical-align: middle;
    }
    .refdiff-mode-separator {
      margin: 0 6px;
      color: #72777d;
    }
    html.skin-theme-clientpref-night .refdiff-inline-container,
    body.skin-theme-clientpref-night .refdiff-inline-container,
    html.skin-theme-clientpref-night .refdiff-decouple-container,
    body.skin-theme-clientpref-night .refdiff-decouple-container {
      color: #a2a9b1;
      color: var(--color-subtle, #a2a9b1);
    }
    @media (prefers-color-scheme: dark) {
      html.skin-theme-clientpref-os .refdiff-inline-container,
      body.skin-theme-clientpref-os .refdiff-inline-container,
      html.skin-theme-clientpref-os .refdiff-decouple-container,
      body.skin-theme-clientpref-os .refdiff-decouple-container {
        color: #a2a9b1;
        color: var(--color-subtle, #a2a9b1);
      }
    }
    #refdiff-ooui-btn.oo-ui-widget-disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    #refdiff-ooui-btn.oo-ui-widget-disabled > a {
      pointer-events: none;
      cursor: not-allowed;
    }
    /* Citation row cell styling mirroring MediaWiki diff lines */
    .refdiff-cit-row td.refdiff-cit-addedline,
    .refdiff-cit-row td.refdiff-cit-deletedline,
    .refdiff-cit-row td.refdiff-cit-context {
      vertical-align: top;
      border-style: solid;
      border-width: 1px 1px 1px 4px;
      border-radius: 0.33em;
      padding: 0.33em 0.5em;
      font-size: 0.8125rem;
      font-family: monospace, monospace;
      tab-size: 4;
      line-height: 1.6;
      white-space: break-spaces;
      word-break: break-word;
      background-color: transparent;
      color: var(--color-base, #202122);
    }
    .refdiff-cit-row td.refdiff-cit-addedline {
      border-color: #a3d3ff;
      border-color: var(--background-color-content-added, #a3d3ff);
    }
    .refdiff-cit-row td.refdiff-cit-deletedline {
      border-color: #ffe49c;
      border-color: var(--background-color-content-removed, #ffe49c);
    }
    .refdiff-cit-row td.refdiff-cit-context {
      border-color: #dadde3;
      border-color: var(--border-color-muted, #dadde3);
    }
    .refdiff-cit-row td.diff-empty {
      border: 0 none;
      background-color: transparent;
    }
    .refdiff-cit-row td.refdiff-cit-addedline .diffchange {
      border-radius: 0.33em;
      padding: 0.25em 0;
      background-color: #a3d3ff;
      background-color: var(--background-color-content-added, #a3d3ff);
      text-decoration: none;
    }
    .refdiff-cit-row td.refdiff-cit-deletedline .diffchange {
      border-radius: 0.33em;
      padding: 0.25em 0;
      background-color: #ffe49c;
      background-color: var(--background-color-content-removed, #ffe49c);
      text-decoration: none;
    }
    .diff-editfont-sans-serif .refdiff-cit-row td.refdiff-cit-addedline,
    .diff-editfont-sans-serif .refdiff-cit-row td.refdiff-cit-deletedline,
    .diff-editfont-sans-serif .refdiff-cit-row td.refdiff-cit-context {
      font-family: sans-serif;
    }
    .diff-editfont-serif .refdiff-cit-row td.refdiff-cit-addedline,
    .diff-editfont-serif .refdiff-cit-row td.refdiff-cit-deletedline,
    .diff-editfont-serif .refdiff-cit-row td.refdiff-cit-context {
      font-family: serif;
    }
    /* Ensure citation diff rows and hidden rows are never visible when Visual diff or diffedit inline edit is active */
    .ve-init-mw-diffPage-diff ~ table.diff .refdiff-cit-row,
    .ve-ui-diffElement ~ table.diff .refdiff-cit-row,
    body.ve-diff-visual table.diff .refdiff-cit-row,
    tr.oo-ui-element-hidden + tr.refdiff-cit-row,
    .refdiff-cit-row.oo-ui-element-hidden,
    table.diff tr.oo-ui-element-hidden,
    table.diff.diff-editmode .refdiff-cit-row {
      display: none !important;
    }
  `;
  /* === [END VIRTUAL FILE: src/constants.js] === */

  /* ==========================================================================
     VIRTUAL FILE: src/state.js
     Description: Internal state encapsulation, lifecycle flags, and modified
                  row snapshot registry for non-destructive DOM restoration.
     ========================================================================== */

  /**
   * Internal state encapsulation for RefDiff lifecycle.
   * Uses Memento pattern for modified DOM rows to keep native MediaWiki closures attached.
   */
  const state = {
    origTableHtml: null,
    isDecoupled: false,
    initRetries: 0,
    diffTypeSwitchWidget: null,
    onTableClickHandler: null,
    onTableHoverHandler: false,
    onTableMouseOver: null,
    onTableMouseOut: null,
    modifiedRows: []
  };
  /* === [END VIRTUAL FILE: src/state.js] === */

  /* ==========================================================================
     VIRTUAL FILE: src/utils.js
     Description: String utilities, regex escaping, reference name extraction,
                  diffchange boundary normalization, and sfn parameter parsing.
     ========================================================================== */

  /**
   * Strips HTML tags and trims leading/trailing whitespace.
   * @param {string} [str]
   * @returns {string}
   */
  const stripHtml = (str) => (str ? str.replace(/<[^>]+>/g, '').trim() : '');

  /**
   * Escapes special characters for use in regular expressions.
   * @param {string} str
   * @returns {string}
   */
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /**
   * Formats a reference label for concise visual badge presentation.
   * Truncates excessively long labels (e.g. pasted article titles or long URLs)
   * while the complete un-truncated label is preserved for tooltips and anchors.
   * @param {string} label
   * @param {number} [maxLen=MAX_LABEL_LEN]
   * @returns {string}
   */
  function formatBadgeDisplayLabel(label, maxLen = MAX_LABEL_LEN) {
    if (!label || typeof label !== 'string') return '';
    if (label.length <= maxLen) return label;
    return `${label.slice(0, maxLen - 1).trimEnd()}…`;
  }

  /**
   * Extracts the reference name attribute from a tag attributes string.
   * Tolerates unclosed quotes before tag close (Donnie Brasco diff=1380017400)
   * and preserves embedded quotes/apostrophes inside matching outer quotes (Bihar diff=1379207737).
   * @param {string} [attrsStr]
   * @returns {string|null}
   */
  function extractName(attrsStr) {
    if (!attrsStr) return null;
    const clean = stripHtml(attrsStr);
    const m = clean.match(/name\s*=\s*(?:"|&quot;)(.*?)(?:"|&quot;|\/|&gt;|>|\s*$)|name\s*=\s*(?:'|&apos;)(.*?)(?:'|&apos;|\/|&gt;|>|\s*$)|name\s*=\s*([^\s"'>&]+)/i);
    if (!m) return null;
    const val = m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : m[3]);
    return val !== undefined ? val.trim() : null;
  }

  const RAW_CN_REGEX = /\{\{(?:<\/?(?:del|ins|span)\b[^>]*>|\s)*(?:citation(?:<\/?(?:del|ins|span)\b[^>]*>|\s)+needed|cn)\b(?:[^{}]|<[^>]+>)*?\}\}/gi;
  const CN_REF_BLOCK_REGEX = /<(?:ins|span)\b[^>]*>(&lt;ref\b(?:(?!&gt;)[\s\S])*?&gt;)<\/(?:ins|span)>\s*\{\{[\s\S]*?\}\}\s*<(?:ins|span)\b[^>]*>(&lt;\/ref&gt;)<\/(?:ins|span)>/gi;

  /**
   * Detects whether a deleted cell HTML string contains a deleted or modified
   * {{citation needed|...}} or {{cn|...}} maintenance template.
   * Strictly scoped to avoid unnecessary transformations on unrelated templates.
   * @param {string} [delHtml]
   * @returns {boolean}
   */
  function hasDeletedCn(delHtml) {
    if (!delHtml || typeof delHtml !== 'string' || !delHtml.includes('<del')) return false;
    const stripped = stripHtml(delHtml);
    return /\{\{\s*(?:citation\s+needed|cn)\b/i.test(stripped);
  }

  /**
   * Verifies that an HTML-stripped string consists strictly of one or more
   * valid <ref>...</ref> citations (with optional punctuation/whitespace between).
   * Ensures boundary normalization never swallows adjacent prose.
   * @param {string} stripped
   * @returns {boolean}
   */
  function isPureRefSequence(stripped) {
    if (!stripped || typeof stripped !== 'string') return false;
    const remainder = stripped.replace(REF_REGEX, '').trim();
    return remainder === '' || /^[,.;:!?'"'\s]+$/.test(remainder);
  }

  /**
   * Normalizes diffchange tag boundaries specifically when an unreferenced claim
   * marked with {{citation needed|...}} or {{cn|...}} is replaced by full <ref> citations.
   * When MediaWiki's wikidiff2 aligns shared tokens ({{, |date=, }}), it leaves
   * opening/closing <ref> tags isolated in <ins> wrappers, breaking diff-tag balance.
   * This aligns deleted {{citation needed}} and added <ref> blocks as cohesive diff units.
   *
   * @param {string} [delHtml]
   * @param {string} [addHtml]
   * @returns {{ delHtml: string, addHtml: string }}
   */
  function normalizeCnDiffPair(delHtml, addHtml) {
    const safeDel = (delHtml && typeof delHtml === 'string') ? delHtml : '';
    const safeAdd = (addHtml && typeof addHtml === 'string') ? addHtml : '';
    if (!hasDeletedCn(safeDel)) {
      return { delHtml: safeDel, addHtml: safeAdd };
    }

    const normDel = safeDel.replace(RAW_CN_REGEX, (m) => {
      if (!m.includes('<del')) return m;
      const clean = m.replace(/<\/?(?:del|ins|span)\b[^>]*>/gi, '');
      return `<del class="${CLASSES.DIFFCHANGE} ${CLASSES.DIFFCHANGE_INLINE}">${clean}</del>`;
    });

    const normAdd = safeAdd ? safeAdd.replace(CN_REF_BLOCK_REGEX, (match) => {
      const stripped = match.replace(/<\/?(?:del|ins|span)\b[^>]*>/gi, '');
      if (!isPureRefSequence(stripped)) return match;
      return `<ins class="${CLASSES.DIFFCHANGE} ${CLASSES.DIFFCHANGE_INLINE}">${stripped}</ins>`;
    }) : safeAdd;

    return { delHtml: normDel, addHtml: normAdd };
  }

  /**
   * Normalizes diffchange tag boundaries that cross HTML-escaped <ref> syntax markers.
   * MediaWiki's wikidiff2 tokenizes at word/character level, which can place <del> or <ins>
   * tags directly between '&lt;/ref' and '&gt;', or between '/' and '&gt;'.
   * This aligns diff markers cleanly with reference tag boundaries.
   *
   * @param {string} [str] Raw cell HTML with diffchange tags
   * @param {string} [delStr] Optional deleted cell HTML for scoped inter-template alignment
   * @returns {string} Normalized cell HTML
   */
  function normalizeDiffTags(str, delStr) {
    if (!str || typeof str !== 'string') return str || '';
    let res = str;
    if (delStr && hasDeletedCn(delStr)) {
      res = normalizeCnDiffPair(delStr, res).addHtml;
    }
    // 1. Closing tag: &lt;/ref<del...>&gt; -> &lt;/ref&gt;<del...>
    res = res.replace(/(&lt;\/(?:ref|references)\b[^&]*?)<(del|ins)([^>]*)>&gt;/gi, '$1&gt;<$2$3>');
    // 2. Self-closing tag where </del> or </ins> splits / and &gt;: /</del>&gt; -> /&gt;</del>
    res = res.replace(/(\/|\/&gt;)<\/(del|ins)>&gt;/gi, '/&gt;</$2>');
    // 3. Self-closing tag where <del> splits / and &gt;: /<del...>&gt; -> /&gt;<del...>
    res = res.replace(/(\/|\/&gt;)<(del|ins)([^>]*)>&gt;/gi, '/&gt;<$2$3>');
    // 4. Opening tag: &lt;ref...<del...>&gt; -> &lt;ref...&gt;<del...>
    res = res.replace(/(&lt;ref\b(?:(?!&gt;)[\s\S])*?)<(del|ins)([^>]*)>&gt;/gi, '$1&gt;<$2$3>');
    // 5. Template opening: {<del/ins...>{ -> <del/ins...>{{ (guarded against adjacent braces)
    res = res.replace(/(?<!\{)\{(<(?:del|ins)[^>]*>)\{(?!\{)/gi, '$1{{');
    // 6. Template closing: }<del/ins>} -> }}<del/ins> (guarded against adjacent braces)
    res = res.replace(/(?<!\})\}(<(?:del|ins)[^>]*>)\}(?!\})/gi, '}}$1');
    // 7. Merge adjacent diffchange spans of identical type separated only by whitespace:
    res = res.replace(/<\/(ins|del)>(\s*)<\1\b[^>]*>/gi, '$2');
    // 7b. Normalize diff boundary shift where wikidiff2 matched a closing ref tag
    // from a later citation instead of the earlier one, placing the closing tag inside
    // <ins>/<del> at the start, and leaving the later closing tag outside </ins>/</del>.
    // Example (Leonardo Torres Quevedo diff=1380356173):
    // ... 2020<ins class="...">.&lt;/ref&gt; In 1919 ... October 2008</ins>.&lt;/ref&gt;
    // -> ... 2020.&lt;/ref&gt;<ins class="..."> In 1919 ... October 2008.&lt;/ref&gt;</ins>
    res = res.replace(/<(ins|del)([^>]*)>([.,;:\s]*&lt;\/ref&gt;)((?:(?!<\/\1>)[\s\S])*?)<\/\1>([.,;:\s]*&lt;\/ref&gt;)/gi, function(match, tag, attrs, startToken, body, endToken) {
      return startToken + '<' + tag + attrs + '>' + body + endToken + '</' + tag + '>';
    });
    // 8. Clean up any empty diffchange spans created by boundary normalization: <del class="..."></del>
    res = res.replace(/<(ins|del)\b[^>]*><\/\1>/gi, '');
    return res;
  }

  /**
   * Checks whether diffchange (<del> and <ins>) tags inside a string are strictly balanced.
   * Prevents matching syntax fragments that cross diffchange boundaries (such as unwrapped templates).
   * @param {string} str
   * @returns {boolean}
   */
  function hasBalancedDiffTags(str) {
    if (!str || typeof str !== 'string') return true;
    let delDepth = 0;
    let insDepth = 0;
    for (let i = 0; i < str.length; i++) {
      if (str.startsWith('<del', i)) {
        const end = str.indexOf('>', i);
        if (end !== -1) {
          delDepth++;
          i = end;
          continue;
        }
      }
      if (str.startsWith('</del>', i)) {
        delDepth--;
        if (delDepth < 0) return false;
        i += 5;
        continue;
      }
      if (str.startsWith('<ins', i)) {
        const end = str.indexOf('>', i);
        if (end !== -1) {
          insDepth++;
          i = end;
          continue;
        }
      }
      if (str.startsWith('</ins>', i)) {
        insDepth--;
        if (insDepth < 0) return false;
        i += 5;
        continue;
      }
    }
    return delDepth === 0 && insDepth === 0;
  }

  /**
   * Extracts author, year, label, and anchor token from an sfn template argument string.
   * Handles formats:
   *   {{sfn|Author|Year|p=...}}
   *   {{sfn|Author1|Author2|Year|pp=...}}
   *   {{sfn|Author1|Author2|Author3|Year}}
   *   {{sfn|Author|p=...}}
   * @param {string} argsStr
   * @returns {{ label: string, anchorToken: string|null, authors: string[], year: string }}
   */
  function extractSfnInfo(argsStr) {
    if (!argsStr) return { label: 'sfn', anchorToken: null, authors: [], year: '' };
    const clean = stripHtml(argsStr).replace(/^\|/, '');
    const parts = clean.split('|').map(s => s.trim()).filter(Boolean);
    const positional = parts.filter(p => !p.includes('='));

    if (positional.length === 0) {
      return { label: 'sfn', anchorToken: null, authors: [], year: '' };
    }

    const lastParam = positional[positional.length - 1];
    const isYear = /^\d{3,4}[a-z]?$/i.test(lastParam);

    let authors = [];
    let year = '';

    if (isYear) {
      year = lastParam;
      authors = positional.slice(0, -1);
    } else {
      authors = positional;
    }

    let label = '';
    if (authors.length === 1) {
      label = authors[0] + (year ? ' ' + year : '');
    } else if (authors.length === 2) {
      label = authors[0] + ' & ' + authors[1] + (year ? ' ' + year : '');
    } else if (authors.length === 3) {
      label = authors[0] + ', ' + authors[1] + ' & ' + authors[2] + (year ? ' ' + year : '');
    } else if (authors.length > 3) {
      label = authors[0] + ' et al.' + (year ? ' ' + year : '');
    } else {
      label = year || 'sfn';
    }

    const anchorToken = authors.length || year ? 'FOOTNOTE' + authors.join('') + year : null;
    return { label, anchorToken, authors, year };
  }

  /**
   * Parses wikitext citation templates into a structured list format for preview tooltips and hovercards.
   * Extracts top-level parameters respecting nested brackets, formatting as:
   *   {{template_name}}
   *   • key1: value1
   *   • key2: value2
   * For plain-text references, returns the cleaned text.
   * @param {string} [rawContent]
   * @returns {{ text: string, data: Array<{ name: string, params: Array<{ key: string, val: string }> }> }|null}
   */
  function parseTemplateList(rawContent) {
    if (!rawContent || typeof rawContent !== 'string') return null;
    const cleanSource = rawContent
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<\/?(?:ins|del|span)\b[^>]*>/gi, '');

    const templates = [];
    let i = 0;
    while (i < cleanSource.length) {
      const start = cleanSource.indexOf('{{', i);
      if (start === -1) break;
      let depth = 2;
      let j = start + 2;
      while (j < cleanSource.length && depth > 0) {
        if (cleanSource[j] === '{') depth++;
        else if (cleanSource[j] === '}') depth--;
        j++;
      }
      if (depth === 0) {
        templates.push(cleanSource.slice(start + 2, j - 2));
        i = j;
      } else {
        i = start + 2;
      }
    }

    if (templates.length === 0) {
      const cleanText = cleanSource.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!cleanText) return null;
      return { text: cleanText, data: [] };
    }

    const data = [];
    const textBlocks = [];

    for (const tpl of templates) {
      const parts = [];
      let cur = '';
      let tDepth = 0;
      let lDepth = 0;
      for (let k = 0; k < tpl.length; k++) {
        const c = tpl[k];
        const next = tpl[k + 1];
        if (c === '{' && next === '{') { tDepth += 2; k++; cur += '{{'; continue; }
        if (c === '}' && next === '}') { tDepth -= 2; k++; cur += '}}'; continue; }
        if (c === '[' && next === '[') { lDepth += 2; k++; cur += '[['; continue; }
        if (c === ']' && next === ']') { lDepth -= 2; k++; cur += ']]'; continue; }
        if (c === '|' && tDepth === 0 && lDepth === 0) {
          parts.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      parts.push(cur.trim());

      const tplName = parts[0].trim();
      const params = [];
      let posIdx = 1;

      for (let p = 1; p < parts.length; p++) {
        const param = parts[p];
        if (!param) continue;
        const eqIdx = param.indexOf('=');
        if (eqIdx !== -1) {
          const key = param.slice(0, eqIdx).trim();
          const val = param.slice(eqIdx + 1).trim();
          if (key && val) {
            params.push({ key, val });
          }
        } else {
          params.push({ key: String(posIdx++), val: param });
        }
      }

      data.push({ name: tplName, params });

      let blockText = `{{${tplName}}}`;
      if (params.length > 0) {
        blockText += '\n' + params.map(p => `• ${p.key}: ${p.val}`).join('\n');
      }
      textBlocks.push(blockText);
    }

    return {
      text: textBlocks.join('\n\n'),
      data
    };
  }
  /* === [END VIRTUAL FILE: src/utils.js] === */

  /* ==========================================================================
     VIRTUAL FILE: src/parser.js
     Description: Core lexer and parser. Scans diff HTML for <ref> tags and
                  footnote templates ({{sfn}}, {{r}}, {{efn}}, {{harv}}),
                  normalizing diff tags and preserving strict document order.
     ========================================================================== */

  /**
   * Parses all HTML-escaped <ref> tags and footnote templates ({{sfn}}, {{r}}, {{efn}})
   * from a diff table cell HTML string, returning them sorted by document position.
   * @param {string} [html]
   * @param {string} [delHtml] Optional deleted cell HTML for scoped inter-template alignment
   * @returns {Array<{ raw: string, attrs: string, content: string|undefined, hasChange: boolean, isTemplate: boolean, templateName?: string, label?: string, name?: string|null, index: number }>}
   */
  function parseRefs(html, delHtml) {
    if (!html) return [];
    let sourceHtml = html;
    if (delHtml && hasDeletedCn(delHtml)) {
      sourceHtml = normalizeCnDiffPair(delHtml, sourceHtml).addHtml;
    }
    const normalized = normalizeDiffTags(sourceHtml);
    const refs = [];
    let m;

    // 1. Scan <ref> tags
    REF_REGEX.lastIndex = 0;
    while ((m = REF_REGEX.exec(normalized)) !== null) {
      if (!hasBalancedDiffTags(m[0])) continue;
      const hasChange = m[0].includes(CLASSES.DIFFCHANGE);
      const name = extractName(m[1]);
      refs.push({
        raw: m[0],
        attrs: m[1],
        content: m[2],
        hasChange,
        index: m.index,
        isTemplate: false,
        name,
        label: name || null
      });
    }

    // 2. Scan citation & footnote templates ({{sfn}}, {{r}}, {{efn}}, etc.)
    TEMPLATE_REF_REGEX.lastIndex = 0;
    while ((m = TEMPLATE_REF_REGEX.exec(normalized)) !== null) {
      if (!hasBalancedDiffTags(m[0])) continue;
      const templateName = m[1].toLowerCase();
      const rawArgs = m[2];
      const hasChange = m[0].includes(CLASSES.DIFFCHANGE);
      let label = templateName;
      let nameToken = null;

      if (templateName.startsWith('sfn')) {
        const info = extractSfnInfo(rawArgs);
        label = info.label;
        nameToken = info.anchorToken || info.label;
      } else if (templateName === 'r') {
        const parts = stripHtml(rawArgs).split('|').map(s => s.trim()).filter(Boolean);
        const refName = parts.find(p => !p.includes('=')) || 'ref';
        label = refName;
        nameToken = refName;
      } else if (templateName.startsWith('efn')) {
        label = 'note';
        nameToken = null;
      } else if (templateName.startsWith('harv')) {
        const info = extractSfnInfo(rawArgs);
        label = info.label;
        nameToken = info.anchorToken || info.label;
      }

      refs.push({
        raw: m[0],
        attrs: rawArgs,
        content: rawArgs,
        hasChange,
        index: m.index,
        isTemplate: true,
        templateName,
        label,
        name: nameToken
      });
    }

    // 3. Filter out references nested inside another reference (e.g. <ref> inside {{efn}})
    const topLevelRefs = refs.filter((r1, i) => {
      const r1End = r1.index + r1.raw.length;
      return !refs.some((r2, j) => {
        if (i === j) return false;
        const r2End = r2.index + r2.raw.length;
        return r1.index >= r2.index && r1End <= r2End && r1.raw.length < r2.raw.length;
      });
    });

    // 4. Sort refs by document index to strictly preserve appearance order
    topLevelRefs.sort((r1, r2) => r1.index - r2.index);

    return topLevelRefs;
  }
  /* === [END VIRTUAL FILE: src/parser.js] === */

  /* ==========================================================================
     VIRTUAL FILE: src/pairing.js
     Description: 3-pass heuristic reference pairing algorithm correlating
                  deleted citations with added citations (explicit name match,
                  clean content hash, and positional order fallback).
     ========================================================================== */

  /**
   * Pairs deleted and added references using a 3-pass heuristic:
   * 1. Match by explicit reference name (case-insensitive).
   * 2. Match identical references (clean content equality).
   * 3. Pair remaining references in positional order.
   *
   * @param {Array<Object>} delRefs
   * @param {Array<Object>} addRefs
   * @returns {Array<{ d: Object|null, a: Object|null, name: string|null }>}
   */
  function pairReferences(delRefs, addRefs) {
    const pairs = [];
    const matchedDel = new Set();
    const matchedAdd = new Set();

    const cleanContent = (r) => (r ? stripHtml(r.content || r.raw) : '');

    // Pass 1: Match by explicit name
    for (let i = 0; i < delRefs.length; i++) {
      const d = delRefs[i];
      const dName = d.name || extractName(d.attrs);
      if (!dName) continue;
      for (let j = 0; j < addRefs.length; j++) {
        if (matchedAdd.has(j)) continue;
        const a = addRefs[j];
        const aName = a.name || extractName(a.attrs);
        if (aName && aName.toLowerCase() === dName.toLowerCase()) {
          matchedDel.add(i);
          matchedAdd.add(j);
          pairs.push({ d, a, name: a.label || d.label || dName });
          break;
        }
      }
    }

    // Pass 2: Match identical references (same clean content)
    for (let i = 0; i < delRefs.length; i++) {
      if (matchedDel.has(i)) continue;
      const d = delRefs[i];
      const dClean = cleanContent(d);
      if (!dClean) continue;
      for (let j = 0; j < addRefs.length; j++) {
        if (matchedAdd.has(j)) continue;
        const a = addRefs[j];
        if (cleanContent(a) === dClean) {
          matchedDel.add(i);
          matchedAdd.add(j);
          pairs.push({ d, a, name: a.label || d.label || extractName(d.attrs) || extractName(a.attrs) });
          break;
        }
      }
    }

    // Pass 3: Pair remaining in positional order
    const remainingDel = delRefs.filter((_, i) => !matchedDel.has(i));
    const remainingAdd = addRefs.filter((_, j) => !matchedAdd.has(j));

    const commonCount = Math.min(remainingDel.length, remainingAdd.length);
    for (let k = 0; k < commonCount; k++) {
      const d = remainingDel[k];
      const a = remainingAdd[k];
      pairs.push({ d, a, name: a.label || d.label || extractName(d.attrs) || extractName(a.attrs) });
    }

    for (let k = commonCount; k < remainingDel.length; k++) {
      pairs.push({ d: remainingDel[k], a: null, name: remainingDel[k].label || extractName(remainingDel[k].attrs) });
    }

    for (let k = commonCount; k < remainingAdd.length; k++) {
      pairs.push({ d: null, a: remainingAdd[k], name: remainingAdd[k].label || extractName(remainingAdd[k].attrs) });
    }

    // Sort pairs by appearance order in document
    pairs.sort((p1, p2) => {
      if (p1.a && p2.a) {
        return addRefs.indexOf(p1.a) - addRefs.indexOf(p2.a);
      }
      if (p1.d && p2.d) {
        return delRefs.indexOf(p1.d) - delRefs.indexOf(p2.d);
      }
      const pos1 = p1.a ? addRefs.indexOf(p1.a) : delRefs.indexOf(p1.d);
      const pos2 = p2.a ? addRefs.indexOf(p2.a) : delRefs.indexOf(p2.d);
      return pos1 - pos2;
    });

    return pairs;
  }
  /* === [END VIRTUAL FILE: src/pairing.js] === */

  /* ==========================================================================
     VIRTUAL FILE: src/anchor.js
     Description: Live DOM footnote anchor discovery engine. Maps citation tokens,
                  named references, and shortened footnote FOOTNOTE anchors to
                  Wikipedia's cite_note elements to activate native popups.
     ========================================================================== */

  /**
   * Sanitizes a string for use in HTML element ID attributes.
   * @param {string} str
   * @returns {string}
   */
  function sanitizeAnchor(str) {
    return String(str || '').trim().replace(/[^a-zA-Z0-9_\-.:]+/g, '_').replace(/^_+|_+$/g, '');
  }

  /**
   * Discovers the corresponding #cite_note anchor ID in the live document, if present.
   * Matches explicit reference names directly (name="ABC"). For anonymous/unnamed references,
   * matches persistent identifiers (DOI, PMID, PMC, unique URL) in the rendered document,
   * falling back to template metadata, plain text content, or sequential reference numbering.
   * @param {string|null} name Reference name attribute
   * @param {string} rawContent Raw wikitext content of the reference
   * @param {string} [label] Badge label (e.g. 'ref2', 'kami')
   * @returns {string|null} Anchor element ID (e.g. 'cite_note-AlicanteRyanair-57') or null
   */
  function findCiteNoteAnchor(name, rawContent, label) {
    if (typeof document === 'undefined' || !document.querySelector) return null;

    // 1. Try explicit reference name (e.g. cite_note-name-1 or cite_note-FOOTNOTE...)
    if (name) {
      const candidates = [name];
      if (/\s/.test(name)) {
        candidates.push(name.trim().replace(/\s+/g, '_'));
      }
      for (const cand of candidates) {
        try {
          const safe = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(cand) : cand.replace(/["\\]/g, '\\$&');
          const el = document.querySelector(`[id^="cite_note-${safe}-"], [id="cite_note-${safe}"]`) ||
            (safe.startsWith('FOOTNOTE') ? document.querySelector(`[id*="${safe}"]`) : null);
          if (el && el.id) return el.id;
        } catch (_e) {
          // Selector query failed
        }
      }

      // Fallback manual scan if selector query did not find or threw
      try {
        const allNotes = document.querySelectorAll('[id^="cite_note-"]');
        if (allNotes && allNotes.length > 0) {
          for (const cand of candidates) {
            const prefix = `cite_note-${cand}-`.toLowerCase();
            const exact = `cite_note-${cand}`.toLowerCase();
            const candLower = cand.toLowerCase();
            for (let i = 0; i < allNotes.length; i++) {
              const id = allNotes[i].id.toLowerCase();
              if (id === exact || id.startsWith(prefix) || id.includes(candLower)) return allNotes[i].id;
            }
          }
        }
      } catch (_e) {
        // Fallback scan error ignored
      }
    }

    if (rawContent && typeof rawContent === 'string') {
      // 2. If sfn template, match author/year in .references li text
      if (/\{\{\s*sfn/i.test(rawContent)) {
        const info = extractSfnInfo(rawContent.replace(/^\{\{\s*sfn[a-z]*\|?/i, '').replace(/\}\}$/, ''));
        if (info && info.authors && info.authors.length) {
          const allNotes = document.querySelectorAll('.references li[id^="cite_note-"]');
          for (let i = 0; i < allNotes.length; i++) {
            const text = allNotes[i].textContent;
            const matchesAuthors = info.authors.every(a => text.includes(a));
            const matchesYear = !info.year || text.includes(info.year);
            if (matchesAuthors && matchesYear) {
              return allNotes[i].id;
            }
          }
        }
      }

      // 3. For anonymous/unnamed references: Try matching persistent identifiers (URL, DOI, PMID, PMC) in rendered reference list
      // MediaWiki renders these identifiers into external anchor links inside .references li[id^="cite_note-"]
      const idCandidates = [];

      // Web URL (e.g. https://www.example.com/...)
      const urlMatch = rawContent.match(/https?:\/\/[^\s|}<>"]+/);
      if (urlMatch) {
        idCandidates.push(urlMatch[0]);
      }

      // DOI (e.g. 10.1183/20734735.0310-2019)
      const doiMatch = rawContent.match(/\b(?:doi\s*=\s*(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:)?|https?:\/\/(?:dx\.)?doi\.org\/)?(10\.\d{4,9}\/[^\s|}<>"]+)/i);
      if (doiMatch) {
        idCandidates.push(doiMatch[1]);
      }

      // PMID (e.g. pmid = 31803258)
      const pmidMatch = rawContent.match(/\bpmid\s*=\s*(\d+)/i);
      if (pmidMatch) {
        idCandidates.push(pmidMatch[1]);
      }

      // PMC (e.g. pmc = 6885340)
      const pmcMatch = rawContent.match(/\bpmc\s*=\s*(?:PMC)?(\d+)/i);
      if (pmcMatch) {
        idCandidates.push(pmcMatch[1]);
      }

      // ISBN (e.g. isbn = 978-0-12-345678-9 matching Special:BookSources/...)
      const isbnMatch = rawContent.match(/\bisbn\s*=\s*([0-9Xx-]+)/i);
      if (isbnMatch) {
        const cleanIsbn = isbnMatch[1].replace(/[- ]/g, '').trim();
        if (cleanIsbn.length >= 9) {
          idCandidates.push(cleanIsbn);
        }
      }

      for (let idx = 0; idx < idCandidates.length; idx++) {
        const idVal = idCandidates[idx];
        try {
          const safeId = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(idVal) : idVal.replace(/["\\]/g, '\\$&');
          const link = document.querySelector(`.references a[href*="${safeId}"], #mw-content-text a.external[href*="${safeId}"], #mw-content-text a[href*="${safeId}"]`);
          if (link && link.closest) {
            const li = link.closest('li[id^="cite_note-"]');
            if (li && li.id) return li.id;
          }
        } catch (_e) {
          // Selector query failed, fallback to loop
        }
        try {
          const refLinks = document.querySelectorAll('.references a[href]');
          for (let i = 0; i < refLinks.length; i++) {
            const href = refLinks[i].getAttribute('href');
            if (href && href.includes(idVal)) {
              const li = refLinks[i].closest ? refLinks[i].closest('li[id^="cite_note-"]') : null;
              if (li && li.id) return li.id;
            }
          }
        } catch (_e) {
          // Loop error ignored
        }
      }

      // 4. Citation template metadata matching (title and/or author)
      const titleM = rawContent.match(/\btitle\s*=\s*([^|}]+)/i);
      const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').replace(/['[\]]/g, '').trim().toLowerCase() : '';

      const authorM = rawContent.match(/\b(?:author|last|author1|last1)\s*=\s*([^|}]+)/i);
      const author = authorM ? authorM[1].replace(/<[^>]+>/g, '').replace(/['[\]]/g, '').trim().toLowerCase() : '';

      if (title || author) {
        const allNotes = document.querySelectorAll('.references li[id^="cite_note-"], li[id^="cite_note-"]');
        for (let i = 0; i < allNotes.length; i++) {
          const text = (allNotes[i].textContent || '').toLowerCase();
          if (title && author) {
            if (text.includes(title) && text.includes(author)) return allNotes[i].id;
          } else if (title && title.length >= 4 && text.includes(title)) {
            return allNotes[i].id;
          } else if (author && author.length >= 4 && text.includes(author)) {
            return allNotes[i].id;
          }
        }
      }

      // 5. Plain text reference matching (non-template <ref>Some text...</ref>)
      const cleanText = rawContent.replace(/<[^>]+>/g, '').replace(/\{\{[^}]+\}\}/g, '').trim();
      if (cleanText.length >= 10) {
        const needle = cleanText.slice(0, 40).toLowerCase();
        const allNotes = document.querySelectorAll('.references li[id^="cite_note-"], li[id^="cite_note-"]');
        for (let i = 0; i < allNotes.length; i++) {
          const text = (allNotes[i].textContent || '').toLowerCase();
          if (text.includes(needle)) return allNotes[i].id;
        }
      }
    }

    // 6. Positional anonymous reference fallback (e.g. label 'ref2' -> id 'cite_note-2')
    if (label) {
      const numMatch = String(label).match(/^ref(\d+)$/i);
      if (numMatch) {
        const candidate = (document.getElementById && document.getElementById(`cite_note-${numMatch[1]}`)) ||
          (document.querySelector && document.querySelector(`[id="cite_note-${numMatch[1]}"]`));
        if (candidate && candidate.id) return candidate.id;
      }
    }

    return null;
  }
  /* === [END VIRTUAL FILE: src/anchor.js] === */

  /* ==========================================================================
     VIRTUAL FILE: src/renderer.js
     Description: Mathematical angle bracket badge generator (⟨ref1⟩, ⟨~name~⟩)
                  and decoupled citation diff row (tr.refdiff-cit-row) builder.
                  Constructs DOM nodes natively via el() (resolves finding M1).
     ========================================================================== */

  /**
   * Safe DOM element builder (fixes M1). Avoids innerHTML injection and ensures
   * text content and attribute values are safely set and escaped natively by the browser.
   * @param {string} tag HTML tag name
   * @param {Object|null} [attrs] Key-value pairs for attributes
   * @param {...(Node|string|number|null|undefined)} children Child nodes or text content
   * @returns {HTMLElement|null}
   */
  function el(tag, attrs, ...children) {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
      return null;
    }
    const node = document.createElement(tag);
    if (attrs && typeof attrs === 'object') {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === null || v === undefined) continue;
        if (k === 'textContent') {
          node.textContent = String(v);
        } else if (k === 'className' || k === 'class') {
          node.className = String(v);
        } else if (k === 'id') {
          node.id = String(v);
        } else if (k === 'checked') {
          if (v) {
            if (typeof node.setAttribute === 'function') node.setAttribute('checked', 'checked');
            node.checked = true;
          } else {
            if (typeof node.removeAttribute === 'function') node.removeAttribute('checked');
            node.checked = false;
          }
        } else if (k === 'role') {
          if (typeof node.setAttribute === 'function') node.setAttribute('role', String(v));
          node.role = String(v);
        } else if (k.startsWith('data-')) {
          if (typeof node.setAttribute === 'function') node.setAttribute(k, String(v));
          if (!node.dataset) node.dataset = {};
          const prop = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          node.dataset[prop] = String(v);
        } else if (typeof node.setAttribute === 'function') {
          node.setAttribute(k, String(v));
        } else {
          node[k] = v;
        }
      }
    }
    const doc = (node && node.ownerDocument) || (typeof document !== 'undefined' ? document : null);
    const flatChildren = children.flat ? children.flat(Infinity) : children;
    for (const child of flatChildren) {
      if (child === null || child === undefined) continue;
      if (typeof child === 'string' || typeof child === 'number') {
        if (doc && typeof doc.createTextNode === 'function') {
          node.appendChild(doc.createTextNode(String(child)));
        } else if (typeof node.appendChild === 'function') {
          node.appendChild({ textContent: String(child) });
        }
      } else if (typeof node.appendChild === 'function') {
        node.appendChild(child);
      }
    }
    return node;
  }

  /**
   * Safely parses an HTML fragment into child DOM nodes and appends them to parent.
   * Used for MediaWiki diff wikitext containing diffchange spans.
   * @param {HTMLElement} parent
   * @param {string} html
   */
  function appendHtmlChildren(parent, html) {
    if (!parent || !html) return;
    const doc = (parent && parent.ownerDocument) || (typeof document !== 'undefined' ? document : null);
    if (!doc || typeof doc.createElement !== 'function') return;
    const temp = doc.createElement('div');
    temp.innerHTML = html;
    if (typeof parent.appendChild === 'function') {
      while (temp.firstChild) {
        parent.appendChild(temp.firstChild);
      }
    }
  }

  /**
   * Replaces raw reference wikitext with a badge, stripping surrounding diffchange wrappers if present.
   * If prepend is true, keeps the raw reference (and any outer wrapper) and places the badge directly before it.
   * @param {string} html
   * @param {string} rawRef
   * @param {string} badgeHtml
   * @param {boolean} [prepend=false]
   * @returns {string}
   */
  function replaceRefInHtml(html, rawRef, badgeHtml, prepend) {
    if (!html || !rawRef) return html;
    const escaped = escapeRegex(rawRef);
    const diffchangeWrapper = new RegExp('<(ins|del)[^>]*class="[^"]*diffchange[^"]*"[^>]*>\\s*' + escaped + '\\s*<\\/\\1>', 'i');
    if (diffchangeWrapper.test(html)) {
      if (prepend) {
        return html.replace(diffchangeWrapper, (match) => badgeHtml + match);
      }
      return html.replace(diffchangeWrapper, () => badgeHtml);
    }
    if (prepend) {
      return html.replace(rawRef, (match) => badgeHtml + match);
    }
    return html.replace(rawRef, () => badgeHtml);
  }

  /**
   * Generates inline prose badge DOM element with reference link.
   * Native DOM constructor with automatic attribute and text escaping.
   * @param {'mod'|'add'|'del'|'norm'} type
   * @param {string} label
   * @param {string|null} [href] Target anchor or jump link
   * @param {string} [rawContent] Raw reference wikitext for preview list formatting
   * @returns {HTMLElement|null}
   */
  function createProseBadgeElement(type, label, href, rawContent) {
    let badgeClass = CLASSES.BADGE;
    const displayLabel = formatBadgeDisplayLabel(label);
    let title = `Citation: ⟨${label}⟩`;
    let inner = `⟨${displayLabel}⟩`;

    switch (type) {
      case 'mod':
        badgeClass = CLASSES.BADGE_MOD;
        title = `Citation metadata modified: ⟨~${label}~⟩`;
        inner = `⟨~${displayLabel}~⟩`;
        break;
      case 'add':
        badgeClass = CLASSES.BADGE_ADD;
        title = `Added citation: ⟨+${label}+⟩`;
        inner = `⟨+${displayLabel}+⟩`;
        break;
      case 'del':
        badgeClass = CLASSES.BADGE_DEL;
        title = `Removed citation: ⟨-${label}-⟩`;
        inner = `⟨-${displayLabel}-⟩`;
        break;
    }

    const isCiteNote = href && href.startsWith('#cite_note-');
    let childNode;
    if (href) {
      const aAttrs = { href, class: badgeClass };
      if (!isCiteNote) {
        let fullTooltip = title;
        const previewInfo = rawContent ? parseTemplateList(rawContent) : null;
        if (previewInfo && previewInfo.text) {
          fullTooltip = `${title}\n${previewInfo.text}`;
          if (previewInfo.data && previewInfo.data.length > 0) {
            aAttrs['data-preview-json'] = JSON.stringify({ title, data: previewInfo.data });
          } else {
            aAttrs['data-preview-json'] = JSON.stringify({ title, text: previewInfo.text });
          }
        }
        aAttrs.title = fullTooltip;
      }
      childNode = el('a', aAttrs, inner);
    } else {
      let fullTooltip = title;
      const spanAttrs = { class: badgeClass };
      const previewInfo = rawContent ? parseTemplateList(rawContent) : null;
      if (previewInfo && previewInfo.text) {
        fullTooltip = `${title}\n${previewInfo.text}`;
        if (previewInfo.data && previewInfo.data.length > 0) {
          spanAttrs['data-preview-json'] = JSON.stringify({ title, data: previewInfo.data });
        } else {
          spanAttrs['data-preview-json'] = JSON.stringify({ title, text: previewInfo.text });
        }
      }
      spanAttrs.title = fullTooltip;
      childNode = el('span', spanAttrs, inner);
    }

    return el('sup', { class: CLASSES.REF_CONTAINER }, childNode);
  }

  /**
   * Generates inline prose badge HTML with reference link.
   * Serializes createProseBadgeElement to HTML string for regex substitution in prose cells.
   * @param {'mod'|'add'|'del'|'norm'} type
   * @param {string} label
   * @param {string|null} [href] Target anchor or jump link
   * @param {string} [rawContent] Raw reference wikitext for preview list formatting
   * @returns {string}
   */
  function createProseBadge(type, label, href, rawContent) {
    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const badgeEl = createProseBadgeElement(type, label, href, rawContent);
      if (badgeEl && badgeEl.outerHTML) return badgeEl.outerHTML;
    }

    let badgeClass = CLASSES.BADGE;
    const displayLabel = formatBadgeDisplayLabel(label);
    let title = `Citation: ⟨${label}⟩`;
    let inner = `⟨${displayLabel}⟩`;

    switch (type) {
      case 'mod':
        badgeClass = CLASSES.BADGE_MOD;
        title = `Citation metadata modified: ⟨~${label}~⟩`;
        inner = `⟨~${displayLabel}~⟩`;
        break;
      case 'add':
        badgeClass = CLASSES.BADGE_ADD;
        title = `Added citation: ⟨+${label}+⟩`;
        inner = `⟨+${displayLabel}+⟩`;
        break;
      case 'del':
        badgeClass = CLASSES.BADGE_DEL;
        title = `Removed citation: ⟨-${label}-⟩`;
        inner = `⟨-${displayLabel}-⟩`;
        break;
    }

    const isCiteNote = href && href.startsWith('#cite_note-');
    if (isCiteNote) {
      const escapedHref = href.replace(/"/g, '&quot;');
      return `<sup class="${CLASSES.REF_CONTAINER}"><a href="${escapedHref}" class="${badgeClass}">${inner}</a></sup>`;
    }

    let fullTooltip = title;
    let dataAttr = '';
    const previewInfo = rawContent ? parseTemplateList(rawContent) : null;
    if (previewInfo && previewInfo.text) {
      fullTooltip = `${title}\n${previewInfo.text}`;
      if (previewInfo.data && previewInfo.data.length > 0) {
        const jsonStr = JSON.stringify({ title, data: previewInfo.data }).replace(/"/g, '&quot;');
        dataAttr = ` data-preview-json="${jsonStr}"`;
      } else {
        const jsonStr = JSON.stringify({ title, text: previewInfo.text }).replace(/"/g, '&quot;');
        dataAttr = ` data-preview-json="${jsonStr}"`;
      }
    }

    const escapedTitle = fullTooltip.replace(/"/g, '&quot;');
    if (href) {
      const escapedHref = href.replace(/"/g, '&quot;');
      return `<sup class="${CLASSES.REF_CONTAINER}"><a href="${escapedHref}" class="${badgeClass}" title="${escapedTitle}"${dataAttr}>${inner}</a></sup>`;
    }
    return `<sup class="${CLASSES.REF_CONTAINER}"><span class="${badgeClass}" title="${escapedTitle}"${dataAttr}>${inner}</span></sup>`;
  }

  let activePreviewCard = null;

  /**
   * Lazily retrieves or creates the singleton floating preview card element.
   * @returns {HTMLElement|null}
   */
  function getOrCreatePreviewCard() {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
    let card = document.getElementById('refdiff-preview-card');
    if (!card) {
      card = el('div', { id: 'refdiff-preview-card', class: CLASSES.PREVIEW_CARD, role: 'tooltip' });
      if (document.body && card && typeof document.body.appendChild === 'function') {
        document.body.appendChild(card);
      }
    }
    return card;
  }

  /**
   * Displays the floating reference preview card populated with template list format.
   * Suppresses the native OS title tooltip while the preview card is shown.
   * @param {HTMLElement} badge
   */
  function showBadgePreview(badge) {
    if (!badge || typeof badge.getAttribute !== 'function') return;
    const jsonStr = badge.getAttribute('data-preview-json');
    if (!jsonStr) return;

    let info;
    try {
      info = JSON.parse(jsonStr);
    } catch (_e) {
      return;
    }

    const card = getOrCreatePreviewCard();
    if (!card) return;

    while (card.firstChild) {
      card.removeChild(card.firstChild);
    }

    if (info.title) {
      const titleEl = el('div', { class: CLASSES.PREVIEW_TITLE }, info.title);
      if (titleEl) card.appendChild(titleEl);
    }

    if (info.data && Array.isArray(info.data) && info.data.length > 0) {
      for (const tpl of info.data) {
        const tplEl = el('div', { class: CLASSES.PREVIEW_TPL }, `{{${tpl.name}}}`);
        if (tplEl) card.appendChild(tplEl);

        if (tpl.params && tpl.params.length > 0) {
          const ul = el('ul', { class: CLASSES.PREVIEW_LIST });
          for (const p of tpl.params) {
            const li = el('li', null, el('span', { class: CLASSES.PREVIEW_KEY }, `${p.key}: `), p.val);
            if (li && ul) ul.appendChild(li);
          }
          if (ul) card.appendChild(ul);
        }
      }
    } else if (info.text) {
      const textEl = el('div', { class: 'refdiff-preview-text' }, info.text);
      if (textEl) card.appendChild(textEl);
    }

    if (badge.hasAttribute('title')) {
      badge.dataset.refdiffOrigTitle = badge.getAttribute('title');
      badge.removeAttribute('title');
    }

    card.style.display = 'block';

    if (typeof badge.getBoundingClientRect === 'function') {
      const rect = badge.getBoundingClientRect();
      const docEl = document.documentElement || document.body;
      const scrollX = (typeof window !== 'undefined' && window.scrollX !== undefined) ? window.scrollX : (docEl ? docEl.scrollLeft : 0);
      const scrollY = (typeof window !== 'undefined' && window.scrollY !== undefined) ? window.scrollY : (docEl ? docEl.scrollTop : 0);

      const top = rect.bottom + scrollY + 4;
      let left = rect.left + scrollX;

      const winWidth = (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 1000;
      if (left + 350 > winWidth) {
        left = Math.max(10, winWidth - 360);
      }

      card.style.top = `${Math.round(top)}px`;
      card.style.left = `${Math.round(left)}px`;
    }

    activePreviewCard = card;
  }

  /**
   * Hides the floating preview card and restores the native title tooltip attribute on the badge.
   * @param {HTMLElement} [badge]
   */
  function hideBadgePreview(badge) {
    if (badge && badge.dataset && badge.dataset.refdiffOrigTitle !== undefined) {
      badge.setAttribute('title', badge.dataset.refdiffOrigTitle);
      delete badge.dataset.refdiffOrigTitle;
    }
    if (activePreviewCard) {
      activePreviewCard.style.display = 'none';
    }
  }

  /**
   * Creates a decoupled citation diff table row (`<tr>`).
   * Constructed purely with DOM elements via el() to eliminate XSS risks (fixes M1).
   * @param {Object} mc Modified citation model
   * @param {string} mc.label Badge label
   * @param {string} mc.oldRaw Previous raw reference wikitext
   * @param {string} mc.newRaw Updated raw reference wikitext
   * @param {string} [mc.rowId] Row anchor ID
   * @param {string|null} [mc.citeNoteId] Target cite_note anchor in live article
   * @param {boolean} [mc.isAdd] True if citation was purely added
   * @param {boolean} [mc.isDel] True if citation was purely deleted
   * @returns {HTMLTableRowElement|null}
   */
  function createCitRow(mc) {
    const citRow = el('tr', { class: CLASSES.CIT_ROW });
    if (!citRow) return null;
    if (mc.rowId) {
      citRow.id = mc.rowId;
    }

    const badgeHref = mc.citeNoteId ? `#${mc.citeNoteId}` : null;
    let delDiv;
    let addDiv;

    if (mc.isAdd) {
      const badgeNode = createProseBadgeElement('add', mc.label, badgeHref, mc.newRaw);
      const cleanContent = mc.newRaw ? mc.newRaw.replace(/<\/?(?:ins|del)\b[^>]*>/gi, '') : '';
      addDiv = el('div', null, badgeNode, ' ');
      if (cleanContent) {
        appendHtmlChildren(addDiv, cleanContent);
      }

      const tdEmpty = el('td', { class: `${CLASSES.DIFF_EMPTY} ${CLASSES.DIFF_SIDE_DELETED}`, colspan: '2' });
      const tdMarkerAdd = el('td', { class: 'diff-marker', 'data-marker': '+' });
      const tdAdd = el('td', {
        class: `${CLASSES.CIT_ADDED_LINE} ${CLASSES.DIFF_SIDE_ADDED}`
      }, addDiv);

      if (typeof citRow.appendChild === 'function') {
        if (tdEmpty) citRow.appendChild(tdEmpty);
        if (tdMarkerAdd) citRow.appendChild(tdMarkerAdd);
        if (tdAdd) citRow.appendChild(tdAdd);
      }
    } else if (mc.isDel) {
      const badgeNode = createProseBadgeElement('del', mc.label, null, mc.oldRaw);
      const cleanContent = mc.oldRaw ? mc.oldRaw.replace(/<\/?(?:ins|del)\b[^>]*>/gi, '') : '';
      delDiv = el('div', null, badgeNode, ' ');
      if (cleanContent) {
        appendHtmlChildren(delDiv, cleanContent);
      }

      const tdMarkerDel = el('td', { class: 'diff-marker', 'data-marker': '−' });
      const tdDel = el('td', {
        class: `${CLASSES.CIT_DELETED_LINE} ${CLASSES.DIFF_SIDE_DELETED}`
      }, delDiv);
      const tdEmpty = el('td', { class: `${CLASSES.DIFF_EMPTY} ${CLASSES.DIFF_SIDE_ADDED}`, colspan: '2' });

      if (typeof citRow.appendChild === 'function') {
        if (tdMarkerDel) citRow.appendChild(tdMarkerDel);
        if (tdDel) citRow.appendChild(tdDel);
        if (tdEmpty) citRow.appendChild(tdEmpty);
      }
    } else {
      const delBadge = createProseBadgeElement('mod', mc.label, badgeHref, mc.oldRaw);
      const addBadge = createProseBadgeElement('mod', mc.label, badgeHref, mc.newRaw);
      delDiv = el('div', null, delBadge, ' ');
      appendHtmlChildren(delDiv, mc.oldRaw);

      addDiv = el('div', null, addBadge, ' ');
      appendHtmlChildren(addDiv, mc.newRaw);

      const tdMarkerDel = el('td', { class: 'diff-marker', 'data-marker': '−' });
      const tdDel = el('td', {
        class: `${CLASSES.CIT_DELETED_LINE} ${CLASSES.DIFF_SIDE_DELETED}`
      }, delDiv);
      const tdMarkerAdd = el('td', { class: 'diff-marker', 'data-marker': '+' });
      const tdAdd = el('td', {
        class: `${CLASSES.CIT_ADDED_LINE} ${CLASSES.DIFF_SIDE_ADDED}`
      }, addDiv);

      if (typeof citRow.appendChild === 'function') {
        if (tdMarkerDel) citRow.appendChild(tdMarkerDel);
        if (tdDel) citRow.appendChild(tdDel);
        if (tdMarkerAdd) citRow.appendChild(tdMarkerAdd);
        if (tdAdd) citRow.appendChild(tdAdd);
      }
    }

    return citRow;
  }
  /* === [END VIRTUAL FILE: src/renderer.js] === */

  /* ==========================================================================
     VIRTUAL FILE: src/memento.js
     Description: Memento design pattern implementation for MediaWiki DOM rows.
                  Captures and restores live DOM elements in-place to prevent
                  detaching native event closures in inlineFormatToggle and VE.
     ========================================================================== */

  /**
   * Captures a non-destructive DOM snapshot of a diff row before transformation.
   * @param {HTMLTableRowElement} row
   * @returns {Object} Row snapshot memento
   */
  function captureRowSnapshot(row) {
    const delDiv = row.querySelector(`${SELECTORS.DELETED_LINE} div`);
    const addDiv = row.querySelector(`${SELECTORS.ADDED_LINE} div`);
    const delTd = row.querySelector(SELECTORS.DELETED_LINE);
    const addTd = row.querySelector(SELECTORS.ADDED_LINE);
    const markers = Array.from(row.querySelectorAll(SELECTORS.DIFF_MARKER));

    return {
      row,
      delDiv,
      addDiv,
      delTd,
      addTd,
      delHtml: delDiv ? delDiv.innerHTML : null,
      addHtml: addDiv ? addDiv.innerHTML : null,
      delTdClass: delTd ? delTd.className : null,
      addTdClass: addTd ? addTd.className : null,
      markers: markers.map(mk => ({ el: mk, marker: mk.getAttribute('data-marker') }))
    };
  }

  /**
   * Restores a captured row snapshot back to its original DOM state in-place.
   * @param {Object} item Snapshot memento
   */
  function restoreRowSnapshot(item) {
    if (item.delDiv && item.delHtml !== null) {
      item.delDiv.innerHTML = item.delHtml;
    }
    if (item.addDiv && item.addHtml !== null) {
      item.addDiv.innerHTML = item.addHtml;
    }
    if (item.delTd && item.delTdClass !== null) {
      item.delTd.className = item.delTdClass;
    }
    if (item.addTd && item.addTdClass !== null) {
      item.addTd.className = item.addTdClass;
    }
    if (item.markers) {
      for (let m = 0; m < item.markers.length; m++) {
        const mkInfo = item.markers[m];
        if (mkInfo.marker !== null) {
          if (typeof mkInfo.el.setAttribute === 'function') {
            mkInfo.el.setAttribute('data-marker', mkInfo.marker);
          }
        } else if (typeof mkInfo.el.removeAttribute === 'function') {
          mkInfo.el.removeAttribute('data-marker');
        }
      }
    }
  }
  /* === [END VIRTUAL FILE: src/memento.js] === */

  /* ==========================================================================
     VIRTUAL FILE: src/pipeline.js
     Description: Core decoupling transformation pipeline. Replaces prose refs
                  with badges, generates citation diff rows, applies changes to
                  table.diff, attaches click handlers, and coordinates restore.
     ========================================================================== */

  /**
   * Transforms prose cell HTML by replacing raw references with badges and extracting modified citations.
   * If inlineModified is true (or legacy separateChanged is false), modified references remain directly
   * inline in the prose diff with a prepended badge (no separate rows created), while unchanged references
   * are shortened into hoverable badges. Added and deleted references always separate into rows below.
   * @param {string} initialDelHtml
   * @param {string} initialAddHtml
   * @param {Array<Object>} pairs
   * @param {number} startCounter
   * @param {{ inlineModified?: boolean, separateChanged?: boolean }} [options]
   * @returns {{ newDelHtml: string, newAddHtml: string, modifiedCits: Array<Object>, nextCounter: number }}
   */
  function transformProseCells(initialDelHtml, initialAddHtml, pairs, startCounter, options) {
    const opts = options || {};
    const inlineModified = typeof opts.inlineModified === 'boolean'
      ? opts.inlineModified
      : (typeof opts.separateChanged === 'boolean'
          ? !opts.separateChanged
          : isInlineModifiedPreferred());

    let citCounter = startCounter;
    const modifiedCits = [];
    let alignedDel = initialDelHtml;
    let alignedAdd = initialAddHtml;
    if (hasDeletedCn(alignedDel)) {
      const aligned = normalizeCnDiffPair(alignedDel, alignedAdd);
      alignedDel = aligned.delHtml;
      alignedAdd = aligned.addHtml;
    }
    let newDelHtml = normalizeDiffTags(alignedDel);
    let newAddHtml = normalizeDiffTags(alignedAdd);

    for (const pair of pairs) {
      const d = pair.d;
      const a = pair.a;
      const label = pair.name || (a && a.label) || (d && d.label) || `ref${citCounter++}`;
      const refContent = (a && (a.content || a.raw)) || (d && (d.content || d.raw)) || '';
      const citeNoteId = findCiteNoteAnchor((a && a.name) || (d && d.name) || pair.name, refContent, label);

      if (d && a) {
        const isMod = (d && d.hasChange) || (a && a.hasChange) || (stripHtml(d.raw) !== stripHtml(a.raw));
        if (isMod) {
          const modContent = (a && (a.content || a.raw)) || (d && (d.content || d.raw)) || '';
          if (inlineModified) {
            const href = citeNoteId ? `#${citeNoteId}` : null;
            const badge = createProseBadge('mod', label, href, modContent);
            newDelHtml = replaceRefInHtml(newDelHtml, d.raw, badge, true);
            newAddHtml = replaceRefInHtml(newAddHtml, a.raw, badge, true);
            continue;
          }
          const rowId = `refdiff-cit-${sanitizeAnchor(label)}-${citCounter}`;
          modifiedCits.push({ label, oldRaw: d.raw, newRaw: a.raw, rowId, citeNoteId });
          const href = citeNoteId ? `#${citeNoteId}` : `#${rowId}`;
          const badge = createProseBadge('mod', label, href, modContent);
          newDelHtml = replaceRefInHtml(newDelHtml, d.raw, badge);
          newAddHtml = replaceRefInHtml(newAddHtml, a.raw, badge);
        } else {
          const href = citeNoteId ? `#${citeNoteId}` : null;
          const badge = createProseBadge('norm', label, href, refContent);
          newDelHtml = replaceRefInHtml(newDelHtml, d.raw, badge);
          newAddHtml = replaceRefInHtml(newAddHtml, a.raw, badge);
        }
      } else if (a && !d) {
        const rowId = `refdiff-cit-${sanitizeAnchor(label)}-${citCounter}`;
        const href = citeNoteId ? `#${citeNoteId}` : `#${rowId}`;
        const badge = createProseBadge('add', label, href, a.content || a.raw);
        newAddHtml = replaceRefInHtml(newAddHtml, a.raw, badge);
        modifiedCits.push({ label, oldRaw: '', newRaw: a.raw, isAdd: true, rowId, citeNoteId });
      } else if (d && !a) {
        const rowId = `refdiff-cit-${sanitizeAnchor(label)}-${citCounter}`;
        const href = `#${rowId}`;
        const badge = createProseBadge('del', label, href, d.content || d.raw);
        newDelHtml = replaceRefInHtml(newDelHtml, d.raw, badge);
        modifiedCits.push({ label, oldRaw: d.raw, newRaw: '', isDel: true, rowId });
      }
    }

    newDelHtml = newDelHtml.replace(/<(ins|del)\b[^>]*><\/\1>/gi, '');
    newAddHtml = newAddHtml.replace(/<(ins|del)\b[^>]*><\/\1>/gi, '');

    return { newDelHtml, newAddHtml, modifiedCits, nextCounter: citCounter };
  }

  /**
   * Applies prose row styling updates when all inline diff changes were extracted citations.
   * @param {HTMLTableRowElement} row
   * @param {string} newDelHtml
   * @param {string} newAddHtml
   */
  function updateProseRowAppearance(row, newDelHtml, newAddHtml) {
    const hasProseChanges = newDelHtml.includes(CLASSES.DIFFCHANGE) || newAddHtml.includes(CLASSES.DIFFCHANGE);
    if (!hasProseChanges) {
      const delTd = row.querySelector(SELECTORS.DELETED_LINE);
      const addTd = row.querySelector(SELECTORS.ADDED_LINE);
      if (delTd) delTd.className = `${CLASSES.DIFF_CONTEXT} ${CLASSES.DIFF_SIDE_DELETED}`;
      if (addTd) addTd.className = `${CLASSES.DIFF_CONTEXT} ${CLASSES.DIFF_SIDE_ADDED}`;
      const markers = row.querySelectorAll(SELECTORS.DIFF_MARKER);
      markers.forEach(mk => mk.removeAttribute('data-marker'));
    }
  }

  /**
   * Inserts decoupled citation diff rows sequentially directly below the anchor row.
   * @param {HTMLTableRowElement} anchorRow
   * @param {Array<Object>} modifiedCits
   */
  function insertCitationRows(anchorRow, modifiedCits) {
    let prevRow = anchorRow;
    for (const mc of modifiedCits) {
      const citRow = createCitRow(mc);
      if (prevRow.parentNode) {
        prevRow.parentNode.insertBefore(citRow, prevRow.nextSibling);
      }
      prevRow = citRow;
    }
  }

  /**
   * Applies the decoupled citation diff view to a MediaWiki diff table.
   * Preserves 100% of native DOM elements in-place to avoid detaching MediaWiki event listeners.
   * @param {HTMLTableElement} table
   * @param {{ separateChanged?: boolean }} [options]
   */
  function applyDecoupling(table, options) {
    if (!table || typeof table.querySelectorAll !== 'function' || state.isDecoupled) return;
    const opts = options || {};

    if (!state.origTableHtml) {
      state.origTableHtml = table.innerHTML;
    }

    const changeRows = Array.from(table.querySelectorAll('tr')).filter(
      r => r.querySelector(`${SELECTORS.DELETED_LINE}, ${SELECTORS.ADDED_LINE}`) &&
           !r.classList.contains(CLASSES.CIT_ROW)
    );

    let citCounter = 1;

    for (const row of changeRows) {
      const delDiv = row.querySelector(`${SELECTORS.DELETED_LINE} div`);
      const addDiv = row.querySelector(`${SELECTORS.ADDED_LINE} div`);
      if (!delDiv && !addDiv) continue;

      let delHtml = delDiv ? delDiv.innerHTML : '';
      let addHtml = addDiv ? addDiv.innerHTML : '';

      if (hasDeletedCn(delHtml)) {
        const aligned = normalizeCnDiffPair(delHtml, addHtml);
        delHtml = aligned.delHtml;
        addHtml = aligned.addHtml;
      }

      const delRefs = parseRefs(delHtml);
      const addRefs = parseRefs(addHtml);
      if (delRefs.length === 0 && addRefs.length === 0) continue;

      // 1. Capture snapshot before mutation
      state.modifiedRows.push(captureRowSnapshot(row));

      // 2. Pair references and transform prose
      const pairs = pairReferences(delRefs, addRefs);
      const { newDelHtml, newAddHtml, modifiedCits, nextCounter } = transformProseCells(
        delHtml,
        addHtml,
        pairs,
        citCounter,
        opts
      );
      citCounter = nextCounter;

      // 3. Mutate prose row DOM
      if (delDiv) delDiv.innerHTML = newDelHtml;
      if (addDiv) addDiv.innerHTML = newAddHtml;
      if (delDiv && addDiv) {
        updateProseRowAppearance(row, newDelHtml, newAddHtml);
      }

      // 4. Insert citation diff rows (only if any modified citations exist)
      if (modifiedCits.length > 0) {
        insertCitationRows(row, modifiedCits);
      }
    }

    state.isDecoupled = true;

    // Attach click handler for smooth scrolling and flashing jump targets
    if (!state.onTableClickHandler && typeof table.addEventListener === 'function') {
      state.onTableClickHandler = onTableClick;
      table.addEventListener('click', state.onTableClickHandler);
    }

    // Attach delegated hover handlers for template preview cards
    if (!state.onTableHoverHandler && typeof table.addEventListener === 'function') {
      state.onTableMouseOver = function(e) {
        const badge = (e.target && e.target.closest) ? e.target.closest('.refdiff-ref a, .refdiff-ref span') : null;
        if (!badge) return;
        const href = badge.getAttribute('href');
        if (href && href.startsWith('#cite_note-')) return;
        showBadgePreview(badge);
      };
      state.onTableMouseOut = function(e) {
        const badge = (e.target && e.target.closest) ? e.target.closest('.refdiff-ref a, .refdiff-ref span') : null;
        if (badge) {
          hideBadgePreview(badge);
        }
      };
      state.onTableHoverHandler = true;
      table.addEventListener('mouseover', state.onTableMouseOver);
      table.addEventListener('mouseout', state.onTableMouseOut);
    }

    notifyBodyUpdate(table);
  }

  /**
   * Click event listener for table.diff to handle smooth scrolling and highlighting
   * when reference badges or citation jump links are clicked.
   * @param {MouseEvent} e
   */
  function onTableClick(e) {
    hideBadgePreview();
    const a = (e.target && e.target.closest) ? e.target.closest('.refdiff-ref a') : null;
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;

    if (href.startsWith('#refdiff-cit-')) {
      const target = document.getElementById(href.slice(1));
      if (target) {
        e.preventDefault();
        if (typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        target.classList.remove(CLASSES.FLASH_CIT);
        void target.offsetWidth;
        target.classList.add(CLASSES.FLASH_CIT);
      }
    } else if (href.startsWith('#cite_note-')) {
      const target = document.getElementById(href.slice(1));
      if (target) {
        e.preventDefault();
        if (typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        try {
          if (window.history && window.history.pushState) {
            window.history.pushState(null, '', href);
          }
        } catch (_err) {
          // Ignore history pushState failures in sandbox/restricted iframes
        }
        target.classList.remove(CLASSES.FLASH_TARGET);
        void target.offsetWidth;
        target.classList.add(CLASSES.FLASH_TARGET);
      }
    }
  }

  /**
   * Restores the diff table to its original native MediaWiki HTML in-place.
   * Ensures closures in inlineFormatToggle.js and VisualEditor stay bound to live DOM nodes.
   * @param {HTMLTableElement} table
   */
  function restoreOriginal(table) {
    if (!table || !state.isDecoupled) return;

    if (state.onTableClickHandler && typeof table.removeEventListener === 'function') {
      table.removeEventListener('click', state.onTableClickHandler);
      state.onTableClickHandler = null;
    }

    if (state.onTableHoverHandler && typeof table.removeEventListener === 'function') {
      if (state.onTableMouseOver) table.removeEventListener('mouseover', state.onTableMouseOver);
      if (state.onTableMouseOut) table.removeEventListener('mouseout', state.onTableMouseOut);
      state.onTableMouseOver = null;
      state.onTableMouseOut = null;
      state.onTableHoverHandler = false;
    }

    hideBadgePreview();
    if (activePreviewCard && activePreviewCard.parentNode) {
      activePreviewCard.parentNode.removeChild(activePreviewCard);
      activePreviewCard = null;
    }

    if (typeof table.querySelectorAll === 'function') {
      const citRows = table.querySelectorAll(SELECTORS.CIT_ROW);
      for (let i = 0; i < citRows.length; i++) {
        citRows[i].remove();
      }
    }

    if (state.modifiedRows && state.modifiedRows.length > 0) {
      for (let i = 0; i < state.modifiedRows.length; i++) {
        restoreRowSnapshot(state.modifiedRows[i]);
      }
      state.modifiedRows = [];
    } else if (state.origTableHtml) {
      table.innerHTML = state.origTableHtml;
    }

    state.isDecoupled = false;
    notifyBodyUpdate(table);
  }
  /* === [END VIRTUAL FILE: src/pipeline.js] === */

  /* ==========================================================================
     VIRTUAL FILE: src/dom_helpers.js
     Description: DOM query, categorization, and hook notification helpers.
                  Separates header from body rows and synchronizes with VE.
     ========================================================================== */

  /**
   * Returns all non-header diff rows from a MediaWiki diff table.
   * Matches VisualEditor's row categorization (excluding diff-title, diff-multi, diff-notice).
   * @param {HTMLTableElement} table
   * @returns {HTMLTableRowElement[]}
   */
  function getDiffBodyRows(table) {
    if (!table || typeof table.querySelectorAll !== 'function') return [];
    const headerSet = new Set(table.querySelectorAll(SELECTORS.DIFF_HEADER_TITLE));
    const multiOrNotice = table.querySelectorAll(SELECTORS.DIFF_MULTI_OR_NOTICE);
    for (let i = 0; i < multiOrNotice.length; i++) {
      if (multiOrNotice[i].parentElement) {
        headerSet.add(multiOrNotice[i].parentElement);
      }
    }
    return Array.from(table.querySelectorAll('tr')).filter(r => !headerSet.has(r));
  }

  /**
   * Fires MediaWiki's native 'wikipage.diff.wikitextBodyUpdate' hook so VisualEditor
   * synchronizes its internal $wikitextDiffBody reference with the live table rows.
   * Also fires 'wikipage.content' so Extension:Popups hooks into new reference links.
   * @param {HTMLTableElement} table
   */
  function notifyBodyUpdate(table) {
    if (!table) return;
    if (typeof window !== 'undefined' && window.mw && window.mw.hook) {
      const $ = window.$ || window.jQuery;
      if ($) {
        const bodyRows = getDiffBodyRows(table);
        window.mw.hook(HOOKS.BODY_UPDATE).fire($(bodyRows));
        try {
          window.mw.hook('wikipage.content').fire($(table));
        } catch (_e) {
          // Ignore failures if wikipage.content hook listeners throw
        }
      }
    }
  }
  /* === [END VIRTUAL FILE: src/dom_helpers.js] === */

  /* ==========================================================================
     VIRTUAL FILE: src/mode_coordinator.js
     Description: 3-way mode switching (visual/wikitext/refdiff), OOUI button
                  synchronization, inline format switch locking, and persistence.
     ========================================================================== */

  /**
   * Checks whether RefDiff should be active based on stored user preference or URL override.
   * Defaults to true if no preference has been saved yet.
   * @returns {boolean}
   */
  function isRefDiffPreferred() {
    try {
      if (typeof window !== 'undefined') {
        if (window.location && /[?&]refdiff=0\b/.test(window.location.search)) return false;
        if (window.location && /[?&]refdiff=1\b/.test(window.location.search)) return true;

        const stored = (window.mw && window.mw.storage)
          ? window.mw.storage.get(STORAGE_KEY)
          : (window.localStorage ? window.localStorage.getItem(STORAGE_KEY) : null);
        if (stored !== null && stored !== undefined) {
          return stored === 'true';
        }
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  /**
   * Persists the RefDiff active preference to mw.storage / localStorage.
   * @param {boolean} active
   */
  function setRefDiffPreferred(active) {
    try {
      if (typeof window !== 'undefined') {
        if (window.mw && window.mw.storage) {
          window.mw.storage.set(STORAGE_KEY, String(active));
        } else if (window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, String(active));
        }
      }
    } catch (e) {
      // Silently ignore quota / private mode storage errors
    }
  }

  /**
   * Checks whether modified references should remain inline in prose with a prepended badge.
   * If true, modified references remain inline with ⟨~label~⟩ prepended, while unchanged
   * references are shortened into hoverable badges. Added and deleted references always
   * separate into citation rows below regardless.
   * Defaults to false (clean traditional RefDiff out-of-the-box, unchecked).
   * Precedence: window.refdiffConfig.inlineModified > window.refdiffConfig.separateChanged (inverted)
   *             > URL (?refdiff_inline=0|1 / ?refdiff_separate=0|1) > storage > default false
   * @returns {boolean}
   */
  function isInlineModifiedPreferred() {
    try {
      if (typeof window !== 'undefined') {
        if (window.refdiffConfig && typeof window.refdiffConfig.inlineModified === 'boolean') {
          return window.refdiffConfig.inlineModified;
        }
        if (window.refdiffConfig && typeof window.refdiffConfig.separateChanged === 'boolean') {
          return !window.refdiffConfig.separateChanged;
        }
        if (window.location && /[?&]refdiff_inline=1\b/.test(window.location.search)) return true;
        if (window.location && /[?&]refdiff_inline=0\b/.test(window.location.search)) return false;
        if (window.location && /[?&]refdiff_separate=0\b/.test(window.location.search)) return true;
        if (window.location && /[?&]refdiff_separate=1\b/.test(window.location.search)) return false;

        const storedInline = (window.mw && window.mw.storage)
          ? window.mw.storage.get(STORAGE_KEY_INLINE)
          : (window.localStorage ? window.localStorage.getItem(STORAGE_KEY_INLINE) : null);
        if (storedInline !== null && storedInline !== undefined) {
          return storedInline === 'true';
        }

        const storedSeparate = (window.mw && window.mw.storage)
          ? window.mw.storage.get(STORAGE_KEY_SEPARATE)
          : (window.localStorage ? window.localStorage.getItem(STORAGE_KEY_SEPARATE) : null);
        if (storedSeparate !== null && storedSeparate !== undefined) {
          return storedSeparate === 'false';
        }
      }
      return false;
    } catch (_e) {
      return false;
    }
  }

  /**
   * Persists the inlineModified preference to mw.storage / localStorage.
   * @param {boolean} inline
   */
  function setInlineModifiedPreferred(inline) {
    try {
      if (typeof window !== 'undefined') {
        if (window.mw && window.mw.storage) {
          window.mw.storage.set(STORAGE_KEY_INLINE, String(inline));
          window.mw.storage.set(STORAGE_KEY_SEPARATE, String(!inline));
        } else if (window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY_INLINE, String(inline));
          window.localStorage.setItem(STORAGE_KEY_SEPARATE, String(!inline));
        }
      }
    } catch (_e) {
      // Silently ignore quota / private mode storage errors
    }
  }

  /**
   * Backward-compatible alias checking whether modified references should be decoupled into separate rows.
   * Defaults to true (full decoupling).
   * @returns {boolean}
   */
  function isSeparateChangedPreferred() {
    return !isInlineModifiedPreferred();
  }

  /**
   * Backward-compatible alias persisting the separateChanged preference.
   * @param {boolean} separate
   */
  function setSeparateChangedPreferred(separate) {
    setInlineModifiedPreferred(!separate);
  }

  /**
   * Toggles active styling on an OOUI button element.
   * @param {HTMLElement|null} el
   * @param {boolean} active
   * @param {boolean} isSelect
   */
  function setElementActive(el, active, isSelect) {
    if (!el) return;
    el.classList.toggle(CLASSES.OO_BTN_ACTIVE, active);
    if (isSelect) {
      el.classList.toggle(CLASSES.OO_OPTION_SELECTED, active);
      el.setAttribute('aria-selected', String(active));
    }
    const icon = el.querySelector('.oo-ui-iconElement-icon');
    if (icon) {
      icon.classList.toggle(CLASSES.OO_IMAGE_INVERT, active);
    }
  }

  /**
   * Helper to retrieve the OOUI ButtonSelectWidget instance for diff mode, if present.
   * @returns {Object|null}
   */
  function getDiffModeWidget() {
    if (typeof document === 'undefined') return null;
    const opt = document.querySelector(SELECTORS.VE_OPTION_WIDGET);
    if (!opt) return null;
    const $ = window.jQuery || window.$;
    if ($) {
      const optWidget = $(opt).data('oo-ui-optionWidget');
      if (optWidget) {
        if (typeof optWidget.getElementGroup === 'function') {
          return optWidget.getElementGroup();
        }
        if (optWidget.elementGroup) {
          return optWidget.elementGroup;
        }
      }
    }
    return null;
  }

  /**
   * Checks whether VisualEditor visual diff mode is currently active.
   * @returns {boolean}
   */
  function isVisualDiffActive() {
    if (typeof document === 'undefined') return false;
    if (typeof window !== 'undefined' && window.location) {
      if (/[?&]diffmode=visual\b/.test(window.location.search)) return true;
      if (/[?&]diffmode=source\b/.test(window.location.search)) return false;
    }
    if (typeof window !== 'undefined' && window.mw && window.mw.user && typeof window.mw.user.options?.get === 'function') {
      const hist = window.mw.user.options.get('visualeditor-diffmode-historical');
      if (hist === 'visual') return true;
    }
    const widget = getDiffModeWidget();
    if (widget && typeof widget.findSelectedItem === 'function') {
      const item = widget.findSelectedItem();
      if (item && typeof item.getData === 'function') {
        return item.getData() === 'visual';
      }
    }
    const veDiff = document.querySelector(SELECTORS.VE_DIFF_ELEMENT);
    if (veDiff && veDiff.offsetParent !== null) return true;
    const visualBtn = document.querySelector(SELECTORS.VE_VISUAL_BUTTON);
    if (visualBtn && (visualBtn.classList.contains(CLASSES.OO_OPTION_SELECTED) || visualBtn.classList.contains(CLASSES.OO_BUTTON_ACTIVE) || visualBtn.getAttribute('aria-selected') === 'true')) {
      return true;
    }
    const eyeBtn = document.querySelector('.ve-init-mw-diffPage-diffMode .oo-ui-icon-eye');
    if (eyeBtn) {
      const btn = eyeBtn.closest('.oo-ui-buttonElement, .oo-ui-optionWidget');
      if (btn && (btn.classList.contains(CLASSES.OO_OPTION_SELECTED) || btn.classList.contains(CLASSES.OO_BUTTON_ACTIVE) || btn.getAttribute('aria-selected') === 'true')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Helper to retrieve the native MediaWiki inline diff toggle switch widget.
   * @returns {Object|null}
   */
  function getInlineSwitchWidget() {
    if (state.diffTypeSwitchWidget && typeof state.diffTypeSwitchWidget.setDisabled === 'function') {
      return state.diffTypeSwitchWidget;
    }
    if (typeof document !== 'undefined') {
      const swEl = document.querySelector(SELECTORS.INLINE_SWITCH);
      if (swEl) {
        if (typeof window !== 'undefined' && (window.$ || window.jQuery)) {
          const $ = window.$ || window.jQuery;
          const infused = $(swEl).data('oouiInfused');
          if (infused && typeof infused.setDisabled === 'function') {
            state.diffTypeSwitchWidget = infused;
            return state.diffTypeSwitchWidget;
          }
        }
        if (typeof window !== 'undefined' && window.OO && window.OO.ui && typeof window.OO.ui.infuse === 'function') {
          try {
            state.diffTypeSwitchWidget = window.OO.ui.infuse(swEl);
            return state.diffTypeSwitchWidget;
          } catch (e) {
            // Silently ignore infusion errors
          }
        }
      }
    }
    return null;
  }

  /**
   * Sets the disabled/inactive state of the native MediaWiki inline diff switch.
   * @param {boolean} disabled
   */
  function setInlineSwitchDisabled(disabled) {
    const swWidget = getInlineSwitchWidget();
    if (swWidget && typeof swWidget.setDisabled === 'function') {
      if (disabled && typeof swWidget.getValue === 'function' && swWidget.getValue()) {
        swWidget.setValue(false);
      }
      swWidget.setDisabled(disabled);
    }
    if (typeof document !== 'undefined') {
      const swEl = document.querySelector(SELECTORS.INLINE_SWITCH);
      if (swEl) {
        swEl.classList.toggle(CLASSES.OO_WIDGET_DISABLED, disabled);
        swEl.classList.toggle(CLASSES.OO_WIDGET_ENABLED, !disabled);
        swEl.setAttribute('aria-disabled', String(disabled));
        if (swEl.tagName === 'INPUT') {
          swEl.disabled = disabled;
        }
      }
      const field = swEl ? swEl.closest('.oo-ui-fieldLayout') : null;
      if (field) {
        field.classList.toggle(CLASSES.OO_WIDGET_DISABLED, disabled);
        field.classList.toggle(CLASSES.OO_WIDGET_ENABLED, !disabled);
        field.classList.toggle(CLASSES.OO_FIELD_DISABLED, disabled);
      }
    }
  }

  /**
   * Sets the disabled/inert state of the RefDiff OOUI button.
   * While Visual mode is active, RefDiff is visually dimmed and not interactive.
   * @param {boolean} disabled
   */
  function setRefDiffButtonDisabled(disabled) {
    if (typeof document === 'undefined') return;
    const refBtn = document.getElementById('refdiff-ooui-btn');
    if (!refBtn) return;
    if (refBtn.classList && typeof refBtn.classList.toggle === 'function') {
      refBtn.classList.toggle(CLASSES.OO_WIDGET_DISABLED, disabled);
      refBtn.classList.toggle(CLASSES.OO_WIDGET_ENABLED, !disabled);
    }
    if (typeof refBtn.setAttribute === 'function') {
      refBtn.setAttribute('aria-disabled', String(disabled));
    }
    const link = typeof refBtn.querySelector === 'function' ? refBtn.querySelector('a') : null;
    if (link && typeof link.setAttribute === 'function') {
      link.setAttribute('tabindex', disabled ? '-1' : '0');
      if (disabled) {
        link.setAttribute('aria-disabled', 'true');
      } else if (typeof link.removeAttribute === 'function') {
        link.removeAttribute('aria-disabled');
      }
    }
  }

  /**
   * Identifies the Wikitext and Visual button elements in a button group.
   * @param {HTMLElement|null} group
   * @param {HTMLElement|null} refBtn
   * @returns {{ wikiBtn: HTMLElement|null, visualBtn: HTMLElement|null }}
   */
  function findModeButtons(group, refBtn) {
    if (!group) return { wikiBtn: null, visualBtn: null };
    const children = Array.from(group.children);
    const wikiBtn = children.find(c => {
      if (c === refBtn) return false;
      const text = c.textContent.toLowerCase();
      return text.includes('wiki') || c.querySelector('.oo-ui-icon-wikiText');
    }) || null;
    const visualBtn = children.find(c => {
      if (c === refBtn) return false;
      const text = c.textContent.toLowerCase();
      return text.includes('visu') || c.querySelector('.oo-ui-icon-eye');
    }) || null;
    return { wikiBtn, visualBtn };
  }

  /**
   * Persists the visualeditor-diffmode-historical option across in-memory options and mw.Api.
   * @param {'source'|'visual'} mode
   */
  function saveDiffModeOption(mode) {
    if (typeof window === 'undefined' || !window.mw || !window.mw.user || !window.mw.user.options) return;
    if (window.mw.user.options.get('visualeditor-diffmode-historical') !== mode) {
      window.mw.user.options.set('visualeditor-diffmode-historical', mode);
    }
    if (window.mw.Api && typeof window.mw.user.isAnon === 'function' && !window.mw.user.isAnon()) {
      try {
        new window.mw.Api().saveOption('visualeditor-diffmode-historical', mode);
      } catch (_e) {
        // Silently ignore API saveOption errors
      }
    }
  }

  /**
   * Switches the diff view mode between 'visual', 'wikitext', and 'refdiff'.
   *
   * Architectural Invariants:
   * 1. Wikitext-Only Scope: RefDiff operates strictly on wikitext diffs.
   *    In 'visual' mode, RefDiff remains dormant, does not mutate the DOM, and persists refdiff-active: false.
   * 2. Disabled in Visual Mode: When 'visual' mode is active, the RefDiff button is visually dimmed
   *    and disabled (aria-disabled="true", tabindex="-1"). RefDiff mode cannot be entered directly from
   *    Visual mode; the reviewer switches to 'wikitext' first, then activates RefDiff.
   * 3. Deterministic Persistence: Explicitly choosing 'visual' or 'wikitext' sets refdiff-active: false,
   *    while choosing 'refdiff' sets refdiff-active: true.
   * 4. Non-Interfering Delegation: Native VisualEditor clicks (Visual and Wikitext) bubble in the
   *    standard phase without capture interruption; RefDiff only halts propagation on #refdiff-ooui-btn.
   *
   * @param {'visual'|'wikitext'|'refdiff'} mode
   * @param {HTMLTableElement} [table]
   * @param {boolean} [persist=true] Set to false during passive page initialization
   */
  function selectMode(mode, table, persist) {
    if (typeof persist !== 'boolean') persist = true;
    table = table || (typeof document !== 'undefined' ? document.querySelector(SELECTORS.DIFF_TABLE) : null);
    const widget = getDiffModeWidget();
    const refBtn = typeof document !== 'undefined' ? document.getElementById('refdiff-ooui-btn') : null;
    const group = refBtn ? refBtn.parentElement : null;
    const isSelect = group && group.classList.contains('oo-ui-buttonSelectWidget');
    const { wikiBtn, visualBtn } = findModeButtons(group, refBtn);

    // Fallback mode bar elements
    const btnDecoupled = typeof document !== 'undefined' ? document.getElementById('refdiff-btn-decoupled') : null;
    const btnStandard = typeof document !== 'undefined' ? document.getElementById('refdiff-btn-standard') : null;

    if (mode === 'visual') {
      restoreOriginal(table);
      if (table && typeof table.querySelectorAll === 'function') {
        const bodyRows = getDiffBodyRows(table);
        bodyRows.forEach(r => r.classList.add(CLASSES.HIDDEN));
        notifyBodyUpdate(table);
      }
      setInlineSwitchDisabled(true);
      setRefDiffButtonDisabled(true);
      if (persist) {
        setRefDiffPreferred(false);
        if (widget && typeof widget.findSelectedItem === 'function') {
          const curr = widget.findSelectedItem();
          if (!curr || (typeof curr.getData === 'function' && curr.getData() !== 'visual')) {
            const visItem = (typeof widget.getItemFromData === 'function' ? widget.getItemFromData('visual') : null) ||
                            (widget.items && widget.items.find(i => (typeof i.getData === 'function' ? i.getData() : i.data) === 'visual'));
            if (visItem && typeof widget.chooseItem === 'function') {
              widget.chooseItem(visItem);
            } else if (typeof widget.selectItemByData === 'function') {
              widget.selectItemByData('visual');
            }
          }
        }
        saveDiffModeOption('visual');
      }
      setElementActive(refBtn, false, isSelect);
      setElementActive(wikiBtn, false, isSelect);
      setElementActive(visualBtn, true, isSelect);
      if (btnStandard) btnStandard.classList.remove('active');
      if (btnDecoupled) btnDecoupled.classList.remove('active');
    } else if (mode === 'wikitext') {
      restoreOriginal(table);
      if (table && typeof table.querySelectorAll === 'function') {
        const bodyRows = getDiffBodyRows(table);
        bodyRows.forEach(r => r.classList.remove(CLASSES.HIDDEN));
        notifyBodyUpdate(table);
      }
      setInlineSwitchDisabled(false);
      setRefDiffButtonDisabled(false);
      if (persist) {
        setRefDiffPreferred(false);
        if (widget && typeof widget.findSelectedItem === 'function') {
          const curr = widget.findSelectedItem();
          if (!curr || (typeof curr.getData === 'function' && curr.getData() !== 'source')) {
            const srcItem = (typeof widget.getItemFromData === 'function' ? widget.getItemFromData('source') : null) ||
                            (widget.items && widget.items.find(i => (typeof i.getData === 'function' ? i.getData() : i.data) === 'source'));
            if (srcItem && typeof widget.chooseItem === 'function') {
              widget.chooseItem(srcItem);
            } else if (typeof widget.selectItemByData === 'function') {
              widget.selectItemByData('source');
            }
          }
        }
        saveDiffModeOption('source');
      }
      setElementActive(refBtn, false, isSelect);
      setElementActive(visualBtn, false, isSelect);
      setElementActive(wikiBtn, true, isSelect);
      if (btnStandard) btnStandard.classList.add('active');
      if (btnDecoupled) btnDecoupled.classList.remove('active');
    } else if (mode === 'refdiff') {
      if (refBtn && ((refBtn.classList && typeof refBtn.classList.contains === 'function' && refBtn.classList.contains(CLASSES.OO_WIDGET_DISABLED)) || (typeof refBtn.getAttribute === 'function' && refBtn.getAttribute('aria-disabled') === 'true'))) {
        return;
      }
      if (table && typeof table.querySelectorAll === 'function') {
        const bodyRows = getDiffBodyRows(table);
        bodyRows.forEach(r => r.classList.remove(CLASSES.HIDDEN));
      }
      setInlineSwitchDisabled(true);
      setRefDiffButtonDisabled(false);
      if (persist) {
        saveDiffModeOption('source');
        setRefDiffPreferred(true);
      }
      setElementActive(visualBtn, false, isSelect);
      setElementActive(wikiBtn, false, isSelect);
      setElementActive(refBtn, true, isSelect);
      if (btnDecoupled) btnDecoupled.classList.add('active');
      if (btnStandard) btnStandard.classList.remove('active');
      applyDecoupling(table);
      if (table) {
        notifyBodyUpdate(table);
      }
    }

    // Synchronize Inline modified refs toggle availability with RefDiff mode
    const toggleCheckbox = typeof document !== 'undefined'
      ? (document.getElementById('refdiff-inline-toggle') || document.getElementById('refdiff-decouple-toggle'))
      : null;
    const toggleContainer = typeof document !== 'undefined'
      ? (document.getElementById('refdiff-inline-container') || document.getElementById('refdiff-decouple-container'))
      : null;
    if (toggleCheckbox) {
      toggleCheckbox.disabled = (mode !== 'refdiff');
    }
    if (toggleContainer) {
      if (mode === 'refdiff') {
        toggleContainer.classList.remove(CLASSES.OO_WIDGET_DISABLED);
        toggleContainer.classList.add(CLASSES.OO_WIDGET_ENABLED);
      } else {
        toggleContainer.classList.remove(CLASSES.OO_WIDGET_ENABLED);
        toggleContainer.classList.add(CLASSES.OO_WIDGET_DISABLED);
      }
    }
  }

  /**
   * Synchronizes RefDiff button state with Wikitext and Visual buttons in the diff mode selector.
   * Backward-compatible alias for selectMode.
   * @param {boolean} active
   * @param {HTMLTableElement} [table]
   */
  function updateButtonState(active, table) {
    selectMode(active ? 'refdiff' : 'wikitext', table);
  }
  /* === [END VIRTUAL FILE: src/mode_coordinator.js] === */

  /* ==========================================================================
     VIRTUAL FILE: src/init.js
     Description: Environment and page detection, OOUI mode button injection,
                  fallback mode bar creation, lifecycle wiring, and auto-start.
     ========================================================================== */

  // --- Environment & Page Detection ---

  /**
   * Checks whether the current page is a MediaWiki diff view.
   * @returns {boolean}
   */
  function isDiffPage() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    return !!(
      (window.mw && window.mw.config && (window.mw.config.get('wgDiffNewId') || window.mw.config.get('wgDiffOldId'))) ||
      document.querySelector(SELECTORS.DIFF_TABLE) ||
      document.getElementById('wikiDiff') ||
      /[?&]diff=/.test(location.search) ||
      /\/wiki\/Special:Diff\//.test(location.pathname)
    );
  }

  /**
   * Creates the Inline modified refs toggle checkbox element.
   * Constructed purely with DOM elements via el() (fixes M1).
   * @param {boolean} [isChecked]
   * @returns {HTMLElement|null}
   */
  function createInlineToggle(isChecked) {
    const isInline = typeof isChecked === 'boolean' ? isChecked : isInlineModifiedPreferred();
    const inputAttrs = {
      type: 'checkbox',
      id: 'refdiff-inline-toggle',
      class: 'refdiff-inline-checkbox refdiff-decouple-checkbox'
    };
    if (isInline) {
      inputAttrs.checked = 'checked';
    }
    const input = el('input', inputAttrs);
    if (input && isInline) input.checked = true;

    const label = el('label', { class: 'refdiff-inline-label refdiff-decouple-label' },
      input,
      el('span', { class: 'refdiff-inline-text refdiff-decouple-text' }, 'Inline modified refs')
    );

    return el('span', {
      id: 'refdiff-inline-container',
      class: 'refdiff-inline-container refdiff-decouple-container oo-ui-widget oo-ui-widget-enabled',
      title: 'When checked, keeps modified references inline in prose with a prepended badge instead of decoupling them into separate rows below'
    }, label);
  }

  /**
   * Backward-compatible alias for createInlineToggle.
   * @param {boolean} [isChecked]
   * @returns {HTMLElement|null}
   */
  function createDecoupleToggle(isChecked) {
    return createInlineToggle(isChecked);
  }

  /**
   * Binds the change event listener to the Inline modified refs toggle checkbox.
   * @param {HTMLTableElement} [table]
   */
  function bindInlineToggleListener(table) {
    if (typeof document === 'undefined') return;
    const toggle = document.getElementById('refdiff-inline-toggle') || document.getElementById('refdiff-decouple-toggle');
    if (!toggle || toggle._refdiffBound) return;
    toggle._refdiffBound = true;
    toggle.addEventListener('change', (e) => {
      const isInline = !!e.target.checked;
      setInlineModifiedPreferred(isInline);
      if (isRefDiffPreferred() && !isVisualDiffActive()) {
        const diffTable = table || document.querySelector(SELECTORS.DIFF_TABLE);
        if (diffTable) {
          restoreOriginal(diffTable);
          applyDecoupling(diffTable, { inlineModified: isInline, separateChanged: !isInline });
          notifyBodyUpdate(diffTable);
        }
      }
    });
  }

  /**
   * Backward-compatible alias for bindInlineToggleListener.
   * @param {HTMLTableElement} [table]
   */
  function bindDecoupleToggleListener(table) {
    return bindInlineToggleListener(table);
  }

  /**
   * Creates the OOUI RefDiff button element matching MediaWiki's ButtonOptionWidget.
   * Constructed purely with DOM elements via el() (fixes M1).
   * @param {boolean} isSelect True if part of an OOUI ButtonSelectWidget
   * @param {boolean} [disabled=false] True if button should be initialized in disabled state (e.g. Visual mode)
   * @returns {HTMLElement|null}
   */
  function createRefDiffButton(isSelect, disabled) {
    const baseClasses = isSelect
      ? 'oo-ui-widget oo-ui-labelElement oo-ui-optionWidget oo-ui-buttonElement oo-ui-buttonElement-framed oo-ui-buttonElement-size-medium oo-ui-iconElement oo-ui-buttonOptionWidget'
      : 'oo-ui-widget oo-ui-buttonElement oo-ui-buttonElement-framed oo-ui-buttonElement-size-medium oo-ui-iconElement oo-ui-labelElement oo-ui-buttonWidget';
    const stateClass = disabled ? CLASSES.OO_WIDGET_DISABLED : CLASSES.OO_WIDGET_ENABLED;

    return el(isSelect ? 'div' : 'span', {
      id: 'refdiff-ooui-btn',
      class: `${baseClasses} ${stateClass}`,
      role: isSelect ? 'option' : 'button',
      'aria-disabled': String(!!disabled),
      title: `RefDiff v${VERSION}: Decoupled citation diff view`
    },
      el('a', {
        class: 'oo-ui-buttonElement-button',
        role: 'button',
        tabindex: disabled ? '-1' : '0',
        rel: 'nofollow'
      },
        el('span', { class: 'oo-ui-iconElement-icon oo-ui-icon-diffs' }),
        el('span', { class: 'oo-ui-labelElement-label' }, 'RefDiff'),
        el('span', { class: 'oo-ui-indicatorElement-indicator oo-ui-indicatorElement-noIndicator' })
      )
    );
  }

  /**
   * Creates a fallback mode bar for MediaWiki skins lacking the OOUI diff mode switcher.
   * Constructed purely with DOM elements via el() (fixes M1).
   * @param {boolean} shouldDecouple
   * @param {boolean} [inlineModified]
   * @returns {HTMLDivElement|null}
   */
  function createFallbackModeBar(shouldDecouple, inlineModified) {
    const isInline = typeof inlineModified === 'boolean' ? inlineModified : isInlineModifiedPreferred();
    const inputAttrs = {
      type: 'checkbox',
      id: 'refdiff-inline-toggle',
      class: 'refdiff-inline-checkbox refdiff-decouple-checkbox'
    };
    if (isInline) {
      inputAttrs.checked = 'checked';
    }
    const input = el('input', inputAttrs);
    if (input && isInline) input.checked = true;

    return el('div', { id: 'refdiff-mode-bar', class: 'refdiff-mode-bar' },
      el('span', { id: 'refdiff-inline-container', class: 'refdiff-inline-container refdiff-decouple-container' },
        el('label', { class: 'refdiff-inline-label refdiff-decouple-label' },
          input,
          el('span', { class: 'refdiff-inline-text refdiff-decouple-text' }, 'Inline modified refs')
        )
      ),
      el('span', { class: 'refdiff-mode-separator' }, '•'),
      el('strong', null, 'Diff view:'),
      ' ',
      el('a', {
        href: '#',
        id: 'refdiff-btn-decoupled',
        class: shouldDecouple ? 'active' : '',
        title: `RefDiff v${VERSION}: Decoupled citation diff view`
      }, 'Decoupled (RefDiff)'),
      ' • ',
      el('a', { href: '#', id: 'refdiff-btn-standard', class: shouldDecouple ? '' : 'active' }, 'Standard Wikidiff')
    );
  }

  /**
   * Initializes the RefDiff gadget on the current page.
   */
  function init() {
    if (typeof document === 'undefined') return;
    const table = document.querySelector(SELECTORS.DIFF_TABLE);
    if (!table || document.getElementById('refdiff-ooui-btn') || document.getElementById('refdiff-mode-bar')) return;

    // Inject minimal badge styling
    if (!document.getElementById('refdiff-badge-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'refdiff-badge-styles';
      styleEl.textContent = BADGE_STYLES;
      document.head.appendChild(styleEl);
    }

    const buttonGroup = document.querySelector(SELECTORS.VE_BUTTON_GROUP);
    const diffModeContainer = document.querySelector(SELECTORS.VE_DIFF_CONTAINER);

    // If diffMode container is present but buttonGroup children are not yet populated, retry briefly
    if (!buttonGroup && diffModeContainer && state.initRetries < 5) {
      state.initRetries++;
      setTimeout(init, 100);
      return;
    }

    const isVisual = isVisualDiffActive();
    const shouldDecouple = isRefDiffPreferred();

    if (buttonGroup) {
      if (document.getElementById('refdiff-ooui-btn')) return;

      // 1. Mount Inline modified refs toggle inline before native inline toggle switch if in .mw-diff-table-prefix
      if (!document.getElementById('refdiff-inline-container') && !document.getElementById('refdiff-decouple-container')) {
        const toggleEl = createInlineToggle(isInlineModifiedPreferred());
        const prefix = diffModeContainer && typeof diffModeContainer.closest === 'function' ? diffModeContainer.closest('.mw-diff-table-prefix') : null;
        const inlineContainer = prefix ? prefix.querySelector('.mw-diffPage-inlineToggle-container') : null;
        if (prefix && inlineContainer) {
          prefix.insertBefore(toggleEl, inlineContainer);
        } else if (diffModeContainer && typeof diffModeContainer.insertBefore === 'function') {
          diffModeContainer.insertBefore(toggleEl, buttonGroup);
        } else if (buttonGroup.parentNode && typeof buttonGroup.parentNode.insertBefore === 'function') {
          buttonGroup.parentNode.insertBefore(toggleEl, buttonGroup);
        }
        bindInlineToggleListener(table);
      }

      const isSelect = buttonGroup.classList.contains('oo-ui-buttonSelectWidget');
      const refBtn = createRefDiffButton(isSelect, isVisual);
      buttonGroup.appendChild(refBtn);

      // ONLY activate RefDiff when wikitext is active!
      // If Visual is active, keep Visual mode active and dim/disable RefDiff button.
      if (isVisual) {
        selectMode('visual', table, false);
      } else if (shouldDecouple) {
        selectMode('refdiff', table, false);
      } else {
        selectMode('wikitext', table, false);
      }

      // Delegated click handling on diffModeContainer in capture phase
      if (diffModeContainer && !diffModeContainer._refdiffBound) {
        diffModeContainer._refdiffBound = true;
        diffModeContainer.addEventListener('click', (e) => {
          const btn = e.target.closest('.oo-ui-buttonElement, .oo-ui-buttonWidget, .oo-ui-buttonOptionWidget, [role="button"], [role="option"]');
          if (!btn) return;
          if (btn.id === 'refdiff-ooui-btn' || (typeof btn.closest === 'function' && btn.closest('#refdiff-ooui-btn'))) {
            e.preventDefault();
            e.stopPropagation();
            if ((btn.classList && typeof btn.classList.contains === 'function' && btn.classList.contains(CLASSES.OO_WIDGET_DISABLED)) || (typeof btn.getAttribute === 'function' && btn.getAttribute('aria-disabled') === 'true')) {
              return;
            }
            selectMode('refdiff', table);
          } else if (
            btn.querySelector('.oo-ui-icon-wikiText') ||
            (btn.closest('.oo-ui-buttonOptionWidget') && btn.closest('.oo-ui-buttonOptionWidget').querySelector('.oo-ui-icon-wikiText')) ||
            btn.textContent.toLowerCase().includes('wiki')
          ) {
            selectMode('wikitext', table);
          } else if (
            btn.querySelector('.oo-ui-icon-eye') ||
            (btn.closest('.oo-ui-buttonOptionWidget') && btn.closest('.oo-ui-buttonOptionWidget').querySelector('.oo-ui-icon-eye')) ||
            btn.textContent.toLowerCase().includes('visu')
          ) {
            selectMode('visual', table);
          }
        }, true);

        // Also synchronize with OOUI widget select event if available
        const widget = getDiffModeWidget();
        if (widget && !widget._refdiffBound) {
          widget._refdiffBound = true;
          widget.on('select', (item) => {
            if (!item) return;
            const data = item.getData();
            if (data === 'visual') {
              selectMode('visual', table);
            } else if (data === 'source') {
              selectMode('wikitext', table);
            }
          });
        }

        // Watch for VisualEditor DOM re-renders of the button container
        const ObsClass = (typeof window !== 'undefined' && window.MutationObserver) || (typeof MutationObserver !== 'undefined' ? MutationObserver : null);
        if (ObsClass) {
          const observer = new ObsClass(() => {
            if (!document.getElementById('refdiff-ooui-btn')) {
              init();
            }
          });
          observer.observe(diffModeContainer, { childList: true, subtree: true });
        }
      }
    } else {
      if (document.getElementById('refdiff-mode-bar')) return;
      const modeBar = createFallbackModeBar(shouldDecouple);
      table.parentNode.insertBefore(modeBar, table);
      bindDecoupleToggleListener(table);

      const btnDecoupled = document.getElementById('refdiff-btn-decoupled');
      const btnStandard = document.getElementById('refdiff-btn-standard');

      if (btnStandard) {
        btnStandard.addEventListener('click', (e) => {
          e.preventDefault();
          selectMode('wikitext', table);
        });
      }

      if (btnDecoupled) {
        btnDecoupled.addEventListener('click', (e) => {
          e.preventDefault();
          selectMode('refdiff', table);
        });
      }
    }

    // Apply decoupled transformation if preferred and not in visual diff mode
    if (shouldDecouple && !isVisual) {
      setInlineSwitchDisabled(true);
      applyDecoupling(table);
    } else if (!isVisual) {
      setInlineSwitchDisabled(false);
    }

    // Ensure interoperability with diffedit.js (https://meta.wikimedia.org/wiki/User:Jon_Harald_Søby/diffedit)
    if (table && !table._refdiffDiffeditBound) {
      table._refdiffDiffeditBound = true;
      if (typeof MutationObserver !== 'undefined') {
        const editObserver = new MutationObserver(() => {
          if (table.classList && table.classList.contains('diff-editmode') && state.isDecoupled) {
            selectMode('wikitext', table);
          }
        });
        editObserver.observe(table, { attributes: true, attributeFilter: ['class'] });
      }
      if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('click', (e) => {
          const editBtn = e.target && e.target.closest && e.target.closest('.diffedit-editbutton');
          if (editBtn && state.isDecoupled) {
            selectMode('wikitext', table);
          }
        }, true);
      }
    }
  }

  // --- Auto-start in browser environment ---
  if (typeof window !== 'undefined' && isDiffPage()) {
    if (window.mw && window.mw.hook) {
      window.mw.hook(HOOKS.DIFF_TYPE_SWITCH).add((sw) => {
        state.diffTypeSwitchWidget = sw;
        if (isRefDiffPreferred() && !isVisualDiffActive()) {
          setInlineSwitchDisabled(true);
        }
      });
      window.mw.hook(HOOKS.DIFF_PAGE).add(init);
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 50);
      }
    } else if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
  /* === [END VIRTUAL FILE: src/init.js] === */

  /* ==========================================================================
     VIRTUAL FILE: src/exports.js
     Description: Universal Module Definition (UMD) exports and public API surface.
     ========================================================================== */

  return {
    VERSION,
    STORAGE_KEY,
    STORAGE_KEY_SEPARATE,
    STORAGE_KEY_INLINE,
    MAX_LABEL_LEN,
    SELECTORS,
    CLASSES,
    HOOKS,
    state,
    isRefDiffPreferred,
    setRefDiffPreferred,
    isSeparateChangedPreferred,
    setSeparateChangedPreferred,
    isInlineModifiedPreferred,
    setInlineModifiedPreferred,
    REF_REGEX,
    TEMPLATE_REF_REGEX,
    stripHtml,
    escapeRegex,
    formatBadgeDisplayLabel,
    extractName,
    extractSfnInfo,
    normalizeDiffTags,
    hasBalancedDiffTags,
    hasDeletedCn,
    normalizeCnDiffPair,
    parseRefs,
    pairReferences,
    sanitizeAnchor,
    findCiteNoteAnchor,
    el,
    createProseBadgeElement,
    createProseBadge,
    createCitRow,
    captureRowSnapshot,
    restoreRowSnapshot,
    transformProseCells,
    applyDecoupling,
    restoreOriginal,
    getDiffBodyRows,
    notifyBodyUpdate,
    isDiffPage,
    isVisualDiffActive,
    selectMode,
    updateButtonState,
    setInlineSwitchDisabled,
    replaceRefInHtml,
    createRefDiffButton,
    createFallbackModeBar,
    createInlineToggle,
    bindInlineToggleListener,
    createDecoupleToggle,
    bindDecoupleToggleListener,
    onTableClick,
    parseTemplateList,
    showBadgePreview,
    hideBadgePreview,
    getOrCreatePreviewCard,
    init
  };
  /* === [END VIRTUAL FILE: src/exports.js] === */
});

/* </nowiki> */
