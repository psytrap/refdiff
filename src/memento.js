  /* ==========================================================================
     VIRTUAL FILE: src/memento.js
     Description: Memento design pattern implementation for MediaWiki DOM rows.
                  Captures and restores live DOM elements in-place to prevent
                  detaching native event closures in inlineFormatToggle and VE.
     ========================================================================== */

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
          if (typeof mkInfo.el.setAttribute === 'function') {
            mkInfo.el.setAttribute('data-marker', mkInfo.marker);
          }
        } else if (typeof mkInfo.el.removeAttribute === 'function') {
          mkInfo.el.removeAttribute('data-marker');
        }
      }
    }
  }
  /* === [END VIRTUAL FILE: src/memento.js] === */
