/**
 * tests/test_utils.js
 *
 * Tests for src/utils.js: String sanitization, entity extraction, boundary normalization.
 */

const { assert, suite, test, finishStandalone } = require('./harness.js');
const { stripHtml, normalizeDiffTags, sanitizeAnchor, escapeRegex } = require('../refdiff.js');

suite('src/utils.js - Text Utilities & Normalization', () => {
  test('stripHtml removes all HTML tags and leaves text intact', () => {
    const html = '<span class="diffchange">modified</span> <b>bold</b> text';
    assert.strictEqual(stripHtml(html), 'modified bold text');
  });

  test('normalizeDiffTags repairs template delimiters split by diffchange spans', () => {
    const rawOpeningSplit = '{<del class="diffchange diffchange-inline">{sfn|Reichert|Wolfram|2010|p=574}}</del>';
    const norm1 = normalizeDiffTags(rawOpeningSplit);
    assert.strictEqual(norm1.includes('{{sfn'), true, 'Should reconstruct opening {{ template syntax');

    const rawClosingSplit = '{{sfn|Reichert|Wolfram|2010|p=574}<ins class="diffchange diffchange-inline">}</ins>';
    const norm2 = normalizeDiffTags(rawClosingSplit);
    assert.strictEqual(norm2.includes('}}'), true, 'Should reconstruct closing }} template syntax');
  });

  test('normalizeDiffTags cleans up empty diffchange tags but preserves whitespace inside diffchange tags', () => {
    const emptySpan = 'word<del class="diffchange diffchange-inline"></del>another';
    assert.strictEqual(normalizeDiffTags(emptySpan), 'wordanother', 'Should strip empty diffchange tags');

    const spaceSpan = 'many of<ins class="diffchange diffchange-inline"> </ins> these';
    assert.strictEqual(normalizeDiffTags(spaceSpan), spaceSpan, 'Should preserve whitespace-only diffchange spans');
  });

  test('sanitizeAnchor sanitizes strings into valid DOM ID tokens', () => {
    assert.strictEqual(sanitizeAnchor('AlicanteRyanair'), 'AlicanteRyanair');
    assert.strictEqual(sanitizeAnchor('exyu_240625'), 'exyu_240625');
    assert.strictEqual(sanitizeAnchor('ref 12! & special'), 'ref_12_special');
  });

  test('escapeRegex escapes special regex characters', () => {
    assert.strictEqual(escapeRegex('a.b*c?d+e[f]g(h)i{j}k|l\\m^n$'), 'a\\.b\\*c\\?d\\+e\\[f\\]g\\(h\\)i\\{j\\}k\\|l\\\\m\\^n\\$');
  });
});

if (require.main === module) {
  finishStandalone();
}
