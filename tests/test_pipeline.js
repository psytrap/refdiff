/**
 * tests/test_pipeline.js
 *
 * Tests for src/pipeline.js: Core decoupling transformation and table mutator pipeline.
 */

const { assert, suite, test, withMockEnvironment, finishStandalone } = require('./harness.js');
const { transformProseCells, applyDecoupling, restoreOriginal } = require('../refdiff.js');

suite('src/pipeline.js - Transformation Pipeline & Roundtrip', () => {
  test('transformProseCells generates badges and returns modified citations list', () => {
    const delHtml = '<div>Earth has 1 satellite.&lt;ref&gt;Moon orbit data&lt;/ref&gt;</div>';
    const addHtml = '<div>Earth has 1 satellite.&lt;ref&gt;Moon orbit data updated&lt;/ref&gt;</div>';
    const pairs = [
      {
        d: { raw: '&lt;ref&gt;Moon orbit data&lt;/ref&gt;', name: null, hasChange: false },
        a: { raw: '&lt;ref&gt;Moon orbit data updated&lt;/ref&gt;', name: null, hasChange: true },
        name: null
      }
    ];

    const result = transformProseCells(delHtml, addHtml, pairs, 1);
    assert.strictEqual(result.newDelHtml.includes('⟨~ref1~⟩'), true, 'Should include mod badge');
    assert.strictEqual(result.newAddHtml.includes('⟨~ref1~⟩'), true, 'Should include mod badge');
    assert.strictEqual(result.modifiedCits.length, 1);
    assert.strictEqual(result.nextCounter, 2);
  });

  test('applyDecoupling and restoreOriginal roundtrip on a mock diff table', () => {
    const mockDelDiv = { innerHTML: 'Line with &lt;ref name="test"&gt;Citation A&lt;/ref&gt;' };
    const mockAddDiv = { innerHTML: 'Line with &lt;ref name="test"&gt;Citation B&lt;/ref&gt;' };
    const mockDelTd = { className: 'diff-deletedline' };
    const mockAddTd = { className: 'diff-addedline' };

    let insertedCitRow = null;

    const mockRow = {
      classList: { contains: () => false },
      querySelector(sel) {
        if (sel.includes('diff-deletedline') && sel.includes('div')) return mockDelDiv;
        if (sel.includes('diff-addedline') && sel.includes('div')) return mockAddDiv;
        if (sel.includes('diff-deletedline')) return mockDelTd;
        if (sel.includes('diff-addedline')) return mockAddTd;
        return null;
      },
      querySelectorAll() { return []; },
      parentNode: {
        insertBefore: (el) => {
          insertedCitRow = el;
        }
      },
      nextSibling: null
    };

    const mockTable = {
      innerHTML: '<table>mock</table>',
      querySelector() { return null; },
      querySelectorAll(sel) {
        if (sel === 'tr') return [mockRow];
        if (sel.includes('refdiff-cit-row')) return insertedCitRow ? [insertedCitRow] : [];
        return [];
      },
      addEventListener() {},
      removeEventListener() {}
    };

    withMockEnvironment({
      document: {
        createElement: () => ({
          className: '',
          setAttribute() {},
          removeAttribute() {},
          style: {},
          innerHTML: '',
          remove: () => { insertedCitRow = null; }
        })
      }
    }, () => {
      // 1. Apply Decoupling
      applyDecoupling(mockTable);
      assert.strictEqual(mockDelDiv.innerHTML.includes('⟨~test~⟩'), true, 'Should replace deleted ref with badge');
      assert.strictEqual(mockAddDiv.innerHTML.includes('⟨~test~⟩'), true, 'Should replace added ref with badge');

      // 2. Restore Original
      restoreOriginal(mockTable);
      assert.strictEqual(mockDelDiv.innerHTML.includes('&lt;ref name="test"&gt;Citation A&lt;/ref&gt;'), true, 'Should restore original deleted ref');
      assert.strictEqual(mockAddDiv.innerHTML.includes('&lt;ref name="test"&gt;Citation B&lt;/ref&gt;'), true, 'Should restore original added ref');
      assert.strictEqual(insertedCitRow, null, 'Citation row should be removed upon restore');
    });
  });

  test('applyDecoupling and restoreOriginal safely guard against null or invalid tables', () => {
    assert.doesNotThrow(() => {
      applyDecoupling(null);
      applyDecoupling({});
      restoreOriginal(null);
      restoreOriginal({});
    });
  });
});

if (require.main === module) {
  finishStandalone();
}
