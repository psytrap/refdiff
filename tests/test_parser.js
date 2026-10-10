/**
 * tests/test_parser.js
 *
 * Tests for src/parser.js: Unified reference and template parser.
 */

const { assert, suite, test, finishStandalone } = require('./harness.js');
const { parseRefs, extractName, extractSfnInfo } = require('../refdiff.js');

suite('src/parser.js - Tag & Footnote Template Parsing', () => {
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

  test('extractSfnInfo parses single author and year correctly', () => {
    const info = extractSfnInfo('|Castritius|2005');
    assert.strictEqual(info.label, 'Castritius 2005');
    assert.strictEqual(info.anchorToken, 'FOOTNOTECastritius2005');
    assert.deepStrictEqual(info.authors, ['Castritius']);
    assert.strictEqual(info.year, '2005');
  });

  test('extractSfnInfo parses two authors, year, and page parameters', () => {
    const info = extractSfnInfo('|Reichert|Wolfram|2010|p=574');
    assert.strictEqual(info.label, 'Reichert & Wolfram 2010');
    assert.strictEqual(info.anchorToken, 'FOOTNOTEReichertWolfram2010');
    assert.deepStrictEqual(info.authors, ['Reichert', 'Wolfram']);
    assert.strictEqual(info.year, '2010');
  });

  test('extractSfnInfo parses three and four-plus authors', () => {
    const three = extractSfnInfo('|Smith|Jones|Brown|2020|pp=12-15');
    assert.strictEqual(three.label, 'Smith, Jones & Brown 2020');
    assert.strictEqual(three.anchorToken, 'FOOTNOTESmithJonesBrown2020');

    const fourPlus = extractSfnInfo('|Alpha|Beta|Gamma|Delta|2023');
    assert.strictEqual(fourPlus.label, 'Alpha et al. 2023');
    assert.strictEqual(fourPlus.anchorToken, 'FOOTNOTEAlphaBetaGammaDelta2023');
  });

  test('extractSfnInfo handles missing year or empty parameters gracefully', () => {
    const empty = extractSfnInfo('');
    assert.strictEqual(empty.label, 'sfn');
    assert.strictEqual(empty.anchorToken, null);

    const authorOnly = extractSfnInfo('|AuthorOnly');
    assert.strictEqual(authorOnly.label, 'AuthorOnly');
    assert.strictEqual(authorOnly.year, '');
    assert.strictEqual(authorOnly.anchorToken, 'FOOTNOTEAuthorOnly');
  });

  test('parseRefs parses both <ref> tags and {{sfn}} templates in sequential document order', () => {
    const html = 'Prose 1&lt;ref name="foo"&gt;Cite A&lt;/ref&gt; prose 2{{sfn|Reichert|Wolfram|2010|p=574}} prose 3&lt;ref&gt;Cite B&lt;/ref&gt; prose 4{{r|bar}}';
    const refs = parseRefs(html);

    assert.strictEqual(refs.length, 4, 'Should parse all 4 mixed citations');

    // 1: <ref name="foo">
    assert.strictEqual(refs[0].isTemplate, false);
    assert.strictEqual(refs[0].name, 'foo');
    assert.strictEqual(refs[0].label, 'foo');

    // 2: {{sfn}}
    assert.strictEqual(refs[1].isTemplate, true);
    assert.strictEqual(refs[1].templateName, 'sfn');
    assert.strictEqual(refs[1].label, 'Reichert & Wolfram 2010');
    assert.strictEqual(refs[1].name, 'FOOTNOTEReichertWolfram2010');

    // 3: <ref>Cite B</ref>
    assert.strictEqual(refs[2].isTemplate, false);
    assert.strictEqual(refs[2].name, null);

    // 4: {{r|bar}}
    assert.strictEqual(refs[3].isTemplate, true);
    assert.strictEqual(refs[3].templateName, 'r');
    assert.strictEqual(refs[3].label, 'bar');
    assert.strictEqual(refs[3].name, 'bar');
  });
});

if (require.main === module) {
  finishStandalone();
}
