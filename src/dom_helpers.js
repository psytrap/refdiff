  /* ==========================================================================
     VIRTUAL FILE: src/dom_helpers.js
     Description: DOM query, categorization, and hook notification helpers.
                  Separates header from body rows and synchronizes with VE.
     ========================================================================== */

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
   * Also fires 'wikipage.content' so Extension:Popups hooks into new reference links.
   * @param {HTMLTableElement} table
   */
  function notifyBodyUpdate(table) {
    if (!table) return;
    if (typeof window !== 'undefined' && window.mw && window.mw.hook) {
      const $ = window.$ || window.jQuery;
      if ($) {
        const bodyRows = getDiffBodyRows(table);
        window.mw.hook(HOOKS.BODY_UPDATE).fire($(bodyRows));
        try {
          window.mw.hook('wikipage.content').fire($(table));
        } catch (_e) {
          // Ignore failures if wikipage.content hook listeners throw
        }
      }
    }
  }
  /* === [END VIRTUAL FILE: src/dom_helpers.js] === */
