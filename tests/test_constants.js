/**
 * tests/test_constants.js
 *
 * Tests for src/constants.js: Centralized regex patterns and constants integrity.
 */

const { assert, suite, test, finishStandalone } = require('./harness.js');
const { TEMPLATE_REF_REGEX } = require('../refdiff.js');

suite('src/constants.js - Patterns & Selectors', () => {
  test('TEMPLATE_REF_REGEX matches supported footnote templates and ignores non-citation templates', () => {
    const sample = 'Prose {{sfn|Reichert|Wolfram|2010|p=574}} and {{sfnp|Castritius|2005}} and {{r|Smith2020}} and {{efn|A note}} plus {{harvnb|Jones|1999}} but ignore {{cite web|url=test}} and {{lang|de|Gothisch}}.';
    const matches = sample.match(TEMPLATE_REF_REGEX) || [];
    assert.strictEqual(matches.length, 5, 'Should match exactly 5 footnote/shortened citation templates');
    assert.strictEqual(matches.some(m => m.includes('cite web')), false, 'Must not match {{cite web}}');
    assert.strictEqual(matches.some(m => m.includes('lang')), false, 'Must not match {{lang}}');
  });
});

if (require.main === module) {
  finishStandalone();
}
