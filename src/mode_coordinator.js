  /* ==========================================================================
     VIRTUAL FILE: src/mode_coordinator.js
     Description: 3-way mode switching (visual/wikitext/refdiff), OOUI button
                  synchronization, inline format switch locking, and persistence.
     ========================================================================== */

  /**
   * Checks whether RefDiff should be active based on stored user preference or URL override.
   * Defaults to true if no preference has been saved yet.
   * @returns {boolean}
   */
  function isRefDiffPreferred() {
    try {
      if (typeof window !== 'undefined') {
        if (window.location && /[?&]refdiff=0\b/.test(window.location.search)) return false;
        if (window.location && /[?&]refdiff=1\b/.test(window.location.search)) return true;

        const stored = (window.mw && window.mw.storage)
          ? window.mw.storage.get(STORAGE_KEY)
          : (window.localStorage ? window.localStorage.getItem(STORAGE_KEY) : null);
        if (stored !== null && stored !== undefined) {
          return stored === 'true';
        }
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  /**
   * Persists the RefDiff active preference to mw.storage / localStorage.
   * @param {boolean} active
   */
  function setRefDiffPreferred(active) {
    try {
      if (typeof window !== 'undefined') {
        if (window.mw && window.mw.storage) {
          window.mw.storage.set(STORAGE_KEY, String(active));
        } else if (window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, String(active));
        }
      }
    } catch (e) {
      // Silently ignore quota / private mode storage errors
    }
  }

  /**
   * Checks whether modified references should remain inline in prose with a prepended badge.
   * If true, modified references remain inline with ⟨~label~⟩ prepended, while unchanged
   * references are shortened into hoverable badges. Added and deleted references always
   * separate into citation rows below regardless.
   * Defaults to false (clean traditional RefDiff out-of-the-box, unchecked).
   * Precedence: window.refdiffConfig.inlineModified > window.refdiffConfig.separateChanged (inverted)
   *             > URL (?refdiff_inline=0|1 / ?refdiff_separate=0|1) > storage > default false
   * @returns {boolean}
   */
  function isInlineModifiedPreferred() {
    try {
      if (typeof window !== 'undefined') {
        if (window.refdiffConfig && typeof window.refdiffConfig.inlineModified === 'boolean') {
          return window.refdiffConfig.inlineModified;
        }
        if (window.refdiffConfig && typeof window.refdiffConfig.separateChanged === 'boolean') {
          return !window.refdiffConfig.separateChanged;
        }
        if (window.location && /[?&]refdiff_inline=1\b/.test(window.location.search)) return true;
        if (window.location && /[?&]refdiff_inline=0\b/.test(window.location.search)) return false;
        if (window.location && /[?&]refdiff_separate=0\b/.test(window.location.search)) return true;
        if (window.location && /[?&]refdiff_separate=1\b/.test(window.location.search)) return false;

        const storedInline = (window.mw && window.mw.storage)
          ? window.mw.storage.get(STORAGE_KEY_INLINE)
          : (window.localStorage ? window.localStorage.getItem(STORAGE_KEY_INLINE) : null);
        if (storedInline !== null && storedInline !== undefined) {
          return storedInline === 'true';
        }

        const storedSeparate = (window.mw && window.mw.storage)
          ? window.mw.storage.get(STORAGE_KEY_SEPARATE)
          : (window.localStorage ? window.localStorage.getItem(STORAGE_KEY_SEPARATE) : null);
        if (storedSeparate !== null && storedSeparate !== undefined) {
          return storedSeparate === 'false';
        }
      }
      return false;
    } catch (_e) {
      return false;
    }
  }

  /**
   * Persists the inlineModified preference to mw.storage / localStorage.
   * @param {boolean} inline
   */
  function setInlineModifiedPreferred(inline) {
    try {
      if (typeof window !== 'undefined') {
        if (window.mw && window.mw.storage) {
          window.mw.storage.set(STORAGE_KEY_INLINE, String(inline));
          window.mw.storage.set(STORAGE_KEY_SEPARATE, String(!inline));
        } else if (window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY_INLINE, String(inline));
          window.localStorage.setItem(STORAGE_KEY_SEPARATE, String(!inline));
        }
      }
    } catch (_e) {
      // Silently ignore quota / private mode storage errors
    }
  }

  /**
   * Backward-compatible alias checking whether modified references should be decoupled into separate rows.
   * Defaults to true (full decoupling).
   * @returns {boolean}
   */
  function isSeparateChangedPreferred() {
    return !isInlineModifiedPreferred();
  }

  /**
   * Backward-compatible alias persisting the separateChanged preference.
   * @param {boolean} separate
   */
  function setSeparateChangedPreferred(separate) {
    setInlineModifiedPreferred(!separate);
  }

  /**
   * Toggles active styling on an OOUI button element.
   * @param {HTMLElement|null} el
   * @param {boolean} active
   * @param {boolean} isSelect
   */
  function setElementActive(el, active, isSelect) {
    if (!el) return;
    el.classList.toggle(CLASSES.OO_BTN_ACTIVE, active);
    if (isSelect) {
      el.classList.toggle(CLASSES.OO_OPTION_SELECTED, active);
      el.setAttribute('aria-selected', String(active));
    }
    const icon = el.querySelector('.oo-ui-iconElement-icon');
    if (icon) {
      icon.classList.toggle(CLASSES.OO_IMAGE_INVERT, active);
    }
  }

  /**
   * Helper to retrieve the OOUI ButtonSelectWidget instance for diff mode, if present.
   * @returns {Object|null}
   */
  function getDiffModeWidget() {
    if (typeof document === 'undefined') return null;
    const opt = document.querySelector(SELECTORS.VE_OPTION_WIDGET);
    if (!opt) return null;
    const $ = window.jQuery || window.$;
    if ($) {
      const optWidget = $(opt).data('oo-ui-optionWidget');
      if (optWidget) {
        if (typeof optWidget.getElementGroup === 'function') {
          return optWidget.getElementGroup();
        }
        if (optWidget.elementGroup) {
          return optWidget.elementGroup;
        }
      }
    }
    return null;
  }

  /**
   * Checks whether VisualEditor visual diff mode is currently active.
   * @returns {boolean}
   */
  function isVisualDiffActive() {
    if (typeof document === 'undefined') return false;
    if (typeof window !== 'undefined' && window.location) {
      if (/[?&]diffmode=visual\b/.test(window.location.search)) return true;
      if (/[?&]diffmode=source\b/.test(window.location.search)) return false;
    }
    if (typeof window !== 'undefined' && window.mw && window.mw.user && typeof window.mw.user.options?.get === 'function') {
      const hist = window.mw.user.options.get('visualeditor-diffmode-historical');
      if (hist === 'visual') return true;
    }
    const widget = getDiffModeWidget();
    if (widget && typeof widget.findSelectedItem === 'function') {
      const item = widget.findSelectedItem();
      if (item && typeof item.getData === 'function') {
        return item.getData() === 'visual';
      }
    }
    const veDiff = document.querySelector(SELECTORS.VE_DIFF_ELEMENT);
    if (veDiff && veDiff.offsetParent !== null) return true;
    const visualBtn = document.querySelector(SELECTORS.VE_VISUAL_BUTTON);
    if (visualBtn && (visualBtn.classList.contains(CLASSES.OO_OPTION_SELECTED) || visualBtn.classList.contains(CLASSES.OO_BUTTON_ACTIVE) || visualBtn.getAttribute('aria-selected') === 'true')) {
      return true;
    }
    const eyeBtn = document.querySelector('.ve-init-mw-diffPage-diffMode .oo-ui-icon-eye');
    if (eyeBtn) {
      const btn = eyeBtn.closest('.oo-ui-buttonElement, .oo-ui-optionWidget');
      if (btn && (btn.classList.contains(CLASSES.OO_OPTION_SELECTED) || btn.classList.contains(CLASSES.OO_BUTTON_ACTIVE) || btn.getAttribute('aria-selected') === 'true')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Helper to retrieve the native MediaWiki inline diff toggle switch widget.
   * @returns {Object|null}
   */
  function getInlineSwitchWidget() {
    if (state.diffTypeSwitchWidget && typeof state.diffTypeSwitchWidget.setDisabled === 'function') {
      return state.diffTypeSwitchWidget;
    }
    if (typeof document !== 'undefined') {
      const swEl = document.querySelector(SELECTORS.INLINE_SWITCH);
      if (swEl) {
        if (typeof window !== 'undefined' && (window.$ || window.jQuery)) {
          const $ = window.$ || window.jQuery;
          const infused = $(swEl).data('oouiInfused');
          if (infused && typeof infused.setDisabled === 'function') {
            state.diffTypeSwitchWidget = infused;
            return state.diffTypeSwitchWidget;
          }
        }
        if (typeof window !== 'undefined' && window.OO && window.OO.ui && typeof window.OO.ui.infuse === 'function') {
          try {
            state.diffTypeSwitchWidget = window.OO.ui.infuse(swEl);
            return state.diffTypeSwitchWidget;
          } catch (e) {
            // Silently ignore infusion errors
          }
        }
      }
    }
    return null;
  }

  /**
   * Sets the disabled/inactive state of the native MediaWiki inline diff switch.
   * @param {boolean} disabled
   */
  function setInlineSwitchDisabled(disabled) {
    const swWidget = getInlineSwitchWidget();
    if (swWidget && typeof swWidget.setDisabled === 'function') {
      if (disabled && typeof swWidget.getValue === 'function' && swWidget.getValue()) {
        swWidget.setValue(false);
      }
      swWidget.setDisabled(disabled);
    }
    if (typeof document !== 'undefined') {
      const swEl = document.querySelector(SELECTORS.INLINE_SWITCH);
      if (swEl) {
        swEl.classList.toggle(CLASSES.OO_WIDGET_DISABLED, disabled);
        swEl.classList.toggle(CLASSES.OO_WIDGET_ENABLED, !disabled);
        swEl.setAttribute('aria-disabled', String(disabled));
        if (swEl.tagName === 'INPUT') {
          swEl.disabled = disabled;
        }
      }
      const field = swEl ? swEl.closest('.oo-ui-fieldLayout') : null;
      if (field) {
        field.classList.toggle(CLASSES.OO_WIDGET_DISABLED, disabled);
        field.classList.toggle(CLASSES.OO_WIDGET_ENABLED, !disabled);
        field.classList.toggle(CLASSES.OO_FIELD_DISABLED, disabled);
      }
    }
  }

  /**
   * Sets the disabled/inert state of the RefDiff OOUI button.
   * While Visual mode is active, RefDiff is visually dimmed and not interactive.
   * @param {boolean} disabled
   */
  function setRefDiffButtonDisabled(disabled) {
    if (typeof document === 'undefined') return;
    const refBtn = document.getElementById('refdiff-ooui-btn');
    if (!refBtn) return;
    if (refBtn.classList && typeof refBtn.classList.toggle === 'function') {
      refBtn.classList.toggle(CLASSES.OO_WIDGET_DISABLED, disabled);
      refBtn.classList.toggle(CLASSES.OO_WIDGET_ENABLED, !disabled);
    }
    if (typeof refBtn.setAttribute === 'function') {
      refBtn.setAttribute('aria-disabled', String(disabled));
    }
    const link = typeof refBtn.querySelector === 'function' ? refBtn.querySelector('a') : null;
    if (link && typeof link.setAttribute === 'function') {
      link.setAttribute('tabindex', disabled ? '-1' : '0');
      if (disabled) {
        link.setAttribute('aria-disabled', 'true');
      } else if (typeof link.removeAttribute === 'function') {
        link.removeAttribute('aria-disabled');
      }
    }
  }

  /**
   * Identifies the Wikitext and Visual button elements in a button group.
   * @param {HTMLElement|null} group
   * @param {HTMLElement|null} refBtn
   * @returns {{ wikiBtn: HTMLElement|null, visualBtn: HTMLElement|null }}
   */
  function findModeButtons(group, refBtn) {
    if (!group) return { wikiBtn: null, visualBtn: null };
    const children = Array.from(group.children);
    const wikiBtn = children.find(c => {
      if (c === refBtn) return false;
      const text = c.textContent.toLowerCase();
      return text.includes('wiki') || c.querySelector('.oo-ui-icon-wikiText');
    }) || null;
    const visualBtn = children.find(c => {
      if (c === refBtn) return false;
      const text = c.textContent.toLowerCase();
      return text.includes('visu') || c.querySelector('.oo-ui-icon-eye');
    }) || null;
    return { wikiBtn, visualBtn };
  }

  /**
   * Persists the visualeditor-diffmode-historical option across in-memory options and mw.Api.
   * @param {'source'|'visual'} mode
   */
  function saveDiffModeOption(mode) {
    if (typeof window === 'undefined' || !window.mw || !window.mw.user || !window.mw.user.options) return;
    if (window.mw.user.options.get('visualeditor-diffmode-historical') !== mode) {
      window.mw.user.options.set('visualeditor-diffmode-historical', mode);
    }
    if (window.mw.Api && typeof window.mw.user.isAnon === 'function' && !window.mw.user.isAnon()) {
      try {
        new window.mw.Api().saveOption('visualeditor-diffmode-historical', mode);
      } catch (_e) {
        // Silently ignore API saveOption errors
      }
    }
  }

  /**
   * Switches the diff view mode between 'visual', 'wikitext', and 'refdiff'.
   *
   * Architectural Invariants:
   * 1. Wikitext-Only Scope: RefDiff operates strictly on wikitext diffs.
   *    In 'visual' mode, RefDiff remains dormant, does not mutate the DOM, and persists refdiff-active: false.
   * 2. Disabled in Visual Mode: When 'visual' mode is active, the RefDiff button is visually dimmed
   *    and disabled (aria-disabled="true", tabindex="-1"). RefDiff mode cannot be entered directly from
   *    Visual mode; the reviewer switches to 'wikitext' first, then activates RefDiff.
   * 3. Deterministic Persistence: Explicitly choosing 'visual' or 'wikitext' sets refdiff-active: false,
   *    while choosing 'refdiff' sets refdiff-active: true.
   * 4. Non-Interfering Delegation: Native VisualEditor clicks (Visual and Wikitext) bubble in the
   *    standard phase without capture interruption; RefDiff only halts propagation on #refdiff-ooui-btn.
   *
   * @param {'visual'|'wikitext'|'refdiff'} mode
   * @param {HTMLTableElement} [table]
   * @param {boolean} [persist=true] Set to false during passive page initialization
   */
  function selectMode(mode, table, persist) {
    if (typeof persist !== 'boolean') persist = true;
    table = table || (typeof document !== 'undefined' ? document.querySelector(SELECTORS.DIFF_TABLE) : null);
    const widget = getDiffModeWidget();
    const refBtn = typeof document !== 'undefined' ? document.getElementById('refdiff-ooui-btn') : null;
    const group = refBtn ? refBtn.parentElement : null;
    const isSelect = group && group.classList.contains('oo-ui-buttonSelectWidget');
    const { wikiBtn, visualBtn } = findModeButtons(group, refBtn);

    // Fallback mode bar elements
    const btnDecoupled = typeof document !== 'undefined' ? document.getElementById('refdiff-btn-decoupled') : null;
    const btnStandard = typeof document !== 'undefined' ? document.getElementById('refdiff-btn-standard') : null;

    if (mode === 'visual') {
      restoreOriginal(table);
      if (table && typeof table.querySelectorAll === 'function') {
        const bodyRows = getDiffBodyRows(table);
        bodyRows.forEach(r => r.classList.add(CLASSES.HIDDEN));
        notifyBodyUpdate(table);
      }
      setInlineSwitchDisabled(true);
      setRefDiffButtonDisabled(true);
      if (persist) {
        setRefDiffPreferred(false);
        if (widget && typeof widget.findSelectedItem === 'function') {
          const curr = widget.findSelectedItem();
          if (!curr || (typeof curr.getData === 'function' && curr.getData() !== 'visual')) {
            const visItem = (typeof widget.getItemFromData === 'function' ? widget.getItemFromData('visual') : null) ||
                            (widget.items && widget.items.find(i => (typeof i.getData === 'function' ? i.getData() : i.data) === 'visual'));
            if (visItem && typeof widget.chooseItem === 'function') {
              widget.chooseItem(visItem);
            } else if (typeof widget.selectItemByData === 'function') {
              widget.selectItemByData('visual');
            }
          }
        }
        saveDiffModeOption('visual');
      }
      setElementActive(refBtn, false, isSelect);
      setElementActive(wikiBtn, false, isSelect);
      setElementActive(visualBtn, true, isSelect);
      if (btnStandard) btnStandard.classList.remove('active');
      if (btnDecoupled) btnDecoupled.classList.remove('active');
    } else if (mode === 'wikitext') {
      restoreOriginal(table);
      if (table && typeof table.querySelectorAll === 'function') {
        const bodyRows = getDiffBodyRows(table);
        bodyRows.forEach(r => r.classList.remove(CLASSES.HIDDEN));
        notifyBodyUpdate(table);
      }
      setInlineSwitchDisabled(false);
      setRefDiffButtonDisabled(false);
      if (persist) {
        setRefDiffPreferred(false);
        if (widget && typeof widget.findSelectedItem === 'function') {
          const curr = widget.findSelectedItem();
          if (!curr || (typeof curr.getData === 'function' && curr.getData() !== 'source')) {
            const srcItem = (typeof widget.getItemFromData === 'function' ? widget.getItemFromData('source') : null) ||
                            (widget.items && widget.items.find(i => (typeof i.getData === 'function' ? i.getData() : i.data) === 'source'));
            if (srcItem && typeof widget.chooseItem === 'function') {
              widget.chooseItem(srcItem);
            } else if (typeof widget.selectItemByData === 'function') {
              widget.selectItemByData('source');
            }
          }
        }
        saveDiffModeOption('source');
      }
      setElementActive(refBtn, false, isSelect);
      setElementActive(visualBtn, false, isSelect);
      setElementActive(wikiBtn, true, isSelect);
      if (btnStandard) btnStandard.classList.add('active');
      if (btnDecoupled) btnDecoupled.classList.remove('active');
    } else if (mode === 'refdiff') {
      if (refBtn && ((refBtn.classList && typeof refBtn.classList.contains === 'function' && refBtn.classList.contains(CLASSES.OO_WIDGET_DISABLED)) || (typeof refBtn.getAttribute === 'function' && refBtn.getAttribute('aria-disabled') === 'true'))) {
        return;
      }
      if (table && typeof table.querySelectorAll === 'function') {
        const bodyRows = getDiffBodyRows(table);
        bodyRows.forEach(r => r.classList.remove(CLASSES.HIDDEN));
      }
      setInlineSwitchDisabled(true);
      setRefDiffButtonDisabled(false);
      if (persist) {
        saveDiffModeOption('source');
        setRefDiffPreferred(true);
      }
      setElementActive(visualBtn, false, isSelect);
      setElementActive(wikiBtn, false, isSelect);
      setElementActive(refBtn, true, isSelect);
      if (btnDecoupled) btnDecoupled.classList.add('active');
      if (btnStandard) btnStandard.classList.remove('active');
      applyDecoupling(table);
      if (table) {
        notifyBodyUpdate(table);
      }
    }

    // Synchronize Inline modified refs toggle availability with RefDiff mode
    const toggleCheckbox = typeof document !== 'undefined'
      ? (document.getElementById('refdiff-inline-toggle') || document.getElementById('refdiff-decouple-toggle'))
      : null;
    const toggleContainer = typeof document !== 'undefined'
      ? (document.getElementById('refdiff-inline-container') || document.getElementById('refdiff-decouple-container'))
      : null;
    if (toggleCheckbox) {
      toggleCheckbox.disabled = (mode !== 'refdiff');
    }
    if (toggleContainer) {
      if (mode === 'refdiff') {
        toggleContainer.classList.remove(CLASSES.OO_WIDGET_DISABLED);
        toggleContainer.classList.add(CLASSES.OO_WIDGET_ENABLED);
      } else {
        toggleContainer.classList.remove(CLASSES.OO_WIDGET_ENABLED);
        toggleContainer.classList.add(CLASSES.OO_WIDGET_DISABLED);
      }
    }
  }

  /**
   * Synchronizes RefDiff button state with Wikitext and Visual buttons in the diff mode selector.
   * Backward-compatible alias for selectMode.
   * @param {boolean} active
   * @param {HTMLTableElement} [table]
   */
  function updateButtonState(active, table) {
    selectMode(active ? 'refdiff' : 'wikitext', table);
  }
  /* === [END VIRTUAL FILE: src/mode_coordinator.js] === */
