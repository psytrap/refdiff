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
 *  - Automated rollback & incident recovery (byte-for-byte Memento restoration, zero residual nodes, fail-open safety)
 *  - Deployment consistency across all release artifacts, destinations, and loader URLs
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

  test('validates automated rollback and incident recovery: restoreOriginal guarantees byte-for-byte DOM restoration and fail-open safety', () => {
    const { JSDOM } = require('jsdom');
    const RefDiff = require('../refdiff.js');

    // 1. Create a realistic MediaWiki diff table
    const sampleTableHtml = [
      '<table class="diff">',
      '  <tbody>',
      '    <tr class="diff-title"><td class="diff-otitle">Old</td><td class="diff-ntitle">New</td></tr>',
      '    <tr>',
      '      <td class="diff-marker" data-marker="-">−</td>',
      '      <td class="diff-deletedline"><div>Text before &lt;ref name="cite1"&gt;Old citation &lt;del class="diffchange diffchange-inline"&gt;1&lt;/del&gt;&lt;/ref&gt; text after.</div></td>',
      '      <td class="diff-marker" data-marker="+">+</td>',
      '      <td class="diff-addedline"><div>Text before &lt;ref name="cite1"&gt;Old citation &lt;ins class="diffchange diffchange-inline"&gt;2&lt;/ins&gt;&lt;/ref&gt; text after.</div></td>',
      '    </tr>',
      '  </tbody>',
      '</table>'
    ].join('\n');

    const dom = new JSDOM(`<!DOCTYPE html><html><body>${sampleTableHtml}</body></html>`);
    const origWindow = global.window;
    const origDoc = global.document;
    global.window = dom.window;
    global.document = dom.window.document;

    try {
      const table = dom.window.document.querySelector('table.diff');
      const originalHtml = table.innerHTML;

      // Apply decoupling
      RefDiff.applyDecoupling(table);
      assert.notStrictEqual(table.innerHTML, originalHtml, 'Table must be mutated after decoupling');
      const injectedRows = table.querySelectorAll('.refdiff-cit-row');
      assert.ok(injectedRows.length > 0, 'Decoupling must inject citation rows');

      // Execute automated rollback via restoreOriginal
      RefDiff.restoreOriginal(table);

      // Verify 100% byte-for-byte DOM recovery
      assert.strictEqual(table.innerHTML, originalHtml, 'Rollback must restore original diff table byte-for-byte');

      // Verify zero residual nodes
      const remainingCitRows = table.querySelectorAll('.refdiff-cit-row');
      assert.strictEqual(remainingCitRows.length, 0, 'Rollback must leave zero orphaned .refdiff-cit-row nodes in DOM');

      // Verify fail-open safety on null/invalid inputs
      let errorThrown = false;
      try {
        RefDiff.applyDecoupling(null);
        RefDiff.restoreOriginal(null);
        RefDiff.applyDecoupling({});
        RefDiff.restoreOriginal({});
      } catch (e) {
        errorThrown = true;
      }
      assert.strictEqual(errorThrown, false, 'applyDecoupling and restoreOriginal must fail-open safely on invalid inputs');
    } finally {
      global.window = origWindow;
      global.document = origDoc;
    }
  });

  test('validates deployment consistency: all artifacts, destinations, and loader URLs are synchronized', () => {
    const deploymentPlanPath = path.join(rootDir, 'DEPLOYMENT_PLAN.md');
    const postMdPath = path.join(rootDir, 'proposal', 'POST.md');

    // 1. All deployment artifacts mapped in DEPLOYMENT_PLAN.md must exist on disk and be non-empty
    const requiredArtifacts = [
      { path: refdiffPath, name: 'refdiff.js' },
      { path: refdiffWikiPath, name: 'refdiff.wiki' },
      { path: userboxEnwikiPath, name: 'userbox_enwiki.wiki' },
      { path: deploymentPlanPath, name: 'DEPLOYMENT_PLAN.md' },
      { path: postMdPath, name: 'proposal/POST.md' }
    ];

    for (const art of requiredArtifacts) {
      assert.strictEqual(fs.existsSync(art.path), true, `${art.name} must exist on disk`);
      const stat = fs.statSync(art.path);
      assert.ok(stat.size > 0, `${art.name} must not be empty`);
    }

    const deployPlanContent = fs.readFileSync(deploymentPlanPath, 'utf8');
    const wikiContent = fs.readFileSync(refdiffWikiPath, 'utf8');
    const userboxContent = fs.readFileSync(userboxEnwikiPath, 'utf8');

    // 2. Version consistency and unversioned filename policy (no versions in filenames)
    const planVersionMatch = deployPlanContent.match(/\*\*Version:\*\*\s*([0-9]+\.[0-9]+\.[0-9]+)/);
    assert.ok(planVersionMatch, 'DEPLOYMENT_PLAN.md must declare Version');
    assert.strictEqual(planVersionMatch[1], pkg.version, 'DEPLOYMENT_PLAN.md version must match package.json');

    assert.strictEqual(/refdiff-v[0-9]/.test(deployPlanContent), false, 'DEPLOYMENT_PLAN.md must not contain versioned filenames (policy: no versions in filenames)');
    assert.strictEqual(deployPlanContent.includes('en:User:Powercycler/refdiff-canary.js'), true, 'DEPLOYMENT_PLAN.md must declare unversioned canary script target en:User:Powercycler/refdiff-canary.js');

    // 3. Canonical lead script destination consistency
    const canonicalScriptTarget = 'en:User:Powercycler/refdiff.js';
    assert.strictEqual(deployPlanContent.includes(canonicalScriptTarget), true, `DEPLOYMENT_PLAN.md must list canonical script target ${canonicalScriptTarget}`);
    assert.strictEqual(wikiContent.includes('en.wikipedia.org/w/index.php?title=User:Powercycler/refdiff.js'), true, 'refdiff.wiki Option 1 must load from canonical script target on en.wikipedia.org');
    assert.strictEqual(deployPlanContent.includes('title=User:Powercycler/refdiff.js&action=raw&ctype=text/javascript'), true, 'DEPLOYMENT_PLAN.md dummy loader must point to canonical en.WP script');

    // 4. Documentation destination consistency
    const canonicalDocTarget = 'en:User:Powercycler/RefDiff';
    assert.strictEqual(deployPlanContent.includes(canonicalDocTarget), true, `DEPLOYMENT_PLAN.md must list canonical doc target ${canonicalDocTarget}`);
    assert.strictEqual(userboxContent.includes('User:Powercycler/RefDiff'), true, 'userbox_enwiki.wiki must link to canonical doc target');

    // 5. Userbox template destination consistency
    assert.strictEqual(deployPlanContent.includes('en:Template:User RefDiff'), true, 'DEPLOYMENT_PLAN.md must list en:Template:User RefDiff');
    assert.strictEqual(userboxContent.includes('Template:User RefDiff'), true, 'userbox_enwiki.wiki doc must reference Template:User RefDiff');
    assert.strictEqual(userboxContent.includes('{{User RefDiff}}'), true, 'userbox_enwiki.wiki doc must reference {{User RefDiff}}');

    // 6. Outreach discussion destination consistency
    const canonicalTalkTarget = 'en:User talk:Powercycler/RefDiff';
    assert.strictEqual(deployPlanContent.includes(canonicalTalkTarget), true, `DEPLOYMENT_PLAN.md must list ${canonicalTalkTarget}`);
  });
});

if (require.main === module) {
  finishStandalone();
}
