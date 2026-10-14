/**
 * tests/test_init.js
 *
 * Tests for src/init.js: Page detection and MediaWiki diff view discovery.
 */

const { assert, suite, test, withMockEnvironment, setupMockStorage, finishStandalone } = require('./harness.js');
const { JSDOM } = require('jsdom');
const {
  isDiffPage,
  createRefDiffButton,
  createFallbackModeBar,
  createInlineToggle,
  createDecoupleToggle,
  bindInlineToggleListener,
  bindDecoupleToggleListener,
  init,
  restoreOriginal,
  isInlineModifiedPreferred,
  isSeparateChangedPreferred
} = require('../refdiff.js');

const getDoc = () => (new JSDOM()).window.document;

suite('src/init.js - Page Detection', () => {
  test('isDiffPage accurately identifies MediaWiki diff views across multiple signals', () => {
    // 1. Non-browser environment
    withMockEnvironment({ window: undefined, document: undefined, location: undefined }, () => {
      assert.strictEqual(isDiffPage(), false);
    });

    // 2. Query param diff=
    withMockEnvironment({
      window: { mw: null },
      location: { search: '?title=Test&diff=123', pathname: '/w/index.php' },
      document: { querySelector: () => null, getElementById: () => null }
    }, () => {
      assert.strictEqual(isDiffPage(), true);
    });

    // 3. Special:Diff pathname
    withMockEnvironment({
      window: { mw: null },
      location: { search: '', pathname: '/wiki/Special:Diff/12345' },
      document: { querySelector: () => null, getElementById: () => null }
    }, () => {
      assert.strictEqual(isDiffPage(), true);
    });

    // 4. MediaWiki config wgDiffNewId
    withMockEnvironment({
      window: { mw: { config: { get: (k) => k === 'wgDiffNewId' ? 123 : null } } },
      location: { search: '', pathname: '/wiki/Test' },
      document: { querySelector: () => null, getElementById: () => null }
    }, () => {
      assert.strictEqual(isDiffPage(), true);
    });

    // 5. Native diff table in DOM
    withMockEnvironment({
      window: { mw: null },
      location: { search: '', pathname: '/wiki/Test' },
      document: { querySelector: (sel) => sel === 'table.diff' ? {} : null, getElementById: () => null }
    }, () => {
      assert.strictEqual(isDiffPage(), true);
    });

    // 6. #wikiDiff element in DOM
    withMockEnvironment({
      window: { mw: null },
      location: { search: '', pathname: '/wiki/Test' },
      document: { querySelector: () => null, getElementById: (id) => id === 'wikiDiff' ? {} : null }
    }, () => {
      assert.strictEqual(isDiffPage(), true);
    });

    // 7. Non-diff page returns false
    withMockEnvironment({
      window: { mw: null },
      location: { search: '', pathname: '/wiki/Test' },
      document: { querySelector: () => null, getElementById: () => null }
    }, () => {
      assert.strictEqual(isDiffPage(), false);
    });
  });

  test('createRefDiffButton creates OOUI button matching ButtonOptionWidget or ButtonWidget', () => {
    withMockEnvironment({ document: getDoc() }, () => {
      const selectBtn = createRefDiffButton(true);
      assert.strictEqual(selectBtn.tagName, 'DIV');
      assert.strictEqual(selectBtn.getAttribute('role') || selectBtn.role, 'option');
      assert.strictEqual(selectBtn.className.includes('oo-ui-buttonOptionWidget'), true);

      const normalBtn = createRefDiffButton(false);
      assert.strictEqual(normalBtn.tagName, 'SPAN');
      assert.strictEqual(normalBtn.getAttribute('role') || normalBtn.role, 'button');
      assert.strictEqual(normalBtn.className.includes('oo-ui-buttonWidget'), true);
    });
  });

  test('createDecoupleToggle renders checkbox container with correct state', () => {
    withMockEnvironment({ document: getDoc() }, () => {
      const toggleTrue = createInlineToggle(true);
      assert.strictEqual(toggleTrue.id, 'refdiff-inline-container');
      assert.strictEqual(toggleTrue.innerHTML.includes('checked'), true);
      assert.strictEqual(toggleTrue.innerHTML.includes('Inline modified refs'), true);

      const toggleFalse = createInlineToggle(false);
      assert.strictEqual(toggleFalse.innerHTML.includes('checked'), false);
      assert.strictEqual(toggleFalse.innerHTML.includes('Inline modified refs'), true);

      // Backward-compatible alias
      const aliasToggle = createDecoupleToggle(false);
      assert.strictEqual(aliasToggle.innerHTML.includes('Inline modified refs'), true);
    });
  });

  test('bindInlineToggleListener safely handles missing DOM and toggles preference on change', () => {
    // 1. Missing document
    withMockEnvironment({ document: undefined }, () => {
      assert.doesNotThrow(() => bindInlineToggleListener());
    });

    // 2. Missing toggle element
    withMockEnvironment({
      document: { getElementById: () => null }
    }, () => {
      assert.doesNotThrow(() => bindInlineToggleListener());
    });

    // 3. Active toggle element
    let changeHandler = null;

    const mockCheckbox = {
      id: 'refdiff-inline-toggle',
      checked: false,
      addEventListener(event, fn) {
        if (event === 'change') changeHandler = fn;
      }
    };

    const mockTable = {
      querySelector: () => null,
      querySelectorAll: () => []
    };

    const { mockWindow } = setupMockStorage('localStorage');
    withMockEnvironment({
      document: {
        getElementById: (id) => (id === 'refdiff-inline-toggle' ? mockCheckbox : null),
        querySelector: () => mockTable
      },
      window: mockWindow
    }, () => {
      bindInlineToggleListener(mockTable);
      assert.strictEqual(typeof bindDecoupleToggleListener, 'function', 'bindDecoupleToggleListener should exist as alias');
      assert.strictEqual(typeof changeHandler, 'function', 'Change handler should be attached');

      // Trigger check event (enable inline modified references)
      changeHandler({ target: { checked: true } });
      assert.strictEqual(isInlineModifiedPreferred(), true, 'Preference should become true (inline)');
      assert.strictEqual(isSeparateChangedPreferred(), false, 'Legacy separate preference should become false');

      // Trigger uncheck event (revert to full decoupling)
      changeHandler({ target: { checked: false } });
      assert.strictEqual(isInlineModifiedPreferred(), false, 'Preference should become false (not inline)');
      assert.strictEqual(isSeparateChangedPreferred(), true, 'Legacy separate preference should become true');
    });
  });

  test('createFallbackModeBar renders mode bar with appropriate active link', () => {
    withMockEnvironment({ document: getDoc() }, () => {
      const barTrue = createFallbackModeBar(true);
      assert.strictEqual(barTrue.innerHTML.includes('id="refdiff-btn-decoupled" class="active"'), true);
      assert.strictEqual(barTrue.innerHTML.includes('Inline modified refs'), true);
      const barFalse = createFallbackModeBar(false);
      assert.strictEqual(barFalse.innerHTML.includes('id="refdiff-btn-standard" class="active"'), true);
    });
  });

  test('init handles missing DOM or missing diff table gracefully', () => {
    withMockEnvironment({ document: undefined }, () => {
      assert.doesNotThrow(() => init());
    });

    withMockEnvironment({
      document: {
        querySelector: () => null,
        getElementById: () => null
      }
    }, () => {
      assert.doesNotThrow(() => init());
    });
  });

  test('init renders fallback mode bar and binds switch listeners when OOUI bar absent', () => {
    let insertedBar = null;
    let clickHandlerDecoupled = null;
    let clickHandlerStandard = null;

    const mockBtnDecoupled = {
      classList: { add() {}, remove() {} },
      addEventListener(event, fn) { clickHandlerDecoupled = fn; }
    };
    const mockBtnStandard = {
      classList: { add() {}, remove() {} },
      addEventListener(event, fn) { clickHandlerStandard = fn; }
    };

    const mockTable = {
      querySelector: () => null,
      querySelectorAll: () => [],
      parentNode: {
        insertBefore: (el) => { insertedBar = el; }
      }
    };

    withMockEnvironment({
      document: {
        head: { appendChild: () => {} },
        createElement: (tag) => ({
          tagName: tag.toUpperCase(),
          id: '',
          className: '',
          innerHTML: '',
          setAttribute() {},
          removeAttribute() {},
          classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
          querySelector: () => null
        }),
        querySelector: (sel) => (sel === 'table.diff' ? mockTable : null),
        getElementById: (id) => {
          if (id === 'refdiff-btn-decoupled') return mockBtnDecoupled;
          if (id === 'refdiff-btn-standard') return mockBtnStandard;
          return null;
        },
        querySelectorAll: () => []
      }
    }, () => {
      init();
      assert.notStrictEqual(insertedBar, null, 'Fallback bar should be inserted before table');
      assert.strictEqual(typeof clickHandlerDecoupled, 'function', 'Decoupled button should have click handler');
      assert.strictEqual(typeof clickHandlerStandard, 'function', 'Standard button should have click handler');
      clickHandlerDecoupled({ preventDefault() {} });
      clickHandlerStandard({ preventDefault() {} });
      restoreOriginal(mockTable);
    });
  });

  test('init mounts OOUI button into buttonGroup and attaches mutation observer', () => {
    let appendedBtn = null;
    let containerClickListener = null;

    const mockButtonGroup = {
      classList: { contains: () => true },
      appendChild: (el) => { appendedBtn = el; }
    };

    const mockContainer = {
      classList: { contains: () => false },
      getAttribute: () => null,
      addEventListener: (event, fn) => { containerClickListener = fn; }
    };

    const mockTable = {
      querySelector: () => null,
      querySelectorAll: () => [],
      parentNode: { insertBefore: () => {} }
    };

    let observerCallback = null;
    const observedTargets = [];
    class MockMutationObserver {
      constructor(cb) { observerCallback = cb; }
      observe(target) {
        observedTargets.push(target);
      }
      disconnect() {}
    }

    let widgetSelectHandler = null;
    const mockWidget = {
      on: (event, fn) => {
        if (event === 'select') widgetSelectHandler = fn;
      },
      findSelectedItem: () => ({ getData: () => 'source' }),
      selectItemByData: () => {}
    };
    const mockOpt = {};
    const mockJquery = () => ({
      data: (key) => (key === 'oo-ui-optionWidget' ? { getElementGroup: () => mockWidget } : null)
    });

    withMockEnvironment({
      MutationObserver: MockMutationObserver,
      window: { $: mockJquery },
      document: {
        head: { appendChild: () => {} },
        createElement: (tag) => ({
          tagName: tag.toUpperCase(),
          id: '',
          className: '',
          innerHTML: '',
          setAttribute() {},
          removeAttribute() {},
          classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
          querySelector: () => null
        }),
        querySelector: (sel) => {
          if (sel === 'table.diff') return mockTable;
          if (sel.includes('.oo-ui-buttonSelectWidget')) return mockButtonGroup;
          if (sel === '.ve-init-mw-diffPage-diffMode') return mockContainer;
          if (sel.includes('oo-ui-optionWidget')) return mockOpt;
          return null;
        },
        getElementById: () => null,
        querySelectorAll: () => []
      }
    }, () => {
      init();
      assert.notStrictEqual(appendedBtn, null, 'OOUI button should be appended to group');
      assert.strictEqual(typeof containerClickListener, 'function', 'Diff mode container should have click listener');
      assert.strictEqual(observedTargets.includes(mockContainer), true, 'Container should be observed for mutations');

      // 1. Click refdiff button
      let preventDefaultCalled = false;
      let stopPropagationCalled = false;
      const refBtnEl = {
        id: 'refdiff-ooui-btn',
        closest: () => true
      };
      containerClickListener({
        preventDefault: () => { preventDefaultCalled = true; },
        stopPropagation: () => { stopPropagationCalled = true; },
        target: { closest: () => refBtnEl }
      });
      assert.strictEqual(preventDefaultCalled, true, 'RefDiff button click calls preventDefault');
      assert.strictEqual(stopPropagationCalled, true, 'RefDiff button click calls stopPropagation');

      // 2. Click wikitext button
      const wikiBtnEl = {
        querySelector: () => true,
        textContent: 'Wikitext',
        closest: () => false
      };
      containerClickListener({
        preventDefault: () => {},
        stopPropagation: () => {},
        target: { closest: () => wikiBtnEl }
      });

      // 3. Click visual button
      const visualBtnEl = {
        querySelector: () => true,
        textContent: 'Visual',
        closest: () => false
      };
      containerClickListener({
        preventDefault: () => {},
        stopPropagation: () => {},
        target: { closest: () => visualBtnEl }
      });

      // 4. Test OOUI widget select event handler
      assert.strictEqual(typeof widgetSelectHandler, 'function', 'Widget select handler should be registered');
      widgetSelectHandler(null);
      widgetSelectHandler({ getData: () => 'visual' });
      widgetSelectHandler({ getData: () => 'source' });

      // 5. Test MutationObserver re-render callback
      assert.strictEqual(typeof observerCallback, 'function', 'Mutation observer callback should be registered');
      observerCallback();

      restoreOriginal(mockTable);
    });
  });

  test('browser auto-start registers diffTypeSwitch hook and synchronizes switch state', () => {
    let hookCallback = null;
    const mockMw = {
      hook: (name) => ({
        add: (fn) => {
          if (name === 'wikipage.diff.diffTypeSwitch') hookCallback = fn;
        }
      })
    };

    let disabledState = null;
    const mockSwitchWidget = {
      setDisabled: (val) => { disabledState = val; }
    };

    withMockEnvironment({
      window: {
        mw: mockMw,
        location: { search: '?diff=123' }
      },
      location: { search: '?diff=123' },
      document: {
        readyState: 'complete',
        querySelector: () => null,
        getElementById: () => null
      }
    }, () => {
      delete require.cache[require.resolve('../refdiff.js')];
      require('../refdiff.js');
      assert.strictEqual(typeof hookCallback, 'function', 'Should register diffTypeSwitch hook');
      hookCallback(mockSwitchWidget);
      assert.strictEqual(disabledState, true, 'Should disable inline diff switch when refdiff preferred');
    });

    delete require.cache[require.resolve('../refdiff.js')];
    require('../refdiff.js');
  });

  test('diffedit compatibility: citation rows do not trigger diffedit line enumeration and diff-editmode restores wikitext', () => {
    const { createCitRow, selectMode } = require('../refdiff.js');

    let docClickListener = null;
    let observerCb = null;
    class MockMutationObserver {
      constructor(cb) { observerCb = cb; }
      observe() {}
      disconnect() {}
    }

    const classList = new Set();
    const mockTable = {
      classList: {
        contains: (c) => classList.has(c),
        add: (c) => classList.add(c),
        remove: (c) => classList.delete(c)
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      parentNode: { insertBefore: () => {} }
    };

    withMockEnvironment({
      MutationObserver: MockMutationObserver,
      document: {
        head: { appendChild: () => {} },
        createElement: (tag) => getDoc().createElement(tag || 'div'),
        querySelector: (sel) => (sel === 'table.diff' ? mockTable : null),
        getElementById: () => null,
        querySelectorAll: () => [],
        addEventListener: (event, fn) => {
          if (event === 'click') docClickListener = fn;
        }
      }
    }, () => {
      const citRow = createCitRow({
        label: 'test',
        oldRaw: '<ref>old</ref>',
        newRaw: '<ref>new</ref>',
        rowId: 'refdiff-cit-test-1'
      });
      const html = citRow.innerHTML;
      assert.strictEqual(html.includes('class="diff-addedline'), false, 'Citation row must not contain diff-addedline class');
      assert.strictEqual(html.includes('class="diff-context'), false, 'Citation row must not contain diff-context class');
      assert.strictEqual(html.includes('refdiff-cit-addedline'), true, 'Citation row uses refdiff-cit-addedline for styling');

      init();
      selectMode('refdiff', mockTable);
      assert.strictEqual(typeof observerCb, 'function', 'Diffedit observer callback should be registered');
      assert.strictEqual(typeof docClickListener, 'function', 'Document click listener for diffedit should be registered');

      classList.add('diff-editmode');
      observerCb();

      selectMode('refdiff', mockTable);
      docClickListener({
        target: {
          closest: (sel) => (sel === '.diffedit-editbutton' ? {} : null)
        }
      });
      restoreOriginal(mockTable);
    });
  });
});

if (require.main === module) {
  finishStandalone();
}
