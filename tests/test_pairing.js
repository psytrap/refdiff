// Comprehensive test suite for refdiff.js logic
const assert = require('assert');
const { extractName, parseRefs, pairReferences, isRefDiffPreferred, setRefDiffPreferred, STORAGE_KEY } = require('../refdiff.js');

// 1. Attribute & Tag Regex Matching

// Test HTML entities in attributes
const htmlEntitiesSample = `&lt;ref name=&quot;schmidt2020&quot; group=&quot;note&quot;&gt;Schmidt 2020 p. 12&lt;/ref&gt;`;
const r1 = parseRefs(htmlEntitiesSample);
assert.strictEqual(r1.length, 1);
assert.strictEqual(extractName(r1[0].attrs), 'schmidt2020');
assert.strictEqual(r1[0].content, 'Schmidt 2020 p. 12');

// Test self-closing with entities
const selfClosingSample = `&lt;ref name=&quot;esa2022&quot; /&gt; and &lt;ref name="jpl"/&gt;`;
const r2 = parseRefs(selfClosingSample);
assert.strictEqual(r2.length, 2);
assert.strictEqual(extractName(r2[0].attrs), 'esa2022');
assert.strictEqual(r2[0].content, undefined);
assert.strictEqual(extractName(r2[1].attrs), 'jpl');
assert.strictEqual(r2[1].content, undefined);

// Test diffchange inside tag
const diffchangeSample = `&lt;ref name=&quot;<span class="diffchange diffchange-inline">new_name</span>&quot;&gt;content&lt;/ref&gt;`;
const r3 = parseRefs(diffchangeSample);
assert.strictEqual(r3.length, 1);
assert.strictEqual(extractName(r3[0].attrs), 'new_name');
assert.strictEqual(r3[0].hasChange, true);

// 2. Reference Pairing Tests
// Test 1: Insertion at front:
const del1 = [
  { raw: '&lt;ref name="A"&gt;A&lt;/ref&gt;', attrs: 'name="A"', content: 'A' },
  { raw: '&lt;ref name="B"&gt;B&lt;/ref&gt;', attrs: 'name="B"', content: 'B' }
];
const add1 = [
  { raw: '&lt;ref name="FIRST"&gt;first&lt;/ref&gt;', attrs: 'name="FIRST"', content: 'first' },
  { raw: '&lt;ref name="A"&gt;A mod&lt;/ref&gt;', attrs: 'name="A"', content: 'A mod', hasChange: true },
  { raw: '&lt;ref name="B"&gt;B&lt;/ref&gt;', attrs: 'name="B"', content: 'B' }
];

const p1 = pairReferences(del1, add1);
assert.strictEqual(p1.length, 3);
// In document appearance order, FIRST is at index 0, A is at index 1, B is at index 2
assert.strictEqual(p1[0].name, 'FIRST');
assert.strictEqual(p1[0].d, null);
assert.strictEqual(p1[0].a.content, 'first');
assert.strictEqual(p1[1].name, 'A');
assert.strictEqual(p1[1].d.content, 'A');
assert.strictEqual(p1[1].a.content, 'A mod');
assert.strictEqual(p1[2].name, 'B');
assert.strictEqual(p1[2].d.content, 'B');
assert.strictEqual(p1[2].a.content, 'B');

// Test 2: Modified citation between two unmodified citations (Solar System case)
const del2 = [
  { raw: '&lt;ref&gt;Ref 1&lt;/ref&gt;', attrs: '', content: 'Ref 1' },
  { raw: '&lt;ref&gt;Ref 2 (old)&lt;/ref&gt;', attrs: '', content: 'Ref 2 (old)' },
  { raw: '&lt;ref&gt;Ref 3&lt;/ref&gt;', attrs: '', content: 'Ref 3' }
];
const add2 = [
  { raw: '&lt;ref&gt;Ref 1&lt;/ref&gt;', attrs: '', content: 'Ref 1' },
  { raw: '&lt;ref&gt;Ref 2 (new)&lt;/ref&gt;', attrs: '', content: 'Ref 2 (new)' },
  { raw: '&lt;ref&gt;Ref 3&lt;/ref&gt;', attrs: '', content: 'Ref 3' }
];

const p2 = pairReferences(del2, add2);
assert.strictEqual(p2.length, 3);
// Should preserve exact sequential 1, 2, 3 appearance order
assert.strictEqual(p2[0].d.content, 'Ref 1');
assert.strictEqual(p2[0].a.content, 'Ref 1');
assert.strictEqual(p2[1].d.content, 'Ref 2 (old)');
assert.strictEqual(p2[1].a.content, 'Ref 2 (new)');
assert.strictEqual(p2[2].d.content, 'Ref 3');
assert.strictEqual(p2[2].a.content, 'Ref 3');

// Test 3: Pure addition (no deleted references)
const del3 = [];
const add3 = [
  { raw: '&lt;ref name="newRef"&gt;Content&lt;/ref&gt;', attrs: 'name="newRef"', content: 'Content' }
];
const p3 = pairReferences(del3, add3);
assert.strictEqual(p3.length, 1);
assert.strictEqual(p3[0].d, null);
assert.strictEqual(p3[0].name, 'newRef');
assert.strictEqual(p3[0].a.content, 'Content');

// Test 4: Pure deletion (no added references)
const del4 = [
  { raw: '&lt;ref name="delRef"&gt;Old&lt;/ref&gt;', attrs: 'name="delRef"', content: 'Old' }
];
const add4 = [];
const p4 = pairReferences(del4, add4);
assert.strictEqual(p4.length, 1);
assert.strictEqual(p4[0].a, null);
assert.strictEqual(p4[0].name, 'delRef');
assert.strictEqual(p4[0].d.content, 'Old');

// Test 5: Self-closing reference tag
const del5 = [
  { raw: '&lt;ref name="selfClose" /&gt;', attrs: 'name="selfClose"', content: undefined }
];
const add5 = [
  { raw: '&lt;ref name="selfClose" /&gt;', attrs: 'name="selfClose"', content: undefined }
];
const p5 = pairReferences(del5, add5);
assert.strictEqual(p5.length, 1);
assert.strictEqual(p5[0].name, 'selfClose');
assert.strictEqual(p5[0].d.attrs, 'name="selfClose"');
// Test 6: Full pipeline parsing and pairing of comprehensive_test.html (real MediaWiki wikidiff2 HTML)
const fs = require('fs');
const path = require('path');
const compHtml = fs.readFileSync(path.join(__dirname, 'comprehensive_test.html'), 'utf8');

const rows = compHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
const changeRows = rows.filter(r => r.includes('diff-deletedline') || r.includes('diff-addedline'));
assert.strictEqual(changeRows.length, 6, 'Should find 6 change rows across the 5 sections in comprehensive_test.html');

let totalDecoupledPairs = 0;
const sectionPairs = [];

for (const row of changeRows) {
  const delMatch = row.match(/<td class="[^"]*diff-deletedline[^"]*"><div>([\s\S]*?)<\/div><\/td>/i);
  const addMatch = row.match(/<td class="[^"]*diff-addedline[^"]*"><div>([\s\S]*?)<\/div><\/td>/i);

  const delHtml = delMatch ? delMatch[1] : '';
  const addHtml = addMatch ? addMatch[1] : '';

  const delRefs = parseRefs(delHtml);
  const addRefs = parseRefs(addHtml);

  if (delRefs.length === 0 && addRefs.length === 0) continue;

  const pairs = pairReferences(delRefs, addRefs);
  totalDecoupledPairs += pairs.length;
  sectionPairs.push(pairs);
}

// 5 sections with citations
assert.strictEqual(sectionPairs.length, 5, 'Should find exactly 5 change rows containing citations');
assert.strictEqual(totalDecoupledPairs, 7, 'Total reference pairs across 5 sections should be 7');

// Section 1: 3 pairs, sequential document order
assert.strictEqual(sectionPairs[0].length, 3);
assert.strictEqual(sectionPairs[0][0].d.content.includes('Venus Orbital Data'), true);
assert.strictEqual(sectionPairs[0][0].a.content.includes('Venus Orbital Data'), true);
assert.strictEqual(sectionPairs[0][1].d.content.includes('50–55'), true);
assert.strictEqual(sectionPairs[0][1].a.content.includes('80–88'), true);
assert.strictEqual(sectionPairs[0][2].d.content.includes('Planetary Moons'), true);
assert.strictEqual(sectionPairs[0][2].a.content.includes('Planetary Moons'), true);

// Section 2: Named citation modified
assert.strictEqual(sectionPairs[1].length, 1);
assert.strictEqual(sectionPairs[1][0].name, 'schmidt2020');
assert.strictEqual(sectionPairs[1][0].d.content.includes('45–48'), true);
assert.strictEqual(sectionPairs[1][0].a.content.includes('45–60'), true);

// Section 3: Added reference with text
assert.strictEqual(sectionPairs[2].length, 1);
assert.strictEqual(sectionPairs[2][0].name, 'esa2022');
assert.strictEqual(sectionPairs[2][0].d, null);
assert.strictEqual(sectionPairs[2][0].a.content.includes('Müller, H.'), true);

// Section 4: Added reference to existing text
assert.strictEqual(sectionPairs[3].length, 1);
assert.strictEqual(sectionPairs[3][0].name, 'esa-press');
assert.strictEqual(sectionPairs[3][0].d, null);
assert.strictEqual(sectionPairs[3][0].a.content.includes('Venus Surface Conditions'), true);

// Section 5: Removed reference
assert.strictEqual(sectionPairs[4].length, 1);
assert.strictEqual(sectionPairs[4][0].name, 'venera1982');
assert.strictEqual(sectionPairs[4][0].a, null);
assert.strictEqual(sectionPairs[4][0].d.content.includes('Moroz, V. I.'), true);

// 7. State Persistence & Storage Tests
// Test 7.1: Defaults to true when no window / storage
assert.strictEqual(isRefDiffPreferred(), true);

// Test 7.2: localStorage integration
const mockStore = {};
global.window = {
  location: { search: '' },
  localStorage: {
    getItem: (key) => mockStore[key] || null,
    setItem: (key, val) => { mockStore[key] = String(val); }
  }
};

assert.strictEqual(isRefDiffPreferred(), true);

setRefDiffPreferred(false);
assert.strictEqual(mockStore[STORAGE_KEY], 'false');
assert.strictEqual(isRefDiffPreferred(), false);

setRefDiffPreferred(true);
assert.strictEqual(mockStore[STORAGE_KEY], 'true');
assert.strictEqual(isRefDiffPreferred(), true);

// Test 7.3: URL parameter overrides
global.window.location.search = '?diff=123&refdiff=0';
assert.strictEqual(isRefDiffPreferred(), false);

global.window.location.search = '?diff=123&refdiff=1';
assert.strictEqual(isRefDiffPreferred(), true);
global.window.location.search = '';

// Test 7.4: mw.storage integration
const mwStore = {};
global.window.mw = {
  storage: {
    get: (key) => mwStore[key] || null,
    set: (key, val) => { mwStore[key] = String(val); }
  }
};

setRefDiffPreferred(false);
assert.strictEqual(mwStore[STORAGE_KEY], 'false');
assert.strictEqual(isRefDiffPreferred(), false);

setRefDiffPreferred(true);
assert.strictEqual(mwStore[STORAGE_KEY], 'true');
assert.strictEqual(isRefDiffPreferred(), true);

// 8. Visual Diff & Selection Mode Tests
const { isVisualDiffActive, selectMode, updateButtonState, setInlineSwitchDisabled } = require('../refdiff.js');

// Test 8.1: isVisualDiffActive returns false in Node environment
assert.strictEqual(isVisualDiffActive(), false);

// Test 8.2: selectMode switches modes cleanly
const mockTable = { innerHTML: '<tr><td>diff</td></tr>' };
selectMode('refdiff', mockTable);
assert.strictEqual(isRefDiffPreferred(), true);

selectMode('wikitext', mockTable);
assert.strictEqual(isRefDiffPreferred(), false);

selectMode('visual', mockTable);
// Visual mode should not set RefDiff preferred
assert.strictEqual(isRefDiffPreferred(), false);

updateButtonState(true, mockTable);
assert.strictEqual(isRefDiffPreferred(), true);

updateButtonState(false, mockTable);
assert.strictEqual(isRefDiffPreferred(), false);

// Test 8.3: setInlineSwitchDisabled handles null/missing environment safely
assert.doesNotThrow(() => {
  setInlineSwitchDisabled(true);
  setInlineSwitchDisabled(false);
});

// Clean up globals
delete global.window;

console.log('All refdiff.js JavaScript unit tests passed successfully!');


