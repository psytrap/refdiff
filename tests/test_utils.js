/**
 * tests/test_utils.js
 *
 * Tests for src/utils.js: String sanitization, entity extraction, boundary normalization.
 */

const { assert, suite, test, finishStandalone } = require('./harness.js');
const { stripHtml, normalizeDiffTags, hasBalancedDiffTags, sanitizeAnchor, escapeRegex } = require('../refdiff.js');

suite('src/utils.js - Text Utilities & Normalization', () => {
  test('stripHtml removes all HTML tags and leaves text intact', () => {
    const html = '<span class="diffchange">modified</span> <b>bold</b> text';
    assert.strictEqual(stripHtml(html), 'modified bold text', 'HTML tags should be cleanly stripped while retaining text');
  });

  test('normalizeDiffTags repairs template delimiters split by diffchange spans', () => {
    const rawOpeningSplit = '{<del class="diffchange diffchange-inline">{sfn|Reichert|Wolfram|2010|p=574}}</del>';
    const norm1 = normalizeDiffTags(rawOpeningSplit);
    assert.strictEqual(norm1.includes('{{sfn'), true, 'Should reconstruct opening {{ template syntax');

    const rawClosingSplit = '{{sfn|Reichert|Wolfram|2010|p=574}<ins class="diffchange diffchange-inline">}</ins>';
    const norm2 = normalizeDiffTags(rawClosingSplit);
    assert.strictEqual(norm2.includes('}}'), true, 'Should reconstruct closing }} template syntax');
  });

  test('normalizeDiffTags preserves adjacent template braces without corrupting into triple braces', () => {
    const adjacent = '{{rp|546}}<del class="diffchange diffchange-inline">}}</del> <del class="diffchange diffchange-inline">first</del>';
    const normalized = normalizeDiffTags(adjacent);
    assert.strictEqual(normalized.includes('}}}'), false, 'Must not produce spurious triple braces');
    assert.strictEqual(normalized, '{{rp|546}}<del class="diffchange diffchange-inline">}} first</del>', 'Should merge adjacent del spans cleanly');
  });

  test('hasBalancedDiffTags validates balanced vs unbalanced diffchange tags', () => {
    assert.strictEqual(hasBalancedDiffTags('plain text'), true, 'Plain text has balanced tags');
    assert.strictEqual(hasBalancedDiffTags('<del class="diffchange">deleted</del>'), true, 'Closed del tag has balanced tags');
    assert.strictEqual(hasBalancedDiffTags('note <del>old</del><ins>new</ins> text'), true, 'Paired del and ins tags are balanced');
    assert.strictEqual(hasBalancedDiffTags('{{efn|as</del> text <del>}}</del>'), false, 'Orphaned </del> must be invalid');
    assert.strictEqual(hasBalancedDiffTags('text <del class="diffchange">unclosed'), false, 'Unclosed <del> must be invalid');
    assert.strictEqual(hasBalancedDiffTags('text </ins>'), false, 'Orphaned </ins> must be invalid');
  });

  test('normalizeDiffTags cleans up empty diffchange tags but preserves whitespace inside diffchange tags', () => {
    const emptySpan = 'word<del class="diffchange diffchange-inline"></del>another';
    assert.strictEqual(normalizeDiffTags(emptySpan), 'wordanother', 'Should strip empty diffchange tags');

    const spaceSpan = 'many of<ins class="diffchange diffchange-inline"> </ins> these';
    assert.strictEqual(normalizeDiffTags(spaceSpan), spaceSpan, 'Should preserve whitespace-only diffchange spans');
  });

  test('normalizeDiffTags merges adjacent diffchange spans separated only by whitespace', () => {
    const splitAddedTag = '<ins class="diffchange diffchange-inline">&lt;ref name="kami"</ins> <ins class="diffchange diffchange-inline">/&gt;</ins>';
    const normalized = normalizeDiffTags(splitAddedTag);
    assert.strictEqual(normalized, '<ins class="diffchange diffchange-inline">&lt;ref name="kami" /&gt;</ins>', 'Should reassemble adjacent split ins tags into single tag');

    const splitDelSpans = '<del class="diffchange">part1</del>   <del class="diffchange">part2</del>';
    assert.strictEqual(normalizeDiffTags(splitDelSpans), '<del class="diffchange">part1   part2</del>', 'Should merge adjacent del spans preserving whitespace');
  });

  test('sanitizeAnchor sanitizes strings into valid DOM ID tokens', () => {
    assert.strictEqual(sanitizeAnchor('AlicanteRyanair'), 'AlicanteRyanair', 'Alphanumeric anchors remain untouched');
    assert.strictEqual(sanitizeAnchor('exyu_240625'), 'exyu_240625', 'Underscore-separated alphanumeric tokens remain untouched');
    assert.strictEqual(sanitizeAnchor('ref 12! & special'), 'ref_12_special', 'Spaces and punctuation convert into valid sanitized tokens');
  });

  test('escapeRegex escapes special regex characters', () => {
    assert.strictEqual(escapeRegex('a.b*c?d+e[f]g(h)i{j}k|l\\m^n$'), 'a\\.b\\*c\\?d\\+e\\[f\\]g\\(h\\)i\\{j\\}k\\|l\\\\m\\^n\\$', 'Special regex characters should be backslash-escaped');
  });
});

if (require.main === module) {
  finishStandalone();
}
