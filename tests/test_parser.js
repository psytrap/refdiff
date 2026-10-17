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

  test('extracts reference name with unclosed quotation mark (Donnie Brasco diff=1380017400)', () => {
    const sample = '&lt;ref name="mojo_2&gt;{{cite web|url = https://example.com}}&lt;/ref&gt;';
    const refs = parseRefs(sample);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(extractName(refs[0].attrs), 'mojo_2', 'Should tolerate unclosed quote before tag close');
    assert.strictEqual(refs[0].name, 'mojo_2');
    assert.strictEqual(refs[0].label, 'mojo_2');
  });

  test('extracts reference name with embedded apostrophes inside double quotes (Bihar Legislative Assembly diff=1379207737)', () => {
    const sample = '&lt;ref name="From teen in RSS shakha to Speaker\'s Chair: Bihar BJP leader Prem Kumar\'s long journey"&gt;{{cite news...}}&lt;/ref&gt;';
    const refs = parseRefs(sample);
    assert.strictEqual(refs.length, 1);
    const expected = "From teen in RSS shakha to Speaker's Chair: Bihar BJP leader Prem Kumar's long journey";
    assert.strictEqual(extractName(refs[0].attrs), expected, 'Should preserve embedded apostrophes without truncation');
    assert.strictEqual(refs[0].name, expected);
    assert.strictEqual(refs[0].label, expected);
  });

  test('extracts reference name with embedded double quotes inside single quotes', () => {
    const sample = '&lt;ref name=\'He said "Hello" world\'&gt;{{cite web}}&lt;/ref&gt;';
    const refs = parseRefs(sample);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(extractName(refs[0].attrs), 'He said "Hello" world');
    assert.strictEqual(refs[0].name, 'He said "Hello" world');
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
    assert.strictEqual(empty.label, 'sfn', 'Empty sfn should default label to sfn');
    assert.strictEqual(empty.anchorToken, null, 'Empty sfn should have null anchor token');

    const authorOnly = extractSfnInfo('|AuthorOnly');
    assert.strictEqual(authorOnly.label, 'AuthorOnly', 'Author-only sfn should use author as label');
    assert.strictEqual(authorOnly.year, '', 'Author-only sfn should have empty year');
    assert.strictEqual(authorOnly.anchorToken, 'FOOTNOTEAuthorOnly', 'Author-only sfn should format anchor with FOOTNOTE prefix');
  });

  test('parseRefs parses both <ref> tags and {{sfn}} templates in sequential document order', () => {
    const html = 'Prose 1&lt;ref name="foo"&gt;Cite A&lt;/ref&gt; prose 2{{sfn|Reichert|Wolfram|2010|p=574}} prose 3&lt;ref&gt;Cite B&lt;/ref&gt; prose 4{{r|bar}}';
    const refs = parseRefs(html);

    assert.strictEqual(refs.length, 4, 'Should parse all 4 mixed citations');

    // 1: <ref name="foo">
    assert.strictEqual(refs[0].isTemplate, false, 'Reference 0 should be a ref tag, not a template');
    assert.strictEqual(refs[0].name, 'foo', 'Reference 0 should have name foo');
    assert.strictEqual(refs[0].label, 'foo', 'Reference 0 should have label foo');

    // 2: {{sfn}}
    assert.strictEqual(refs[1].isTemplate, true, 'Reference 1 should be a template');
    assert.strictEqual(refs[1].templateName, 'sfn', 'Reference 1 template name should be sfn');
    assert.strictEqual(refs[1].label, 'Reichert & Wolfram 2010', 'Reference 1 label should synthesize authors and year');
    assert.strictEqual(refs[1].name, 'FOOTNOTEReichertWolfram2010', 'Reference 1 anchor should format FOOTNOTE token');

    // 3: <ref>Cite B</ref>
    assert.strictEqual(refs[2].isTemplate, false, 'Reference 2 should be a ref tag, not a template');
    assert.strictEqual(refs[2].name, null, 'Reference 2 should have null name for anonymous ref');

    // 4: {{r|bar}}
    assert.strictEqual(refs[3].isTemplate, true, 'Reference 3 should be a template');
    assert.strictEqual(refs[3].templateName, 'r', 'Reference 3 template name should be r');
    assert.strictEqual(refs[3].label, 'bar', 'Reference 3 label should be bar');
    assert.strictEqual(refs[3].name, 'bar', 'Reference 3 anchor name should be bar');
  });

  test('parseRefs filters out nested <ref> tags contained within {{efn}} footnote templates', () => {
    const html = 'Prose {{efn|Footnote text with &lt;ref name="inner"&gt;Source data&lt;/ref&gt; inside}} and outside &lt;ref name="outer"&gt;Outer source&lt;/ref&gt;';
    const refs = parseRefs(html);

    assert.strictEqual(refs.length, 2, 'Should only contain the outer efn and the outside ref');
    assert.strictEqual(refs[0].isTemplate, true, 'First citation should be the efn template');
    assert.strictEqual(refs[0].templateName, 'efn', 'First citation templateName should be efn');
    assert.strictEqual(refs[0].label, 'note', 'First citation label should be note');

    assert.strictEqual(refs[1].isTemplate, false, 'Second citation should be the outside ref tag');
    assert.strictEqual(refs[1].name, 'outer', 'Second citation name should be outer');
  });

  test('parseRefs ignores unwrapped template syntax crossing diffchange boundaries', () => {
    const html = '<div><del class="diffchange diffchange-inline">Zipf&#039;s law had been discovered before Zipf,{{efn|as</del> Zipf acknowledged&lt;ref name=zipf1949/&gt;{{rp|546}}<del class="diffchange diffchange-inline">}} first</del> by Estoup</div>';
    const refs = parseRefs(html);

    assert.strictEqual(refs.length, 1, 'Should only parse intact <ref name=zipf1949/>');
    assert.strictEqual(refs[0].isTemplate, false, 'Parsed citation should be a ref tag');
    assert.strictEqual(refs[0].name, 'zipf1949', 'Parsed citation should have name zipf1949');
  });

  test('parseRefs does not treat {{rp}} page suffix as an independent reference', () => {
    const html = 'Text&lt;ref name="book"&gt;Book cite&lt;/ref&gt;{{rp|123-125}} more text.';
    const refs = parseRefs(html);

    assert.strictEqual(refs.length, 1, 'Only <ref> should be parsed, not {{rp}}');
    assert.strictEqual(refs[0].name, 'book', 'Parsed citation name should be book');
  });

  test('parseRefs ignores unclosed <ref> tags and protects subsequent valid citations from being swallowed', () => {
    const textWithUnclosed = 'Intro &lt;ref&gt;This citation is unclosed and has no end tag. Sentence two &lt;ref name="valid"&gt;Valid cite&lt;/ref&gt; trailing text.';
    const refs = parseRefs(textWithUnclosed);

    assert.strictEqual(refs.length, 1, 'Only the subsequent valid reference should be extracted');
    assert.strictEqual(refs[0].name, 'valid', 'Extracted reference should be the valid citation');
    assert.strictEqual(refs[0].content, 'Valid cite', 'Content should match the valid citation');

    const pureUnclosed = 'Pure unclosed &lt;ref name="broken"&gt;no closing tag anywhere in line';
    const noRefs = parseRefs(pureUnclosed);
    assert.strictEqual(noRefs.length, 0, 'Unclosed reference without closing tag must return zero parsed refs');
  });

  test('parseRefs parses references replacing {{citation needed|...}} in Dwight D. Eisenhower diff=1380014667', () => {
    const delHtml = 'He was promoted to lieutenant general on July 7.{{<del class="diffchange diffchange-inline">citation</del> <del class="diffchange diffchange-inline">needed</del>|date=<del class="diffchange diffchange-inline">August</del> <del class="diffchange diffchange-inline">2025</del>}}';
    const addHtml = 'He was promoted to lieutenant general on July 7.<ins class="diffchange diffchange-inline">&lt;ref&gt;</ins>{{<ins class="diffchange diffchange-inline">cite book |title=Steven Zaloga Eisenhower The Background, Strategies, Tactics And |url=https://archive.org/details/steven-zaloga-eisenhower-the-background-strategies-tactics-and_202111 |via=Internet Archive}}&lt;/ref&gt;&lt;ref&gt;{{Cite book |last=Zaloga |first=Steve |title=Dwight Eisenhower: leadership, strategy, conflict |last2=Noon |first2=Steve</ins> |date=<ins class="diffchange diffchange-inline">2011</ins> <ins class="diffchange diffchange-inline">|publisher=Osprey |isbn=978-1-84908-359-1 |series=Command |location=Botley, Oxford ; Long Island City, NY|page=15</ins>}}<ins class="diffchange diffchange-inline">&lt;/ref&gt;</ins>';

    const refs = parseRefs(addHtml, delHtml);

    assert.strictEqual(refs.length, 2, 'Should extract both newly added references');
    assert.strictEqual(refs[0].isTemplate, false);
    assert.strictEqual(refs[1].isTemplate, false);
    assert.strictEqual(refs[0].content.includes('Steven Zaloga'), true, 'First citation should contain Zaloga background book');
    assert.strictEqual(refs[1].content.includes('Dwight Eisenhower: leadership, strategy, conflict'), true, 'Second citation should contain Zaloga Osprey book');
  });
});

if (require.main === module) {
  finishStandalone();
}
