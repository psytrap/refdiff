// Comprehensive test suite for refdiff.js logic
const assert = require('assert');

// 1. Attribute & Tag Regex Matching
const refRegex = /&lt;ref\b((?:(?!&gt;|\/&gt;)[\s\S])*?)(?:\/&gt;|&gt;([\s\S]*?)&lt;\/ref&gt;)/gi;

function extractName(attrsStr) {
  if (!attrsStr) return null;
  const clean = attrsStr.replace(/<[^>]+>/g, '');
  const m = clean.match(/name\s*=\s*(?:&quot;|["']|&apos;)(.*?)(?:&quot;|["']|&apos;)|name\s*=\s*([^\s"'>&]+)/i);
  return m ? (m[1] || m[2]).trim() : null;
}

function parseRefs(html) {
  const refs = [];
  let m;
  refRegex.lastIndex = 0;
  while ((m = refRegex.exec(html)) !== null) {
    const hasChange = m[0].includes('diffchange');
    refs.push({ raw: m[0], attrs: m[1], content: m[2], hasChange });
  }
  return refs;
}

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

// 2. Reference Pairing
function pairReferences(delRefs, addRefs) {
  const pairs = [];
  const matchedDel = new Set();
  const matchedAdd = new Set();

  const cleanContent = (r) => {
    if (!r) return '';
    return (r.content || r.raw || '').replace(/<[^>]+>/g, '').trim();
  };

  // Pass 1: Match by explicit name
  for (let i = 0; i < delRefs.length; i++) {
    const d = delRefs[i];
    const dName = extractName(d.attrs);
    if (!dName) continue;
    for (let j = 0; j < addRefs.length; j++) {
      if (matchedAdd.has(j)) continue;
      const a = addRefs[j];
      const aName = extractName(a.attrs);
      if (aName && aName.toLowerCase() === dName.toLowerCase()) {
        matchedDel.add(i);
        matchedAdd.add(j);
        pairs.push({ d, a, name: dName });
        break;
      }
    }
  }

  // Pass 2: Match identical references (same clean content)
  for (let i = 0; i < delRefs.length; i++) {
    if (matchedDel.has(i)) continue;
    const d = delRefs[i];
    const dClean = cleanContent(d);
    if (!dClean) continue;
    for (let j = 0; j < addRefs.length; j++) {
      if (matchedAdd.has(j)) continue;
      const a = addRefs[j];
      if (cleanContent(a) === dClean) {
        matchedDel.add(i);
        matchedAdd.add(j);
        pairs.push({ d, a, name: extractName(d.attrs) || extractName(a.attrs) });
        break;
      }
    }
  }

  // Pass 3: Pair remaining in positional order
  const remainingDel = [];
  for (let i = 0; i < delRefs.length; i++) {
    if (!matchedDel.has(i)) remainingDel.push(delRefs[i]);
  }
  const remainingAdd = [];
  for (let j = 0; j < addRefs.length; j++) {
    if (!matchedAdd.has(j)) remainingAdd.push(addRefs[j]);
  }

  const commonCount = Math.min(remainingDel.length, remainingAdd.length);
  for (let k = 0; k < commonCount; k++) {
    const d = remainingDel[k];
    const a = remainingAdd[k];
    pairs.push({ d, a, name: extractName(d.attrs) || extractName(a.attrs) });
  }

  for (let k = commonCount; k < remainingDel.length; k++) {
    const d = remainingDel[k];
    pairs.push({ d, a: null, name: extractName(d.attrs) });
  }

  for (let k = commonCount; k < remainingAdd.length; k++) {
    const a = remainingAdd[k];
    pairs.push({ d: null, a, name: extractName(a.attrs) });
  }

  return pairs;
}

// Test insertion at front:
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
// Pass 1 pairs A and B
assert.strictEqual(p1[0].name, 'A');
assert.strictEqual(p1[0].d.content, 'A');
assert.strictEqual(p1[0].a.content, 'A mod');
assert.strictEqual(p1[1].name, 'B');
assert.strictEqual(p1[1].d.content, 'B');
assert.strictEqual(p1[1].a.content, 'B');
// Added FIRST
assert.strictEqual(p1[2].name, 'FIRST');
assert.strictEqual(p1[2].d, null);
assert.strictEqual(p1[2].a.content, 'first');

console.log("All refdiff.js JavaScript unit tests passed successfully!");
