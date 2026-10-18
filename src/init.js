  /* ==========================================================================
     VIRTUAL FILE: src/init.js
     Description: Environment and page detection, OOUI mode button injection,
                  fallback mode bar creation, lifecycle wiring, and auto-start.
     ========================================================================== */

  // --- Environment & Page Detection ---

  /**
   * Checks whether the current page is a MediaWiki diff view.
   * @returns {boolean}
   */
  function isDiffPage() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    return !!(
      (window.mw && window.mw.config && (window.mw.config.get('wgDiffNewId') || window.mw.config.get('wgDiffOldId'))) ||
      document.querySelector(SELECTORS.DIFF_TABLE) ||
      document.getElementById('wikiDiff') ||
      /[?&]diff=/.test(location.search) ||
      /\/wiki\/Special:Diff\//.test(location.pathname)
    );
  }

  /**
   * Creates the Inline modified refs toggle checkbox element.
   * Constructed purely with DOM elements via el() (fixes M1).
   * @param {boolean} [isChecked]
   * @returns {HTMLElement|null}
   */
  function createInlineToggle(isChecked) {
    const isInline = typeof isChecked === 'boolean' ? isChecked : isInlineModifiedPreferred();
    const inputAttrs = {
      type: 'checkbox',
      id: 'refdiff-inline-toggle',
      class: 'refdiff-inline-checkbox refdiff-decouple-checkbox'
    };
    if (isInline) {
      inputAttrs.checked = 'checked';
    }
    const input = el('input', inputAttrs);
    if (input && isInline) input.checked = true;

    const label = el('label', { class: 'refdiff-inline-label refdiff-decouple-label' },
      input,
      el('span', { class: 'refdiff-inline-text refdiff-decouple-text' }, 'Inline modified refs')
    );

    return el('span', {
      id: 'refdiff-inline-container',
      class: 'refdiff-inline-container refdiff-decouple-container oo-ui-widget oo-ui-widget-enabled',
      title: 'When checked, keeps modified references inline in prose with a prepended badge instead of decoupling them into separate rows below'
    }, label);
  }

  /**
   * Backward-compatible alias for createInlineToggle.
   * @param {boolean} [isChecked]
   * @returns {HTMLElement|null}
   */
  function createDecoupleToggle(isChecked) {
    return createInlineToggle(isChecked);
  }

  /**
   * Binds the change event listener to the Inline modified refs toggle checkbox.
   * @param {HTMLTableElement} [table]
   */
  function bindInlineToggleListener(table) {
    if (typeof document === 'undefined') return;
    const toggle = document.getElementById('refdiff-inline-toggle') || document.getElementById('refdiff-decouple-toggle');
    if (!toggle || toggle._refdiffBound) return;
    toggle._refdiffBound = true;
    toggle.addEventListener('change', (e) => {
      const isInline = !!e.target.checked;
      setInlineModifiedPreferred(isInline);
      if (isRefDiffPreferred() && !isVisualDiffActive()) {
        const diffTable = table || document.querySelector(SELECTORS.DIFF_TABLE);
        if (diffTable) {
          restoreOriginal(diffTable);
          applyDecoupling(diffTable, { inlineModified: isInline, separateChanged: !isInline });
          notifyBodyUpdate(diffTable);
        }
      }
    });
  }

  /**
   * Backward-compatible alias for bindInlineToggleListener.
   * @param {HTMLTableElement} [table]
   */
  function bindDecoupleToggleListener(table) {
    return bindInlineToggleListener(table);
  }

  /**
   * Creates the OOUI RefDiff button element matching MediaWiki's ButtonOptionWidget.
   * Constructed purely with DOM elements via el() (fixes M1).
   * @param {boolean} isSelect True if part of an OOUI ButtonSelectWidget
   * @param {boolean} [disabled=false] True if button should be initialized in disabled state (e.g. Visual mode)
   * @returns {HTMLElement|null}
   */
  function createRefDiffButton(isSelect, disabled) {
    const baseClasses = isSelect
      ? 'oo-ui-widget oo-ui-labelElement oo-ui-optionWidget oo-ui-buttonElement oo-ui-buttonElement-framed oo-ui-buttonElement-size-medium oo-ui-iconElement oo-ui-buttonOptionWidget'
      : 'oo-ui-widget oo-ui-buttonElement oo-ui-buttonElement-framed oo-ui-buttonElement-size-medium oo-ui-iconElement oo-ui-labelElement oo-ui-buttonWidget';
    const stateClass = disabled ? CLASSES.OO_WIDGET_DISABLED : CLASSES.OO_WIDGET_ENABLED;

    return el(isSelect ? 'div' : 'span', {
      id: 'refdiff-ooui-btn',
      class: `${baseClasses} ${stateClass}`,
      role: isSelect ? 'option' : 'button',
      'aria-disabled': String(!!disabled),
      title: `RefDiff v${VERSION}: Decoupled citation diff view`
    },
      el('a', {
        class: 'oo-ui-buttonElement-button',
        role: 'button',
        tabindex: disabled ? '-1' : '0',
        rel: 'nofollow'
      },
        el('span', { class: 'oo-ui-iconElement-icon oo-ui-icon-diffs' }),
        el('span', { class: 'oo-ui-labelElement-label' }, 'RefDiff'),
        el('span', { class: 'oo-ui-indicatorElement-indicator oo-ui-indicatorElement-noIndicator' })
      )
    );
  }

  /**
   * Creates a fallback mode bar for MediaWiki skins lacking the OOUI diff mode switcher.
   * Constructed purely with DOM elements via el() (fixes M1).
   * @param {boolean} shouldDecouple
   * @param {boolean} [inlineModified]
   * @returns {HTMLDivElement|null}
   */
  function createFallbackModeBar(shouldDecouple, inlineModified) {
    const isInline = typeof inlineModified === 'boolean' ? inlineModified : isInlineModifiedPreferred();
    const inputAttrs = {
      type: 'checkbox',
      id: 'refdiff-inline-toggle',
      class: 'refdiff-inline-checkbox refdiff-decouple-checkbox'
    };
    if (isInline) {
      inputAttrs.checked = 'checked';
    }
    const input = el('input', inputAttrs);
    if (input && isInline) input.checked = true;

    return el('div', { id: 'refdiff-mode-bar', class: 'refdiff-mode-bar' },
      el('span', { id: 'refdiff-inline-container', class: 'refdiff-inline-container refdiff-decouple-container' },
        el('label', { class: 'refdiff-inline-label refdiff-decouple-label' },
          input,
          el('span', { class: 'refdiff-inline-text refdiff-decouple-text' }, 'Inline modified refs')
        )
      ),
      el('span', { class: 'refdiff-mode-separator' }, '•'),
      el('strong', null, 'Diff view:'),
      ' ',
      el('a', {
        href: '#',
        id: 'refdiff-btn-decoupled',
        class: shouldDecouple ? 'active' : '',
        title: `RefDiff v${VERSION}: Decoupled citation diff view`
      }, 'Decoupled (RefDiff)'),
      ' • ',
      el('a', { href: '#', id: 'refdiff-btn-standard', class: shouldDecouple ? '' : 'active' }, 'Standard Wikidiff')
    );
  }

  /**
   * Initializes the RefDiff gadget on the current page.
   */
  function init() {
    if (typeof document === 'undefined') return;
    const table = document.querySelector(SELECTORS.DIFF_TABLE);
    if (!table || document.getElementById('refdiff-ooui-btn') || document.getElementById('refdiff-mode-bar')) return;

    // Inject minimal badge styling
    if (!document.getElementById('refdiff-badge-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'refdiff-badge-styles';
      styleEl.textContent = BADGE_STYLES;
      document.head.appendChild(styleEl);
    }

    const buttonGroup = document.querySelector(SELECTORS.VE_BUTTON_GROUP);
    const diffModeContainer = document.querySelector(SELECTORS.VE_DIFF_CONTAINER);

    // If diffMode container is present but buttonGroup children are not yet populated, retry briefly
    if (!buttonGroup && diffModeContainer && state.initRetries < 5) {
      state.initRetries++;
      setTimeout(init, 100);
      return;
    }

    const isVisual = isVisualDiffActive();
    const shouldDecouple = isRefDiffPreferred();

    if (buttonGroup) {
      if (document.getElementById('refdiff-ooui-btn')) return;

      // 1. Mount Inline modified refs toggle inline before native inline toggle switch if in .mw-diff-table-prefix
      if (!document.getElementById('refdiff-inline-container') && !document.getElementById('refdiff-decouple-container')) {
        const toggleEl = createInlineToggle(isInlineModifiedPreferred());
        const prefix = diffModeContainer && typeof diffModeContainer.closest === 'function' ? diffModeContainer.closest('.mw-diff-table-prefix') : null;
        const inlineContainer = prefix ? prefix.querySelector('.mw-diffPage-inlineToggle-container') : null;
        if (prefix && inlineContainer) {
          prefix.insertBefore(toggleEl, inlineContainer);
        } else if (diffModeContainer && typeof diffModeContainer.insertBefore === 'function') {
          diffModeContainer.insertBefore(toggleEl, buttonGroup);
        } else if (buttonGroup.parentNode && typeof buttonGroup.parentNode.insertBefore === 'function') {
          buttonGroup.parentNode.insertBefore(toggleEl, buttonGroup);
        }
        bindInlineToggleListener(table);
      }

      const isSelect = buttonGroup.classList.contains('oo-ui-buttonSelectWidget');
      const refBtn = createRefDiffButton(isSelect, isVisual);
      buttonGroup.appendChild(refBtn);

      // ONLY activate RefDiff when wikitext is active!
      // If Visual is active, keep Visual mode active and dim/disable RefDiff button.
      if (isVisual) {
        selectMode('visual', table, false);
      } else if (shouldDecouple) {
        selectMode('refdiff', table, false);
      } else {
        selectMode('wikitext', table, false);
      }

      // Delegated click handling on diffModeContainer in capture phase
      if (diffModeContainer && !diffModeContainer._refdiffBound) {
        diffModeContainer._refdiffBound = true;
        diffModeContainer.addEventListener('click', (e) => {
          const btn = e.target.closest('.oo-ui-buttonElement, .oo-ui-buttonWidget, .oo-ui-buttonOptionWidget, [role="button"], [role="option"]');
          if (!btn) return;
          if (btn.id === 'refdiff-ooui-btn' || (typeof btn.closest === 'function' && btn.closest('#refdiff-ooui-btn'))) {
            e.preventDefault();
            e.stopPropagation();
            if ((btn.classList && typeof btn.classList.contains === 'function' && btn.classList.contains(CLASSES.OO_WIDGET_DISABLED)) || (typeof btn.getAttribute === 'function' && btn.getAttribute('aria-disabled') === 'true')) {
              return;
            }
            selectMode('refdiff', table);
          } else if (
            btn.querySelector('.oo-ui-icon-wikiText') ||
            (btn.closest('.oo-ui-buttonOptionWidget') && btn.closest('.oo-ui-buttonOptionWidget').querySelector('.oo-ui-icon-wikiText')) ||
            btn.textContent.toLowerCase().includes('wiki')
          ) {
            selectMode('wikitext', table);
          } else if (
            btn.querySelector('.oo-ui-icon-eye') ||
            (btn.closest('.oo-ui-buttonOptionWidget') && btn.closest('.oo-ui-buttonOptionWidget').querySelector('.oo-ui-icon-eye')) ||
            btn.textContent.toLowerCase().includes('visu')
          ) {
            selectMode('visual', table);
          }
        }, true);

        // Also synchronize with OOUI widget select event if available
        const widget = getDiffModeWidget();
        if (widget && !widget._refdiffBound) {
          widget._refdiffBound = true;
          widget.on('select', (item) => {
            if (!item) return;
            const data = item.getData();
            if (data === 'visual') {
              selectMode('visual', table);
            } else if (data === 'source') {
              selectMode('wikitext', table);
            }
          });
        }

        // Watch for VisualEditor DOM re-renders of the button container
        const ObsClass = (typeof window !== 'undefined' && window.MutationObserver) || (typeof MutationObserver !== 'undefined' ? MutationObserver : null);
        if (ObsClass) {
          const observer = new ObsClass(() => {
            if (!document.getElementById('refdiff-ooui-btn')) {
              init();
            }
          });
          observer.observe(diffModeContainer, { childList: true, subtree: true });
        }
      }
    } else {
      if (document.getElementById('refdiff-mode-bar')) return;
      const modeBar = createFallbackModeBar(shouldDecouple);
      table.parentNode.insertBefore(modeBar, table);
      bindDecoupleToggleListener(table);

      const btnDecoupled = document.getElementById('refdiff-btn-decoupled');
      const btnStandard = document.getElementById('refdiff-btn-standard');

      if (btnStandard) {
        btnStandard.addEventListener('click', (e) => {
          e.preventDefault();
          selectMode('wikitext', table);
        });
      }

      if (btnDecoupled) {
        btnDecoupled.addEventListener('click', (e) => {
          e.preventDefault();
          selectMode('refdiff', table);
        });
      }
    }

    // Apply decoupled transformation if preferred and not in visual diff mode
    if (shouldDecouple && !isVisual) {
      setInlineSwitchDisabled(true);
      applyDecoupling(table);
    } else if (!isVisual) {
      setInlineSwitchDisabled(false);
    }

    // Ensure interoperability with diffedit.js (https://meta.wikimedia.org/wiki/User:Jon_Harald_Søby/diffedit)
    if (table && !table._refdiffDiffeditBound) {
      table._refdiffDiffeditBound = true;
      if (typeof MutationObserver !== 'undefined') {
        const editObserver = new MutationObserver(() => {
          if (table.classList && table.classList.contains('diff-editmode') && state.isDecoupled) {
            selectMode('wikitext', table);
          }
        });
        editObserver.observe(table, { attributes: true, attributeFilter: ['class'] });
      }
      if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('click', (e) => {
          const editBtn = e.target && e.target.closest && e.target.closest('.diffedit-editbutton');
          if (editBtn && state.isDecoupled) {
            selectMode('wikitext', table);
          }
        }, true);
      }
    }
  }

  // --- Auto-start in browser environment ---
  if (typeof window !== 'undefined' && isDiffPage()) {
    if (window.mw && window.mw.hook) {
      window.mw.hook(HOOKS.DIFF_TYPE_SWITCH).add((sw) => {
        state.diffTypeSwitchWidget = sw;
        if (isRefDiffPreferred() && !isVisualDiffActive()) {
          setInlineSwitchDisabled(true);
        }
      });
      window.mw.hook(HOOKS.DIFF_PAGE).add(init);
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 50);
      }
    } else if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
  /* === [END VIRTUAL FILE: src/init.js] === */
