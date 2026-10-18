  /* ==========================================================================
     VIRTUAL FILE: src/constants.js
     Description: Centralized regex patterns, storage keys, DOM selectors,
                  CSS classes, MediaWiki hook names, and inline badge styles.
     ========================================================================== */

  /**
   * Current RefDiff semantic version.
   */
  const VERSION = '1.5.6';

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
