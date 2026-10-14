/**
 * tests/test_renderer.js
 *
 * Tests for src/renderer.js: Badge generation and citation diff row construction.
 */

const { assert, suite, test, withMockEnvironment, finishStandalone } = require('./harness.js');
const { JSDOM } = require('jsdom');
const { createProseBadge, createProseBadgeElement, createCitRow, replaceRefInHtml, el } = require('../refdiff.js');

const getDoc = () => (new JSDOM()).window.document;

suite('src/renderer.js - Badge & Citation Row Rendering', () => {
  test('el creates DOM elements with escaped textContent and safe attributes (M1)', () => {
    withMockEnvironment({ document: getDoc() }, () => {
      const node = el('div', {
        id: 'test-id',
        class: 'foo bar',
        title: 'Title with "quotes" and <tags>',
        'data-marker': '+'
      }, 'Text with <raw> & "special" chars');

      assert.strictEqual(node.tagName, 'DIV');
      assert.strictEqual(node.id, 'test-id');
      assert.strictEqual(node.className, 'foo bar');
      assert.strictEqual(node.getAttribute('title'), 'Title with "quotes" and <tags>');
      assert.strictEqual(node.getAttribute('data-marker'), '+');
      assert.strictEqual(node.textContent, 'Text with <raw> & "special" chars');
      assert.strictEqual(node.innerHTML, 'Text with &lt;raw&gt; &amp; "special" chars');
    });
  });

  test('createProseBadgeElement constructs native DOM tree with XSS immunity (M1)', () => {
    withMockEnvironment({ document: getDoc() }, () => {
      const malicious = '"><script>x</script>';
      const badge = createProseBadgeElement('mod', malicious, '#refdiff-cit-1');
      assert.strictEqual(badge.tagName, 'SUP');
      assert.strictEqual(badge.className, 'reference refdiff-ref');

      const a = badge.querySelector('a');
      assert.strictEqual(a.className, 'ref-badge-mod');
      assert.strictEqual(a.textContent, `⟨~${malicious}~⟩`);
      assert.strictEqual(badge.querySelectorAll('script').length, 0, 'No script tags should be injected');
    });
  });

  test('createProseBadgeElement truncates long display labels while preserving full label in title attribute', () => {
    withMockEnvironment({ document: getDoc() }, () => {
      const longLabel = "From teen in RSS shakha to Speaker's Chair: Bihar BJP leader Prem Kumar's long journey";
      const badge = createProseBadgeElement('add', longLabel, '#refdiff-cit-1');
      assert.strictEqual(badge.tagName, 'SUP');
      const a = badge.querySelector('a');
      assert.strictEqual(a.className, 'ref-badge-add');
      assert.strictEqual(a.textContent, '⟨+From teen in RSS shakha…+⟩');
      assert.strictEqual(a.getAttribute('title'), `Added citation: ⟨+${longLabel}+⟩`);
    });
  });

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
    withMockEnvironment({ document: getDoc() }, () => {
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

  test('createCitRow styles added citations cleanly without outer ins wrapper, stripping partial diffchange spans', () => {
    withMockEnvironment({ document: getDoc() }, () => {
      const row = createCitRow({
        label: 'kami',
        oldRaw: '',
        newRaw: '&lt;ref name="kami" /&gt;',
        isAdd: true,
        rowId: 'refdiff-cit-kami-1',
        citeNoteId: 'cite_note-kami-1'
      });
      assert.strictEqual(row.innerHTML.includes('&lt;ref name="kami" /&gt;'), true, 'Added ref content should be present');
      assert.strictEqual(row.innerHTML.includes('<ins'), false, 'Added ref should not be wrapped in ins');

      // Even if newRaw contained broken internal diffchange spans from word tokenization:
      const rowWithInternalSpans = createCitRow({
        label: 'kami',
        oldRaw: '',
        newRaw: '&lt;ref name="kami"</ins> <ins class="diffchange diffchange-inline">/&gt;',
        isAdd: true,
        rowId: 'refdiff-cit-kami-1'
      });
      assert.strictEqual(rowWithInternalSpans.innerHTML.includes('&lt;ref name="kami" /&gt;'), true, 'Internal diff tags should be stripped');
      assert.strictEqual(rowWithInternalSpans.innerHTML.includes('<ins'), false, 'No ins tag should be present');
    });
  });

  test('createCitRow styles deleted citations cleanly without outer del wrapper, stripping partial diffchange spans', () => {
    withMockEnvironment({ document: getDoc() }, () => {
      const row = createCitRow({
        label: 'oldRef',
        oldRaw: '&lt;ref name="oldRef" /&gt;',
        newRaw: '',
        isDel: true,
        rowId: 'refdiff-cit-oldRef-1'
      });
      assert.strictEqual(row.innerHTML.includes('&lt;ref name="oldRef" /&gt;'), true, 'Deleted ref content should be present');
      assert.strictEqual(row.innerHTML.includes('<del'), false, 'Deleted ref should not be wrapped in del');
    });
  });

  test('createCitRow mirrors native MediaWiki diff structure with diff-empty on single-sided rows', () => {
    withMockEnvironment({ document: getDoc() }, () => {
      // 1. Added citation row: diff-empty on deleted side (left)
      const addRow = createCitRow({
        label: 'newRef',
        oldRaw: '',
        newRaw: '<ref name="newRef">content</ref>',
        isAdd: true,
        rowId: 'refdiff-cit-newRef-1'
      });
      const addCells = Array.from(addRow.children);
      assert.strictEqual(addCells.length, 3, 'Added citation row should have 3 cells (empty colspan=2, marker, addedline)');
      assert.strictEqual(addCells[0].className, 'diff-empty diff-side-deleted');
      assert.strictEqual(addCells[0].getAttribute('colspan'), '2');
      assert.strictEqual(addCells[1].className, 'diff-marker');
      assert.strictEqual(addCells[1].getAttribute('data-marker'), '+');
      assert.strictEqual(addCells[2].className, 'refdiff-cit-addedline diff-side-added');

      // 2. Deleted citation row: diff-empty on added side (right)
      const delRow = createCitRow({
        label: 'oldRef',
        oldRaw: '<ref name="oldRef">content</ref>',
        newRaw: '',
        isDel: true,
        rowId: 'refdiff-cit-oldRef-1'
      });
      const delCells = Array.from(delRow.children);
      assert.strictEqual(delCells.length, 3, 'Deleted citation row should have 3 cells (marker, deletedline, empty colspan=2)');
      assert.strictEqual(delCells[0].className, 'diff-marker');
      assert.strictEqual(delCells[0].getAttribute('data-marker'), '−');
      assert.strictEqual(delCells[1].className, 'refdiff-cit-deletedline diff-side-deleted');
      assert.strictEqual(delCells[2].className, 'diff-empty diff-side-added');
      assert.strictEqual(delCells[2].getAttribute('colspan'), '2');

      // 3. Modified citation row: both sides populated (4 cells)
      const modRow = createCitRow({
        label: 'modRef',
        oldRaw: '<ref name="modRef">old</ref>',
        newRaw: '<ref name="modRef">new</ref>',
        rowId: 'refdiff-cit-modRef-1'
      });
      const modCells = Array.from(modRow.children);
      assert.strictEqual(modCells.length, 4, 'Modified citation row should have 4 cells');
      assert.strictEqual(modCells[0].getAttribute('data-marker'), '−');
      assert.strictEqual(modCells[1].className, 'refdiff-cit-deletedline diff-side-deleted');
      assert.strictEqual(modCells[2].getAttribute('data-marker'), '+');
      assert.strictEqual(modCells[2].className, 'diff-marker');
      assert.strictEqual(modCells[3].className, 'refdiff-cit-addedline diff-side-added');
    });
  });
});

if (require.main === module) {
  finishStandalone();
}
