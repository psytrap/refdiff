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

  test('findCiteNoteAnchor discovers explicit references with spaces and apostrophes via underscore conversion (Bihar Legislative Assembly diff=1379207737)', () => {
    const rawName = "From teen in RSS shakha to Speaker's Chair: Bihar BJP leader Prem Kumar's long journey";
    const underscoreName = rawName.replace(/ /g, '_');
    const mockId = `cite_note-${underscoreName}-4`;

    withMockEnvironment({
      document: {
        querySelector: (sel) => {
          if (sel.includes(underscoreName)) {
            return { id: mockId };
          }
          return null;
        }
      }
    }, () => {
      const anchor = findCiteNoteAnchor(rawName, '{{cite news}}');
      assert.strictEqual(anchor, mockId, 'Should match anchor converted from spaces to underscores');
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

  test('findCiteNoteAnchor discovers shortened footnotes by matching author text in .references li', () => {
    const mockLi = {
      id: 'cite_note-fallback-99',
      textContent: 'Castritius, Helmut (2005). Die Völkerwanderung.'
    };

    withMockEnvironment({
      document: {
        querySelector: () => null,
        querySelectorAll: (sel) => sel.includes('.references li') ? [mockLi] : []
      }
    }, () => {
      const anchor = findCiteNoteAnchor(null, '{{sfn|Castritius|2005}}');
      assert.strictEqual(anchor, 'cite_note-fallback-99');
    });
  });

  test('findCiteNoteAnchor discovers anonymous book/journal references by matching title and author', () => {
    const mockLi = {
      id: 'cite_note-2',
      textContent: 'Harris, A. (2018). Planetary Dynamics. Academic Press. pp. 80–88.'
    };

    withMockEnvironment({
      document: {
        querySelector: () => null,
        querySelectorAll: (sel) => sel.includes('.references li') ? [mockLi] : []
      }
    }, () => {
      const rawContent = '{{Cite book |author=Harris, A. |title=Planetary Dynamics |year=2018 |pages=80–88 |publisher=Academic Press}}';
      const anchor = findCiteNoteAnchor(null, rawContent);
      assert.strictEqual(anchor, 'cite_note-2', 'Should match note containing author and title');
    });
  });

  test('findCiteNoteAnchor discovers anonymous references by plain text content', () => {
    const mockLi = {
      id: 'cite_note-plain-7',
      textContent: 'Archives of the Royal Society, Box 44, Folder 12, Unpublished manuscript.'
    };

    withMockEnvironment({
      document: {
        querySelector: () => null,
        querySelectorAll: (sel) => sel.includes('.references li') ? [mockLi] : []
      }
    }, () => {
      const rawContent = '<ref>Archives of the Royal Society, Box 44, Folder 12, Unpublished manuscript.</ref>';
      const anchor = findCiteNoteAnchor(null, rawContent);
      assert.strictEqual(anchor, 'cite_note-plain-7', 'Should match note containing plain text');
    });
  });

  test('findCiteNoteAnchor falls back to sequential positional numbering (e.g. ref2 -> cite_note-2)', () => {
    withMockEnvironment({
      document: {
        querySelector: () => null,
        querySelectorAll: () => [],
        getElementById: (id) => id === 'cite_note-2' ? { id: 'cite_note-2' } : null
      }
    }, () => {
      const anchor = findCiteNoteAnchor(null, '', 'ref2');
      assert.strictEqual(anchor, 'cite_note-2', 'Should resolve ref2 to cite_note-2 via positional fallback');
    });
  });
});

if (require.main === module) {
  finishStandalone();
}
