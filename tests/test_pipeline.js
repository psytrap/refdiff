/**
 * tests/test_pipeline.js
 *
 * Tests for src/pipeline.js: Core decoupling transformation and table mutator pipeline.
 */

const { assert, suite, test, withMockEnvironment, finishStandalone } = require('./harness.js');
const { transformProseCells, applyDecoupling, restoreOriginal, onTableClick, normalizeDiffTags, pairReferences, parseRefs } = require('../refdiff.js');

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

  test('transformProseCells with separateChanged: false keeps mod badges in prose without rows while added/deleted still separate', () => {
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

    // 2. Modified reference: modify badge is prepended inline directly before raw ref, no row below
    assert.strictEqual(result.newDelHtml.includes('⟨~mod~⟩') && result.newDelHtml.includes('&lt;ref name="mod"&gt;Old text&lt;/ref&gt;'), true, 'Modified ref badge + raw ref should stay inline in deleted cell');
    assert.strictEqual(result.newAddHtml.includes('⟨~mod~⟩') && result.newAddHtml.includes('&lt;ref name="mod"&gt;New text&lt;/ref&gt;'), true, 'Modified ref badge + raw ref should stay inline in added cell');

    // 3. Added and deleted references ALWAYS separate regardless of checkbox
    assert.strictEqual(result.newAddHtml.includes('⟨+added+⟩'), true, 'Added ref should be badged');
    assert.strictEqual(result.newDelHtml.includes('⟨-deleted-⟩'), true, 'Deleted ref should be badged');
    assert.strictEqual(result.modifiedCits.length, 2, 'Added and deleted refs should still produce citation rows');
    assert.strictEqual(result.modifiedCits.some(m => m.label === 'mod'), false, 'Modified ref should NOT produce a separate row');
    assert.strictEqual(result.modifiedCits.some(m => m.label === 'added'), true, 'Added ref should produce a separate row');
    assert.strictEqual(result.modifiedCits.some(m => m.label === 'deleted'), true, 'Deleted ref should produce a separate row');
  });

  test('applyDecoupling with separateChanged: false does not insert citation rows for modified citations', () => {
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

  test('transformProseCells and applyDecoupling preserve prose whitespace diffs (Cosmic Inflation diff)', () => {
    const delHtml = '<div>many of these&lt;ref name="wmap2"&gt;cite content&lt;/ref&gt;</div>';
    const addHtml = '<div>many of<ins class="diffchange diffchange-inline"> </ins> these&lt;ref name="wmap2"&gt;cite content&lt;/ref&gt;</div>';
    const pairs = [
      {
        d: { raw: '&lt;ref name="wmap2"&gt;cite content&lt;/ref&gt;', name: 'wmap2', hasChange: false },
        a: { raw: '&lt;ref name="wmap2"&gt;cite content&lt;/ref&gt;', name: 'wmap2', hasChange: false },
        name: 'wmap2'
      }
    ];

    const result = transformProseCells(delHtml, addHtml, pairs, 1);
    assert.strictEqual(
      result.newAddHtml.includes('<ins class="diffchange diffchange-inline"> </ins>'),
      true,
      'Should preserve whitespace diffchange tag in added line'
    );
    assert.strictEqual(result.newAddHtml.includes('⟨wmap2⟩'), true, 'Should still badge unchanged citation');

    // Test applyDecoupling retains diff row classes when prose change is purely whitespace
    const mockDelDiv = { innerHTML: delHtml };
    const mockAddDiv = { innerHTML: addHtml };
    const mockDelTd = { className: 'diff-deletedline' };
    const mockAddTd = { className: 'diff-addedline' };
    let removedMarker = false;
    const mockMarker = {
      getAttribute(attr) { return attr === 'data-marker' ? '+' : null; },
      removeAttribute(attr) { if (attr === 'data-marker') removedMarker = true; }
    };

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
          remove: () => {}
        })
      }
    }, () => {
      applyDecoupling(mockTable);
      assert.strictEqual(mockDelTd.className, 'diff-deletedline', 'Should NOT convert deleted td to context');
      assert.strictEqual(mockAddTd.className, 'diff-addedline', 'Should NOT convert added td to context');
      assert.strictEqual(removedMarker, false, 'Should NOT strip data-marker from whitespace diff row');
      restoreOriginal(mockTable);
    });
  });

  test('transformProseCells separates newly added callout into citation row (Kim Domingo diff)', () => {
    const rawDel = '<div>| birth_date ={{birth date and age|1995|2|3}} </div>';
    const rawAdd = '<div>| birth_date =<ins class="diffchange diffchange-inline"> </ins>{{birth date and age|1995|2|3}}<ins class="diffchange diffchange-inline">&lt;ref name="kami"</ins> <ins class="diffchange diffchange-inline">/&gt;</ins></div>';

    const normDel = normalizeDiffTags(rawDel);
    const normAdd = normalizeDiffTags(rawAdd);
    const pairs = pairReferences(parseRefs(normDel), parseRefs(normAdd));

    const result = transformProseCells(normDel, normAdd, pairs, 1);
    assert.strictEqual(result.newAddHtml.includes('⟨+kami+⟩'), true, 'Should include add badge');
    assert.strictEqual(result.modifiedCits.length, 1);
    assert.strictEqual(result.modifiedCits[0].newRaw, '&lt;ref name="kami" /&gt;');
    assert.strictEqual(result.modifiedCits[0].isAdd, true);
  });

  test('transformProseCells accurately handles unwrapped footnotes and preserves rp page suffixes without spurious modified badges (Zipf\'s law diff=1379548357)', () => {
    const rawDel = '<div><del class="diffchange diffchange-inline">Zipf&#039;s law had been discovered before Zipf,{{efn|as</del> Zipf acknowledged&lt;ref name=zipf1949/&gt;{{rp|546}}<del class="diffchange diffchange-inline">}}</del> <del class="diffchange diffchange-inline">first</del> by the French stenographer [[Jean-Baptiste Estoup]] in 1916,{{refn|</div>';
    const rawAdd = '<div><ins class="diffchange diffchange-inline">As</ins> Zipf acknowledged<ins class="diffchange diffchange-inline">,</ins>&lt;ref name=zipf1949/&gt;{{rp|546}} <ins class="diffchange diffchange-inline">the frequency relationship now called Zipf&#039;s law had been discovered</ins> by the French stenographer [[Jean-Baptiste Estoup]] in 1916,{{refn|</div>';

    const normDel = normalizeDiffTags(rawDel);
    const normAdd = normalizeDiffTags(rawAdd);
    const delRefs = parseRefs(normDel);
    const addRefs = parseRefs(normAdd);

    // Only intact <ref name=zipf1949/> should be parsed; unwrapped efn and rp should not be parsed as standalone citations
    assert.strictEqual(delRefs.length, 1, 'Only zipf1949 should be in delRefs');
    assert.strictEqual(delRefs[0].name, 'zipf1949');
    assert.strictEqual(addRefs.length, 1, 'Only zipf1949 should be in addRefs');
    assert.strictEqual(addRefs[0].name, 'zipf1949');

    const pairs = pairReferences(delRefs, addRefs);
    assert.strictEqual(pairs.length, 1);
    assert.strictEqual(pairs[0].name, 'zipf1949');

    const result = transformProseCells(normDel, normAdd, pairs, 1);

    // Verified badge placement and prose preservation
    assert.strictEqual(result.newDelHtml.includes('⟨zipf1949⟩'), true, 'Should include normal zipf1949 badge in deleted line');
    assert.strictEqual(result.newAddHtml.includes('⟨zipf1949⟩'), true, 'Should include normal zipf1949 badge in added line');
    assert.strictEqual(result.newDelHtml.includes('{{rp|546}}'), true, 'Should preserve {{rp|546}} in deleted line');
    assert.strictEqual(result.newAddHtml.includes('{{rp|546}}'), true, 'Should preserve {{rp|546}} in added line');
    assert.strictEqual(result.newDelHtml.includes('}}}'), false, 'Must not contain corrupted triple braces');
    assert.strictEqual(result.newAddHtml.includes('~546~'), false, 'Must not contain spurious 546 modified badge');
    assert.strictEqual(result.modifiedCits.length, 0, 'No spurious modified citation rows should be created');
  });

  test('transformProseCells leaves unclosed <ref> tags gracefully in-situ in prose', () => {
    const delHtml = 'Line with &lt;ref&gt;unclosed citation in old prose';
    const addHtml = 'Line with &lt;ref&gt;unclosed citation in new prose &lt;ref name="cite1"&gt;Valid new cite&lt;/ref&gt;';
    const delRefs = parseRefs(delHtml);
    const addRefs = parseRefs(addHtml);

    assert.strictEqual(delRefs.length, 0, 'Unclosed ref in deleted line should produce 0 parsed refs');
    assert.strictEqual(addRefs.length, 1, 'Only valid ref in added line should be parsed');

    const pairs = pairReferences(delRefs, addRefs);
    const result = transformProseCells(delHtml, addHtml, pairs, 1);

    assert.strictEqual(result.newDelHtml.includes('&lt;ref&gt;unclosed citation in old prose'), true, 'Unclosed ref must remain in-situ in deleted line');
    assert.strictEqual(result.newAddHtml.includes('&lt;ref&gt;unclosed citation in new prose'), true, 'Unclosed ref must remain in-situ in added line');
    assert.strictEqual(result.newAddHtml.includes('⟨+cite1+⟩'), true, 'Valid reference must receive added badge');
    assert.strictEqual(result.modifiedCits.length, 1, 'Only the valid added reference should produce a citation row');
    assert.strictEqual(result.modifiedCits[0].label, 'cite1');
  });
});

if (require.main === module) {
  finishStandalone();
}
