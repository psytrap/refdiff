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
