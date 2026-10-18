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
