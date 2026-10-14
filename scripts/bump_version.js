/**
 * scripts/bump_version.js
 *
 * Automated Version Bump & Manifest Synchronizer:
 * Bumps the project version across:
 *  1. package.json
 *  2. package-lock.json
 *  3. refdiff.js (@version in UserScript header)
 *  4. refdiff.wiki (| version = X.Y.Z and | status = Stable (vX.Y.Z))
 *  5. ROLLOUT_PLAN.md (> **Version:** X.Y.Z)
 *  6. AUDIT_STRATEGY.md (> **Version:** X.Y.Z)
 *
 * Usage:
 *   node scripts/bump_version.js patch
 *   node scripts/bump_version.js minor
 *   node scripts/bump_version.js major
 *   node scripts/bump_version.js 1.4.1
 */

/* eslint-env node */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.join(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const pkgLockPath = path.join(rootDir, 'package-lock.json');
const refdiffJsPath = path.join(rootDir, 'refdiff.js');
const refdiffWikiPath = path.join(rootDir, 'refdiff.wiki');
const rolloutPlanPath = path.join(rootDir, 'ROLLOUT_PLAN.md');
const auditStrategyPath = path.join(rootDir, 'AUDIT_STRATEGY.md');

function computeNextVersion(currentVersion, bumpType) {
  const parts = currentVersion.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid current version in package.json: ${currentVersion}`);
  }
  let [major, minor, patch] = parts;
  if (bumpType === 'patch') {
    patch += 1;
  } else if (bumpType === 'minor') {
    minor += 1;
    patch = 0;
  } else if (bumpType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(bumpType)) {
    return bumpType;
  } else {
    throw new Error(`Invalid bump type or semver: '${bumpType}'. Expected 'patch', 'minor', 'major', or 'X.Y.Z'.`);
  }
  return `${major}.${minor}.${patch}`;
}

function bumpVersion(bumpType, dryRun = false) {
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`package.json not found at ${pkgPath}`);
  }

  const pkgRaw = fs.readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(pkgRaw);
  const currentVersion = pkg.version;
  const nextVersion = computeNextVersion(currentVersion, bumpType);

  console.log('='.repeat(72));
  console.log(` RefDiff Version Bump: v${currentVersion} -> v${nextVersion}${dryRun ? ' (DRY RUN)' : ''}`);
  console.log('='.repeat(72));

  // 1. package.json
  const updatedPkgRaw = pkgRaw.replace(
    /"version":\s*"[0-9]+\.[0-9]+\.[0-9]+"/,
    `"version": "${nextVersion}"`
  );
  if (!dryRun) fs.writeFileSync(pkgPath, updatedPkgRaw, 'utf8');
  console.log(`  [✓] package.json               -> ${nextVersion}`);

  // 2. package-lock.json
  if (fs.existsSync(pkgLockPath)) {
    const lockRaw = fs.readFileSync(pkgLockPath, 'utf8');
    const updatedLockRaw = lockRaw
      .replace(/"version":\s*"[0-9]+\.[0-9]+\.[0-9]+"/, `"version": "${nextVersion}"`)
      .replace(/("packages":\s*\{\s*"":\s*\{\s*"name":\s*"refdiff",\s*"version":\s*")[0-9]+\.[0-9]+\.[0-9]+"/, `$1${nextVersion}"`);
    if (!dryRun) fs.writeFileSync(pkgLockPath, updatedLockRaw, 'utf8');
    console.log(`  [✓] package-lock.json          -> ${nextVersion}`);
  }

  // 3. refdiff.js
  let jsSha1 = '';
  if (fs.existsSync(refdiffJsPath)) {
    const jsRaw = fs.readFileSync(refdiffJsPath, 'utf8');
    const updatedJsRaw = jsRaw.replace(
      /(\/\/\s*@version\s+)[0-9]+\.[0-9]+\.[0-9]+/,
      `$1${nextVersion}`
    );
    if (!dryRun) fs.writeFileSync(refdiffJsPath, updatedJsRaw, 'utf8');
    jsSha1 = crypto.createHash('sha1').update(updatedJsRaw, 'utf8').digest('hex');
    console.log(`  [✓] refdiff.js                 -> @version ${nextVersion} (SHA-1: ${jsSha1.slice(0, 8)})`);
  }

  // 4. refdiff.wiki
  if (fs.existsSync(refdiffWikiPath)) {
    const wikiRaw = fs.readFileSync(refdiffWikiPath, 'utf8');
    const updatedWikiRaw = wikiRaw
      .replace(/(\|\s*version\s*=\s*)[0-9]+\.[0-9]+\.[0-9]+/, `$1${nextVersion}`)
      .replace(/(\|\s*status\s*=\s*Stable \(v)[0-9]+\.[0-9]+\.[0-9]+(\))/, `$1${nextVersion}$2`);
    if (!dryRun) fs.writeFileSync(refdiffWikiPath, updatedWikiRaw, 'utf8');
    console.log(`  [✓] refdiff.wiki               -> ${nextVersion}`);
  }

  // 5. ROLLOUT_PLAN.md
  if (fs.existsSync(rolloutPlanPath)) {
    const planRaw = fs.readFileSync(rolloutPlanPath, 'utf8');
    let updatedPlanRaw = planRaw
      .replace(/(\*\*Version:\*\*\s*)[0-9]+\.[0-9]+\.[0-9]+/, `$1${nextVersion}`)
      .replace(/(git tag -a v)[0-9]+\.[0-9]+\.[0-9]+(\s+-m\s+"Release v)[0-9]+\.[0-9]+\.[0-9]+(")/g, `$1${nextVersion}$2${nextVersion}$3`)
      .replace(/(git push origin v)[0-9]+\.[0-9]+\.[0-9]+/g, `$1${nextVersion}`)
      .replace(/(Tag release `v)[0-9]+\.[0-9]+\.[0-9]+/g, `$1${nextVersion}`);

    if (jsSha1) {
      const shortSha = jsSha1.slice(0, 8);
      updatedPlanRaw = updatedPlanRaw
        .replace(/(release SHA-1 \(`)[a-f0-9]{8}(`\))/g, `$1${shortSha}$2`)
        .replace(/(SHA-1 pointer \(`)[a-f0-9]{8}(\.\.\.`\))/g, `$1${shortSha}$2`);
    }

    if (!dryRun) fs.writeFileSync(rolloutPlanPath, updatedPlanRaw, 'utf8');
    console.log(`  [✓] ROLLOUT_PLAN.md            -> ${nextVersion}`);
  }

  // 6. AUDIT_STRATEGY.md
  if (fs.existsSync(auditStrategyPath)) {
    const auditRaw = fs.readFileSync(auditStrategyPath, 'utf8');
    const updatedAuditRaw = auditRaw
      .replace(/(\*\*Version:\*\*\s*)[0-9]+\.[0-9]+\.[0-9]+/, `$1${nextVersion}`)
      .replace(/(\(v)[0-9]+\.[0-9]+\.[0-9]+(\))/g, `$1${nextVersion}$2`);
    if (!dryRun) fs.writeFileSync(auditStrategyPath, updatedAuditRaw, 'utf8');
    console.log(`  [✓] AUDIT_STRATEGY.md          -> ${nextVersion}`);
  }

  console.log('-'.repeat(72));
  console.log(' Version bump complete. Next steps:');
  console.log('  1. Review diff:            git diff --stat && git diff');
  console.log('  2. Pre-flight CI:          npm run preflight');
  console.log('  3. Git tag & commit:       git commit -am "chore(release): v' + nextVersion + '" && git tag -a v' + nextVersion + ' -m "Release v' + nextVersion + '"');
  console.log('  4. Shipment & On-Wiki:     Deploy to Meta-Wiki & en.WP, then npm run check:deploy');
  console.log('  5. Feature Uprev:          Execute minor bump ONLY after shipment verification');
  console.log('='.repeat(72));

  return { currentVersion, nextVersion, jsSha1 };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node scripts/bump_version.js [patch|minor|major|X.Y.Z] [--dry-run]');
    console.log('  Default: patch (pre-flight candidate uprev)');
    console.log('  Feature uprev (minor/major) is executed only after shipment across Wikimedia targets.');
    process.exit(0);
  }
  const dryRun = args.includes('--dry-run');
  const bumpType = args.find(a => !a.startsWith('--')) || 'patch';
  try {
    bumpVersion(bumpType, dryRun);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { bumpVersion, computeNextVersion };
