/**
 * tests/test_deployment.js
 *
 * Automated Deployment & Release Quality Gate Check:
 *  - On-wiki packaging and syntax safety (nowiki wrapping, BOM, subst, signatures)
 *  - Security & clean code invariants (no console.log, no debug flags, strict mode)
 *  - Version synchronization across package.json, refdiff.js, and refdiff.wiki
 *  - Distribution budget & file size guards
 *  - Public API contract and global namespace hygiene
 *  - On-wiki template syntax integrity (userbox.wiki, userbox_enwiki.wiki)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert, suite, test, finishStandalone } = require('./harness.js');

const rootDir = path.join(__dirname, '..');
const refdiffPath = path.join(rootDir, 'refdiff.js');
const packageJsonPath = path.join(rootDir, 'package.json');
const refdiffWikiPath = path.join(rootDir, 'refdiff.wiki');
const userboxWikiPath = path.join(rootDir, 'userbox.wiki');
const userboxEnwikiPath = path.join(rootDir, 'userbox_enwiki.wiki');

suite('Deployment & Release Pre-Flight Checks', () => {
  const refdiffSrc = fs.readFileSync(refdiffPath, 'utf8');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  test('validates packaging: nowiki encapsulation and zero BOM', () => {
    // 1. Byte Order Mark (BOM) check
    assert.strictEqual(refdiffSrc.charCodeAt(0) === 0xFEFF, false, 'refdiff.js must not contain UTF-8 Byte Order Mark (BOM)');

    // 2. <nowiki> wrapper for MediaWiki JS subpages
    assert.strictEqual(refdiffSrc.trimStart().startsWith('/* <nowiki> */'), true, 'refdiff.js must begin with /* <nowiki> */');
    assert.strictEqual(refdiffSrc.trimEnd().endsWith('/* </nowiki> */'), true, 'refdiff.js must terminate with /* </nowiki> */');

    // 3. No internal unescaped nowiki tags that would prematurely terminate the block
    const innerContent = refdiffSrc.slice(
      refdiffSrc.indexOf('/* <nowiki> */') + '/* <nowiki> */'.length,
      refdiffSrc.lastIndexOf('/* </nowiki> */')
    );
    assert.strictEqual(/<\/?\s*nowiki\s*\/?>/i.test(innerContent), false, 'refdiff.js must not contain unescaped internal nowiki tags');
  });

  test('validates on-wiki syntax safety: zero signatures, subst, or unescaped script tags', () => {
    // MediaWiki signature expansion (~~~, ~~~~, ~~~~~)
    assert.strictEqual(/~{3,5}/.test(refdiffSrc), false, 'refdiff.js must not contain 3-5 consecutive tildes (~), which MediaWiki expands into signatures');

    // MediaWiki template substitution tags
    assert.strictEqual(/\{\{\s*(?:safe)?subst:/i.test(refdiffSrc), false, 'refdiff.js must not contain {{subst: or {{safesubst: calls');

    // Premature inline script tag termination
    assert.strictEqual(/<\/script\s*>/i.test(refdiffSrc), false, 'refdiff.js must not contain raw </script> closing tags');
  });

  test('validates production code hygiene: zero console.log and no active debug flags', () => {
    // No console.log left in production code (console.warn/error allowed for genuine errors)
    const consoleLogMatches = refdiffSrc.match(/(?:window\.)?console\.log\s*\(/g);
    assert.strictEqual(consoleLogMatches, null, 'refdiff.js must contain zero console.log statements');

    // No debug flag forced to true (unlike Ultraviolet window.rw_debug = true)
    assert.strictEqual(/(?:window\.)?rw_debug\s*=\s*true/.test(refdiffSrc), false, 'refdiff.js must not activate Ultraviolet rw_debug');
    assert.strictEqual(/debug\s*:\s*true\b/.test(refdiffSrc), false, 'refdiff.js must not declare active debug flags in config');
  });

  test('validates JavaScript syntax and strict mode compliance', () => {
    // Valid strict mode declaration
    assert.strictEqual(refdiffSrc.includes("'use strict';"), true, "refdiff.js must declare 'use strict';");

    // Syntax validation via Node vm.Script
    let syntaxError = null;
    try {
      new vm.Script(refdiffSrc, { filename: 'refdiff.js' });
    } catch (e) {
      syntaxError = e;
    }
    assert.strictEqual(syntaxError, null, `refdiff.js must parse with zero JavaScript syntax errors: ${syntaxError ? syntaxError.message : ''}`);
  });

  test('validates version synchronization across repository files', () => {
    const pkgVersion = pkg.version;
    assert.ok(pkgVersion, 'package.json must declare a version');

    // UserScript header @version
    const headerMatch = refdiffSrc.match(/\/\/\s*@version\s+([0-9]+\.[0-9]+\.[0-9]+)/);
    assert.ok(headerMatch, 'refdiff.js UserScript header must specify @version');
    assert.strictEqual(headerMatch[1], pkgVersion, 'UserScript @version must match package.json');

    // refdiff.wiki infobox version
    if (fs.existsSync(refdiffWikiPath)) {
      const wikiContent = fs.readFileSync(refdiffWikiPath, 'utf8');
      const wikiVersionMatch = wikiContent.match(/\|\s*version\s*=\s*([0-9]+\.[0-9]+\.[0-9]+)/);
      assert.ok(wikiVersionMatch, 'refdiff.wiki must declare | version in infobox');
      assert.strictEqual(wikiVersionMatch[1], pkgVersion, 'refdiff.wiki version must match package.json');
    }
  });

  test('validates distribution budget and bundle size constraints', () => {
    const stats = fs.statSync(refdiffPath);
    const sizeKb = stats.size / 1024;

    // Sanity check: Size must remain under 120 KB unminified to prevent bloated distribution
    assert.strictEqual(sizeKb < 120, true, `refdiff.js size (${sizeKb.toFixed(1)} KB) must be within the 120 KB unminified budget`);
    assert.strictEqual(sizeKb > 10, true, 'refdiff.js must be greater than 10 KB to ensure it is not an empty stub');
  });

  test('validates public API exports and absence of global scope pollution', () => {
    const RefDiff = require('../refdiff.js');

    // Required public exports
    const requiredFunctions = [
      'applyDecoupling',
      'restoreOriginal',
      'parseRefs',
      'init',
      'selectMode',
      'isDiffPage',
      'el',
      'createProseBadgeElement',
      'normalizeDiffTags',
      'hasBalancedDiffTags',
      'stripHtml',
      'sanitizeAnchor',
      'escapeRegex',
      'pairReferences',
      'findCiteNoteAnchor'
    ];

    for (const fn of requiredFunctions) {
      assert.strictEqual(typeof RefDiff[fn], 'function', `RefDiff.${fn} must be exported as a function`);
    }

    // Verify global namespace hygiene: no random leak onto global object
    const forbiddenGlobals = ['a', 'b', 'temp', 'cits', 'raw', 'pairs', 'badge', 'row'];
    for (const varName of forbiddenGlobals) {
      assert.strictEqual(global[varName], undefined, `Global scope must not be polluted with leaked variable: ${varName}`);
    }
  });

  test('validates on-wiki userbox template syntax integrity', () => {
    const filesToTest = [
      { name: 'userbox.wiki', path: userboxWikiPath },
      { name: 'userbox_enwiki.wiki', path: userboxEnwikiPath }
    ];

    for (const file of filesToTest) {
      assert.strictEqual(fs.existsSync(file.path), true, `${file.name} must exist on disk`);
      const content = fs.readFileSync(file.path, 'utf8');

      // Check balanced <includeonly> tags
      const incOpen = (content.match(/<includeonly>/gi) || []).length;
      const incClose = (content.match(/<\/includeonly>/gi) || []).length;
      assert.strictEqual(incOpen, incClose, `${file.name} must have balanced <includeonly> tags`);

      // Check balanced <noinclude> tags
      const noIncOpen = (content.match(/<noinclude>/gi) || []).length;
      const noIncClose = (content.match(/<\/noinclude>/gi) || []).length;
      assert.strictEqual(noIncOpen, noIncClose, `${file.name} must have balanced <noinclude> tags`);

      // Verify presence of {{Userbox
      assert.strictEqual(content.includes('{{Userbox'), true, `${file.name} must invoke {{Userbox`);
    }
  });
});

if (require.main === module) {
  finishStandalone();
}
