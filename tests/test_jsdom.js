/**
 * tests/test_jsdom.js
 *
 * Real DOM integration tests running in jsdom against real MediaWiki diff table
 * HTML fixtures (tests/comprehensive_test.html and tests/stress_test_1379409916.html).
 * Verifies DOM mutations, in-place Memento restoration, OOUI button mounting,
 * event delegation, and high-density stress benchmarks without hand-written mock objects.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { assert, suite, test, finishStandalone } = require('./harness.js');

const compFixturePath = path.join(__dirname, 'comprehensive_test.html');
const stressFixturePath = path.join(__dirname, 'stress_test_1379409916.html');

const compHtml = fs.readFileSync(compFixturePath, 'utf8');
const stressHtml = fs.readFileSync(stressFixturePath, 'utf8');

/**
 * Runs a test callback within a fully-sandboxed JSDOM environment.
 * Restores global state completely upon completion.
 * @param {string} html HTML fixture string
 * @param {string} url Virtual URL
 * @param {Function} callback Callback receiving { dom, window, document, RefDiff, hooks }
 */
function withJsdom(html, url, callback) {
  const dom = new JSDOM(html, { url });
  const { window } = dom;
  const { document } = window;

  const hooks = {};
  const mockMw = {
    hook: (name) => {
      if (!hooks[name]) {
        hooks[name] = {
          callbacks: [],
          add: (fn) => { hooks[name].callbacks.push(fn); },
          fire: (...args) => { hooks[name].callbacks.forEach(cb => cb(...args)); }
        };
      }
      return hooks[name];
    },
    storage: {
      get: () => null,
      set: () => {}
    },
    config: {
      get: (key) => (key === 'skin' ? 'vector-2022' : null)
    }
  };
  window.mw = mockMw;

  const originals = {
    window: global.window,
    document: global.document,
    location: global.location,
    MutationObserver: global.MutationObserver,
    CSS: global.CSS,
    mw: global.mw
  };

  global.window = window;
  global.document = document;
  global.location = window.location;
  global.MutationObserver = window.MutationObserver;
  global.CSS = window.CSS || { escape: (s) => s };
  global.mw = mockMw;

  delete require.cache[require.resolve('../refdiff.js')];
  const RefDiff = require('../refdiff.js');

  try {
    return callback({ dom, window, document, RefDiff, hooks });
  } finally {
    global.window = originals.window;
    global.document = originals.document;
    global.location = originals.location;
    global.MutationObserver = originals.MutationObserver;
    global.CSS = originals.CSS;
    global.mw = originals.mw;
    delete require.cache[require.resolve('../refdiff.js')];
  }
}

suite('tests/test_jsdom.js - Real DOM Testing in JSDOM', () => {

  test('decouples real MediaWiki diff table into prose and citation rows on comprehensive_test.html', () => {
    withJsdom(compHtml, 'https://en.wikipedia.org/w/index.php?diff=1000', ({ document, RefDiff }) => {
      const table = document.querySelector('table.diff');
      assert.strictEqual(!!table, true, 'table.diff should exist in comprehensive fixture');

      RefDiff.applyDecoupling(table);

      // Verify that citation rows were inserted into DOM
      const citRows = table.querySelectorAll('.refdiff-cit-row');
      assert.strictEqual(citRows.length, 5, 'Should insert 5 citation diff rows for modified/added citations');

      for (const row of citRows) {
        assert.strictEqual(row.classList.contains('refdiff-cit-row'), true);
        assert.strictEqual(!!row.id, true, 'Citation row must have an ID');
        assert.strictEqual(row.querySelectorAll('.refdiff-ref').length >= 1, true, 'Citation row must contain prefix badge');
      }

      // Verify that mathematical badges were injected into prose lines
      const badges = table.querySelectorAll('.refdiff-ref');
      assert.strictEqual(badges.length, 18, 'Should inject 18 reference badges across all sections');

      // Check specific badge labels
      const badgeTexts = Array.from(badges).map(b => b.textContent.trim());
      assert.strictEqual(badgeTexts.includes('⟨ref1⟩'), true, 'Should include unmodified reference badge');
      assert.strictEqual(badgeTexts.includes('⟨~schmidt2020~⟩'), true, 'Should include modified citation badge');
      assert.strictEqual(badgeTexts.includes('⟨+esa2022+⟩'), true, 'Should include added citation badge');
      assert.strictEqual(badgeTexts.includes('⟨+esa-press+⟩'), true, 'Should include added citation to existing text badge');
      assert.strictEqual(badgeTexts.includes('⟨-venera1982-⟩'), true, 'Should include deleted citation badge');
    });
  });

  test('verifies diffchange highlight rules across all change cases in real DOM (pure adds, pure dels, mods)', () => {
    withJsdom(compHtml, 'https://en.wikipedia.org/w/index.php?diff=1000', ({ document, RefDiff }) => {
      const table = document.querySelector('table.diff');
      RefDiff.applyDecoupling(table);

      const citRows = Array.from(table.querySelectorAll('.refdiff-cit-row'));
      assert.strictEqual(citRows.length, 5, 'Should find 5 citation rows');

      // Partition citation rows by type:
      // Added rows have diff-side-added and diff-empty on deleted side
      const addedRows = citRows.filter(r => r.querySelector('.diff-empty.diff-side-deleted'));
      // Deleted rows have diff-side-deleted and diff-empty on added side
      const deletedRows = citRows.filter(r => r.querySelector('.diff-empty.diff-side-added'));
      // Modified rows have both deleted and added line cells
      const modRows = citRows.filter(r => r.querySelector('.refdiff-cit-deletedline') && r.querySelector('.refdiff-cit-addedline'));

      assert.strictEqual(addedRows.length, 2, 'Should have 2 added citation rows (esa2022, esa-press)');
      assert.strictEqual(deletedRows.length, 1, 'Should have 1 deleted citation row (venera1982)');
      assert.strictEqual(modRows.length, 2, 'Should have 2 modified citation rows (Harris, schmidt2020)');

      // Rule 1: Pure added citation rows must contain ZERO diffchange elements (no ins, no del)
      for (const row of addedRows) {
        assert.strictEqual(row.querySelectorAll('.diffchange').length, 0, `Added row ${row.id} must have 0 diffchange elements`);
        assert.strictEqual(row.querySelectorAll('ins, del').length, 0, `Added row ${row.id} must have 0 ins/del elements`);
      }

      // Rule 2: Pure deleted citation rows must contain ZERO diffchange elements (no ins, no del)
      for (const row of deletedRows) {
        assert.strictEqual(row.querySelectorAll('.diffchange').length, 0, `Deleted row ${row.id} must have 0 diffchange elements`);
        assert.strictEqual(row.querySelectorAll('ins, del').length, 0, `Deleted row ${row.id} must have 0 ins/del elements`);
      }

      // Rule 3: Modified citation rows MUST preserve native intra-line diff highlights on changed words
      for (const row of modRows) {
        const delLine = row.querySelector('.refdiff-cit-deletedline');
        const addLine = row.querySelector('.refdiff-cit-addedline');
        assert.strictEqual(delLine.querySelectorAll('del.diffchange').length >= 1, true, `Mod row ${row.id} deleted line must preserve del.diffchange`);
        assert.strictEqual(addLine.querySelectorAll('ins.diffchange').length >= 1, true, `Mod row ${row.id} added line must preserve ins.diffchange`);
      }
    });
  });

  test('verifies byte-for-byte in-place Memento restoration on comprehensive_test.html', () => {
    withJsdom(compHtml, 'https://en.wikipedia.org/w/index.php?diff=1000', ({ document, RefDiff }) => {
      const table = document.querySelector('table.diff');
      const originalHtml = table.innerHTML;

      RefDiff.applyDecoupling(table);
      assert.notStrictEqual(table.innerHTML, originalHtml, 'Table HTML should change after decoupling');

      RefDiff.restoreOriginal(table);
      assert.strictEqual(table.innerHTML, originalHtml, 'Table HTML must match original byte-for-byte after restore');

      const citRowsAfter = table.querySelectorAll('.refdiff-cit-row');
      assert.strictEqual(citRowsAfter.length, 0, 'All citation rows must be cleanly removed from DOM');
    });
  });

  test('executes high-density stress test on stress_test_1379409916.html (114 references) in real DOM', () => {
    withJsdom(stressHtml, 'https://en.wikipedia.org/w/index.php?diff=1379409916', ({ document, RefDiff }) => {
      const table = document.querySelector('table.diff');
      assert.strictEqual(!!table, true, 'Stress table should be present');
      const originalHtml = table.innerHTML;

      const t0 = Date.now();
      RefDiff.applyDecoupling(table);
      const elapsed = Date.now() - t0;

      // Assert DOM processing completes in reasonable budget in headless JSDOM
      assert.strictEqual(elapsed < 1000, true, `Processing took ${elapsed}ms; must complete under 1000ms`);

      const badges = table.querySelectorAll('.refdiff-ref');
      assert.strictEqual(badges.length, 114, 'Should decouple all 114 references in stress fixture');

      RefDiff.restoreOriginal(table);
      assert.strictEqual(table.innerHTML, originalHtml, 'Stress table must restore byte-for-byte');
    });
  });

  test('mounts OOUI button and controls mode switcher on comprehensive_test.html', () => {
    withJsdom(compHtml, 'https://en.wikipedia.org/w/index.php?diff=1000', ({ document, RefDiff }) => {
      RefDiff.init();

      const btn = document.getElementById('refdiff-ooui-btn');
      assert.strictEqual(!!btn, true, 'RefDiff OOUI button should be mounted');
      assert.strictEqual(btn.textContent.includes('RefDiff'), true, 'Button text should include RefDiff');

      const inlineToggle = document.getElementById('refdiff-inline-toggle');
      assert.strictEqual(!!inlineToggle, true, 'Inline toggle checkbox should be mounted');

      // Click RefDiff button to toggle mode
      const table = document.querySelector('table.diff');
      RefDiff.selectMode('refdiff', table);

      const citRows = table.querySelectorAll('.refdiff-cit-row');
      assert.strictEqual(citRows.length > 0, true, 'Table should be decoupled in refdiff mode');

      // Click Wikitext button to restore
      RefDiff.selectMode('wikitext', table);
      const citRowsWikitext = table.querySelectorAll('.refdiff-cit-row');
      assert.strictEqual(citRowsWikitext.length, 0, 'Table should restore in wikitext mode');
    });
  });

  test('locks and restores native inline diff toggle switch in real DOM', () => {
    const fixtureWithSwitch = compHtml.replace(
      '<table class="diff">',
      '<div class="mw-diffPage-inlineToggle-container"><div id="mw-diffPage-inline-toggle-switch" class="oo-ui-widget oo-ui-widget-enabled" aria-disabled="false"></div></div><table class="diff">'
    );

    withJsdom(fixtureWithSwitch, 'https://en.wikipedia.org/w/index.php?diff=1000', ({ document, RefDiff }) => {
      const nativeSwitch = document.getElementById('mw-diffPage-inline-toggle-switch');
      assert.strictEqual(!!nativeSwitch, true, 'Native inline toggle switch should exist in fixture');

      RefDiff.setInlineSwitchDisabled(true);
      assert.strictEqual(nativeSwitch.classList.contains('oo-ui-widget-disabled'), true, 'Switch should have disabled class');
      assert.strictEqual(nativeSwitch.getAttribute('aria-disabled'), 'true', 'Switch should have aria-disabled true');

      RefDiff.setInlineSwitchDisabled(false);
      assert.strictEqual(nativeSwitch.classList.contains('oo-ui-widget-disabled'), false, 'Switch should not have disabled class');
      assert.strictEqual(nativeSwitch.getAttribute('aria-disabled'), 'false', 'Switch should have aria-disabled false');
    });
  });

  test('handles fallback mode bar when OOUI button group is absent', () => {
    withJsdom('<!DOCTYPE html><html><body><table class="diff"><tr><td class="diff-deletedline"><div>Text&lt;ref&gt;Ref1&lt;/ref&gt;</div></td><td class="diff-addedline"><div>Text&lt;ref&gt;Ref2&lt;/ref&gt;</div></td></tr></table></body></html>', 'https://en.wikipedia.org/w/index.php?diff=999', ({ document, RefDiff }) => {
      RefDiff.init();

      const fallbackBar = document.getElementById('refdiff-mode-bar');
      assert.strictEqual(!!fallbackBar, true, 'Fallback mode bar should be mounted when OOUI button group is absent');

      const refdiffLink = fallbackBar.querySelector('#refdiff-btn-decoupled');
      assert.strictEqual(!!refdiffLink, true, 'Decoupled link should be present');
      assert.strictEqual(refdiffLink.textContent.includes('RefDiff'), true);

      const standardLink = fallbackBar.querySelector('#refdiff-btn-standard');
      assert.strictEqual(!!standardLink, true, 'Standard link should be present');
      assert.strictEqual(standardLink.textContent.includes('Wikidiff'), true);
    });
  });

  test('resolves live footnote anchors with findCiteNoteAnchor in real DOM', () => {
    const htmlWithRefs = `
      <!DOCTYPE html>
      <html>
      <body>
        <table class="diff"></table>
        <ol class="references">
          <li id="cite_note-esa2022-1"><span class="reference-text">ESA mission overview 2022</span></li>
          <li id="cite_note-2"><span class="reference-text"><a href="https://example.com/orbit">Orbit data</a></span></li>
        </ol>
      </body>
      </html>
    `;

    withJsdom(htmlWithRefs, 'https://en.wikipedia.org/w/index.php?diff=1000', ({ RefDiff }) => {
      const explicitAnchor = RefDiff.findCiteNoteAnchor('esa2022', 'ESA mission overview 2022');
      assert.strictEqual(explicitAnchor, 'cite_note-esa2022-1', 'Should resolve explicit named reference');

      const urlAnchor = RefDiff.findCiteNoteAnchor(null, 'https://example.com/orbit');
      assert.strictEqual(urlAnchor, 'cite_note-2', 'Should resolve anonymous URL reference');
    });
  });

  test('dispatches table click events to flash jump target in real DOM', () => {
    withJsdom(compHtml, 'https://en.wikipedia.org/w/index.php?diff=1000', ({ window, document, RefDiff }) => {
      const table = document.querySelector('table.diff');
      RefDiff.applyDecoupling(table);

      const firstBadgeLink = table.querySelector('.refdiff-ref a[href^="#refdiff-cit-"]');
      assert.strictEqual(!!firstBadgeLink, true, 'Should find citation jump link on badge');

      const targetId = firstBadgeLink.getAttribute('href').slice(1);
      const targetCitRow = document.getElementById(targetId);
      assert.strictEqual(!!targetCitRow, true, 'Target citation row should exist in DOM');

      // Dispatch click event
      let defaultPrevented = false;
      const clickEvent = new window.MouseEvent('click', { bubbles: true, cancelable: true });
      firstBadgeLink.dispatchEvent(clickEvent);
      if (clickEvent.defaultPrevented) defaultPrevented = true;

      assert.strictEqual(defaultPrevented, true, 'Click handler should prevent default on badge jump link');
      assert.strictEqual(targetCitRow.classList.contains('refdiff-cit-flash'), true, 'Target row should have flash class applied');
    });
  });

  test('supports "Inline modified refs" mode on real DOM', () => {
    withJsdom(compHtml, 'https://en.wikipedia.org/w/index.php?diff=1000', ({ document, RefDiff }) => {
      const table = document.querySelector('table.diff');

      // Apply with separateChanged: false (inline modified mode)
      RefDiff.applyDecoupling(table, { separateChanged: false });

      // Modified citation in Section 2 should have prepended inline badge without a citation diff row
      const schmidtBadge = Array.from(table.querySelectorAll('.refdiff-ref')).find(b => b.textContent.includes('schmidt2020'));
      assert.strictEqual(!!schmidtBadge, true, 'Modified citation badge should be rendered inline');

      // Modified citation row for schmidt2020 should NOT be in the table
      const schmidtRow = document.getElementById('refdiff-cit-schmidt2020-2');
      assert.strictEqual(schmidtRow, null, 'Modified citation row should not be created when separateChanged is false');

      // But purely added/deleted citation rows (like esa2022) SHOULD still be created
      const addedRow = Array.from(table.querySelectorAll('.refdiff-cit-row')).find(r => r.textContent.includes('esa2022'));
      assert.strictEqual(!!addedRow, true, 'Purely added citations should still generate separate rows');
    });
  });

  test('handles reference with embedded apostrophe in attribute and discovers underscore-normalized anchor (Bihar diff=1379207737)', () => {
    const biharHtml = `
      <div class="references">
        <ol>
          <li id="cite_note-1">Note 1</li>
          <li id="cite_note-From_teen_in_RSS_shakha_to_Speaker's_Chair:_Bihar_BJP_leader_Prem_Kumar's_long_journey-4">
            <span>Prem Kumar text</span>
          </li>
        </ol>
      </div>
      <table class="diff">
        <tbody>
          <tr>
            <td class="diff-marker" data-marker="+"></td>
            <td class="diff-addedline diff-side-added"><div>|&lt;ref name="From teen in RSS shakha to Speaker's Chair: Bihar BJP leader Prem Kumar's long journey"&gt;{{cite news |date=2 December 2025 |title=From teen in RSS shakha to Speaker's Chair: Bihar BJP leader Prem Kumar's long journey |url=https://example.com}}&lt;/ref&gt;</div></td>
          </tr>
        </tbody>
      </table>
    `;

    withJsdom(biharHtml, 'https://en.wikipedia.org/w/index.php?diff=1379207737', ({ document, RefDiff }) => {
      const table = document.querySelector('table.diff');
      const initialTableHtml = table.innerHTML;

      RefDiff.applyDecoupling(table);

      // Verify badge text is cleanly truncated for visual presentation with ellipsis
      const badge = table.querySelector('.ref-badge-add');
      assert.strictEqual(!!badge, true, 'Added reference badge should be rendered');
      assert.strictEqual(
        badge.textContent,
        '⟨+From teen in RSS shakha…+⟩',
        'Badge display text must be cleanly truncated with ellipsis'
      );

      // Verify anchor discovery points to the underscore-converted cite_note ID
      const expectedHref = "#cite_note-From_teen_in_RSS_shakha_to_Speaker's_Chair:_Bihar_BJP_leader_Prem_Kumar's_long_journey-4";
      assert.strictEqual(badge.getAttribute('href'), expectedHref, 'Badge href should discover underscore-normalized footnote anchor');

      // Verify decoupled citation row prefix badge also links to the footnote anchor
      const citRow = table.querySelector('.refdiff-cit-row');
      assert.strictEqual(!!citRow, true, 'Dedicated citation row should be inserted');
      const citBadge = citRow.querySelector('.ref-badge-add');
      assert.strictEqual(!!citBadge, true, 'Citation row prefix badge should exist');
      assert.strictEqual(citBadge.getAttribute('href'), expectedHref, 'Citation row prefix badge should link to footnote anchor');

      // Verify byte-for-byte Memento restoration
      RefDiff.restoreOriginal(table);
      assert.strictEqual(table.innerHTML, initialTableHtml, 'Table should be restored byte-for-byte');
    });
  });

  test('verifies on-wiki nowiki wrapping protects script from template expansion', () => {
    const src = fs.readFileSync(path.join(__dirname, '../refdiff.js'), 'utf8');
    assert.strictEqual(src.trimStart().startsWith('/* <nowiki> */'), true, 'refdiff.js must start with /* <nowiki> */');
    assert.strictEqual(src.trimEnd().endsWith('/* </nowiki> */'), true, 'refdiff.js must end with /* </nowiki> */');

    // Verify no unclosed inner nowiki tags
    const inner = src.slice(src.indexOf('/* <nowiki> */') + 14, src.lastIndexOf('/* </nowiki> */'));
    assert.strictEqual(/<\/?\s*nowiki\s*\/?>/i.test(inner), false, 'refdiff.js should not have internal unescaped nowiki tags');
  });
});

finishStandalone();
