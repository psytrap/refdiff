/**
 * tests/test_renderer.js
 *
 * Tests for src/renderer.js: Badge generation and citation diff row construction.
 */

const { assert, suite, test, withMockEnvironment, finishStandalone } = require('./harness.js');
const { createProseBadge, createCitRow, replaceRefInHtml } = require('../refdiff.js');

suite('src/renderer.js - Badge & Citation Row Rendering', () => {
  test('replaceRefInHtml replaces reference wrapped in diffchange tag', () => {
    const html = '<div>prose <del class="diffchange diffchange-inline">&lt;ref name="test"&gt;cite&lt;/ref&gt;</del> more prose</div>';
    const result = replaceRefInHtml(html, '&lt;ref name="test"&gt;cite&lt;/ref&gt;', '⟨ref1⟩');
    assert.strictEqual(result, '<div>prose ⟨ref1⟩ more prose</div>');
  });

  test('replaceRefInHtml prepends badge when prepend flag is true', () => {
    const html = '<div>prose &lt;ref name="test"&gt;cite&lt;/ref&gt; more prose</div>';
    const result = replaceRefInHtml(html, '&lt;ref name="test"&gt;cite&lt;/ref&gt;', '⟨~test~⟩', true);
    assert.strictEqual(result, '<div>prose ⟨~test~⟩&lt;ref name="test"&gt;cite&lt;/ref&gt; more prose</div>');

    const htmlWrapped = '<div>prose <ins class="diffchange diffchange-inline">&lt;ref name="test"&gt;cite&lt;/ref&gt;</ins> more prose</div>';
    const resultWrapped = replaceRefInHtml(htmlWrapped, '&lt;ref name="test"&gt;cite&lt;/ref&gt;', '⟨~test~⟩', true);
    assert.strictEqual(resultWrapped, '<div>prose ⟨~test~⟩<ins class="diffchange diffchange-inline">&lt;ref name="test"&gt;cite&lt;/ref&gt;</ins> more prose</div>');
  });
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
    assert.strictEqual(badge.includes('<a href="#cite_note-ref1-1" class="ref-badge">'), true, 'Should contain link with href and omit title to allow Reference Previews');
    assert.strictEqual(badge.includes('title='), false, 'Should not render native title attribute when pointing to #cite_note-*');
    assert.strictEqual(badge.includes('⟨ref1⟩'), true);

    const modBadge = createProseBadge('mod', 'testRef', '#refdiff-cit-testRef-1');
    assert.strictEqual(modBadge.includes('<a href="#refdiff-cit-testRef-1" class="ref-badge-mod" title="Citation metadata modified: ⟨~testRef~⟩">'), true, 'Should retain title on internal row anchors');
    assert.strictEqual(modBadge.includes('⟨~testRef~⟩'), true);
  });

  test('createProseBadge renders non-link <span> inside <sup class="reference refdiff-ref"> when href is null', () => {
    const badge = createProseBadge('norm', 'ref1', null);
    assert.strictEqual(badge.includes('<sup class="reference refdiff-ref">'), true);
    assert.strictEqual(badge.includes('<span class="ref-badge" title="Citation: ⟨ref1⟩">'), true);
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
      assert.strictEqual(row.innerHTML.includes('title='), false, 'Should omit title attribute when citeNoteId is present');
    });
  });

  test('createCitRow styles added citations entirely as added (<ins>), stripping partial diffchange spans', () => {
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
        label: 'kami',
        oldRaw: '',
        newRaw: '&lt;ref name="kami" /&gt;',
        isAdd: true,
        rowId: 'refdiff-cit-kami-1',
        citeNoteId: 'cite_note-kami-1'
      });
      assert.strictEqual(row.innerHTML.includes('<ins class="diffchange diffchange-inline">&lt;ref name="kami" /&gt;</ins>'), true, 'Entire added ref should be wrapped in ins');

      // Even if newRaw contained broken internal diffchange spans from word tokenization:
      const rowWithInternalSpans = createCitRow({
        label: 'kami',
        oldRaw: '',
        newRaw: '&lt;ref name="kami"</ins> <ins class="diffchange diffchange-inline">/&gt;',
        isAdd: true,
        rowId: 'refdiff-cit-kami-1'
      });
      assert.strictEqual(rowWithInternalSpans.innerHTML.includes('<ins class="diffchange diffchange-inline">&lt;ref name="kami" /&gt;</ins>'), true, 'Internal diff tags should be normalized into a single contiguous ins span');
    });
  });

  test('createCitRow styles deleted citations entirely as deleted (<del>), stripping partial diffchange spans', () => {
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
        label: 'oldRef',
        oldRaw: '&lt;ref name="oldRef" /&gt;',
        newRaw: '',
        isDel: true,
        rowId: 'refdiff-cit-oldRef-1'
      });
      assert.strictEqual(row.innerHTML.includes('<del class="diffchange diffchange-inline">&lt;ref name="oldRef" /&gt;</del>'), true, 'Entire deleted ref should be wrapped in del');
    });
  });
});

if (require.main === module) {
  finishStandalone();
}
