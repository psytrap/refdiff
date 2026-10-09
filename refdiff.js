// ==UserScript==
// @name         RefDiff
// @namespace    https://github.com/m-k/einzelnachweise
// @version      1.1.0
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
 */

(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    root.RefDiff = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // --- Constants & Enums ---

  /**
   * Matches HTML-escaped wikitext <ref> tags as output by MediaWiki's diff engine.
   * Handles self-closing tags and opening/closing tags with attributes containing HTML entities.
   */
  const REF_REGEX = /&lt;ref\b((?:(?!&gt;|\/&gt;)[\s\S])*?)(?:\/&gt;|&gt;([\s\S]*?)&lt;\/ref&gt;)/gi;

  const STORAGE_KEY = 'refdiff-active';

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
    VE_OPTION_WIDGET: '.ve-init-mw-diffPage-diffMode .oo-ui-optionWidget',
    VE_DIFF_ELEMENT: '.ve-ui-diffElement, .ve-init-mw-diffPage-diff',
    VE_VISUAL_BUTTON: '.ve-init-mw-diffPage-diffMode .oo-ui-buttonOptionWidget:first-child',
    REFDIFF_BTN_OOUI: '#refdiff-ooui-btn',
    REFDIFF_MODE_BAR: '#refdiff-mode-bar',
    REFDIFF_BTN_DECOUPLED: '#refdiff-btn-decoupled',
    REFDIFF_BTN_STANDARD: '#refdiff-btn-standard',
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
    DIFF_CONTEXT: 'diff-context',
    DELETED_LINE: 'diff-deletedline',
    ADDED_LINE: 'diff-addedline',
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
    .ref-badge {
      font-weight: normal;
      color: #72777d;
      color: var(--color-subtle, #72777d);
      cursor: default;
    }
    .ref-badge-mod {
      font-weight: bold;
      color: #9a6700;
      background: rgba(255, 215, 0, 0.25);
      border-radius: 2px;
      padding: 0 3px;
      cursor: help;
    }
    .ref-badge-add {
      font-weight: bold;
      color: #14866d;
      background: rgba(0, 175, 137, 0.2);
      border-radius: 2px;
      padding: 0 3px;
      cursor: help;
      text-decoration: none;
    }
    .ref-badge-del {
      font-weight: bold;
      color: #b32424;
      background: rgba(211, 51, 51, 0.2);
      border-radius: 2px;
      padding: 0 3px;
      cursor: help;
      text-decoration: line-through;
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
    /* Ensure citation diff rows and hidden rows are never visible when Visual diff is active */
    .ve-init-mw-diffPage-diff ~ table.diff .refdiff-cit-row,
    .ve-ui-diffElement ~ table.diff .refdiff-cit-row,
    body.ve-diff-visual table.diff .refdiff-cit-row,
    tr.oo-ui-element-hidden + tr.refdiff-cit-row,
    .refdiff-cit-row.oo-ui-element-hidden,
    table.diff tr.oo-ui-element-hidden {
      display: none !important;
    }
  `;

  // --- State Management ---

  /**
   * Internal state encapsulation for RefDiff lifecycle.
   * Uses Memento pattern for modified DOM rows to keep native MediaWiki closures attached.
   */
  const state = {
    origTableHtml: null,
    isDecoupled: false,
    initRetries: 0,
    diffTypeSwitchWidget: null,
    modifiedRows: []
  };

  // --- String & Parsing Utilities ---

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
   * Extracts the reference name attribute from a tag attributes string.
   * @param {string} [attrsStr]
   * @returns {string|null}
   */
  function extractName(attrsStr) {
    if (!attrsStr) return null;
    const clean = stripHtml(attrsStr);
    const m = clean.match(/name\s*=\s*(?:&quot;|["']|&apos;)(.*?)(?:&quot;|["']|&apos;)|name\s*=\s*([^\s"'>&]+)/i);
    return m ? (m[1] || m[2]).trim() : null;
  }

  /**
   * Parses all HTML-escaped <ref> tags from a diff table cell HTML string.
   * @param {string} [html]
   * @returns {Array<{ raw: string, attrs: string, content: string|undefined, hasChange: boolean }>}
   */
  function parseRefs(html) {
    if (!html) return [];
    const refs = [];
    let m;
    REF_REGEX.lastIndex = 0;
    while ((m = REF_REGEX.exec(html)) !== null) {
      const hasChange = m[0].includes(CLASSES.DIFFCHANGE);
      refs.push({ raw: m[0], attrs: m[1], content: m[2], hasChange });
    }
    return refs;
  }

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
      const dName = extractName(d.attrs);
      if (!dName) continue;
      for (let j = 0; j < addRefs.length; j++) {
        if (matchedAdd.has(j)) continue;
        const a = addRefs[j];
        const aName = extractName(a.attrs);
        if (aName && aName.toLowerCase() === dName.toLowerCase()) {
          matchedDel.add(i);
          matchedAdd.add(j);
          pairs.push({ d, a, name: dName });
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
          pairs.push({ d, a, name: extractName(d.attrs) || extractName(a.attrs) });
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
      pairs.push({ d, a, name: extractName(d.attrs) || extractName(a.attrs) });
    }

    for (let k = commonCount; k < remainingDel.length; k++) {
      pairs.push({ d: remainingDel[k], a: null, name: extractName(remainingDel[k].attrs) });
    }

    for (let k = commonCount; k < remainingAdd.length; k++) {
      pairs.push({ d: null, a: remainingAdd[k], name: extractName(remainingAdd[k].attrs) });
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

  // --- Badge & DOM Creation Helpers ---

  /**
   * Replaces raw reference wikitext with a badge, stripping surrounding diffchange wrappers if present.
   * @param {string} html
   * @param {string} rawRef
   * @param {string} badgeHtml
   * @returns {string}
   */
  function replaceRefInHtml(html, rawRef, badgeHtml) {
    if (!html || !rawRef) return html;
    const escaped = escapeRegex(rawRef);
    const diffchangeWrapper = new RegExp('<(ins|del)[^>]*class="[^"]*diffchange[^"]*"[^>]*>\\s*' + escaped + '\\s*<\\/\\1>', 'i');
    if (diffchangeWrapper.test(html)) {
      return html.replace(diffchangeWrapper, badgeHtml);
    }
    return html.replace(rawRef, badgeHtml);
  }

  /**
   * Generates inline prose badge HTML.
   * @param {'mod'|'add'|'del'|'norm'} type
   * @param {string} label
   * @returns {string}
   */
  function createProseBadge(type, label) {
    switch (type) {
      case 'mod':
        return `<span class="${CLASSES.BADGE_MOD}" title="Citation metadata modified: ⟨~${label}~⟩">⟨~${label}~⟩</span>`;
      case 'add':
        return `<span class="${CLASSES.BADGE_ADD}" title="Added citation: ⟨+${label}+⟩">⟨+${label}+⟩</span>`;
      case 'del':
        return `<span class="${CLASSES.BADGE_DEL}" title="Removed citation: ⟨-${label}-⟩">⟨-${label}-⟩</span>`;
      default:
        return `<span class="${CLASSES.BADGE}" title="Citation: ⟨${label}⟩">⟨${label}⟩</span>`;
    }
  }

  /**
   * Creates a decoupled citation diff table row (`<tr>`).
   * @param {Object} mc Modified citation model
   * @param {string} mc.label Badge label
   * @param {string} mc.oldRaw Previous raw reference wikitext
   * @param {string} mc.newRaw Updated raw reference wikitext
   * @param {boolean} [mc.isAdd] True if citation was purely added
   * @param {boolean} [mc.isDel] True if citation was purely deleted
   * @returns {HTMLTableRowElement}
   */
  function createCitRow(mc) {
    const citRow = document.createElement('tr');
    citRow.className = CLASSES.CIT_ROW;

    let delPrefix = '';
    let addPrefix = '';
    let delContent = mc.oldRaw;
    let addContent = mc.newRaw;

    if (mc.isAdd) {
      addPrefix = `<span class="${CLASSES.BADGE_ADD}" title="Added citation">⟨+${mc.label}+⟩</span> `;
      if (addContent && !addContent.includes(CLASSES.DIFFCHANGE)) {
        addContent = `<ins class="${CLASSES.DIFFCHANGE} ${CLASSES.DIFFCHANGE_INLINE}">${addContent}</ins>`;
      }
    } else if (mc.isDel) {
      delPrefix = `<span class="${CLASSES.BADGE_DEL}" title="Removed citation">⟨-${mc.label}-⟩</span> `;
      if (delContent && !delContent.includes(CLASSES.DIFFCHANGE)) {
        delContent = `<del class="${CLASSES.DIFFCHANGE} ${CLASSES.DIFFCHANGE_INLINE}">${delContent}</del>`;
      }
    } else {
      const modBadge = `<span class="${CLASSES.BADGE_MOD}" title="Citation metadata modified">⟨~${mc.label}~⟩</span> `;
      delPrefix = modBadge;
      addPrefix = modBadge;
    }

    citRow.innerHTML = `
      <td class="diff-marker" data-marker="${mc.isAdd ? '' : '−'}"></td>
      <td class="${mc.isAdd ? CLASSES.DIFF_CONTEXT : `${CLASSES.DELETED_LINE} ${CLASSES.DIFF_SIDE_DELETED}`}"><div>${delPrefix}${delContent}</div></td>
      <td class="diff-marker" data-marker="${mc.isDel ? '' : '+'}"></td>
      <td class="${mc.isDel ? CLASSES.DIFF_CONTEXT : `${CLASSES.ADDED_LINE} ${CLASSES.DIFF_SIDE_ADDED}`}"><div>${addPrefix}${addContent}</div></td>
    `;
    return citRow;
  }

  // --- Row Snapshot & Memento Pattern ---

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
          mkInfo.el.setAttribute('data-marker', mkInfo.marker);
        } else {
          mkInfo.el.removeAttribute('data-marker');
        }
      }
    }
  }

  // --- Core Decoupling Transformation Pipeline ---

  /**
   * Transforms prose cell HTML by replacing raw references with badges and extracting modified citations.
   * @param {string} initialDelHtml
   * @param {string} initialAddHtml
   * @param {Array<Object>} pairs
   * @param {number} startCounter
   * @returns {{ newDelHtml: string, newAddHtml: string, modifiedCits: Array<Object>, nextCounter: number }}
   */
  function transformProseCells(initialDelHtml, initialAddHtml, pairs, startCounter) {
    let citCounter = startCounter;
    const modifiedCits = [];
    let newDelHtml = initialDelHtml;
    let newAddHtml = initialAddHtml;

    for (const pair of pairs) {
      const d = pair.d;
      const a = pair.a;
      const label = pair.name || `ref${citCounter++}`;

      if (d && a) {
        const isMod = a.hasChange || (stripHtml(d.raw) !== stripHtml(a.raw));
        if (isMod) {
          modifiedCits.push({ label, oldRaw: d.raw, newRaw: a.raw });
          const badge = createProseBadge('mod', label);
          newDelHtml = replaceRefInHtml(newDelHtml, d.raw, badge);
          newAddHtml = replaceRefInHtml(newAddHtml, a.raw, badge);
        } else {
          const badge = createProseBadge('norm', label);
          newDelHtml = replaceRefInHtml(newDelHtml, d.raw, badge);
          newAddHtml = replaceRefInHtml(newAddHtml, a.raw, badge);
        }
      } else if (a && !d) {
        const badge = createProseBadge('add', label);
        newAddHtml = replaceRefInHtml(newAddHtml, a.raw, badge);
        modifiedCits.push({ label, oldRaw: '', newRaw: a.raw, isAdd: true });
      } else if (d && !a) {
        const badge = createProseBadge('del', label);
        newDelHtml = replaceRefInHtml(newDelHtml, d.raw, badge);
        modifiedCits.push({ label, oldRaw: d.raw, newRaw: '', isDel: true });
      }
    }

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
   */
  function applyDecoupling(table) {
    if (!table || typeof table.querySelectorAll !== 'function' || state.isDecoupled) return;

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

      const delRefs = parseRefs(delDiv ? delDiv.innerHTML : '');
      const addRefs = parseRefs(addDiv ? addDiv.innerHTML : '');
      if (delRefs.length === 0 && addRefs.length === 0) continue;

      // 1. Capture snapshot before mutation
      state.modifiedRows.push(captureRowSnapshot(row));

      // 2. Pair references and transform prose
      const pairs = pairReferences(delRefs, addRefs);
      const { newDelHtml, newAddHtml, modifiedCits, nextCounter } = transformProseCells(
        delDiv ? delDiv.innerHTML : '',
        addDiv ? addDiv.innerHTML : '',
        pairs,
        citCounter
      );
      citCounter = nextCounter;

      // 3. Mutate prose row DOM
      if (delDiv) delDiv.innerHTML = newDelHtml;
      if (addDiv) addDiv.innerHTML = newAddHtml;
      if (delDiv && addDiv) {
        updateProseRowAppearance(row, newDelHtml, newAddHtml);
      }

      // 4. Insert citation diff rows
      insertCitationRows(row, modifiedCits);
    }

    state.isDecoupled = true;
    notifyBodyUpdate(table);
  }

  /**
   * Restores the diff table to its original native MediaWiki HTML in-place.
   * Ensures closures in inlineFormatToggle.js and VisualEditor stay bound to live DOM nodes.
   * @param {HTMLTableElement} table
   */
  function restoreOriginal(table) {
    if (!table || !state.isDecoupled) return;

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

  // --- DOM Query & Synchronization Helpers ---

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
   * @param {HTMLTableElement} table
   */
  function notifyBodyUpdate(table) {
    if (!table) return;
    if (typeof window !== 'undefined' && window.mw && window.mw.hook) {
      const $ = window.$ || window.jQuery;
      if ($) {
        const bodyRows = getDiffBodyRows(table);
        window.mw.hook(HOOKS.BODY_UPDATE).fire($(bodyRows));
      }
    }
  }

  // --- UI State & Persistence ---

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
      if (optWidget && typeof optWidget.getElementGroup === 'function') {
        return optWidget.getElementGroup();
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
    const veDiff = document.querySelector(SELECTORS.VE_DIFF_ELEMENT);
    if (veDiff && veDiff.offsetParent !== null) return true;
    const visualBtn = document.querySelector(SELECTORS.VE_VISUAL_BUTTON);
    if (visualBtn && (visualBtn.classList.contains(CLASSES.OO_OPTION_SELECTED) || visualBtn.getAttribute('aria-selected') === 'true')) {
      return true;
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
   * Switches the diff view mode between 'visual', 'wikitext', and 'refdiff'.
   * @param {'visual'|'wikitext'|'refdiff'} mode
   * @param {HTMLTableElement} [table]
   */
  function selectMode(mode, table) {
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
      if (widget && widget.findSelectedItem && widget.findSelectedItem() && widget.findSelectedItem().getData() !== 'visual') {
        widget.selectItemByData('visual');
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
      setRefDiffPreferred(false);
      setInlineSwitchDisabled(false);
      if (widget && widget.findSelectedItem && widget.findSelectedItem() && widget.findSelectedItem().getData() !== 'source') {
        widget.selectItemByData('source');
      }
      setElementActive(refBtn, false, isSelect);
      setElementActive(visualBtn, false, isSelect);
      setElementActive(wikiBtn, true, isSelect);
      if (btnStandard) btnStandard.classList.add('active');
      if (btnDecoupled) btnDecoupled.classList.remove('active');
    } else if (mode === 'refdiff') {
      if (table && typeof table.querySelectorAll === 'function') {
        const bodyRows = getDiffBodyRows(table);
        bodyRows.forEach(r => r.classList.remove(CLASSES.HIDDEN));
      }
      if (isVisualDiffActive()) {
        if (widget) {
          widget.selectItemByData('source');
        } else if (wikiBtn) {
          wikiBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }
      }
      setRefDiffPreferred(true);
      setInlineSwitchDisabled(true);
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

  // --- Initialization & UI Wiring ---

  /**
   * Creates the OOUI RefDiff button element matching MediaWiki's ButtonOptionWidget.
   * @param {boolean} isSelect True if part of an OOUI ButtonSelectWidget
   * @returns {HTMLElement}
   */
  function createRefDiffButton(isSelect) {
    const refBtn = document.createElement(isSelect ? 'div' : 'span');
    refBtn.id = 'refdiff-ooui-btn';
    refBtn.className = isSelect
      ? 'oo-ui-widget oo-ui-widget-enabled oo-ui-labelElement oo-ui-optionWidget oo-ui-buttonElement oo-ui-buttonElement-framed oo-ui-buttonElement-size-medium oo-ui-iconElement oo-ui-buttonOptionWidget'
      : 'oo-ui-widget oo-ui-widget-enabled oo-ui-buttonElement oo-ui-buttonElement-framed oo-ui-buttonElement-size-medium oo-ui-iconElement oo-ui-labelElement oo-ui-buttonWidget';
    refBtn.setAttribute('role', isSelect ? 'option' : 'button');
    refBtn.setAttribute('title', 'RefDiff: Decoupled citation diff view');
    refBtn.innerHTML = `
      <a class="oo-ui-buttonElement-button" role="button" tabindex="0" rel="nofollow">
        <span class="oo-ui-iconElement-icon oo-ui-icon-diffs"></span>
        <span class="oo-ui-labelElement-label">RefDiff</span>
        <span class="oo-ui-indicatorElement-indicator oo-ui-indicatorElement-noIndicator"></span>
      </a>
    `;
    return refBtn;
  }

  /**
   * Creates a fallback mode bar for MediaWiki skins lacking the OOUI diff mode switcher.
   * @param {boolean} shouldDecouple
   * @returns {HTMLDivElement}
   */
  function createFallbackModeBar(shouldDecouple) {
    const modeBar = document.createElement('div');
    modeBar.id = 'refdiff-mode-bar';
    modeBar.className = 'refdiff-mode-bar';
    modeBar.innerHTML = `
      <strong>Diff view:</strong>
      <a href="#" id="refdiff-btn-decoupled" class="${shouldDecouple ? 'active' : ''}">Decoupled (RefDiff)</a> &bull;
      <a href="#" id="refdiff-btn-standard" class="${shouldDecouple ? '' : 'active'}">Standard Wikidiff</a>
    `;
    return modeBar;
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
    const shouldDecouple = isVisual ? false : isRefDiffPreferred();

    if (buttonGroup) {
      if (document.getElementById('refdiff-ooui-btn')) return;

      const isSelect = buttonGroup.classList.contains('oo-ui-buttonSelectWidget');
      const refBtn = createRefDiffButton(isSelect);
      buttonGroup.appendChild(refBtn);

      // Initialize button states according to user preference and initial view
      if (isVisual) {
        setElementActive(refBtn, false, isSelect);
      } else {
        selectMode(shouldDecouple ? 'refdiff' : 'wikitext', table);
      }

      // Delegated click handling on diffModeContainer with capture phase
      if (diffModeContainer && !diffModeContainer._refdiffBound) {
        diffModeContainer._refdiffBound = true;
        diffModeContainer.addEventListener('click', (e) => {
          const btn = e.target.closest('.oo-ui-buttonElement, .oo-ui-buttonWidget, .oo-ui-buttonOptionWidget, [role="button"], [role="option"]');
          if (!btn) return;
          if (btn.id === 'refdiff-ooui-btn' || btn.closest('#refdiff-ooui-btn')) {
            e.preventDefault();
            e.stopPropagation();
            selectMode('refdiff', table);
          } else if (
            btn.querySelector('.oo-ui-icon-wikiText') ||
            btn.textContent.toLowerCase().includes('wiki')
          ) {
            selectMode('wikitext', table);
          } else if (
            btn.querySelector('.oo-ui-icon-eye') ||
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
            } else if (data === 'source' && !isRefDiffPreferred()) {
              selectMode('wikitext', table);
            }
          });
        }

        // Watch for VisualEditor DOM re-renders of the button container
        const observer = new MutationObserver(() => {
          if (!document.getElementById('refdiff-ooui-btn')) {
            init();
          }
        });
        observer.observe(diffModeContainer, { childList: true, subtree: true });
      }
    } else {
      if (document.getElementById('refdiff-mode-bar')) return;
      const modeBar = createFallbackModeBar(shouldDecouple);
      table.parentNode.insertBefore(modeBar, table);

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

  return {
    STORAGE_KEY,
    SELECTORS,
    CLASSES,
    HOOKS,
    state,
    isRefDiffPreferred,
    setRefDiffPreferred,
    REF_REGEX,
    stripHtml,
    escapeRegex,
    extractName,
    parseRefs,
    pairReferences,
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
    init
  };
});
