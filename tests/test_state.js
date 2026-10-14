/**
 * tests/test_state.js
 *
 * Tests for src/state.js & storage persistence: Preferences, mw.storage, and localStorage.
 */

const { assert, suite, test, withMockEnvironment, setupMockStorage, finishStandalone } = require('./harness.js');
const { isRefDiffPreferred, setRefDiffPreferred, STORAGE_KEY } = require('../refdiff.js');

suite('src/state.js - State Persistence & Storage', () => {
  test('defaults to true when window and storage are absent', () => {
    withMockEnvironment({ window: undefined }, () => {
      assert.strictEqual(isRefDiffPreferred(), true, 'Should default to true when window is undefined');
    });
  });

  test('reads and persists preference using localStorage', () => {
    const { mockStore, mockWindow } = setupMockStorage('localStorage');
    withMockEnvironment({ window: mockWindow }, () => {
      assert.strictEqual(isRefDiffPreferred(), true, 'Default preference should be true');
      setRefDiffPreferred(false);
      assert.strictEqual(mockStore[STORAGE_KEY], 'false', 'Storage value should be updated to false');
      assert.strictEqual(isRefDiffPreferred(), false, 'Preference should report false after update');
      setRefDiffPreferred(true);
      assert.strictEqual(mockStore[STORAGE_KEY], 'true', 'Storage value should be updated to true');
      assert.strictEqual(isRefDiffPreferred(), true, 'Preference should report true after update');
    });
  });

  test('reads and persists preference using mw.storage', () => {
    const { mockStore, mockWindow } = setupMockStorage('mw.storage');
    withMockEnvironment({ window: mockWindow }, () => {
      setRefDiffPreferred(false);
      assert.strictEqual(mockStore[STORAGE_KEY], 'false', 'mw.storage value should be updated to false');
      assert.strictEqual(isRefDiffPreferred(), false, 'Preference should report false under mw.storage');
      setRefDiffPreferred(true);
      assert.strictEqual(mockStore[STORAGE_KEY], 'true', 'mw.storage value should be updated to true');
      assert.strictEqual(isRefDiffPreferred(), true, 'Preference should report true under mw.storage');
    });
  });

  test('URL parameters override storage preference', () => {
    const { mockWindow } = setupMockStorage('localStorage');
    withMockEnvironment({ window: mockWindow }, () => {
      mockWindow.location.search = '?diff=123&refdiff=0';
      assert.strictEqual(isRefDiffPreferred(), false, '?refdiff=0 should force disabled');
      mockWindow.location.search = '?diff=123&refdiff=1';
      assert.strictEqual(isRefDiffPreferred(), true, '?refdiff=1 should force enabled');
    });
  });
});

if (require.main === module) {
  finishStandalone();
}
