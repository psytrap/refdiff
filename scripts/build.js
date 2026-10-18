/**
 * scripts/build.js
 *
 * Deterministic RefDiff Bundler:
 * Concatenates modular source files in src/ into the monolithic production distribution
 * refdiff.js, wrapping them with the userscript header, metadata block, and UMD wrapper.
 *
 * Guarantees zero build drift between modular src/ files and the deployable userscript.
 */

/* eslint-env node */
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const packageJsonPath = path.join(rootDir, 'package.json');
const refdiffPath = path.join(rootDir, 'refdiff.js');

/**
 * Canonical module ordering for the concatenated bundle.
 */
const MODULES = [
  'constants.js',
  'state.js',
  'utils.js',
  'parser.js',
  'pairing.js',
  'anchor.js',
  'renderer.js',
  'memento.js',
  'pipeline.js',
  'dom_helpers.js',
  'mode_coordinator.js',
  'init.js',
  'exports.js'
];

/**
 * Generates the userscript header block, documentation banner, and UMD wrapper opener.
 *
 * @param {string} version Semantic version from package.json
 * @returns {string} Formatted header string
 */
function getHeader(version) {
  return [
    '/* <nowiki> */',
    '// ==UserScript==',
    '// @name         RefDiff',
    '// @namespace    https://github.com/psytrap/refdiff',
    `// @version      ${version}`,
    '// @description  Zero-loss citation decoupling gadget for Wikipedia / MediaWiki Special:Diff',
    '// @author       RefDiff Contributors',
    '// @match        https://*.wikipedia.org/*diff=*',
    '// @match        https://*.wikipedia.org/*oldid=*',
    '// @match        https://*.wikipedia.org/wiki/Special:Diff/*',
    '// @match        https://*.wikimedia.org/*diff=*',
    '// @match        https://*.wiktionary.org/*diff=*',
    '// @match        https://*.wikiquote.org/*diff=*',
    '// @grant        none',
    '// @run-at       document-end',
    '// @license      MIT',
    '// ==/UserScript==',
    '',
    '/**',
    ' * RefDiff.js - The Ref-Differentiator',
    ' * ------------------------------------------------------------------------------',
    ' * A zero-loss diff-decoupling gadget for MediaWiki Special:Diff.',
    ' * Preserves 100% of Wikipedia\'s native diff table (revision headers, line numbers,',
    ' * context lines, diff hunks) while decoupling citation templates from prose lines.',
    ' *',
    ' * Repository: https://github.com/psytrap/refdiff',
    ' *',
    ' * Virtual File Hierarchy:',
    ' *  1. [src/anchor.js]           (first line: 624)  - Live DOM footnote anchor discovery and popup integration',
    ' *  2. [src/constants.js]        (first line: 53)   - Centralized regex patterns, selectors, CSS classes, hook names, inline styles',
    ' *  3. [src/dom_helpers.js]      (first line: 1146) - DOM query, categorization, and hook notification helpers',
    ' *  4. [src/exports.js]          (first line: 1804) - Public API return and UMD module exports',
    ' *  5. [src/init.js]             (first line: 1529) - Page detection, UI button wiring, and lifecycle auto-start',
    ' *  6. [src/memento.js]          (first line: 825)  - Non-destructive DOM row snapshot and restore memento',
    ' *  7. [src/mode_coordinator.js] (first line: 1193) - 3-way mode switching (visual/wikitext/refdiff) & switch locks',
    ' *  8. [src/pairing.js]          (first line: 528)  - 3-pass heuristic reference pairing engine',
    ' *  9. [src/parser.js]           (first line: 445)  - Unified reference and template parser',
    ' * 10. [src/pipeline.js]         (first line: 890)  - Core decoupling transformation and table mutator pipeline',
    ' * 11. [src/renderer.js]         (first line: 714)  - Badge generation and citation diff row construction',
    ' * 12. [src/state.js]            (first line: 313)  - State management and memento registry',
    ' * 13. [src/utils.js]            (first line: 333)  - String sanitization, entity extraction, boundary normalization',
    ' */',
    '',
    '(function (root, factory) {',
    '  if (typeof module === \'object\' && typeof module.exports === \'object\') {',
    '    module.exports = factory();',
    '  } else {',
    '    root.RefDiff = factory();',
    '  }',
    '})(typeof globalThis !== \'undefined\' ? globalThis : this, function () {',
    '  \'use strict\';'
  ].join('\n');
}

/**
 * UMD wrapper footer and on-wiki closing nowiki tag.
 */
const FOOTER = [
  '});',
  '',
  '/* </nowiki> */',
  ''
].join('\n');

/**
 * Bundles src/ modules into the production refdiff.js distribution string.
 *
 * @param {boolean|object} [options=false] If true or { write: true }, writes bundle to refdiff.js on disk.
 * @returns {string} Complete generated refdiff.js bundle content.
 */
function build(options = false) {
  const shouldWrite = options === true || (typeof options === 'object' && options !== null && options.write === true);

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`);
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const header = getHeader(pkg.version);

  const moduleSnippets = MODULES.map((file) => {
    const filePath = path.join(srcDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Module file not found: ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf8').trimEnd();
  });

  const bundle = header + '\n\n' + moduleSnippets.join('\n\n') + '\n' + FOOTER;

  if (shouldWrite) {
    fs.writeFileSync(refdiffPath, bundle, 'utf8');
    const sizeKb = Buffer.byteLength(bundle, 'utf8') / 1024;
    console.log(`[build] Successfully built refdiff.js (${sizeKb.toFixed(1)} KB) from ${MODULES.length} src modules.`);
  }

  return bundle;
}

if (require.main === module) {
  build(true);
}

module.exports = {
  build,
  MODULES,
  getHeader,
  FOOTER
};
