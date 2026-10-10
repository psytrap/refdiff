/**
 * tests/test_renderer.js
 *
 * Tests for src/renderer.js: Badge generation and citation diff row construction.
 */

const { assert, suite, test, withMockEnvironment, finishStandalone } = require('./harness.js');
const { createProseBadge, createCitRow } = require('../refdiff.js');

suite('src/renderer.js - Badge & Citation Row Rendering', () => {
  test('creates mathematical angle bracket badges with correct styling', () => {
    const norm = createProseBadge('norm', 'ref1');
    assert.strictEqual(norm.includes('⟨ref1⟩'), true, 'Norm badge should use ⟨ref1⟩');
    assert.strictEqual(norm.includes('ref-badge'), true);

    const mod = createProseBadge('mod', 'ref2');
    assert.strictEqual(mod.includes('⟨~ref2~⟩'), true, 'Mod badge should use ⟨~ref2~⟩');
    assert.strictEqual(mod.includes('ref-badge-mod'), true);

    const add = createProseBadge('add', 'ref3');
    assert.strictEqual(add.includes('⟨+ref3+⟩'), true, 'Add badge should use ⟨+ref3+⟩');
    assert.strictEqual(add.includes('ref-badge-add'), true);

    const del = createProseBadge('del', 'ref4');
    assert.strictEqual(del.includes('⟨-ref4-⟩'), true, 'Del badge should use ⟨-ref4-⟩');
    assert.strictEqual(del.includes('ref-badge-del'), true);
  });

  test('createProseBadge renders interactive <sup class="reference refdiff-ref"><a href="..."> when href is provided', () => {
    const badge = createProseBadge('norm', 'ref1', '#cite_note-ref1-1');
    assert.strictEqual(badge.includes('<sup class="reference refdiff-ref">'), true, 'Should wrap in sup.reference for ext.popups');
    assert.strictEqual(badge.includes('<a href="#cite_note-ref1-1" class="ref-badge"'), true, 'Should contain link with href');
    assert.strictEqual(badge.includes('⟨ref1⟩'), true);

    const modBadge = createProseBadge('mod', 'testRef', '#refdiff-cit-testRef-1');
    assert.strictEqual(modBadge.includes('<a href="#refdiff-cit-testRef-1" class="ref-badge-mod"'), true);
    assert.strictEqual(modBadge.includes('⟨~testRef~⟩'), true);
  });

  test('createProseBadge renders non-link <span> inside <sup class="reference refdiff-ref"> when href is null', () => {
    const badge = createProseBadge('norm', 'ref1', null);
    assert.strictEqual(badge.includes('<sup class="reference refdiff-ref">'), true);
    assert.strictEqual(badge.includes('<span class="ref-badge"'), true);
    assert.strictEqual(badge.includes('<a'), false, 'Should not render anchor tag when href is null');
  });

  test('createCitRow assigns rowId and links prefix badge when citeNoteId is present', () => {
    withMockEnvironment({
      document: {
        createElement: () => ({
          className: '',
          innerHTML: '',
          set id(val) { this._id = val; },
          get id() { return this._id; }
        })
      }
    }, () => {
      const row = createCitRow({
        label: 'exyu_240625',
        oldRaw: '<ref name="exyu_240625">old</ref>',
        newRaw: '<ref name="exyu_240625">new</ref>',
        rowId: 'refdiff-cit-exyu_240625-1',
        citeNoteId: 'cite_note-exyu_240625-58'
      });
      assert.strictEqual(row.id, 'refdiff-cit-exyu_240625-1', 'Row should have rowId assigned');
      assert.strictEqual(row.innerHTML.includes('href="#cite_note-exyu_240625-58"'), true, 'Prefix badge should link to cite_note');
    });
  });
});

if (require.main === module) {
  finishStandalone();
}
