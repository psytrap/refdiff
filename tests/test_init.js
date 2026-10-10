/**
 * tests/test_init.js
 *
 * Tests for src/init.js: Page detection and MediaWiki diff view discovery.
 */

const { assert, suite, test, withMockEnvironment, finishStandalone } = require('./harness.js');
const { isDiffPage, createRefDiffButton, createFallbackModeBar, init, restoreOriginal } = require('../refdiff.js');

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
    withMockEnvironment({
      document: {
        createElement: (tag) => ({
          tagName: tag.toUpperCase(),
          id: '',
          className: '',
          innerHTML: '',
          setAttribute(k, v) { this[k] = v; },
          removeAttribute() {}
        })
      }
    }, () => {
      const selectBtn = createRefDiffButton(true);
      assert.strictEqual(selectBtn.tagName, 'DIV');
      assert.strictEqual(selectBtn.role, 'option');
      assert.strictEqual(selectBtn.className.includes('oo-ui-buttonOptionWidget'), true);

      const normalBtn = createRefDiffButton(false);
      assert.strictEqual(normalBtn.tagName, 'SPAN');
      assert.strictEqual(normalBtn.role, 'button');
      assert.strictEqual(normalBtn.className.includes('oo-ui-buttonWidget'), true);
    });
  });

  test('createFallbackModeBar renders mode bar with appropriate active link', () => {
    withMockEnvironment({
      document: {
        createElement: (tag) => ({
          tagName: tag.toUpperCase(),
          id: '',
          className: '',
          innerHTML: '',
          setAttribute() {},
          removeAttribute() {}
        })
      }
    }, () => {
      const barTrue = createFallbackModeBar(true);
      assert.strictEqual(barTrue.innerHTML.includes('id="refdiff-btn-decoupled" class="active"'), true);
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
    let observedTarget = null;

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
    class MockMutationObserver {
      constructor(cb) { observerCallback = cb; }
      observe(target) { observedTarget = target; }
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
      assert.strictEqual(observedTarget, mockContainer, 'Container should be observed for mutations');

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
});

if (require.main === module) {
  finishStandalone();
}
