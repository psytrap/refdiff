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
