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
