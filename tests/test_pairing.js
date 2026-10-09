/**
 * refdiff.js Test Suite
 *
 * Zero-dependency unit and integration test suite for RefDiff.
 * Covers: regex matching, citation extraction, pairing algorithms,
 * badge creation, DOM transformations, state persistence, Visual diff interoperability,
 * and inline toggle switch locking.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  extractName,
  parseRefs,
  pairReferences,
  createProseBadge,
  stripHtml,
  isRefDiffPreferred,
  setRefDiffPreferred,
  STORAGE_KEY,
  isVisualDiffActive,
  selectMode,
  updateButtonState,
  setInlineSwitchDisabled,
  applyDecoupling,
  restoreOriginal,
  getDiffBodyRows,
  notifyBodyUpdate
} = require('../refdiff.js');

// --- Lightweight Test Runner ---

let totalTests = 0;
let passedTests = 0;
const failures = [];

function suite(name, fn) {
  console.log(`\n=== ${name} ===`);
  fn();
}

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    failures.push({ description, error: err });
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
  }
}

let originalWindow;

function setupMockWindow(storageEngine = 'localStorage') {
  originalWindow = global.window;
  const mockStore = {};

  if (storageEngine === 'localStorage') {
    global.window = {
      location: { search: '' },
      localStorage: {
        getItem: (key) => mockStore[key] || null,
        setItem: (key, val) => { mockStore[key] = String(val); }
      }
    };
  } else if (storageEngine === 'mw.storage') {
    global.window = {
      location: { search: '' },
      mw: {
        storage: {
          get: (key) => mockStore[key] || null,
          set: (key, val) => { mockStore[key] = String(val); }
        }
      }
    };
  }
  return mockStore;
}

function teardownMockWindow() {
  if (originalWindow !== undefined) {
    global.window = originalWindow;
  } else {
    delete global.window;
  }
}

// --- Test Suites ---

suite('1. Attribute & Tag Regex Parsing', () => {
  test('extracts named citation with HTML entities in attributes', () => {
    const sample = '&lt;ref name=&quot;schmidt2020&quot; group=&quot;note&quot;&gt;Schmidt 2020 p. 12&lt;/ref&gt;';
    const refs = parseRefs(sample);
    assert.strictEqual(refs.length, 1, 'Should parse exactly one reference');
    assert.strictEqual(extractName(refs[0].attrs), 'schmidt2020', 'Should extract decoded name attribute');
    assert.strictEqual(refs[0].content, 'Schmidt 2020 p. 12', 'Should extract reference body content');
  });

  test('extracts self-closing reference tags', () => {
    const sample = '&lt;ref name=&quot;esa2022&quot; /&gt; and &lt;ref name="jpl"/&gt;';
    const refs = parseRefs(sample);
    assert.strictEqual(refs.length, 2, 'Should parse two self-closing references');
    assert.strictEqual(extractName(refs[0].attrs), 'esa2022');
    assert.strictEqual(refs[0].content, undefined, 'Self-closing tag should have undefined content');
    assert.strictEqual(extractName(refs[1].attrs), 'jpl');
    assert.strictEqual(refs[1].content, undefined);
  });

  test('handles diffchange spans nested inside tag attributes', () => {
    const sample = '&lt;ref name=&quot;<span class="diffchange diffchange-inline">new_name</span>&quot;&gt;content&lt;/ref&gt;';
    const refs = parseRefs(sample);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(extractName(refs[0].attrs), 'new_name', 'Should strip diffchange tags when reading name');
    assert.strictEqual(refs[0].hasChange, true, 'Should mark reference as containing changes');
  });

  test('stripHtml removes all HTML tags and leaves text intact', () => {
    const html = '<span class="diffchange">modified</span> <b>bold</b> text';
    assert.strictEqual(stripHtml(html), 'modified bold text');
  });
});

suite('2. Reference Pairing Algorithm', () => {
  test('handles reference inserted at the front of a list', () => {
    const del = [
      { raw: '&lt;ref name="A"&gt;A&lt;/ref&gt;', attrs: 'name="A"', content: 'A' },
      { raw: '&lt;ref name="B"&gt;B&lt;/ref&gt;', attrs: 'name="B"', content: 'B' }
    ];
    const add = [
      { raw: '&lt;ref name="FIRST"&gt;first&lt;/ref&gt;', attrs: 'name="FIRST"', content: 'first' },
      { raw: '&lt;ref name="A"&gt;A mod&lt;/ref&gt;', attrs: 'name="A"', content: 'A mod', hasChange: true },
      { raw: '&lt;ref name="B"&gt;B&lt;/ref&gt;', attrs: 'name="B"', content: 'B' }
    ];

    const pairs = pairReferences(del, add);
    assert.strictEqual(pairs.length, 3, 'Should preserve all 3 positions');
    assert.strictEqual(pairs[0].name, 'FIRST');
    assert.strictEqual(pairs[0].d, null, 'Inserted reference has no deleted counterpart');
    assert.strictEqual(pairs[0].a.content, 'first');
    assert.strictEqual(pairs[1].name, 'A');
    assert.strictEqual(pairs[1].d.content, 'A');
    assert.strictEqual(pairs[1].a.content, 'A mod');
    assert.strictEqual(pairs[2].name, 'B');
  });

  test('preserves sequential order when modified reference is surrounded by unchanged references', () => {
    const del = [
      { raw: '&lt;ref&gt;Ref 1&lt;/ref&gt;', attrs: '', content: 'Ref 1' },
      { raw: '&lt;ref&gt;Ref 2 (old)&lt;/ref&gt;', attrs: '', content: 'Ref 2 (old)' },
      { raw: '&lt;ref&gt;Ref 3&lt;/ref&gt;', attrs: '', content: 'Ref 3' }
    ];
    const add = [
      { raw: '&lt;ref&gt;Ref 1&lt;/ref&gt;', attrs: '', content: 'Ref 1' },
      { raw: '&lt;ref&gt;Ref 2 (new)&lt;/ref&gt;', attrs: '', content: 'Ref 2 (new)' },
      { raw: '&lt;ref&gt;Ref 3&lt;/ref&gt;', attrs: '', content: 'Ref 3' }
    ];

    const pairs = pairReferences(del, add);
    assert.strictEqual(pairs.length, 3);
    assert.strictEqual(pairs[0].d.content, 'Ref 1');
    assert.strictEqual(pairs[0].a.content, 'Ref 1');
    assert.strictEqual(pairs[1].d.content, 'Ref 2 (old)');
    assert.strictEqual(pairs[1].a.content, 'Ref 2 (new)');
    assert.strictEqual(pairs[2].d.content, 'Ref 3');
    assert.strictEqual(pairs[2].a.content, 'Ref 3');
  });

  test('pairs pure reference addition', () => {
    const del = [];
    const add = [{ raw: '&lt;ref name="newRef"&gt;Content&lt;/ref&gt;', attrs: 'name="newRef"', content: 'Content' }];
    const pairs = pairReferences(del, add);
    assert.strictEqual(pairs.length, 1);
    assert.strictEqual(pairs[0].d, null);
    assert.strictEqual(pairs[0].name, 'newRef');
    assert.strictEqual(pairs[0].a.content, 'Content');
  });

  test('pairs pure reference deletion', () => {
    const del = [{ raw: '&lt;ref name="delRef"&gt;Old&lt;/ref&gt;', attrs: 'name="delRef"', content: 'Old' }];
    const add = [];
    const pairs = pairReferences(del, add);
    assert.strictEqual(pairs.length, 1);
    assert.strictEqual(pairs[0].a, null);
    assert.strictEqual(pairs[0].name, 'delRef');
    assert.strictEqual(pairs[0].d.content, 'Old');
  });

  test('pairs self-closing identical references', () => {
    const del = [{ raw: '&lt;ref name="selfClose" /&gt;', attrs: 'name="selfClose"', content: undefined }];
    const add = [{ raw: '&lt;ref name="selfClose" /&gt;', attrs: 'name="selfClose"', content: undefined }];
    const pairs = pairReferences(del, add);
    assert.strictEqual(pairs.length, 1);
    assert.strictEqual(pairs[0].name, 'selfClose');
    assert.strictEqual(pairs[0].d.attrs, 'name="selfClose"');
  });
});

suite('3. Badge Formatting', () => {
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
});

suite('4. Integration on Comprehensive MediaWiki Diff Fixture', () => {
  const compHtml = fs.readFileSync(path.join(__dirname, 'comprehensive_test.html'), 'utf8');

  test('parses all change rows and decoupled citations from fixture', () => {
    const rows = compHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    const changeRows = rows.filter(r => r.includes('diff-deletedline') || r.includes('diff-addedline'));
    assert.strictEqual(changeRows.length, 6, 'Should find 6 change rows in fixture');

    let totalDecoupledPairs = 0;
    const sectionPairs = [];

    for (const row of changeRows) {
      const delMatch = row.match(/<td class="[^"]*diff-deletedline[^"]*"><div>([\s\S]*?)<\/div><\/td>/i);
      const addMatch = row.match(/<td class="[^"]*diff-addedline[^"]*"><div>([\s\S]*?)<\/div><\/td>/i);

      const delRefs = parseRefs(delMatch ? delMatch[1] : '');
      const addRefs = parseRefs(addMatch ? addMatch[1] : '');

      if (delRefs.length === 0 && addRefs.length === 0) continue;

      const pairs = pairReferences(delRefs, addRefs);
      totalDecoupledPairs += pairs.length;
      sectionPairs.push(pairs);
    }

    assert.strictEqual(sectionPairs.length, 5, 'Should find 5 sections containing citation changes');
    assert.strictEqual(totalDecoupledPairs, 7, 'Total decoupled citation pairs should equal 7');

    // Section 1: 3 pairs, sequential
    assert.strictEqual(sectionPairs[0].length, 3);
    assert.strictEqual(sectionPairs[0][0].d.content.includes('Venus Orbital Data'), true);
    assert.strictEqual(sectionPairs[0][1].d.content.includes('50–55'), true);
    assert.strictEqual(sectionPairs[0][1].a.content.includes('80–88'), true);

    // Section 2: Named citation modification
    assert.strictEqual(sectionPairs[1][0].name, 'schmidt2020');

    // Section 3: Added citation with text
    assert.strictEqual(sectionPairs[2][0].name, 'esa2022');
    assert.strictEqual(sectionPairs[2][0].d, null);

    // Section 4: Added citation to existing text
    assert.strictEqual(sectionPairs[3][0].name, 'esa-press');
    assert.strictEqual(sectionPairs[3][0].d, null);

    // Section 5: Removed citation
    assert.strictEqual(sectionPairs[4][0].name, 'venera1982');
    assert.strictEqual(sectionPairs[4][0].a, null);
  });
});

suite('5. State Persistence & Storage', () => {
  test('defaults to true when window and storage are absent', () => {
    delete global.window;
    assert.strictEqual(isRefDiffPreferred(), true);
  });

  test('reads and persists preference using localStorage', () => {
    const store = setupMockWindow('localStorage');
    try {
      assert.strictEqual(isRefDiffPreferred(), true);
      setRefDiffPreferred(false);
      assert.strictEqual(store[STORAGE_KEY], 'false');
      assert.strictEqual(isRefDiffPreferred(), false);
      setRefDiffPreferred(true);
      assert.strictEqual(store[STORAGE_KEY], 'true');
      assert.strictEqual(isRefDiffPreferred(), true);
    } finally {
      teardownMockWindow();
    }
  });

  test('reads and persists preference using mw.storage', () => {
    const store = setupMockWindow('mw.storage');
    try {
      setRefDiffPreferred(false);
      assert.strictEqual(store[STORAGE_KEY], 'false');
      assert.strictEqual(isRefDiffPreferred(), false);
      setRefDiffPreferred(true);
      assert.strictEqual(store[STORAGE_KEY], 'true');
      assert.strictEqual(isRefDiffPreferred(), true);
    } finally {
      teardownMockWindow();
    }
  });

  test('URL parameters override storage preference', () => {
    setupMockWindow('localStorage');
    try {
      global.window.location.search = '?diff=123&refdiff=0';
      assert.strictEqual(isRefDiffPreferred(), false, '?refdiff=0 should force disabled');
      global.window.location.search = '?diff=123&refdiff=1';
      assert.strictEqual(isRefDiffPreferred(), true, '?refdiff=1 should force enabled');
    } finally {
      teardownMockWindow();
    }
  });
});

suite('6. Visual Diff & Selection Mode Switching', () => {
  test('isVisualDiffActive returns false in non-browser environment', () => {
    teardownMockWindow();
    assert.strictEqual(isVisualDiffActive(), false);
  });

  test('selectMode toggles preference correctly across modes', () => {
    setupMockWindow('localStorage');
    try {
      const mockTable = { innerHTML: '<tr><td>diff</td></tr>' };

      selectMode('refdiff', mockTable);
      assert.strictEqual(isRefDiffPreferred(), true);

      selectMode('wikitext', mockTable);
      assert.strictEqual(isRefDiffPreferred(), false);

      selectMode('visual', mockTable);
      assert.strictEqual(isRefDiffPreferred(), false);
    } finally {
      teardownMockWindow();
    }
  });

  test('updateButtonState acts as backward-compatible alias to selectMode', () => {
    setupMockWindow('localStorage');
    try {
      const mockTable = { innerHTML: '<tr><td>diff</td></tr>' };
      updateButtonState(true, mockTable);
      assert.strictEqual(isRefDiffPreferred(), true);
      updateButtonState(false, mockTable);
      assert.strictEqual(isRefDiffPreferred(), false);
    } finally {
      teardownMockWindow();
    }
  });

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

  test('selectMode toggles oo-ui-element-hidden on body rows and notifies mw.hook', () => {
    let hookFiredWith = null;
    global.window = {
      mw: {
        hook(name) {
          if (name === 'wikipage.diff.wikitextBodyUpdate') {
            return {
              fire(arg) { hookFiredWith = arg; }
            };
          }
          return { fire() {}, add() {} };
        }
      },
      $: (el) => el
    };

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

    try {
      selectMode('visual', mockTable);
      assert.strictEqual(addedClasses.includes('oo-ui-element-hidden'), true, 'Should add oo-ui-element-hidden in visual mode');
      assert.deepStrictEqual(hookFiredWith, [bodyRow], 'Should fire wikitextBodyUpdate with body rows in visual mode');

      hookFiredWith = null;
      selectMode('wikitext', mockTable);
      assert.strictEqual(removedClasses.includes('oo-ui-element-hidden'), true, 'Should remove oo-ui-element-hidden in wikitext mode');
      assert.deepStrictEqual(hookFiredWith, [bodyRow], 'Should fire wikitextBodyUpdate with body rows in wikitext mode');
    } finally {
      delete global.window;
    }
  });

  test('notifyBodyUpdate fires mw.hook with jQuery-wrapped body rows', () => {
    let hookFiredWith = null;
    global.window = {
      mw: {
        hook(name) {
          if (name === 'wikipage.diff.wikitextBodyUpdate') {
            return {
              fire(arg) { hookFiredWith = arg; }
            };
          }
          return { fire() {}, add() {} };
        }
      },
      $: (el) => el
    };

    const row = { className: '' };
    const mockTable = {
      querySelectorAll(selector) {
        if (selector === 'tr.diff-title') return [];
        if (selector.includes('diff-multi') || selector.includes('diff-notice')) return [];
        if (selector === 'tr') return [row];
        return [];
      }
    };

    try {
      notifyBodyUpdate(mockTable);
      assert.deepStrictEqual(hookFiredWith, [row]);
    } finally {
      delete global.window;
    }
  });
});

suite('7. Inline Switch Management & Defensive Guards', () => {
  test('setInlineSwitchDisabled safely handles execution without DOM', () => {
    assert.doesNotThrow(() => {
      setInlineSwitchDisabled(true);
      setInlineSwitchDisabled(false);
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

// --- Summary & Exit ---

console.log(`\n==========================================`);
console.log(`Test Results: ${passedTests}/${totalTests} passed (${failures.length} failed)`);
console.log(`==========================================`);

if (failures.length > 0) {
  console.error(`\nFailed tests:`);
  for (const f of failures) {
    console.error(` - ${f.description}: ${f.error.message}`);
  }
  process.exit(1);
} else {
  console.log(`All test suites passed successfully!\n`);
  process.exit(0);
}
