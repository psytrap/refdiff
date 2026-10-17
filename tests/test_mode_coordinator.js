/**
 * tests/test_mode_coordinator.js
 *
 * Tests for src/mode_coordinator.js: 3-way mode switching (visual/wikitext/refdiff) & switch locks.
 */

const { assert, suite, test, withMockEnvironment, setupMockStorage, finishStandalone } = require('./harness.js');
const {
  isVisualDiffActive,
  selectMode,
  updateButtonState,
  isRefDiffPreferred,
  isSeparateChangedPreferred,
  setSeparateChangedPreferred,
  isInlineModifiedPreferred,
  setInlineModifiedPreferred,
  STORAGE_KEY_SEPARATE,
  STORAGE_KEY_INLINE,
  setInlineSwitchDisabled,
  restoreOriginal
} = require('../refdiff.js');

suite('src/mode_coordinator.js - Mode Switching & Locks', () => {
  test('isVisualDiffActive returns false in non-browser environment', () => {
    withMockEnvironment({ window: undefined }, () => {
      assert.strictEqual(isVisualDiffActive(), false);
    });
  });

  test('selectMode toggles preference correctly across modes', () => {
    const { mockWindow } = setupMockStorage('localStorage');
    withMockEnvironment({ window: mockWindow }, () => {
      const mockTable = { innerHTML: '<tr><td>diff</td></tr>' };

      selectMode('refdiff', mockTable);
      assert.strictEqual(isRefDiffPreferred(), true);

      // Direct switch from refdiff to visual must set preference to false
      selectMode('visual', mockTable);
      assert.strictEqual(isRefDiffPreferred(), false);

      // Direct switch from visual back to refdiff (programmatic API invocation)
      selectMode('refdiff', mockTable);
      assert.strictEqual(isRefDiffPreferred(), true);

      // Direct switch from refdiff to wikitext must set preference to false
      selectMode('wikitext', mockTable);
      assert.strictEqual(isRefDiffPreferred(), false);
    });
  });

  test('selectMode ignores refdiff activation when button is disabled', () => {
    const { mockWindow } = setupMockStorage('localStorage');
    mockWindow.localStorage.setItem('refdiff-active', 'false');
    const mockBtn = {
      id: 'refdiff-ooui-btn',
      classList: {
        contains: (cls) => cls === 'oo-ui-widget-disabled'
      },
      getAttribute: (attr) => (attr === 'aria-disabled' ? 'true' : null)
    };
    mockWindow.document = {
      getElementById: (id) => (id === 'refdiff-ooui-btn' ? mockBtn : null),
      querySelector: () => null
    };
    withMockEnvironment({ window: mockWindow, document: mockWindow.document }, () => {
      const mockTable = { innerHTML: '<tr><td>diff</td></tr>' };
      assert.strictEqual(isRefDiffPreferred(), false);
      selectMode('refdiff', mockTable);
      assert.strictEqual(isRefDiffPreferred(), false);
    });
  });

  test('updateButtonState acts as backward-compatible alias to selectMode', () => {
    const { mockWindow } = setupMockStorage('localStorage');
    withMockEnvironment({ window: mockWindow }, () => {
      const mockTable = { innerHTML: '<tr><td>diff</td></tr>' };
      updateButtonState(true, mockTable);
      assert.strictEqual(isRefDiffPreferred(), true);
      updateButtonState(false, mockTable);
      assert.strictEqual(isRefDiffPreferred(), false);
    });
  });

  test('selectMode toggles oo-ui-element-hidden on body rows and notifies mw.hook', () => {
    let hookFiredWith = null;
    const addedClasses = [];
    const removedClasses = [];
    const bodyRow = {
      className: '',
      classList: {
        add(c) { addedClasses.push(c); },
        remove(c) { removedClasses.push(c); }
      }
    };
    const mockTable = {
      querySelectorAll(selector) {
        if (selector === 'tr.diff-title') return [];
        if (selector.includes('diff-multi') || selector.includes('diff-notice')) return [];
        if (selector === 'tr') return [bodyRow];
        if (selector === 'tr.oo-ui-element-hidden') return [bodyRow];
        return [];
      }
    };

    withMockEnvironment({
      window: {
        mw: {
          hook(name) {
            if (name === 'wikipage.diff.wikitextBodyUpdate') {
              return { fire(arg) { hookFiredWith = arg; } };
            }
            return { fire() {}, add() {} };
          }
        },
        $: (el) => el
      }
    }, () => {
      selectMode('visual', mockTable);
      assert.strictEqual(addedClasses.includes('oo-ui-element-hidden'), true, 'Should add oo-ui-element-hidden in visual mode');
      assert.deepStrictEqual(hookFiredWith, [bodyRow], 'Should fire wikitextBodyUpdate with body rows in visual mode');

      hookFiredWith = null;
      selectMode('wikitext', mockTable);
      assert.strictEqual(removedClasses.includes('oo-ui-element-hidden'), true, 'Should remove oo-ui-element-hidden in wikitext mode');
      assert.deepStrictEqual(hookFiredWith, [bodyRow], 'Should fire wikitextBodyUpdate with body rows in wikitext mode');
    });
  });

  test('setInlineSwitchDisabled safely handles execution without DOM', () => {
    assert.doesNotThrow(() => {
      setInlineSwitchDisabled(true);
      setInlineSwitchDisabled(false);
    });
  });

  test('selectMode discovers wikitext/visual mode buttons and unhides diff rows in refdiff mode', () => {
    let wikiActive = null;
    let visualActive = null;
    let refActive = null;

    const mockRefBtn = {
      id: 'refdiff-ooui-btn',
      classList: {
        add() {},
        remove() {},
        toggle(cls, val) { if (cls.includes('active')) refActive = val; },
        contains: () => false
      },
      setAttribute() {},
      removeAttribute() {},
      querySelector: () => null
    };

    const mockWikiBtn = {
      textContent: 'Wikitext diff',
      classList: {
        add() {},
        remove() {},
        toggle(cls, val) { if (cls.includes('active')) wikiActive = val; },
        contains: () => false
      },
      setAttribute() {},
      removeAttribute() {},
      querySelector: () => null
    };

    const mockVisualBtn = {
      textContent: 'Visual diff',
      classList: {
        add() {},
        remove() {},
        toggle(cls, val) { if (cls.includes('active')) visualActive = val; },
        contains: () => false
      },
      setAttribute() {},
      removeAttribute() {},
      querySelector: () => null
    };

    const mockGroup = {
      classList: { contains: (cls) => cls === 'oo-ui-buttonSelectWidget' },
      children: [mockRefBtn, mockWikiBtn, mockVisualBtn]
    };
    mockRefBtn.parentElement = mockGroup;

    let removedHidden = false;
    const mockRow = {
      className: '',
      classList: {
        remove: (c) => { if (c === 'oo-ui-element-hidden') removedHidden = true; },
        add: () => {}
      },
      querySelector: () => null,
      querySelectorAll: () => []
    };

    const mockTable = {
      querySelectorAll: (sel) => (sel === 'tr' ? [mockRow] : []),
      querySelector: () => null
    };

    withMockEnvironment({
      document: {
        getElementById: (id) => (id === 'refdiff-ooui-btn' ? mockRefBtn : null),
        querySelector: () => null
      }
    }, () => {
      selectMode('refdiff', mockTable);
      assert.strictEqual(refActive, true, 'RefDiff button should be active');
      assert.strictEqual(wikiActive, false, 'Wiki button should not be active');
      assert.strictEqual(visualActive, false, 'Visual button should not be active');
      assert.strictEqual(removedHidden, true, 'Body row hidden class should be removed in refdiff mode');
      restoreOriginal(mockTable);
    });
  });

  test('isSeparateChangedPreferred returns true by default and handles absent window/storage', () => {
    withMockEnvironment({ window: undefined }, () => {
      assert.strictEqual(isSeparateChangedPreferred(), true, 'Should default to true when window is undefined');
    });

    withMockEnvironment({ window: {} }, () => {
      assert.strictEqual(isSeparateChangedPreferred(), true, 'Should default to true when window is empty');
    });
  });

  test('isSeparateChangedPreferred prioritizes window.refdiffConfig over URL and storage', () => {
    const { mockWindow } = setupMockStorage('localStorage');
    mockWindow.location.search = '?diff=123&refdiff_separate=1';
    mockWindow.localStorage.setItem(STORAGE_KEY_SEPARATE, 'true');

    // refdiffConfig.separateChanged = false overrides URL and storage
    mockWindow.refdiffConfig = { separateChanged: false };
    withMockEnvironment({ window: mockWindow }, () => {
      assert.strictEqual(isSeparateChangedPreferred(), false, 'refdiffConfig.separateChanged = false should take precedence');
    });

    // refdiffConfig.separateChanged = true
    mockWindow.location.search = '?diff=123&refdiff_separate=0';
    mockWindow.localStorage.setItem(STORAGE_KEY_SEPARATE, 'false');
    mockWindow.refdiffConfig = { separateChanged: true };
    withMockEnvironment({ window: mockWindow }, () => {
      assert.strictEqual(isSeparateChangedPreferred(), true, 'refdiffConfig.separateChanged = true should take precedence');
    });
  });

  test('isSeparateChangedPreferred respects URL parameters ?refdiff_separate=0 and ?refdiff_separate=1', () => {
    const { mockWindow } = setupMockStorage('localStorage');
    withMockEnvironment({ window: mockWindow }, () => {
      mockWindow.location.search = '?diff=123&refdiff_separate=0';
      assert.strictEqual(isSeparateChangedPreferred(), false, '?refdiff_separate=0 should return false');

      mockWindow.location.search = '?diff=123&refdiff_separate=1';
      assert.strictEqual(isSeparateChangedPreferred(), true, '?refdiff_separate=1 should return true');
    });
  });

  test('isSeparateChangedPreferred and setSeparateChangedPreferred work across localStorage and mw.storage', () => {
    // 1. localStorage
    const { mockStore: localStore, mockWindow: localWin } = setupMockStorage('localStorage');
    withMockEnvironment({ window: localWin }, () => {
      assert.strictEqual(isSeparateChangedPreferred(), true);
      setSeparateChangedPreferred(false);
      assert.strictEqual(localStore[STORAGE_KEY_SEPARATE], 'false');
      assert.strictEqual(isSeparateChangedPreferred(), false);

      setSeparateChangedPreferred(true);
      assert.strictEqual(localStore[STORAGE_KEY_SEPARATE], 'true');
      assert.strictEqual(isSeparateChangedPreferred(), true);
    });

    // 2. mw.storage
    const { mockStore: mwStore, mockWindow: mwWin } = setupMockStorage('mw.storage');
    withMockEnvironment({ window: mwWin }, () => {
      setSeparateChangedPreferred(false);
      assert.strictEqual(mwStore[STORAGE_KEY_SEPARATE], 'false');
      assert.strictEqual(isSeparateChangedPreferred(), false);

      setSeparateChangedPreferred(true);
      assert.strictEqual(mwStore[STORAGE_KEY_SEPARATE], 'true');
      assert.strictEqual(isSeparateChangedPreferred(), true);
    });

    // 3. Storage errors caught gracefully
    const failingWin = {
      localStorage: {
        getItem() { throw new Error('QuotaExceeded'); },
        setItem() { throw new Error('QuotaExceeded'); }
      }
    };
    withMockEnvironment({ window: failingWin }, () => {
      assert.strictEqual(isSeparateChangedPreferred(), true, 'Should fall back to true on storage read error');
      assert.doesNotThrow(() => {
        setSeparateChangedPreferred(false);
      }, 'Storage write error should be caught silently');
    });
  });

  test('isInlineModifiedPreferred and setInlineModifiedPreferred persist preference and sync with separateChanged', () => {
    // 1. Defaults to false (unchecked by default)
    withMockEnvironment({ window: undefined }, () => {
      assert.strictEqual(isInlineModifiedPreferred(), false);
    });

    // 2. window.refdiffConfig.inlineModified
    const { mockStore, mockWindow } = setupMockStorage('localStorage');
    mockWindow.refdiffConfig = { inlineModified: true };
    withMockEnvironment({ window: mockWindow }, () => {
      assert.strictEqual(isInlineModifiedPreferred(), true);
      assert.strictEqual(isSeparateChangedPreferred(), false);
    });

    // 3. URL params ?refdiff_inline=1 and ?refdiff_inline=0
    delete mockWindow.refdiffConfig;
    mockWindow.location.search = '?diff=123&refdiff_inline=1';
    withMockEnvironment({ window: mockWindow }, () => {
      assert.strictEqual(isInlineModifiedPreferred(), true);
    });
    mockWindow.location.search = '?diff=123&refdiff_inline=0';
    withMockEnvironment({ window: mockWindow }, () => {
      assert.strictEqual(isInlineModifiedPreferred(), false);
    });

    // 4. Persistence via setInlineModifiedPreferred
    mockWindow.location.search = '';
    withMockEnvironment({ window: mockWindow }, () => {
      setInlineModifiedPreferred(true);
      assert.strictEqual(mockStore[STORAGE_KEY_INLINE], 'true');
      assert.strictEqual(mockStore[STORAGE_KEY_SEPARATE], 'false');
      assert.strictEqual(isInlineModifiedPreferred(), true);

      setInlineModifiedPreferred(false);
      assert.strictEqual(mockStore[STORAGE_KEY_INLINE], 'false');
      assert.strictEqual(mockStore[STORAGE_KEY_SEPARATE], 'true');
      assert.strictEqual(isInlineModifiedPreferred(), false);
    });
  });
});

if (require.main === module) {
  finishStandalone();
}
