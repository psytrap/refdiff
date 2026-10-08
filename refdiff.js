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

(function () {
  'use strict';

  // Only run on MediaWiki diff pages
  const isDiffPage = () => {
    return !!(
      (window.mw && (mw.config.get('wgDiffNewId') || mw.config.get('wgDiffOldId'))) ||
      document.querySelector('table.diff') ||
      document.getElementById('wikiDiff') ||
      /[?&]diff=/.test(location.search) ||
      /\/wiki\/Special:Diff\//.test(location.pathname)
    );
  };

  if (!isDiffPage()) return;

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
      padding: 0 2px;
      cursor: help;
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
  `;

  let origTableHtml = null;
  let isDecoupled = false;

  function extractName(attrsStr) {
    if (!attrsStr) return null;
    const clean = attrsStr.replace(/<[^>]+>/g, '');
    const m = clean.match(/name\s*=\s*(?:&quot;|["']|&apos;)(.*?)(?:&quot;|["']|&apos;)|name\s*=\s*([^\s"'>&]+)/i);
    return m ? (m[1] || m[2]).trim() : null;
  }

  function pairReferences(delRefs, addRefs) {
    const pairs = [];
    const matchedDel = new Set();
    const matchedAdd = new Set();

    const cleanContent = (r) => {
      if (!r) return '';
      return (r.content || r.raw || '').replace(/<[^>]+>/g, '').trim();
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
    const remainingDel = [];
    for (let i = 0; i < delRefs.length; i++) {
      if (!matchedDel.has(i)) remainingDel.push(delRefs[i]);
    }
    const remainingAdd = [];
    for (let j = 0; j < addRefs.length; j++) {
      if (!matchedAdd.has(j)) remainingAdd.push(addRefs[j]);
    }

    const commonCount = Math.min(remainingDel.length, remainingAdd.length);
    for (let k = 0; k < commonCount; k++) {
      const d = remainingDel[k];
      const a = remainingAdd[k];
      pairs.push({ d, a, name: extractName(d.attrs) || extractName(a.attrs) });
    }

    for (let k = commonCount; k < remainingDel.length; k++) {
      const d = remainingDel[k];
      pairs.push({ d, a: null, name: extractName(d.attrs) });
    }

    for (let k = commonCount; k < remainingAdd.length; k++) {
      const a = remainingAdd[k];
      pairs.push({ d: null, a, name: extractName(a.attrs) });
    }

    return pairs;
  }

  function applyDecoupling(table) {
    if (!table) return;

    // Cache original HTML once
    if (!origTableHtml) {
      origTableHtml = table.innerHTML;
    }

    // Match HTML-escaped wikitext <ref> tags as output by MediaWiki's diff engine.
    // Handles self-closing tags and opening/closing tags with attributes containing HTML entities.
    const refRegex = /&lt;ref\b((?:(?!&gt;|\/&gt;)[\s\S])*?)(?:\/&gt;|&gt;([\s\S]*?)&lt;\/ref&gt;)/gi;

    const changeRows = Array.from(table.querySelectorAll('tr')).filter(
      r => r.querySelector('.diff-deletedline, .diff-addedline') && !r.classList.contains('refdiff-cit-row')
    );

    let citCounter = 1;

    for (const row of changeRows) {
      const delDiv = row.querySelector('.diff-deletedline div');
      const addDiv = row.querySelector('.diff-addedline div');
      if (!delDiv || !addDiv) continue;

      // Extract refs from deleted side
      const delRefs = [];
      let m;
      refRegex.lastIndex = 0;
      while ((m = refRegex.exec(delDiv.innerHTML)) !== null) {
        delRefs.push({ raw: m[0], attrs: m[1], content: m[2] });
      }

      // Extract refs from added side
      const addRefs = [];
      refRegex.lastIndex = 0;
      while ((m = refRegex.exec(addDiv.innerHTML)) !== null) {
        const hasChange = m[0].includes('diffchange');
        addRefs.push({ raw: m[0], attrs: m[1], content: m[2], hasChange });
      }

      if (delRefs.length === 0 && addRefs.length === 0) continue;

      const pairs = pairReferences(delRefs, addRefs);
      const modifiedCits = [];
      let newDelHtml = delDiv.innerHTML;
      let newAddHtml = addDiv.innerHTML;

      for (const pair of pairs) {
        const d = pair.d;
        const a = pair.a;
        const label = pair.name || `ref${citCounter++}`;

        if (d && a) {
          const isMod = a.hasChange || (d.raw.replace(/<[^>]+>/g, '').trim() !== a.raw.replace(/<[^>]+>/g, '').trim());
          if (isMod) {
            modifiedCits.push({ label, oldRaw: d.raw, newRaw: a.raw });
            const badge = `<span class="ref-badge-mod" title="Citation metadata modified: ⟨~${label}~⟩">⟨~${label}~⟩</span>`;
            newDelHtml = newDelHtml.replace(d.raw, badge);
            newAddHtml = newAddHtml.replace(a.raw, badge);
          } else {
            const badge = `<span class="ref-badge" title="Citation: ⟨${label}⟩">⟨${label}⟩</span>`;
            newDelHtml = newDelHtml.replace(d.raw, badge);
            newAddHtml = newAddHtml.replace(a.raw, badge);
          }
        } else if (a && !d) {
          const badge = `<ins class="diffchange diffchange-inline" title="Added citation: ${label}">{+ ⟨${label}⟩ +}</ins>`;
          newAddHtml = newAddHtml.replace(a.raw, badge);
          modifiedCits.push({ label, oldRaw: '', newRaw: a.raw, isAdd: true });
        } else if (d && !a) {
          const badge = `<del class="diffchange diffchange-inline" title="Removed citation: ${label}">[- ⟨${label}⟩ -]</del>`;
          newDelHtml = newDelHtml.replace(d.raw, badge);
          modifiedCits.push({ label, oldRaw: d.raw, newRaw: '', isDel: true });
        }
      }

      delDiv.innerHTML = newDelHtml;
      addDiv.innerHTML = newAddHtml;

      // If no remaining diffchanges in prose, convert line to context appearance
      const hasProseChanges = newDelHtml.includes('diffchange') || newAddHtml.includes('diffchange');
      if (!hasProseChanges) {
        const delTd = row.querySelector('.diff-deletedline');
        const addTd = row.querySelector('.diff-addedline');
        if (delTd) delTd.className = 'diff-context diff-side-deleted';
        if (addTd) addTd.className = 'diff-context diff-side-added';
        const markers = row.querySelectorAll('.diff-marker');
        markers.forEach(mk => mk.removeAttribute('data-marker'));
      }

      // Insert citation diff rows directly below this prose row
      let prevRow = row;
      for (const mc of modifiedCits) {
        const citRow = document.createElement('tr');
        citRow.className = 'refdiff-cit-row';

        let delPrefix = '';
        let addPrefix = '';
        if (mc.isAdd) {
          addPrefix = `<ins class="diffchange diffchange-inline">{+ ⟨${mc.label}⟩ +}</ins> `;
        } else if (mc.isDel) {
          delPrefix = `<del class="diffchange diffchange-inline">[- ⟨${mc.label}⟩ -]</del> `;
        } else {
          const modBadge = `<span class="ref-badge-mod" title="Citation metadata modified">⟨~${mc.label}~⟩</span> `;
          delPrefix = modBadge;
          addPrefix = modBadge;
        }

        citRow.innerHTML = `
          <td class="diff-marker" data-marker="${mc.isAdd ? '' : '−'}"></td>
          <td class="${mc.isAdd ? 'diff-context' : 'diff-deletedline diff-side-deleted'}"><div>${delPrefix}${mc.oldRaw}</div></td>
          <td class="diff-marker" data-marker="${mc.isDel ? '' : '+'}"></td>
          <td class="${mc.isDel ? 'diff-context' : 'diff-addedline diff-side-added'}"><div>${addPrefix}${mc.newRaw}</div></td>
        `;
        prevRow.parentNode.insertBefore(citRow, prevRow.nextSibling);
        prevRow = citRow;
      }
    }

    isDecoupled = true;
  }

  function restoreOriginal(table) {
    if (!table || !origTableHtml) return;
    table.innerHTML = origTableHtml;
    isDecoupled = false;
  }

  let initRetries = 0;
  function init() {
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

    if (buttonGroup) {
      if (document.getElementById('refdiff-ooui-btn')) return;

      const isSelect = buttonGroup.classList.contains('oo-ui-buttonSelectWidget');
      const wikiBtn = Array.from(buttonGroup.children).find(c => c.textContent.includes('Wikitext'));

      // Create native OOUI RefDiff button
      const refBtn = document.createElement(isSelect ? 'div' : 'span');
      refBtn.id = 'refdiff-ooui-btn';
      refBtn.className = isSelect
        ? 'oo-ui-widget oo-ui-widget-enabled oo-ui-labelElement oo-ui-optionWidget oo-ui-buttonElement oo-ui-buttonElement-framed oo-ui-buttonElement-size-medium oo-ui-iconElement oo-ui-buttonOptionWidget oo-ui-optionWidget-selected oo-ui-buttonElement-active'
        : 'oo-ui-widget oo-ui-widget-enabled oo-ui-buttonElement oo-ui-buttonElement-framed oo-ui-buttonElement-size-medium oo-ui-iconElement oo-ui-labelElement oo-ui-buttonWidget oo-ui-buttonElement-active';
      refBtn.setAttribute('role', isSelect ? 'option' : 'button');
      if (isSelect) refBtn.setAttribute('aria-selected', 'true');
      refBtn.setAttribute('title', 'RefDiff: Decoupled citation diff view');
      refBtn.innerHTML = `
        <a class="oo-ui-buttonElement-button" role="button" tabindex="0" rel="nofollow">
          <span class="oo-ui-iconElement-icon oo-ui-icon-diffs oo-ui-image-invert"></span>
          <span class="oo-ui-labelElement-label">RefDiff</span>
          <span class="oo-ui-indicatorElement-indicator oo-ui-indicatorElement-noIndicator oo-ui-image-invert"></span>
        </a>
      `;
      buttonGroup.appendChild(refBtn);

      // Deselect Wikitext button initially since RefDiff starts decoupled
      if (wikiBtn) {
        wikiBtn.classList.remove('oo-ui-buttonElement-active', 'oo-ui-optionWidget-selected');
        if (isSelect) wikiBtn.setAttribute('aria-selected', 'false');
        const wikiIcon = wikiBtn.querySelector('.oo-ui-iconElement-icon');
        if (wikiIcon) wikiIcon.classList.remove('oo-ui-image-invert');
      }

      function updateButtonState(active) {
        const btn = document.getElementById('refdiff-ooui-btn');
        if (!btn) return;
        const group = btn.parentElement;
        const currentWiki = group ? Array.from(group.children).find(c => c.textContent.includes('Wikitext')) : null;
        const currentIsSelect = group && group.classList.contains('oo-ui-buttonSelectWidget');

        if (active) {
          btn.classList.add('oo-ui-buttonElement-active');
          if (currentIsSelect) {
            btn.classList.add('oo-ui-optionWidget-selected');
            btn.setAttribute('aria-selected', 'true');
          }
          const icon = btn.querySelector('.oo-ui-iconElement-icon');
          if (icon) icon.classList.add('oo-ui-image-invert');

          if (currentWiki) {
            currentWiki.classList.remove('oo-ui-buttonElement-active', 'oo-ui-optionWidget-selected');
            if (currentIsSelect) currentWiki.setAttribute('aria-selected', 'false');
            const wIcon = currentWiki.querySelector('.oo-ui-iconElement-icon');
            if (wIcon) wIcon.classList.remove('oo-ui-image-invert');
          }
        } else {
          btn.classList.remove('oo-ui-buttonElement-active', 'oo-ui-optionWidget-selected');
          if (currentIsSelect) btn.setAttribute('aria-selected', 'false');
          const icon = btn.querySelector('.oo-ui-iconElement-icon');
          if (icon) icon.classList.remove('oo-ui-image-invert');

          if (currentWiki) {
            currentWiki.classList.add('oo-ui-buttonElement-active');
            if (currentIsSelect) {
              currentWiki.classList.add('oo-ui-optionWidget-selected');
              currentWiki.setAttribute('aria-selected', 'true');
            }
            const wIcon = currentWiki.querySelector('.oo-ui-iconElement-icon');
            if (wIcon) wIcon.classList.add('oo-ui-image-invert');
          }
        }
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
            updateButtonState(true);
            applyDecoupling(table);
          } else if (btn.textContent.includes('Wikitext')) {
            updateButtonState(false);
            restoreOriginal(table);
          } else if (btn.textContent.includes('Visual')) {
            const rBtn = document.getElementById('refdiff-ooui-btn');
            if (rBtn) {
              rBtn.classList.remove('oo-ui-buttonElement-active', 'oo-ui-optionWidget-selected');
              const icon = rBtn.querySelector('.oo-ui-iconElement-icon');
              if (icon) icon.classList.remove('oo-ui-image-invert');
            }
          }
        }, true);

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
        <a href="#" id="refdiff-btn-decoupled" class="active">Decoupled (RefDiff)</a> &bull;
        <a href="#" id="refdiff-btn-standard">Standard Wikidiff</a>
      `;
      table.parentNode.insertBefore(modeBar, table);

      const btnDecoupled = document.getElementById('refdiff-btn-decoupled');
      const btnStandard = document.getElementById('refdiff-btn-standard');

      btnStandard.addEventListener('click', (e) => {
        e.preventDefault();
        btnStandard.classList.add('active');
        btnDecoupled.classList.remove('active');
        restoreOriginal(table);
      });

      btnDecoupled.addEventListener('click', (e) => {
        e.preventDefault();
        btnDecoupled.classList.add('active');
        btnStandard.classList.remove('active');
        applyDecoupling(table);
      });
    }

    // Apply decoupled transformation by default
    applyDecoupling(table);
  }

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
})();
