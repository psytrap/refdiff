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
  setInlineSwitchDisabled
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

      selectMode('wikitext', mockTable);
      assert.strictEqual(isRefDiffPreferred(), false);

      selectMode('visual', mockTable);
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
});

if (require.main === module) {
  finishStandalone();
}
