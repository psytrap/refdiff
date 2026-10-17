/**
 * tests/test_utils.js
 *
 * Tests for src/utils.js: String sanitization, entity extraction, boundary normalization.
 */

const { assert, suite, test, finishStandalone } = require('./harness.js');
const {
  stripHtml,
  normalizeDiffTags,
  hasBalancedDiffTags,
  hasDeletedCn,
  normalizeCnDiffPair,
  sanitizeAnchor,
  escapeRegex,
  formatBadgeDisplayLabel
} = require('../refdiff.js');

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

  test('normalizeDiffTags shifts closing ref tag boundary displacement across diffchange spans (Leonardo Torres Quevedo diff=1380356173)', () => {
    const raw = '... 2020<ins class="diffchange diffchange-inline">.&lt;/ref&gt; In 1919 ... October 2008</ins>.&lt;/ref&gt;';
    const normalized = normalizeDiffTags(raw);
    assert.strictEqual(
      normalized,
      '... 2020.&lt;/ref&gt;<ins class="diffchange diffchange-inline"> In 1919 ... October 2008.&lt;/ref&gt;</ins>',
      'Should shift closing ref boundary so both the preceding and trailing citations are properly balanced'
    );
  });

  test('sanitizeAnchor sanitizes strings into valid DOM ID tokens', () => {
    assert.strictEqual(sanitizeAnchor('AlicanteRyanair'), 'AlicanteRyanair', 'Alphanumeric anchors remain untouched');
    assert.strictEqual(sanitizeAnchor('exyu_240625'), 'exyu_240625', 'Underscore-separated alphanumeric tokens remain untouched');
    assert.strictEqual(sanitizeAnchor('ref 12! & special'), 'ref_12_special', 'Spaces and punctuation convert into valid sanitized tokens');
  });

  test('escapeRegex escapes special regex characters', () => {
    assert.strictEqual(escapeRegex('a.b*c?d+e[f]g(h)i{j}k|l\\m^n$'), 'a\\.b\\*c\\?d\\+e\\[f\\]g\\(h\\)i\\{j\\}k\\|l\\\\m\\^n\\$', 'Special regex characters should be backslash-escaped');
  });

  test('formatBadgeDisplayLabel preserves concise labels and truncates long labels with ellipsis', () => {
    assert.strictEqual(formatBadgeDisplayLabel('ref1'), 'ref1');
    assert.strictEqual(formatBadgeDisplayLabel('smith2020'), 'smith2020');
    assert.strictEqual(formatBadgeDisplayLabel('1234567890123456789012345'), '1234567890123456789012345');
    assert.strictEqual(
      formatBadgeDisplayLabel("From teen in RSS shakha to Speaker's Chair: Bihar BJP leader Prem Kumar's long journey"),
      'From teen in RSS shakha…'
    );
  });

  test('hasDeletedCn detects deleted citation needed and cn variations while ignoring unrelated templates', () => {
    assert.strictEqual(
      hasDeletedCn('He was promoted.{{<del class="diffchange diffchange-inline">citation</del> <del class="diffchange diffchange-inline">needed</del>|date=<del class="diffchange diffchange-inline">August</del> <del class="diffchange diffchange-inline">2025</del>}}'),
      true,
      'Should detect parameterized {{citation needed|...}} with internal del tags'
    );
    assert.strictEqual(
      hasDeletedCn('Sentence.<del class="diffchange diffchange-inline">{{citation needed}}</del>'),
      true,
      'Should detect fully wrapped {{citation needed}}'
    );
    assert.strictEqual(
      hasDeletedCn('Claim.{{<del class="diffchange diffchange-inline">cn</del>}}'),
      true,
      'Should detect bare {{cn}}'
    );
    assert.strictEqual(
      hasDeletedCn('Claim.{{<del class="diffchange diffchange-inline">cn</del>|date=<del class="diffchange diffchange-inline">May 2024</del>}}'),
      true,
      'Should detect parameterized {{cn|date=...}}'
    );
    assert.strictEqual(
      hasDeletedCn('Claim.{{<del class="diffchange diffchange-inline">Citation needed</del>|reason=<del class="diffchange diffchange-inline">unclear</del>}}'),
      true,
      'Should detect {{Citation needed|reason=...}}'
    );
    // Negative tests
    assert.strictEqual(
      hasDeletedCn('Claim.{{citation needed|date=August 2025}}'),
      false,
      'Should return false when template is unchanged (no del tags)'
    );
    assert.strictEqual(
      hasDeletedCn('Claim.{{<del class="diffchange diffchange-inline">clarification needed</del>}}'),
      false,
      'Should return false for unrelated maintenance template'
    );
    assert.strictEqual(
      hasDeletedCn('Claim.{{<del class="diffchange diffchange-inline">who</del>}}'),
      false,
      'Should return false for {{who}} template'
    );
    assert.strictEqual(
      hasDeletedCn('Normal text with no templates.'),
      false,
      'Should return false for plain text'
    );
  });

  test('normalizeCnDiffPair aligns split diffchange boundaries for Dwight D. Eisenhower diff=1380014667', () => {
    const deletedHtml = 'At the end of May 1942... He was promoted to lieutenant general on July 7.{{<del class="diffchange diffchange-inline">citation</del> <del class="diffchange diffchange-inline">needed</del>|date=<del class="diffchange diffchange-inline">August</del> <del class="diffchange diffchange-inline">2025</del>}}';
    const addedHtml = 'At the end of May 1942... He was promoted to lieutenant general on July 7.<ins class="diffchange diffchange-inline">&lt;ref&gt;</ins>{{<ins class="diffchange diffchange-inline">cite book |title=Steven Zaloga Eisenhower The Background, Strategies, Tactics And |url=https://archive.org/details/steven-zaloga-eisenhower-the-background-strategies-tactics-and_202111 |via=Internet Archive}}&lt;/ref&gt;&lt;ref&gt;{{Cite book |last=Zaloga |first=Steve |title=Dwight Eisenhower: leadership, strategy, conflict |last2=Noon |first2=Steve</ins> |date=<ins class="diffchange diffchange-inline">2011</ins> <ins class="diffchange diffchange-inline">|publisher=Osprey |isbn=978-1-84908-359-1 |series=Command |location=Botley, Oxford ; Long Island City, NY|page=15</ins>}}<ins class="diffchange diffchange-inline">&lt;/ref&gt;</ins>';

    const aligned = normalizeCnDiffPair(deletedHtml, addedHtml);

    assert.strictEqual(
      aligned.delHtml,
      'At the end of May 1942... He was promoted to lieutenant general on July 7.<del class="diffchange diffchange-inline">{{citation needed|date=August 2025}}</del>',
      'Should unify deleted template into a single cohesive <del> span'
    );
    assert.strictEqual(
      aligned.addHtml.includes('<ins class="diffchange diffchange-inline">&lt;ref&gt;{{cite book'),
      true,
      'Should unify opening <ref> and cite template into cohesive <ins> span'
    );
    assert.strictEqual(
      aligned.addHtml.includes('NY|page=15}}&lt;/ref&gt;</ins>'),
      true,
      'Should close final </ref> cleanly inside <ins> span'
    );
    assert.strictEqual(
      aligned.addHtml.includes('&lt;ref&gt;</ins>'),
      false,
      'Should have zero isolated opening <ref> tags'
    );
  });

  test('normalizeCnDiffPair aligns bare {{cn}} replaced by single reference', () => {
    const delHtml = 'Claim.{{<del class="diffchange diffchange-inline">cn</del>}}';
    const addHtml = 'Claim.<ins class="diffchange diffchange-inline">&lt;ref&gt;</ins>{{<ins class="diffchange diffchange-inline">cite web |title=Source</ins>}}<ins class="diffchange diffchange-inline">&lt;/ref&gt;</ins>';

    const aligned = normalizeCnDiffPair(delHtml, addHtml);
    assert.strictEqual(aligned.delHtml, 'Claim.<del class="diffchange diffchange-inline">{{cn}}</del>');
    assert.strictEqual(aligned.addHtml, 'Claim.<ins class="diffchange diffchange-inline">&lt;ref&gt;{{cite web |title=Source}}&lt;/ref&gt;</ins>');
  });

  test('normalizeCnDiffPair leaves non-cn diffs completely untouched', () => {
    const delHtml = 'Plain deleted text.';
    const addHtml = 'Plain added text.<ins class="diffchange diffchange-inline">&lt;ref&gt;new ref&lt;/ref&gt;</ins>';
    const aligned = normalizeCnDiffPair(delHtml, addHtml);
    assert.strictEqual(aligned.delHtml, delHtml);
    assert.strictEqual(aligned.addHtml, addHtml);
  });
});

if (require.main === module) {
  finishStandalone();
}
