/**
 * tests/test_pairing.js
 *
 * Tests for src/pairing.js: 3-pass heuristic reference pairing engine.
 */

const { assert, suite, test, finishStandalone } = require('./harness.js');
const { pairReferences, parseRefs } = require('../refdiff.js');

suite('src/pairing.js - Reference Pairing Heuristics', () => {
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

  test('pairReferences accurately pairs modified {{sfn}} citations by label', () => {
    const delRefs = parseRefs('{{sfn|Voyles|1992|p=140}}');
    const addRefs = parseRefs('{{sfn|Voyles|1992|p=141}}');
    const pairs = pairReferences(delRefs, addRefs);

    assert.strictEqual(pairs.length, 1, 'Should pair the two Voyles 1992 citations');
    assert.strictEqual(pairs[0].d.label, 'Voyles 1992');
    assert.strictEqual(pairs[0].a.label, 'Voyles 1992');
    assert.strictEqual(pairs[0].name, 'Voyles 1992');
  });
});

if (require.main === module) {
  finishStandalone();
}
