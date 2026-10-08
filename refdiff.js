/**
 * RefDiff.js - The Ref-Differentiator
 * ------------------------------------------------------------------------------
 * A MediaWiki gadget for Special:Diff that separates human prose edits
 * from citation metadata changes using Wikipedia's native 2-column diff table.
 *
 * Repository: https://github.com/m-k/einzelnachweise
 * Architecture: Option A badge notation [~name~] & native MediaWiki table.diff
 *
 * @version 1.0.0
 * @author RefDiff Contributors
 * @license MIT
 */

(function () {
  'use strict';

  // Only run on MediaWiki diff pages
  const isDiffPage = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return !!(
      (window.mw && mw.config.get('wgDiffNewId')) ||
      urlParams.get('diff') ||
      document.querySelector('table.diff') ||
      document.getElementById('wikiDiff')
    );
  };

  if (!isDiffPage()) return;

  // Minimal badge styling (everything else uses native MediaWiki CSS)
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
    .refdiff-mode-selector {
      margin: 8px 0 12px 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .refdiff-mode-selector a.active {
      font-weight: bold;
      color: #000;
      text-decoration: none;
      cursor: default;
    }
    html.skin-theme-clientpref-night .refdiff-mode-selector a.active {
      color: #fff;
    }
  `;

  // ============================================================================
  // Wikitext Parsing Engine
  // ============================================================================
  class WikitextParser {
    static ATTR_RE = /([a-zA-Z0-9_\-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
    static HEADING_RE = /^(={1,6})\s*(.*?)\s*\1\s*$/gm;
    static REF_DEF_BLOCK_RE = /<references\s+(?:hidden|display\s*=\s*["']?none["']?)[^>]*>(.*?)<\/references>|<references-def[^>]*>(.*?)<\/references-def>/gis;
    static REF_RENDER_BLOCK_RE = /<references(?:\s*\/>|\s*[^>]*>.*?<\/references>)/gis;
    static REF_TAG_RE = /<ref\b(?<attrs>[^>/]*)(?:\/(?:\s*)>|>(?<content>.*?)<\/ref>)/gis;

    static parseAttributes(attrStr) {
      const attrs = {};
      let match;
      this.ATTR_RE.lastIndex = 0;
      while ((match = this.ATTR_RE.exec(attrStr)) !== null) {
        const key = match[1].toLowerCase();
        const val = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : match[4]);
        attrs[key] = val || '';
      }
      return attrs;
    }

    static parseDocument(wikitext, filename = 'document') {
      const sections = [];
      const allCitations = {};
      let anonCounter = 1;

      // 1. Split text into sections
      const headings = [];
      let m;
      this.HEADING_RE.lastIndex = 0;
      while ((m = this.HEADING_RE.exec(wikitext)) !== null) {
        headings.push({
          index: m.index,
          end: m.index + m[0].length,
          level: m[1].length,
          title: m[2].trim()
        });
      }

      const splits = [];
      if (headings.length === 0 || headings[0].index > 0) {
        const leadEnd = headings.length > 0 ? headings[0].index : wikitext.length;
        splits.push({ title: '(Lead)', level: 1, raw: wikitext.slice(0, leadEnd) });
      }

      for (let i = 0; i < headings.length; i++) {
        const h = headings[i];
        const nextStart = i + 1 < headings.length ? headings[i + 1].index : wikitext.length;
        splits.push({
          title: h.title,
          level: h.level,
          raw: wikitext.slice(h.end, nextStart)
        });
      }

      // 2. Process each section
      for (const split of splits) {
        const sectionCitations = {};
        let workingText = split.raw;
        let orderInSection = 1;

        // Strip <references hidden> definition blocks
        workingText = workingText.replace(this.REF_DEF_BLOCK_RE, (match, p1, p2) => {
          const blockContent = p1 || p2 || '';
          let refM;
          const refRegex = new RegExp(this.REF_TAG_RE.source, 'gis');
          while ((refM = refRegex.exec(blockContent)) !== null) {
            const attrs = this.parseAttributes(refM.groups.attrs || '');
            const content = (refM.groups.content || '').trim();
            const refName = attrs.name || null;
            const refId = refName || `anon_${Object.keys(allCitations).length + 1}`;
            const cit = {
              refId,
              name: refName,
              group: attrs.group || null,
              details: attrs.details || null,
              rawContent: content,
              fullTag: refM[0].trim(),
              section: split.title,
              isDefinition: true
            };
            sectionCitations[refId] = cit;
            allCitations[refId] = cit;
          }
          return '';
        });

        // Strip render <references />
        workingText = workingText.replace(this.REF_RENDER_BLOCK_RE, '');

        // Replace inline <ref> tags with sentinels
        workingText = workingText.replace(this.REF_TAG_RE, (match, attrsStr, contentStr) => {
          const attrs = this.parseAttributes(attrsStr || '');
          const content = (contentStr || '').trim();
          const refName = attrs.name || null;
          let refId = refName;
          if (!refId) {
            refId = `anon_${anonCounter++}`;
          }

          if (!allCitations[refId] || content) {
            const cit = {
              refId,
              name: refName,
              group: attrs.group || null,
              details: attrs.details || null,
              rawContent: content,
              fullTag: match.trim(),
              section: split.title,
              isDefinition: false,
              orderInSection: orderInSection++
            };
            sectionCitations[refId] = cit;
            allCitations[refId] = cit;
          } else {
            sectionCitations[refId] = allCitations[refId];
          }

          return `⟦ref:${refId}⟧`;
        });

        sections.push({
          title: split.title,
          level: split.level,
          rawText: split.raw,
          prose: workingText.trim(),
          citations: sectionCitations
        });
      }

      return { filename, sections, citations: allCitations };
    }
  }

  // ============================================================================
  // Myers Word-Level Diff Algorithm
  // ============================================================================
  class DiffEngine {
    static SENTINEL_RE = /^⟦ref:([^⟧]+)⟧$/;
    static TOKEN_RE = /(⟦ref:[^⟧]+⟧|[a-zA-Z0-9_\u00C0-\u017F]+|\s+|[^\w\s])/gu;
    static RAW_TOKEN_RE = /([a-zA-Z0-9_\u00C0-\u017F]+|\s+|[^\w\s])/gu;

    static tokenizeProse(text) {
      return text.match(this.TOKEN_RE) || [];
    }

    static tokenizeRaw(text) {
      return text.match(this.RAW_TOKEN_RE) || [];
    }

    static myersDiff(a, b) {
      if (a.join('') === b.join('')) {
        return a.map(t => ({ type: 'equal', text: t }));
      }
      const n = a.length, m = b.length;
      const max = n + m;
      const v = { 1: 0 };
      const trace = [];

      for (let d = 0; d <= max; d++) {
        trace.push(Object.assign({}, v));
        for (let k = -d; k <= d; k += 2) {
          let x;
          if (k === -d || (k !== d && (v[k - 1] === undefined ? -1 : v[k - 1]) < (v[k + 1] === undefined ? -1 : v[k + 1]))) {
            x = v[k + 1];
          } else {
            x = v[k - 1] + 1;
          }
          let y = x - k;
          while (x < n && y < m && a[x] === b[y]) {
            x++;
            y++;
          }
          v[k] = x;
          if (x >= n && y >= m) {
            return this.backtrack(trace, a, b);
          }
        }
      }
      return this.backtrack(trace, a, b);
    }

    static backtrack(trace, a, b) {
      let x = a.length, y = b.length;
      const ops = [];
      for (let d = trace.length - 1; d > 0; d--) {
        const v = trace[d];
        const k = x - y;
        let prevK;
        if (k === -d || (k !== d && (v[k - 1] === undefined ? -1 : v[k - 1]) < (v[k + 1] === undefined ? -1 : v[k + 1]))) {
          prevK = k + 1;
        } else {
          prevK = k - 1;
        }
        const prevX = v[prevK];
        const prevY = prevX - prevK;
        while (x > prevX && y > prevY) {
          ops.push({ type: 'equal', text: a[x - 1] });
          x--;
          y--;
        }
        if (d > 0) {
          if (x === prevX) {
            ops.push({ type: 'insert', text: b[prevY] });
            y = prevY;
          } else if (y === prevY) {
            ops.push({ type: 'delete', text: a[prevX] });
            x = prevX;
          }
        }
      }
      while (x > 0 && y > 0 && a[x - 1] === b[y - 1]) {
        ops.push({ type: 'equal', text: a[x - 1] });
        x--;
        y--;
      }
      while (x > 0) {
        ops.push({ type: 'delete', text: a[x - 1] });
        x--;
      }
      while (y > 0) {
        ops.push({ type: 'insert', text: b[y - 1] });
        y--;
      }
      ops.reverse();
      return ops;
    }

    static diffRawContent(oldContent, newContent) {
      const a = this.tokenizeRaw(oldContent);
      const b = this.tokenizeRaw(newContent);
      return this.myersDiff(a, b);
    }

    static diffProse(oldProse, newProse, refLabelMap, modifiedRefIds) {
      const tokensA = this.tokenizeProse(oldProse);
      const tokensB = this.tokenizeProse(newProse);
      const rawDiff = this.myersDiff(tokensA, tokensB);

      const result = [];
      let wordsAdded = 0;
      let wordsRemoved = 0;

      for (const tok of rawDiff) {
        const m = this.SENTINEL_RE.exec(tok.text);
        if (m) {
          const refId = m[1];
          const label = refLabelMap[refId] || refId;
          let badgeStatus = tok.type;
          if (tok.type === 'equal') {
            badgeStatus = modifiedRefIds && modifiedRefIds.has(refId) ? 'modified' : 'equal';
          }
          result.push({
            type: 'ref_badge',
            text: tok.text,
            refId,
            refLabel: label,
            badgeStatus
          });
        } else {
          result.push(tok);
          if (tok.type === 'insert' && /\w/.test(tok.text)) wordsAdded++;
          if (tok.type === 'delete' && /\w/.test(tok.text)) wordsRemoved++;
        }
      }

      return { tokens: result, wordsAdded, wordsRemoved };
    }

    static diffCitations(oldCits, newCits) {
      const added = [];
      const removed = [];
      const modified = [];

      const allKeys = Array.from(new Set([...Object.keys(oldCits), ...Object.keys(newCits)])).sort();

      for (const k of allKeys) {
        const inOld = k in oldCits;
        const inNew = k in newCits;

        if (inNew && !inOld) {
          added.push(newCits[k]);
        } else if (inOld && !inNew) {
          removed.push(oldCits[k]);
        } else {
          const cOld = oldCits[k];
          const cNew = newCits[k];
          const tagOld = (cOld.fullTag || cOld.rawContent).trim();
          const tagNew = (cNew.fullTag || cNew.rawContent).trim();

          if (tagOld !== tagNew) {
            const rawDiff = this.diffRawContent(tagOld, tagNew);
            modified.push({ oldCit: cOld, newCit: cNew, rawDiff });
          }
        }
      }

      return { added, removed, modified };
    }

    static compareDocuments(docA, docB) {
      const refLabelMap = {};
      const allCitsById = {};

      for (const sec of docB.sections) Object.assign(allCitsById, sec.citations);
      for (const sec of docA.sections) {
        for (const [rid, cit] of Object.entries(sec.citations)) {
          if (!allCitsById[rid]) allCitsById[rid] = cit;
        }
      }

      let counter = 1;
      const assignLabels = (doc) => {
        for (const sec of doc.sections) {
          for (const refId of Object.keys(sec.citations)) {
            if (!refLabelMap[refId]) {
              const cit = allCitsById[refId];
              if (cit && cit.name) {
                refLabelMap[refId] = cit.name;
              } else {
                refLabelMap[refId] = `ref${counter++}`;
              }
            }
          }
        }
      };

      assignLabels(docB);
      assignLabels(docA);

      const oldSecMap = Object.fromEntries(docA.sections.map(s => [s.title, s]));
      const newSecMap = Object.fromEntries(docB.sections.map(s => [s.title, s]));
      const allTitles = Array.from(new Set([...docA.sections.map(s => s.title), ...docB.sections.map(s => s.title)]));

      const sectionDiffs = [];
      const totalStats = {
        wordsAdded: 0,
        wordsRemoved: 0,
        citsAdded: 0,
        citsRemoved: 0,
        citsModified: 0
      };

      for (const title of allTitles) {
        const sOld = oldSecMap[title] || { title, level: 2, rawText: '', prose: '', citations: {} };
        const sNew = newSecMap[title] || { title, level: 2, rawText: '', prose: '', citations: {} };

        const citDelta = this.diffCitations(sOld.citations, sNew.citations);
        const modifiedRefIds = new Set(citDelta.modified.map(m => m.newCit.refId));

        const proseDiff = this.diffProse(sOld.prose, sNew.prose, refLabelMap, modifiedRefIds);
        const hasProseChanges = proseDiff.wordsAdded > 0 || proseDiff.wordsRemoved > 0 ||
          proseDiff.tokens.some(t => t.badgeStatus === 'insert' || t.badgeStatus === 'delete' || t.badgeStatus === 'modified');

        totalStats.wordsAdded += proseDiff.wordsAdded;
        totalStats.wordsRemoved += proseDiff.wordsRemoved;
        totalStats.citsAdded += citDelta.added.length;
        totalStats.citsRemoved += citDelta.removed.length;
        totalStats.citsModified += citDelta.modified.length;

        sectionDiffs.push({
          title,
          hasProseChanges,
          proseTokens: proseDiff.tokens,
          wordsAdded: proseDiff.wordsAdded,
          wordsRemoved: proseDiff.wordsRemoved,
          citationDelta: citDelta
        });
      }

      return { sectionDiffs, totalStats, refLabelMap };
    }
  }

  // ============================================================================
  // Native Wikipedia Diff Table Renderer
  // ============================================================================
  class NativeTableRenderer {
    static escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    static renderSideBySide(ops) {
      const left = [];
      const right = [];
      let delBuf = [];
      let insBuf = [];

      const flushLeft = () => {
        if (delBuf.length) {
          left.push(`<del class="diffchange diffchange-inline">${this.escapeHtml(delBuf.join(''))}</del>`);
          delBuf = [];
        }
      };
      const flushRight = () => {
        if (insBuf.length) {
          right.push(`<ins class="diffchange diffchange-inline">${this.escapeHtml(insBuf.join(''))}</ins>`);
          insBuf = [];
        }
      };

      for (const op of ops) {
        if (op.type === 'equal') {
          flushLeft();
          flushRight();
          const t = this.escapeHtml(op.text);
          left.push(t);
          right.push(t);
        } else if (op.type === 'delete') {
          flushRight();
          delBuf.push(op.text);
        } else if (op.type === 'insert') {
          flushLeft();
          insBuf.push(op.text);
        } else if (op.type === 'ref_badge') {
          flushLeft();
          flushRight();
          const lbl = this.escapeHtml(op.refLabel);
          if (op.badgeStatus === 'delete') {
            left.push(`<del class="diffchange diffchange-inline">[${lbl}]</del>`);
          } else if (op.badgeStatus === 'insert') {
            right.push(`<ins class="diffchange diffchange-inline">[${lbl}]</ins>`);
          } else if (op.badgeStatus === 'modified') {
            const badge = `<span class="ref-badge-mod" title="Citation metadata modified">[~${lbl}~]</span>`;
            left.push(badge);
            right.push(badge);
          } else {
            const badge = `<span class="ref-badge">[${lbl}]</span>`;
            left.push(badge);
            right.push(badge);
          }
        }
      }
      flushLeft();
      flushRight();

      return { left: left.join(''), right: right.join('') };
    }

    static renderRawDiffSideBySide(rawDiff) {
      const left = [];
      const right = [];
      let delBuf = [];
      let insBuf = [];

      const flushLeft = () => {
        if (delBuf.length) {
          left.push(`<del class="diffchange diffchange-inline">${this.escapeHtml(delBuf.join(''))}</del>`);
          delBuf = [];
        }
      };
      const flushRight = () => {
        if (insBuf.length) {
          right.push(`<ins class="diffchange diffchange-inline">${this.escapeHtml(insBuf.join(''))}</ins>`);
          insBuf = [];
        }
      };

      for (const t of rawDiff) {
        if (t.type === 'equal') {
          flushLeft();
          flushRight();
          const esc = this.escapeHtml(t.text);
          left.push(esc);
          right.push(esc);
        } else if (t.type === 'delete') {
          flushRight();
          delBuf.push(t.text);
        } else if (t.type === 'insert') {
          flushLeft();
          insBuf.push(t.text);
        }
      }
      flushLeft();
      flushRight();

      return { left: left.join(''), right: right.join('') };
    }

    static buildDiffTable(diffData) {
      const { sectionDiffs, totalStats, refLabelMap } = diffData;
      let rowsHtml = '';

      for (const s of sectionDiffs) {
        const hasCitChanges = s.citationDelta.added.length > 0 ||
          s.citationDelta.removed.length > 0 ||
          s.citationDelta.modified.length > 0;

        if (!s.hasProseChanges && !hasCitChanges) continue;

        const secTitle = this.escapeHtml(s.title);

        // 1. Prose Row
        if (s.hasProseChanges || hasCitChanges) {
          rowsHtml += `
            <tr class="diff-section">
              <td colspan="2" class="diff-lineno">== ${secTitle} == (Prose)</td>
              <td colspan="2" class="diff-lineno">== ${secTitle} == (Prose)</td>
            </tr>
          `;

          const sideBySide = this.renderSideBySide(s.proseTokens);

          if (s.hasProseChanges) {
            rowsHtml += `
              <tr>
                <td class="diff-marker" data-marker="−"></td>
                <td class="diff-deletedline diff-side-deleted"><div>${sideBySide.left}</div></td>
                <td class="diff-marker" data-marker="+"></td>
                <td class="diff-addedline diff-side-added"><div>${sideBySide.right}</div></td>
              </tr>
            `;
          } else {
            // Prose was not edited; show context line with modified badge annotated
            rowsHtml += `
              <tr>
                <td class="diff-marker"></td>
                <td class="diff-context"><div>${sideBySide.left}</div></td>
                <td class="diff-marker"></td>
                <td class="diff-context"><div>${sideBySide.right}</div></td>
              </tr>
            `;
          }
        }

        // 2. Citation Rows (if citations changed)
        if (hasCitChanges) {
          rowsHtml += `
            <tr class="diff-section">
              <td colspan="2" class="diff-lineno">== ${secTitle} == (Citations)</td>
              <td colspan="2" class="diff-lineno">== ${secTitle} == (Citations)</td>
            </tr>
          `;

          // Modified
          for (const { oldCit, newCit, rawDiff } of s.citationDelta.modified) {
            const num = this.escapeHtml(refLabelMap[newCit.refId] || newCit.refId);
            const side = this.renderRawDiffSideBySide(rawDiff);
            rowsHtml += `
              <tr>
                <td class="diff-marker" data-marker="−"></td>
                <td class="diff-deletedline diff-side-deleted"><div>${side.left}</div></td>
                <td class="diff-marker" data-marker="+"></td>
                <td class="diff-addedline diff-side-added"><div>${side.right}</div></td>
              </tr>
            `;
          }

          // Added
          for (const cit of s.citationDelta.added) {
            const tagStr = this.escapeHtml((cit.fullTag || cit.rawContent).trim());
            rowsHtml += `
              <tr>
                <td class="diff-marker"></td>
                <td class="diff-context"></td>
                <td class="diff-marker" data-marker="+"></td>
                <td class="diff-addedline diff-side-added"><div><ins class="diffchange diffchange-inline">${tagStr}</ins></div></td>
              </tr>
            `;
          }

          // Removed
          for (const cit of s.citationDelta.removed) {
            const tagStr = this.escapeHtml((cit.fullTag || cit.rawContent).trim());
            rowsHtml += `
              <tr>
                <td class="diff-marker" data-marker="−"></td>
                <td class="diff-deletedline diff-side-deleted"><div><del class="diffchange diffchange-inline">${tagStr}</del></div></td>
                <td class="diff-marker"></td>
                <td class="diff-context"></td>
              </tr>
            `;
          }
        }
      }

      if (!rowsHtml) {
        rowsHtml = `
          <tr>
            <td colspan="4" class="diff-context" style="text-align: center; padding: 20px;">
              (No changes between revisions)
            </td>
          </tr>
        `;
      }

      return `
        <table class="diff diff-type-table diff-contentalign-left diff-editfont-monospace" id="refdiff-decoupled-table">
          <colgroup>
            <col class="diff-marker">
            <col class="diff-content">
            <col class="diff-marker">
            <col class="diff-content">
          </colgroup>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;
    }
  }

  // ============================================================================
  // App Controller & MediaWiki Initialization
  // ============================================================================
  async function initRefDiff() {
    if (document.getElementById('refdiff-mode-bar')) return;

    const diffContainer = document.querySelector('table.diff') || document.getElementById('wikiDiff');
    if (!diffContainer) return;

    // Inject minimal badge CSS
    if (!document.getElementById('refdiff-badge-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'refdiff-badge-styles';
      styleEl.textContent = BADGE_STYLES;
      document.head.appendChild(styleEl);
    }

    // Insert mode selector bar right above the diff table
    const modeBar = document.createElement('div');
    modeBar.id = 'refdiff-mode-bar';
    modeBar.className = 'refdiff-mode-selector';
    modeBar.innerHTML = `
      <strong>Diff view:</strong>
      <a href="#" id="refdiff-toggle-decoupled" class="active">Decoupled (RefDiff)</a> &bull;
      <a href="#" id="refdiff-toggle-standard">Standard Wikidiff</a>
      <span id="refdiff-loading-indicator" style="margin-left: 12px; color: #72777d; font-size: 12px;">(Loading decoupled diff...)</span>
    `;
    diffContainer.parentNode.insertBefore(modeBar, diffContainer);

    try {
      let oldId = window.mw && mw.config.get('wgDiffOldId');
      let newId = window.mw && mw.config.get('wgDiffNewId');

      if (!oldId || !newId) {
        const urlParams = new URLSearchParams(window.location.search);
        newId = urlParams.get('diff');
        oldId = urlParams.get('oldid');
      }

      let wikitextOld = '';
      let wikitextNew = '';

      if (window.mw && mw.Api) {
        const api = new mw.Api();

        let reqIds = [oldId, newId].filter(Boolean);
        if (newId === 'prev' || !oldId) {
          const infoRes = await api.get({
            action: 'query',
            prop: 'revisions',
            revids: newId && newId !== 'prev' ? newId : mw.config.get('wgRevisionId'),
            rvprop: 'ids',
            format: 'json'
          });
          const p = Object.values(infoRes.query.pages)[0];
          const currRev = p.revisions[0];
          newId = currRev.revid;
          oldId = currRev.parentid;
          reqIds = [oldId, newId];
        }

        const res = await api.get({
          action: 'query',
          prop: 'revisions',
          revids: reqIds,
          rvprop: 'ids|content',
          rvslots: 'main',
          format: 'json'
        });

        const revMap = {};
        for (const p of Object.values(res.query.pages)) {
          for (const r of p.revisions || []) {
            const content = r.slots && r.slots.main ? r.slots.main['*'] : (r['*'] || '');
            revMap[r.revid] = content;
          }
        }
        wikitextOld = revMap[oldId] || '';
        wikitextNew = revMap[newId] || '';
      } else {
        const fetchRev = async (id) => {
          const r = await fetch(`/w/api.php?action=query&prop=revisions&revids=${id}&rvprop=ids|content&rvslots=main&format=json`);
          const data = await r.json();
          const p = Object.values(data.query.pages)[0];
          const rev = p.revisions[0];
          return rev.slots && rev.slots.main ? rev.slots.main['*'] : (rev['*'] || '');
        };
        [wikitextOld, wikitextNew] = await Promise.all([fetchRev(oldId), fetchRev(newId)]);
      }

      // Parse & Diff
      const docA = WikitextParser.parseDocument(wikitextOld, `Rev ${oldId}`);
      const docB = WikitextParser.parseDocument(wikitextNew, `Rev ${newId}`);
      const diffData = DiffEngine.compareDocuments(docA, docB);

      // Create decoupled table container
      const tableWrapper = document.createElement('div');
      tableWrapper.id = 'refdiff-table-container';
      tableWrapper.innerHTML = NativeTableRenderer.buildDiffTable(diffData);
      diffContainer.parentNode.insertBefore(tableWrapper, diffContainer);

      // By default show decoupled table, hide standard wikidiff
      diffContainer.style.display = 'none';

      // Update loading indicator to stats
      const indicator = document.getElementById('refdiff-loading-indicator');
      if (indicator) {
        indicator.innerHTML = `
          <span style="color: #54595d;">(Prose: +${diffData.totalStats.wordsAdded} -${diffData.totalStats.wordsRemoved} words | Refs: ${diffData.totalStats.citsModified} modified, +${diffData.totalStats.citsAdded} added)</span>
        `;
      }

      // Hook toggle links
      const btnDecoupled = document.getElementById('refdiff-toggle-decoupled');
      const btnStandard = document.getElementById('refdiff-toggle-standard');

      btnStandard.addEventListener('click', (e) => {
        e.preventDefault();
        btnStandard.classList.add('active');
        btnDecoupled.classList.remove('active');
        tableWrapper.style.display = 'none';
        diffContainer.style.display = '';
      });

      btnDecoupled.addEventListener('click', (e) => {
        e.preventDefault();
        btnDecoupled.classList.add('active');
        btnStandard.classList.remove('active');
        tableWrapper.style.display = '';
        diffContainer.style.display = 'none';
      });

    } catch (err) {
      console.error('[RefDiff] Error:', err);
      const indicator = document.getElementById('refdiff-loading-indicator');
      if (indicator) {
        indicator.textContent = `(Error loading decoupled diff: ${err.message})`;
        indicator.style.color = '#cf222e';
      }
    }
  }

  if (window.mw && mw.hook) {
    mw.hook('wikipage.diff').add(initRefDiff);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(initRefDiff, 50);
    }
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRefDiff);
  } else {
    initRefDiff();
  }
})();
