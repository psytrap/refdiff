/**
 * tests/test_init.js
 *
 * Tests for src/init.js: Page detection and MediaWiki diff view discovery.
 */

const { assert, suite, test, withMockEnvironment, finishStandalone } = require('./harness.js');
const { isDiffPage } = require('../refdiff.js');

suite('src/init.js - Page Detection', () => {
  test('isDiffPage accurately identifies MediaWiki diff views across multiple signals', () => {
    // 1. Non-browser environment
    withMockEnvironment({ window: undefined, document: undefined, location: undefined }, () => {
      assert.strictEqual(isDiffPage(), false);
    });

    // 2. Query param diff=
    withMockEnvironment({
      window: { mw: null },
      location: { search: '?title=Test&diff=123', pathname: '/w/index.php' },
      document: { querySelector: () => null, getElementById: () => null }
    }, () => {
      assert.strictEqual(isDiffPage(), true);
    });

    // 3. Special:Diff pathname
    withMockEnvironment({
      window: { mw: null },
      location: { search: '', pathname: '/wiki/Special:Diff/12345' },
      document: { querySelector: () => null, getElementById: () => null }
    }, () => {
      assert.strictEqual(isDiffPage(), true);
    });

    // 4. MediaWiki config wgDiffNewId
    withMockEnvironment({
      window: { mw: { config: { get: (k) => k === 'wgDiffNewId' ? 123 : null } } },
      location: { search: '', pathname: '/wiki/Test' },
      document: { querySelector: () => null, getElementById: () => null }
    }, () => {
      assert.strictEqual(isDiffPage(), true);
    });

    // 5. Native diff table in DOM
    withMockEnvironment({
      window: { mw: null },
      location: { search: '', pathname: '/wiki/Test' },
      document: { querySelector: (sel) => sel === 'table.diff' ? {} : null, getElementById: () => null }
    }, () => {
      assert.strictEqual(isDiffPage(), true);
    });

    // 6. #wikiDiff element in DOM
    withMockEnvironment({
      window: { mw: null },
      location: { search: '', pathname: '/wiki/Test' },
      document: { querySelector: () => null, getElementById: (id) => id === 'wikiDiff' ? {} : null }
    }, () => {
      assert.strictEqual(isDiffPage(), true);
    });

    // 7. Non-diff page returns false
    withMockEnvironment({
      window: { mw: null },
      location: { search: '', pathname: '/wiki/Test' },
      document: { querySelector: () => null, getElementById: () => null }
    }, () => {
      assert.strictEqual(isDiffPage(), false);
    });
  });
});

if (require.main === module) {
  finishStandalone();
}
