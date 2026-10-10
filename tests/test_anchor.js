/**
 * tests/test_anchor.js
 *
 * Tests for src/anchor.js: Live DOM footnote anchor discovery and Popups tooltip integration.
 */

const { assert, suite, test, withMockEnvironment, finishStandalone } = require('./harness.js');
const { findCiteNoteAnchor } = require('../refdiff.js');

suite('src/anchor.js - Footnote Anchor Discovery', () => {
  test('findCiteNoteAnchor returns null when document is undefined or absent', () => {
    const anchor = findCiteNoteAnchor('test', '{{cite web|url=https://example.com}}');
    assert.strictEqual(anchor, null, 'Should return null safely in non-browser Node environment');
  });

  test('findCiteNoteAnchor discovers explicit named references in mock DOM', () => {
    const mockElements = {
      '[id^="cite_note-AlicanteRyanair-"], [id="cite_note-AlicanteRyanair"]': { id: 'cite_note-AlicanteRyanair-57' }
    };

    withMockEnvironment({
      document: { querySelector: (sel) => mockElements[sel] || null }
    }, () => {
      const anchor = findCiteNoteAnchor('AlicanteRyanair', '{{cite news}}');
      assert.strictEqual(anchor, 'cite_note-AlicanteRyanair-57');
    });
  });

  test('findCiteNoteAnchor discovers anonymous references by matching URL in mock DOM', () => {
    const targetUrl = 'https://www.croatianaviation.com/post/eurowings-test';

    withMockEnvironment({
      document: {
        querySelector: (sel) => {
          if (sel.includes(targetUrl)) {
            return {
              closest: (parentSel) => {
                if (parentSel.includes('cite_note-')) return { id: 'cite_note-59' };
                return null;
              }
            };
          }
          return null;
        }
      }
    }, () => {
      const rawContent = `{{cite web |url=${targetUrl} |title=Test}}`;
      const anchor = findCiteNoteAnchor(null, rawContent);
      assert.strictEqual(anchor, 'cite_note-59');
    });
  });

  test('findCiteNoteAnchor discovers cite_note-FOOTNOTE anchors for shortened footnotes in DOM', () => {
    const mockElement = { id: 'cite_note-FOOTNOTEReichertWolfram2010574-1' };

    withMockEnvironment({
      document: {
        querySelector: (selector) => selector.includes('FOOTNOTEReichertWolfram2010') ? mockElement : null
      }
    }, () => {
      const anchor = findCiteNoteAnchor('FOOTNOTEReichertWolfram2010', '{{sfn|Reichert|Wolfram|2010|p=574}}');
      assert.strictEqual(anchor, 'cite_note-FOOTNOTEReichertWolfram2010574-1', 'Should locate FOOTNOTE anchor');
    });
  });
});

if (require.main === module) {
  finishStandalone();
}
