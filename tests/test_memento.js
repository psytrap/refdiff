/**
 * tests/test_memento.js
 *
 * Tests for src/memento.js: Non-destructive DOM row snapshot and restore memento.
 */

const { assert, suite, test, finishStandalone } = require('./harness.js');
const { captureRowSnapshot, restoreRowSnapshot } = require('../refdiff.js');

suite('src/memento.js - DOM Memento In-Place Restoration', () => {
  test('captureRowSnapshot and restoreRowSnapshot accurately preserve and restore DOM elements in-place', () => {
    const mockDelDiv = { innerHTML: 'Original deleted text' };
    const mockAddDiv = { innerHTML: 'Original added text' };
    const mockDelTd = { className: 'diff-deletedline' };
    const mockAddTd = { className: 'diff-addedline' };
    const mockMarker = {
      marker: '-',
      getAttribute: () => '-',
      setAttribute: function(k, v) { this.marker = v; },
      removeAttribute: function() { this.marker = null; }
    };

    const mockRow = {
      querySelector(sel) {
        if (sel.includes('diff-deletedline') && sel.includes('div')) return mockDelDiv;
        if (sel.includes('diff-addedline') && sel.includes('div')) return mockAddDiv;
        if (sel.includes('diff-deletedline')) return mockDelTd;
        if (sel.includes('diff-addedline')) return mockAddTd;
        return null;
      },
      querySelectorAll(sel) {
        if (sel.includes('diff-marker')) return [mockMarker];
        return [];
      }
    };

    const snapshot = captureRowSnapshot(mockRow);
    assert.strictEqual(snapshot.delHtml, 'Original deleted text');
    assert.strictEqual(snapshot.addHtml, 'Original added text');

    // Mutate row elements as if decoupling occurred
    mockDelDiv.innerHTML = 'Mutated with badge';
    mockAddDiv.innerHTML = 'Mutated with badge';
    mockDelTd.className = 'diff-deletedline modified';
    mockMarker.marker = '+';

    restoreRowSnapshot(snapshot);
    assert.strictEqual(mockDelDiv.innerHTML, 'Original deleted text');
    assert.strictEqual(mockAddDiv.innerHTML, 'Original added text');
    assert.strictEqual(mockDelTd.className, 'diff-deletedline');
    assert.strictEqual(mockMarker.marker, '-');
  });
});

if (require.main === module) {
  finishStandalone();
}
