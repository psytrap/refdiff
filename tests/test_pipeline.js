/**
 * tests/test_pipeline.js
 *
 * Tests for src/pipeline.js: Core decoupling transformation and table mutator pipeline.
 */

const { assert, suite, test, withMockEnvironment, finishStandalone } = require('./harness.js');
const { transformProseCells, applyDecoupling, restoreOriginal, onTableClick } = require('../refdiff.js');

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

  test('updateProseRowAppearance strips diff markers when row has no prose changes', () => {
    let removedAttr = null;
    const mockMarker = {
      getAttribute: (attr) => (attr === 'data-marker' ? '+' : null),
      removeAttribute: (attr) => { removedAttr = attr; },
      setAttribute: () => {}
    };
    const mockDelDiv = { innerHTML: 'Text &lt;ref&gt;Old&lt;/ref&gt;' };
    const mockAddDiv = { innerHTML: 'Text &lt;ref&gt;New&lt;/ref&gt;' };
    const mockDelTd = { className: 'diff-deletedline' };
    const mockAddTd = { className: 'diff-addedline' };

    const mockRow = {
      classList: { contains: () => false },
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
      },
      parentNode: { insertBefore: () => {} },
      nextSibling: null
    };

    const mockTable = {
      querySelector: () => null,
      querySelectorAll: (sel) => (sel === 'tr' ? [mockRow] : []),
      addEventListener: () => {},
      removeEventListener: () => {}
    };

    withMockEnvironment({
      document: {
        createElement: () => ({
          className: '',
          setAttribute() {},
          removeAttribute() {},
          style: {},
          innerHTML: '',
          remove() {}
        })
      }
    }, () => {
      applyDecoupling(mockTable);
      assert.strictEqual(removedAttr, 'data-marker', 'Should remove data-marker attribute');
      assert.strictEqual(mockDelTd.className.includes('diff-side-deleted'), true);
      assert.strictEqual(mockAddTd.className.includes('diff-side-added'), true);
      restoreOriginal(mockTable);
    });
  });

  test('onTableClick handles smooth scrolling and flashing for citation rows and footnotes', () => {
    let prevented = false;
    let scrolledNearest = false;
    let scrolledCenter = false;
    const addedClasses = [];
    const removedClasses = [];

    const mockCitTarget = {
      scrollIntoView: (opts) => { if (opts.block === 'nearest') scrolledNearest = true; },
      classList: {
        add: (c) => addedClasses.push(c),
        remove: (c) => removedClasses.push(c)
      },
      offsetWidth: 100
    };

    const mockFootnoteTarget = {
      scrollIntoView: (opts) => { if (opts.block === 'center') scrolledCenter = true; },
      classList: {
        add: (c) => addedClasses.push(c),
        remove: (c) => removedClasses.push(c)
      },
      offsetWidth: 100
    };

    let pushedState = null;
    withMockEnvironment({
      document: {
        getElementById: (id) => {
          if (id === 'refdiff-cit-1') return mockCitTarget;
          if (id === 'cite_note-1') return mockFootnoteTarget;
          return null;
        }
      },
      window: {
        history: {
          pushState: (state, title, url) => { pushedState = url; }
        }
      }
    }, () => {
      // 1. Click outside refdiff-ref
      onTableClick({ target: { closest: () => null } });

      // 2. Click with no href
      onTableClick({
        target: {
          closest: () => ({ getAttribute: () => null })
        }
      });

      // 3. Click citation row link (#refdiff-cit-1)
      const citEvent = {
        preventDefault: () => { prevented = true; },
        target: {
          closest: () => ({ getAttribute: () => '#refdiff-cit-1' })
        }
      };
      onTableClick(citEvent);
      assert.strictEqual(prevented, true, 'preventDefault called for cit row');
      assert.strictEqual(scrolledNearest, true, 'Scrolled nearest for cit row');
      assert.strictEqual(addedClasses.includes('refdiff-cit-flash'), true, 'Added flash-cit class');

      // 4. Click footnote anchor link (#cite_note-1)
      let fnPrevented = false;
      const fnEvent = {
        preventDefault: () => { fnPrevented = true; },
        target: {
          closest: () => ({ getAttribute: () => '#cite_note-1' })
        }
      };
      onTableClick(fnEvent);
      assert.strictEqual(fnPrevented, true, 'preventDefault called for footnote');
      assert.strictEqual(scrolledCenter, true, 'Scrolled center for footnote');
      assert.strictEqual(pushedState, '#cite_note-1', 'Updated history pushState');
      assert.strictEqual(addedClasses.includes('refdiff-target-flash'), true, 'Added flash-target class');
    });
  });

  test('transformProseCells with separateChanged: false badges unchanged refs and preserves changed/added/deleted refs inline', () => {
    const delHtml = '<div>Text &lt;ref name="fixed"&gt;Fixed&lt;/ref&gt; and &lt;ref name="mod"&gt;Old text&lt;/ref&gt; and &lt;ref name="deleted"&gt;Gone&lt;/ref&gt;</div>';
    const addHtml = '<div>Text &lt;ref name="fixed"&gt;Fixed&lt;/ref&gt; and &lt;ref name="mod"&gt;New text&lt;/ref&gt; and &lt;ref name="added"&gt;Fresh&lt;/ref&gt;</div>';
    const pairs = [
      {
        d: { raw: '&lt;ref name="fixed"&gt;Fixed&lt;/ref&gt;', name: 'fixed', hasChange: false },
        a: { raw: '&lt;ref name="fixed"&gt;Fixed&lt;/ref&gt;', name: 'fixed', hasChange: false },
        name: 'fixed'
      },
      {
        d: { raw: '&lt;ref name="mod"&gt;Old text&lt;/ref&gt;', name: 'mod', hasChange: true },
        a: { raw: '&lt;ref name="mod"&gt;New text&lt;/ref&gt;', name: 'mod', hasChange: true },
        name: 'mod'
      },
      {
        d: null,
        a: { raw: '&lt;ref name="added"&gt;Fresh&lt;/ref&gt;', name: 'added', hasChange: true },
        name: 'added'
      },
      {
        d: { raw: '&lt;ref name="deleted"&gt;Gone&lt;/ref&gt;', name: 'deleted', hasChange: true },
        a: null,
        name: 'deleted'
      }
    ];

    const result = transformProseCells(delHtml, addHtml, pairs, 1, { separateChanged: false });

    // 1. Unchanged reference IS replaced by badge
    assert.strictEqual(result.newDelHtml.includes('⟨fixed⟩'), true, 'Unchanged ref should be badged in deleted cell');
    assert.strictEqual(result.newAddHtml.includes('⟨fixed⟩'), true, 'Unchanged ref should be badged in added cell');

    // 2. Changed, added, and deleted references remain untouched inline
    assert.strictEqual(result.newDelHtml.includes('&lt;ref name="mod"&gt;Old text&lt;/ref&gt;'), true, 'Modified ref should stay untouched inline');
    assert.strictEqual(result.newAddHtml.includes('&lt;ref name="mod"&gt;New text&lt;/ref&gt;'), true, 'Modified ref should stay untouched inline');
    assert.strictEqual(result.newAddHtml.includes('&lt;ref name="added"&gt;Fresh&lt;/ref&gt;'), true, 'Added ref should stay untouched inline');
    assert.strictEqual(result.newDelHtml.includes('&lt;ref name="deleted"&gt;Gone&lt;/ref&gt;'), true, 'Deleted ref should stay untouched inline');

    // 3. No modified citations extracted for separate rows
    assert.strictEqual(result.modifiedCits.length, 0, 'No citation rows should be created');
  });

  test('applyDecoupling with separateChanged: false does not insert citation rows', () => {
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
      applyDecoupling(mockTable, { separateChanged: false });
      assert.strictEqual(insertedCitRow, null, 'No citation row should be inserted when separateChanged is false');
      restoreOriginal(mockTable);
    });
  });
});

if (require.main === module) {
  finishStandalone();
}
