/**
 * tests/test_dom_helpers.js
 *
 * Tests for src/dom_helpers.js: DOM query, categorization, and hook notification helpers.
 */

const { assert, suite, test, withMockEnvironment, finishStandalone } = require('./harness.js');
const { getDiffBodyRows, notifyBodyUpdate } = require('../refdiff.js');

suite('src/dom_helpers.js - Diff Row Helpers', () => {
  test('getDiffBodyRows separates header rows from body content rows', () => {
    const titleRow = { className: 'diff-title' };
    const noticeRow = { className: '' };
    const noticeTd = { className: 'diff-notice', parentElement: noticeRow };
    const contentRow1 = { className: '', classList: { add() {}, remove() {} } };
    const contentRow2 = { className: '', classList: { add() {}, remove() {} } };

    const mockTable = {
      querySelectorAll(selector) {
        if (selector === 'tr.diff-title') return [titleRow];
        if (selector.includes('diff-multi') || selector.includes('diff-notice')) return [noticeTd];
        if (selector === 'tr') return [titleRow, noticeRow, contentRow1, contentRow2];
        return [];
      }
    };

    const bodyRows = getDiffBodyRows(mockTable);
    assert.strictEqual(bodyRows.length, 2);
    assert.strictEqual(bodyRows[0], contentRow1);
    assert.strictEqual(bodyRows[1], contentRow2);
  });

  test('notifyBodyUpdate fires mw.hook with jQuery-wrapped body rows', () => {
    let hookFiredWith = null;
    const row = { className: '' };
    const mockTable = {
      querySelectorAll(selector) {
        if (selector === 'tr.diff-title') return [];
        if (selector.includes('diff-multi') || selector.includes('diff-notice')) return [];
        if (selector === 'tr') return [row];
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
      notifyBodyUpdate(mockTable);
      assert.deepStrictEqual(hookFiredWith, [row]);
    });
  });
});

if (require.main === module) {
  finishStandalone();
}
