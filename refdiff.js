/**
 * RefDiff.js - The Ref-Differentiator
 * ------------------------------------------------------------------------------
 * A zero-loss diff-decoupling gadget for MediaWiki Special:Diff.
 * Preserves 100% of Wikipedia's native diff table (revision headers, line numbers,
 * context lines, diff hunks) while decoupling citation templates from prose lines.
 *
 * Repository: https://github.com/m-k/einzelnachweise
 *
 * @version 1.1.0
 * @author RefDiff Contributors
 * @license MIT
 */

(function () {
  'use strict';

  // Only run on MediaWiki diff pages
  const isDiffPage = () => {
    return !!(
      document.querySelector('table.diff') ||
      document.getElementById('wikiDiff') ||
      (window.mw && mw.config.get('wgDiffNewId'))
    );
  };

  if (!isDiffPage()) return;

  const BADGE_STYLES = `
    .ref-badge {
      font-weight: bold;
      color: #0645ad;
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
      color: #6da2ff;
    }
    html.skin-theme-clientpref-night .ref-badge-mod,
    body.skin-theme-clientpref-night .ref-badge-mod {
      color: #ffd043;
      background: rgba(255, 208, 67, 0.2);
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
    const m = attrsStr.match(/name\s*=\s*(?:&quot;|"|'|&apos;)(.*?)(?:&quot;|"|'|&apos;)|name\s*=\s*([^\s"'>]+)/i);
    return m ? (m[1] || m[2]) : null;
  }

  function applyDecoupling(table) {
    if (!table) return;

    // Cache original HTML once
    if (!origTableHtml) {
      origTableHtml = table.innerHTML;
    }

    // Match HTML-escaped wikitext <ref> tags as output by MediaWiki's diff engine
    const refRegex = /&lt;ref\b([^&]*?)(?:\/&gt;|&gt;(.*?)&lt;\/ref&gt;)/gis;

    const changeRows = Array.from(table.querySelectorAll('tr')).filter(
      r => r.querySelector('.diff-deletedline, .diff-addedline') && !r.classList.contains('refdiff-cit-row')
    );

    let citCounter = 1;
    let totalModified = 0;
    let totalAdded = 0;
    let totalRemoved = 0;

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

      const modifiedCits = [];
      let newDelHtml = delDiv.innerHTML;
      let newAddHtml = addDiv.innerHTML;

      const maxLen = Math.max(delRefs.length, addRefs.length);
      for (let i = 0; i < maxLen; i++) {
        const d = delRefs[i];
        const a = addRefs[i];

        let refName = (d && extractName(d.attrs)) || (a && extractName(a.attrs));
        let label = refName || `ref${citCounter++}`;

        if (d && a) {
          const isMod = a.hasChange || (d.raw.replace(/<[^>]+>/g, '') !== a.raw.replace(/<[^>]+>/g, ''));
          if (isMod) {
            totalModified++;
            modifiedCits.push({ label, oldRaw: d.raw, newRaw: a.raw });
            const badge = `<span class="ref-badge-mod" title="Citation metadata modified">[~${label}~]</span>`;
            newDelHtml = newDelHtml.replace(d.raw, badge);
            newAddHtml = newAddHtml.replace(a.raw, badge);
          } else {
            const badge = `<span class="ref-badge">[${label}]</span>`;
            newDelHtml = newDelHtml.replace(d.raw, badge);
            newAddHtml = newAddHtml.replace(a.raw, badge);
          }
        } else if (a && !d) {
          totalAdded++;
          const badge = `<ins class="diffchange diffchange-inline">{+ [${label}] +}</ins>`;
          newAddHtml = newAddHtml.replace(a.raw, badge);
          modifiedCits.push({ label, oldRaw: '', newRaw: a.raw, isAdd: true });
        } else if (d && !a) {
          totalRemoved++;
          const badge = `<del class="diffchange diffchange-inline">[- [${label}] -]</del>`;
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
        citRow.innerHTML = `
          <td class="diff-marker" data-marker="${mc.isAdd ? '' : '−'}"></td>
          <td class="${mc.isAdd ? 'diff-context' : 'diff-deletedline diff-side-deleted'}"><div>${mc.oldRaw}</div></td>
          <td class="diff-marker" data-marker="${mc.isDel ? '' : '+'}"></td>
          <td class="${mc.isDel ? 'diff-context' : 'diff-addedline diff-side-added'}"><div>${mc.newRaw}</div></td>
        `;
        prevRow.parentNode.insertBefore(citRow, prevRow.nextSibling);
        prevRow = citRow;
      }
    }

    isDecoupled = true;

    // Update stats in header bar
    const statsEl = document.getElementById('refdiff-stats-note');
    if (statsEl) {
      statsEl.textContent = `(Refs: ${totalModified} modified, +${totalAdded} added, -${totalRemoved} removed)`;
    }
  }

  function restoreOriginal(table) {
    if (!table || !origTableHtml) return;
    table.innerHTML = origTableHtml;
    isDecoupled = false;
  }

  function init() {
    const table = document.querySelector('table.diff');
    if (!table || document.getElementById('refdiff-mode-bar')) return;

    // Inject minimal badge styling
    if (!document.getElementById('refdiff-badge-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'refdiff-badge-styles';
      styleEl.textContent = BADGE_STYLES;
      document.head.appendChild(styleEl);
    }

    // Insert mode switcher right above the diff table
    const modeBar = document.createElement('div');
    modeBar.id = 'refdiff-mode-bar';
    modeBar.className = 'refdiff-mode-bar';
    modeBar.innerHTML = `
      <strong>Diff view:</strong>
      <a href="#" id="refdiff-btn-decoupled" class="active">Decoupled (RefDiff)</a> &bull;
      <a href="#" id="refdiff-btn-standard">Standard Wikidiff</a>
      <span id="refdiff-stats-note" style="color: #72777d; font-size: 12px; margin-left: 10px;"></span>
    `;
    table.parentNode.insertBefore(modeBar, table);

    // Apply decoupled transformation by default
    applyDecoupling(table);

    // Hook buttons
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
