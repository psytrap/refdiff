/**
 * tests/test_benchmarks.js
 *
 * Tests for full diff fixtures & high-density airport stress benchmarks.
 */

const fs = require('fs');
const path = require('path');
const { assert, suite, test, finishStandalone } = require('./harness.js');
const { parseRefs, pairReferences, normalizeDiffTags } = require('../refdiff.js');

suite('Benchmarks & Integration Fixtures', () => {
  const compHtml = fs.readFileSync(path.join(__dirname, 'comprehensive_test.html'), 'utf8');
  const stressFixturePath = path.join(__dirname, 'stress_test_1379409916.html');
  const stressHtml = fs.readFileSync(stressFixturePath, 'utf8');

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

  test('normalizes diffchange boundaries splitting <ref> tag markers', () => {
    const rawSplit = '&lt;ref&gt;content&lt;/ref<del class="diffchange diffchange-inline">&gt; deleted prose,&lt;ref name="test"/</del>&gt;';
    const norm = normalizeDiffTags(rawSplit);
    assert.strictEqual(norm.includes('&lt;/ref&gt;'), true, 'Should reassemble &lt;/ref&gt;');
    assert.strictEqual(norm.includes('&lt;ref name="test"/&gt;'), true, 'Should reassemble self-closing tag');

    const refs = parseRefs(rawSplit);
    assert.strictEqual(refs.length, 2, 'Should parse both references across diffchange boundary split');
  });

  test('loads and accurately parses 114 references across high-density change rows', () => {
    const rows = stressHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    const changeRows = rows.filter(r => r.includes('diff-deletedline') || r.includes('diff-addedline'));
    assert.strictEqual(changeRows.length, 4, 'Should find 4 change rows in stress diff');

    let totalDelRefs = 0;
    let totalAddRefs = 0;
    for (const row of changeRows) {
      const delMatch = row.match(/<td class="[^"]*diff-deletedline[^"]*"><div>([\s\S]*?)<\/div><\/td>/i);
      const addMatch = row.match(/<td class="[^"]*diff-addedline[^"]*"><div>([\s\S]*?)<\/div><\/td>/i);
      totalDelRefs += parseRefs(delMatch ? delMatch[1] : '').length;
      totalAddRefs += parseRefs(addMatch ? addMatch[1] : '').length;
    }

    assert.strictEqual(totalDelRefs, 57, 'Deleted side should contain 57 references');
    assert.strictEqual(totalAddRefs, 57, 'Added side should contain 57 references');
    assert.strictEqual(totalDelRefs + totalAddRefs, 114, 'Total parsed citations under stress should equal 114');
  });

  test('accurately pairs 57 reference slots without leaking unparsed tags', () => {
    const rows = stressHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    const changeRows = rows.filter(r => r.includes('diff-deletedline') || r.includes('diff-addedline'));

    const rowResults = [];
    let totalPairs = 0;

    for (const row of changeRows) {
      const delMatch = row.match(/<td class="[^"]*diff-deletedline[^"]*"><div>([\s\S]*?)<\/div><\/td>/i);
      const addMatch = row.match(/<td class="[^"]*diff-addedline[^"]*"><div>([\s\S]*?)<\/div><\/td>/i);

      const delRefs = parseRefs(delMatch ? delMatch[1] : '');
      const addRefs = parseRefs(addMatch ? addMatch[1] : '');
      const pairs = pairReferences(delRefs, addRefs);
      totalPairs += pairs.length;
      rowResults.push({ delRefs, addRefs, pairs });
    }

    assert.strictEqual(totalPairs, 57, 'Total decoupled citation pairs should equal 57');

    // Row 0: 27 references, all unmodified
    assert.strictEqual(rowResults[0].pairs.length, 27, 'Row 0 should have 27 pairs');
    const row0Changed = rowResults[0].pairs.filter(p => !p.d || !p.a || p.d.raw !== p.a.raw);
    assert.strictEqual(row0Changed.length, 0, 'Row 0 must produce 0 modified citations (all 27 are unmodified)');

    // Row 1 & 2: 1 pair each, unmodified
    assert.strictEqual(rowResults[1].pairs.length, 1);
    assert.strictEqual(rowResults[2].pairs.length, 1);

    // Row 3: 28 pairs (all 28 citations are identical across revisions)
    assert.strictEqual(rowResults[3].pairs.length, 28, 'Row 3 should have 28 pairs');
    const row3Changed = rowResults[3].pairs.filter(p => !p.d || !p.a || p.d.raw !== p.a.raw);
    assert.strictEqual(row3Changed.length, 0, 'Row 3 citations were unchanged (only airline destination prose changed)');
  });

  test('benchmark: sub-50ms processing time across 100+ citations', () => {
    const rows = stressHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    const changeRows = rows.filter(r => r.includes('diff-deletedline') || r.includes('diff-addedline'));

    const start = process.hrtime.bigint();
    for (let run = 0; run < 10; run++) {
      for (const row of changeRows) {
        const delMatch = row.match(/<td class="[^"]*diff-deletedline[^"]*"><div>([\s\S]*?)<\/div><\/td>/i);
        const addMatch = row.match(/<td class="[^"]*diff-addedline[^"]*"><div>([\s\S]*?)<\/div><\/td>/i);
        const delRefs = parseRefs(delMatch ? delMatch[1] : '');
        const addRefs = parseRefs(addMatch ? addMatch[1] : '');
        pairReferences(delRefs, addRefs);
      }
    }
    const totalElapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    const avgMs = totalElapsedMs / 10;

    assert.strictEqual(avgMs < 50, true, `Processing must be fast (took ${avgMs.toFixed(2)}ms per full table pass, limit is 50ms)`);
  });
});

if (require.main === module) {
  finishStandalone();
}
