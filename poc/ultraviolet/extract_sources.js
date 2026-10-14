#!/usr/bin/env node
/**
 * Restores Ultraviolet's original TypeScript sources from the webpack source
 * map shipped next to the minified build (Ultraviolet publishes no `_dev.js`),
 * then verifies them against the git checkout of the deployed commit.
 *
 * Finding: the published map's `sourcesContent` is partly mis-associated with
 * `sources` (file A's path carries file B's code), so the map alone is NOT a
 * trustworthy readable copy. Use `deployed/` (git worktree) instead.
 *
 * Usage: node extract_sources.js [mapFile] [outDir] [verifyDir]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const mapFile = process.argv[2] || path.join(__dirname, 'dist', 'ultraviolet.js.map');
const outDir = path.resolve(process.argv[3] || path.join(__dirname, 'sourcemap-src'));
const verifyDir = path.resolve(process.argv[4] || path.join(__dirname, 'deployed'));

const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
const extracted = [];

map.sources.forEach((src, i) => {
  const content = map.sourcesContent && map.sourcesContent[i];
  // Only first-party TypeScript is of interest; skip webpack runtime, CSS loader stubs, node_modules.
  if (content == null || /node_modules|webpack\/(runtime|bootstrap)/.test(src) || /\?/.test(src)) return;
  const rel = src.replace(/^webpack:\/\/[^/]*\//, '').replace(/^\.\//, '');
  const target = path.join(outDir, rel);
  if (!target.startsWith(outDir + path.sep)) return; // path traversal guard
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  extracted.push(rel);
});
console.log(`map sources: ${map.sources.length}, first-party files written: ${extracted.length} -> ${outDir}`);

if (!fs.existsSync(verifyDir)) {
  console.log(`(no ${verifyDir}; run ./fetch.sh to enable verification)`);
  process.exit(0);
}

const md5 = (buf) => crypto.createHash('md5').update(buf).digest('hex');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const repoByHash = new Map(
  walk(path.join(verifyDir, 'src')).map((f) => [md5(fs.readFileSync(f)), path.relative(verifyDir, f)])
);

const stats = { identical: 0, misassociated: 0, drifted: 0, missingInRepo: 0 };
const examples = [];
for (const rel of extracted.filter((r) => /\.tsx?$/.test(r))) {
  const repoFile = path.join(verifyDir, rel);
  const mine = fs.readFileSync(path.join(outDir, rel));
  if (!fs.existsSync(repoFile)) { stats.missingInRepo++; continue; }
  if (mine.equals(fs.readFileSync(repoFile))) { stats.identical++; continue; }
  const owner = repoByHash.get(md5(mine));
  if (owner) {
    stats.misassociated++;
    if (examples.length < 5) examples.push(`${rel}  actually contains  ${owner}`);
  } else {
    stats.drifted++;
  }
}
console.log('verification vs deployed commit:', stats);
examples.forEach((e) => console.log('  e.g. ' + e));
