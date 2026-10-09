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
    factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // --- Constants & Styles ---

  /**
   * Matches HTML-escaped wikitext <ref> tags as output by MediaWiki's diff engine.
   * Handles self-closing tags and opening/closing tags with attributes containing HTML entities.
   */
  const REF_REGEX = /&lt;ref\b((?:(?!&gt;|\/&gt;)[\s\S])*?)(?:\/&gt;|&gt;([\s\S]*?)&lt;\/ref&gt;)/gi;

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
    /* Ensure citation diff rows are never visible when Visual diff is active */
    .ve-init-mw-diffPage-diff ~ table.diff .refdiff-cit-row,
    .ve-ui-diffElement ~ table.diff .refdiff-cit-row,
    body.ve-diff-visual table.diff .refdiff-cit-row,
    tr.oo-ui-element-hidden + tr.refdiff-cit-row,
    .refdiff-cit-row.oo-ui-element-hidden {
      display: none !important;
    }
  `;

  // --- State ---

  let origTableHtml = null;
  let isDecoupled = false;
  let initRetries = 0;

  // --- String & Parsing Utilities ---

  /**
   * Strips HTML tags and trims leading/trailing whitespace.
   * @param {string} [str]
   * @returns {string}
   */
  const stripHtml = (str) => (str ? str.replace(/<[^>]+>/g, '').trim() : '');

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
      const hasChange = m[0].includes('diffchange');
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

    const cleanContent = (r) => {
      if (!r) return '';
      return stripHtml(r.content || r.raw);
    };

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

  // --- DOM Helpers ---

  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
        return `<span class="ref-badge-mod" title="Citation metadata modified: ⟨~${label}~⟩">⟨~${label}~⟩</span>`;
      case 'add':
        return `<span class="ref-badge-add" title="Added citation: ⟨+${label}+⟩">⟨+${label}+⟩</span>`;
      case 'del':
        return `<span class="ref-badge-del" title="Removed citation: ⟨-${label}-⟩">⟨-${label}-⟩</span>`;
      default:
        return `<span class="ref-badge" title="Citation: ⟨${label}⟩">⟨${label}⟩</span>`;
    }
  }

  /**
   * Creates a decoupled citation diff table row (`<tr>`).
   * @param {Object} mc
   * @returns {HTMLTableRowElement}
   */
  function createCitRow(mc) {
    const citRow = document.createElement('tr');
    citRow.className = 'refdiff-cit-row';

    let delPrefix = '';
    let addPrefix = '';
    let delContent = mc.oldRaw;
    let addContent = mc.newRaw;

    if (mc.isAdd) {
      addPrefix = `<span class="ref-badge-add" title="Added citation">⟨+${mc.label}+⟩</span> `;
      if (addContent && !addContent.includes('diffchange')) {
        addContent = `<ins class="diffchange diffchange-inline">${addContent}</ins>`;
      }
    } else if (mc.isDel) {
      delPrefix = `<span class="ref-badge-del" title="Removed citation">⟨-${mc.label}-⟩</span> `;
      if (delContent && !delContent.includes('diffchange')) {
        delContent = `<del class="diffchange diffchange-inline">${delContent}</del>`;
      }
    } else {
      const modBadge = `<span class="ref-badge-mod" title="Citation metadata modified">⟨~${mc.label}~⟩</span> `;
      delPrefix = modBadge;
      addPrefix = modBadge;
    }

    citRow.innerHTML = `
      <td class="diff-marker" data-marker="${mc.isAdd ? '' : '−'}"></td>
      <td class="${mc.isAdd ? 'diff-context' : 'diff-deletedline diff-side-deleted'}"><div>${delPrefix}${delContent}</div></td>
      <td class="diff-marker" data-marker="${mc.isDel ? '' : '+'}"></td>
      <td class="${mc.isDel ? 'diff-context' : 'diff-addedline diff-side-added'}"><div>${addPrefix}${addContent}</div></td>
    `;
    return citRow;
  }

  // --- UI State & Persistence ---

  const STORAGE_KEY = 'refdiff-active';

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
    el.classList.toggle('oo-ui-buttonElement-active', active);
    if (isSelect) {
      el.classList.toggle('oo-ui-optionWidget-selected', active);
      el.setAttribute('aria-selected', String(active));
    }
    const icon = el.querySelector('.oo-ui-iconElement-icon');
    if (icon) {
      icon.classList.toggle('oo-ui-image-invert', active);
    }
  }

  /**
   * Helper to retrieve the OOUI ButtonSelectWidget instance for diff mode, if present.
   * @returns {Object|null}
   */
  function getDiffModeWidget() {
    if (typeof document === 'undefined') return null;
    const opt = document.querySelector('.ve-init-mw-diffPage-diffMode .oo-ui-optionWidget');
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
    const veDiff = document.querySelector('.ve-ui-diffElement, .ve-init-mw-diffPage-diff');
    if (veDiff && veDiff.offsetParent !== null) return true;
    const visualBtn = document.querySelector('.ve-init-mw-diffPage-diffMode .oo-ui-buttonOptionWidget:first-child');
    if (visualBtn && (visualBtn.classList.contains('oo-ui-optionWidget-selected') || visualBtn.getAttribute('aria-selected') === 'true')) {
      return true;
    }
    return false;
  }

  /**
   * Switches the diff view mode between 'visual', 'wikitext', and 'refdiff'.
   * @param {'visual'|'wikitext'|'refdiff'} mode
   * @param {HTMLTableElement} [table]
   */
  function selectMode(mode, table) {
    table = table || (typeof document !== 'undefined' ? document.querySelector('table.diff') : null);
    const widget = getDiffModeWidget();
    const refBtn = typeof document !== 'undefined' ? document.getElementById('refdiff-ooui-btn') : null;
    const group = refBtn ? refBtn.parentElement : null;
    const currentWiki = group ? Array.from(group.children).find(c => c.textContent.includes('Wikitext')) : null;
    const currentVisual = group ? Array.from(group.children).find(c => c.textContent.includes('Visual')) : null;
    const isSelect = group && group.classList.contains('oo-ui-buttonSelectWidget');

    // Fallback mode bar elements
    const btnDecoupled = typeof document !== 'undefined' ? document.getElementById('refdiff-btn-decoupled') : null;
    const btnStandard = typeof document !== 'undefined' ? document.getElementById('refdiff-btn-standard') : null;

    if (mode === 'visual') {
      restoreOriginal(table);
      if (widget && widget.findSelectedItem && widget.findSelectedItem() && widget.findSelectedItem().getData() !== 'visual') {
        widget.selectItemByData('visual');
      }
      setElementActive(refBtn, false, isSelect);
      setElementActive(currentWiki, false, isSelect);
      setElementActive(currentVisual, true, isSelect);
      if (btnStandard) btnStandard.classList.remove('active');
      if (btnDecoupled) btnDecoupled.classList.remove('active');
    } else if (mode === 'wikitext') {
      restoreOriginal(table);
      setRefDiffPreferred(false);
      if (widget && widget.findSelectedItem && widget.findSelectedItem() && widget.findSelectedItem().getData() !== 'source') {
        widget.selectItemByData('source');
      }
      setElementActive(refBtn, false, isSelect);
      setElementActive(currentVisual, false, isSelect);
      setElementActive(currentWiki, true, isSelect);
      if (btnStandard) btnStandard.classList.add('active');
      if (btnDecoupled) btnDecoupled.classList.remove('active');
    } else if (mode === 'refdiff') {
      if (isVisualDiffActive()) {
        if (widget) {
          widget.selectItemByData('source');
        } else if (currentWiki) {
          currentWiki.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }
      }
      setRefDiffPreferred(true);
      setElementActive(currentVisual, false, isSelect);
      setElementActive(currentWiki, false, isSelect);
      setElementActive(refBtn, true, isSelect);
      if (btnDecoupled) btnDecoupled.classList.add('active');
      if (btnStandard) btnStandard.classList.remove('active');
      applyDecoupling(table);
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

  // --- Core Decoupling Transformation ---

  /**
   * Applies the decoupled citation diff view to a MediaWiki diff table.
   * @param {HTMLTableElement} table
   */
  function applyDecoupling(table) {
    if (!table || typeof table.querySelectorAll !== 'function' || isDecoupled) return;

    if (!origTableHtml) {
      origTableHtml = table.innerHTML;
    }

    const changeRows = Array.from(table.querySelectorAll('tr')).filter(
      r => r.querySelector('.diff-deletedline, .diff-addedline') && !r.classList.contains('refdiff-cit-row')
    );

    let citCounter = 1;

    for (const row of changeRows) {
      const delDiv = row.querySelector('.diff-deletedline div');
      const addDiv = row.querySelector('.diff-addedline div');
      if (!delDiv && !addDiv) continue;

      const delRefs = parseRefs(delDiv ? delDiv.innerHTML : '');
      const addRefs = parseRefs(addDiv ? addDiv.innerHTML : '');

      if (delRefs.length === 0 && addRefs.length === 0) continue;

      const pairs = pairReferences(delRefs, addRefs);
      const modifiedCits = [];
      let newDelHtml = delDiv ? delDiv.innerHTML : '';
      let newAddHtml = addDiv ? addDiv.innerHTML : '';

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

      if (delDiv) delDiv.innerHTML = newDelHtml;
      if (addDiv) addDiv.innerHTML = newAddHtml;

      // If no remaining diffchanges in prose, convert line to context appearance
      if (delDiv && addDiv) {
        const hasProseChanges = newDelHtml.includes('diffchange') || newAddHtml.includes('diffchange');
        if (!hasProseChanges) {
          const delTd = row.querySelector('.diff-deletedline');
          const addTd = row.querySelector('.diff-addedline');
          if (delTd) delTd.className = 'diff-context diff-side-deleted';
          if (addTd) addTd.className = 'diff-context diff-side-added';
          const markers = row.querySelectorAll('.diff-marker');
          markers.forEach(mk => mk.removeAttribute('data-marker'));
        }
      }

      // Insert citation diff rows directly below this prose row
      let prevRow = row;
      for (const mc of modifiedCits) {
        const citRow = createCitRow(mc);
        prevRow.parentNode.insertBefore(citRow, prevRow.nextSibling);
        prevRow = citRow;
      }
    }

    isDecoupled = true;
  }

  /**
   * Restores the diff table to its original native MediaWiki HTML.
   * @param {HTMLTableElement} table
   */
  function restoreOriginal(table) {
    if (!table || !origTableHtml || !isDecoupled) return;
    table.innerHTML = origTableHtml;
    isDecoupled = false;
  }

  // --- Environment & Page Detection ---

  /**
   * Checks whether the current page is a MediaWiki diff view.
   * @returns {boolean}
   */
  function isDiffPage() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    return !!(
      (window.mw && (mw.config.get('wgDiffNewId') || mw.config.get('wgDiffOldId'))) ||
      document.querySelector('table.diff') ||
      document.getElementById('wikiDiff') ||
      /[?&]diff=/.test(location.search) ||
      /\/wiki\/Special:Diff\//.test(location.pathname)
    );
  }

  // --- Initialization & UI Wiring ---

  /**
   * Initializes the RefDiff gadget on the current page.
   */
  function init() {
    if (typeof document === 'undefined') return;
    const table = document.querySelector('table.diff');
    if (!table || document.getElementById('refdiff-ooui-btn') || document.getElementById('refdiff-mode-bar')) return;

    // Inject minimal badge styling
    if (!document.getElementById('refdiff-badge-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'refdiff-badge-styles';
      styleEl.textContent = BADGE_STYLES;
      document.head.appendChild(styleEl);
    }

    const buttonGroup = document.querySelector(
      '.ve-init-mw-diffPage-diffMode .oo-ui-buttonGroupWidget, ' +
      '.ve-init-mw-diffPage-diffMode .oo-ui-buttonSelectWidget, ' +
      '.ve-init-mw-diffPage-diffMode > *'
    );

    // If diffMode container is present but buttonGroup children are not yet populated, retry briefly
    const diffModeContainer = document.querySelector('.ve-init-mw-diffPage-diffMode');
    if (!buttonGroup && diffModeContainer && initRetries < 5) {
      initRetries++;
      setTimeout(init, 100);
      return;
    }

    const isVisual = isVisualDiffActive();
    const shouldDecouple = isVisual ? false : isRefDiffPreferred();

    if (buttonGroup) {
      if (document.getElementById('refdiff-ooui-btn')) return;

      const isSelect = buttonGroup.classList.contains('oo-ui-buttonSelectWidget');

      // Create native OOUI RefDiff button
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
          } else if (btn.textContent.includes('Wikitext')) {
            selectMode('wikitext', table);
          } else if (btn.textContent.includes('Visual')) {
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
      // Fallback mode switcher bar for skins without OOUI diff-mode switcher
      const modeBar = document.createElement('div');
      modeBar.id = 'refdiff-mode-bar';
      modeBar.className = 'refdiff-mode-bar';
      modeBar.innerHTML = `
        <strong>Diff view:</strong>
        <a href="#" id="refdiff-btn-decoupled" class="${shouldDecouple ? 'active' : ''}">Decoupled (RefDiff)</a> &bull;
        <a href="#" id="refdiff-btn-standard" class="${shouldDecouple ? '' : 'active'}">Standard Wikidiff</a>
      `;
      table.parentNode.insertBefore(modeBar, table);

      const btnDecoupled = document.getElementById('refdiff-btn-decoupled');
      const btnStandard = document.getElementById('refdiff-btn-standard');

      btnStandard.addEventListener('click', (e) => {
        e.preventDefault();
        selectMode('wikitext', table);
      });

      btnDecoupled.addEventListener('click', (e) => {
        e.preventDefault();
        selectMode('refdiff', table);
      });
    }

    // Apply decoupled transformation if preferred and not in visual diff mode
    if (shouldDecouple && !isVisual) {
      applyDecoupling(table);
    }
  }

  // --- Auto-start in browser environment ---
  if (typeof window !== 'undefined' && isDiffPage()) {
    if (window.mw && mw.hook) {
      mw.hook('wikipage.diff').add(init);
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
    isRefDiffPreferred,
    setRefDiffPreferred,
    REF_REGEX,
    stripHtml,
    extractName,
    parseRefs,
    pairReferences,
    createProseBadge,
    createCitRow,
    applyDecoupling,
    restoreOriginal,
    isDiffPage,
    isVisualDiffActive,
    selectMode,
    updateButtonState,
    init
  };
});
