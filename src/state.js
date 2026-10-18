  /* ==========================================================================
     VIRTUAL FILE: src/state.js
     Description: Internal state encapsulation, lifecycle flags, and modified
                  row snapshot registry for non-destructive DOM restoration.
     ========================================================================== */

  /**
   * Internal state encapsulation for RefDiff lifecycle.
   * Uses Memento pattern for modified DOM rows to keep native MediaWiki closures attached.
   */
  const state = {
    origTableHtml: null,
    isDecoupled: false,
    initRetries: 0,
    diffTypeSwitchWidget: null,
    onTableClickHandler: null,
    onTableHoverHandler: false,
    onTableMouseOver: null,
    onTableMouseOut: null,
    modifiedRows: []
  };
  /* === [END VIRTUAL FILE: src/state.js] === */
