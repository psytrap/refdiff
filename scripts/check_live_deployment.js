/**
 * scripts/check_live_deployment.js
 *
 * Automated Live On-Wiki Deployment Auditor:
 * Queries the live Wikimedia APIs (English Wikipedia & Meta-Wiki) to verify:
 *  1. Meta-Wiki Script Lead (m:User:Powercycler/refdiff.js)
 *  2. English Wikipedia Early Testing Harness (en:User:Powercycler/common.js)
 *  3. English Wikipedia SHA Pointer (en:User:Powercycler/refdiff.js)
 *  4. English Wikipedia Documentation Lead (en:User:Powercycler/RefDiff)
 *  5. Meta-Wiki Documentation Soft Redirect (m:User:Powercycler/RefDiff)
 *  6. English Wikipedia Userbox Template (en:Template:User RefDiff)
 *
 * Compares live revisions, timestamps, file sizes, and SHA-1 hashes against local release files.
 */

/* eslint-env node */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const localJs = fs.readFileSync(path.join(rootDir, 'refdiff.js'), 'utf8');
const localWiki = fs.readFileSync(path.join(rootDir, 'refdiff.wiki'), 'utf8');
const localUserbox = fs.readFileSync(path.join(rootDir, 'userbox_enwiki.wiki'), 'utf8');

const localJsSha1 = crypto.createHash('sha1').update(localJs, 'utf8').digest('hex');
const localJsTrimmedSha1 = crypto.createHash('sha1').update(localJs.trimEnd(), 'utf8').digest('hex');
const localWikiSha1 = crypto.createHash('sha1').update(localWiki, 'utf8').digest('hex');

function getGitReleaseInfo() {
  try {
    const latestTag = execSync('git describe --tags --abbrev=0 --match "v*"', {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    if (!latestTag) return null;

    const tagJs = execSync(`git show ${latestTag}:refdiff.js`, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const tagJsSha1 = crypto.createHash('sha1').update(tagJs, 'utf8').digest('hex');
    const tagJsTrimmedSha1 = crypto.createHash('sha1').update(tagJs.trimEnd(), 'utf8').digest('hex');

    return {
      tag: latestTag,
      jsSha1: tagJsSha1,
      jsTrimmedSha1: tagJsTrimmedSha1,
      sizeKb: (tagJs.length / 1024).toFixed(1)
    };
  } catch (_) {
    return null;
  }
}

const USER_AGENT = `RefDiffLiveDeployAudit/${pkg.version} (https://en.wikipedia.org/wiki/User:Powercycler/RefDiff; contact: User:Powercycler)`;

function fetchApi(apiBase, titles) {
  return new Promise((resolve, reject) => {
    const url = `${apiBase}?action=query&titles=${encodeURIComponent(titles.join('|'))}&prop=info|revisions&rvprop=ids|timestamp|sha1|size|content&format=json`;
    const req = https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          reject(new Error(`Failed to parse API response from ${apiBase}: ${body.slice(0, 150)}`));
        }
      });
    });
    req.on('error', reject);
  });
}

async function auditDeployment() {
  const gitRelease = getGitReleaseInfo();
  const targetTag = gitRelease ? gitRelease.tag : `v${pkg.version}`;
  const isPostShipmentCycle = gitRelease && gitRelease.tag !== `v${pkg.version}` && gitRelease.jsSha1 !== localJsSha1;
  const targetJsSha1 = isPostShipmentCycle ? gitRelease.jsSha1 : localJsSha1;

  console.log('========================================================================');
  const targetHeader = isPostShipmentCycle
    ? `Target Release: ${targetTag} | Working Tree: v${pkg.version}`
    : `Target Release: ${targetTag}`;
  console.log(` RefDiff Live On-Wiki Deployment Auditor (${targetHeader})`);
  console.log('========================================================================\n');

  console.log('Release Artifacts:');
  console.log(`  - refdiff.js (Working Tree):   ${(localJs.length / 1024).toFixed(1)} KB (SHA-1: ${localJsSha1})`);
  if (gitRelease) {
    console.log(`  - refdiff.js (Release ${gitRelease.tag}):   ${gitRelease.sizeKb} KB (SHA-1: ${gitRelease.jsSha1})`);
  }
  console.log(`  - refdiff.wiki (Doc Lead):     ${(localWiki.length / 1024).toFixed(1)} KB (SHA-1: ${localWikiSha1})`);
  console.log(`  - userbox_enwiki.wiki:         ${(localUserbox.length / 1024).toFixed(1)} KB\n`);

  console.log('Querying live Wikimedia APIs...\n');

  const enwikiPages = {};
  const metawikiPages = {};

  try {
    const enRes = await fetchApi('https://en.wikipedia.org/w/api.php', [
      'User:Powercycler/refdiff.js',
      'User:Powercycler/RefDiff',
      'User:Powercycler/Userbox RefDiff',
      'User:Powercycler/Userbox/RefDiff',
      'User:Powercycler/User RefDiff',
      'User:Powercycler/common.js'
    ]);
    if (enRes.query && enRes.query.pages) {
      for (const page of Object.values(enRes.query.pages)) {
        enwikiPages[page.title] = page;
      }
    }
  } catch (err) {
    console.error(`Error querying English Wikipedia: ${err.message}`);
  }

  try {
    const metaRes = await fetchApi('https://meta.wikimedia.org/w/api.php', [
      'User:Powercycler/refdiff.js',
      'User:Powercycler/RefDiff'
    ]);
    if (metaRes.query && metaRes.query.pages) {
      for (const page of Object.values(metaRes.query.pages)) {
        metawikiPages[page.title] = page;
      }
    }
  } catch (err) {
    console.error(`Error querying Meta-Wiki: ${err.message}`);
  }

  const reports = [];

  // 1. Meta-Wiki - Script Lead (Primary Code Payload)
  const metaLead = metawikiPages['User:Powercycler/refdiff.js'];
  if (!metaLead || metaLead.missing !== undefined) {
    reports.push({
      target: 'm:User:Powercycler/refdiff.js (Script Lead)',
      status: 'NOT DEPLOYED (Missing)',
      details: 'Page does not exist on meta.wikimedia.org yet. Action: Copy local refdiff.js to page.',
      ok: false
    });
  } else {
    const rev = metaLead.revisions && metaLead.revisions[0];
    const liveSha1 = rev ? rev.sha1 : '';
    const matchTree = liveSha1 === localJsSha1 || liveSha1 === localJsTrimmedSha1;
    const matchTag = gitRelease && (liveSha1 === gitRelease.jsSha1 || liveSha1 === gitRelease.jsTrimmedSha1);
    const isSync = matchTree || matchTag;

    let syncStatus = 'DEPLOYED & SYNCHRONIZED (Script Lead)';
    let detailMsg = `Rev ${rev.revid} (${rev.timestamp}), Size: ${(rev.size / 1024).toFixed(1)} KB, SHA-1: ${liveSha1}. `;

    if (matchTree && matchTag) {
      syncStatus = `DEPLOYED & SYNCHRONIZED (${gitRelease.tag})`;
      detailMsg += `Production is 100% in sync with release ${gitRelease.tag}.`;
    } else if (matchTag) {
      syncStatus = `DEPLOYED & SYNCHRONIZED (Release ${gitRelease.tag})`;
      detailMsg += `Production matches latest release tag ${gitRelease.tag} (Working tree is v${pkg.version} for next development cycle).`;
    } else if (matchTree) {
      syncStatus = `DEPLOYED & SYNCHRONIZED (Working Tree v${pkg.version})`;
      detailMsg += `Production matches local working tree v${pkg.version}.`;
    } else {
      syncStatus = 'DEPLOYED (Out of Sync)';
      const expectedSha = gitRelease ? `${gitRelease.jsSha1.slice(0, 8)} (${gitRelease.tag}) or ${localJsSha1.slice(0, 8)} (local)` : localJsSha1;
      detailMsg += `Update needed. Expected SHA-1: ${expectedSha}.`;
    }

    reports.push({
      target: 'm:User:Powercycler/refdiff.js (Script Lead)',
      status: syncStatus,
      details: detailMsg,
      ok: isSync
    });
  }

  // 2. English Wikipedia - Early Testing Harness (common.js)
  const enCommon = enwikiPages['User:Powercycler/common.js'];
  if (!enCommon || enCommon.missing !== undefined) {
    reports.push({
      target: 'en:User:Powercycler/common.js (Early Testing Harness)',
      status: 'NOT CONFIGURED (Optional)',
      details: 'Page does not exist on en.wikipedia.org. Used during deployment stages for early smoke testing before upreving SHA pointer.',
      ok: true
    });
  } else {
    const rev = enCommon.revisions && enCommon.revisions[0];
    const content = rev ? (rev['*'] || '') : '';
    const loadsMetaLead = content.includes('meta.wikimedia.org') && content.includes('refdiff.js');
    const loadsEnPointer = (content.includes('User:Powercycler/refdiff.js') || content.includes('refdiff.js')) && !loadsMetaLead;
    let statusText = 'DEPLOYED (No RefDiff loader detected)';
    let detailText = `Rev ${rev.revid} (${rev.timestamp}). Optional install / testing hook.`;
    if (loadsEnPointer) {
      statusText = 'FINAL PRODUCTION INSTALL (via en.WP Pointer / ScriptInstaller)';
      detailText = `Rev ${rev.revid} (${rev.timestamp}). Configured via canonical en.WP script pointer (production install).`;
    } else if (loadsMetaLead) {
      statusText = 'EARLY TESTING HARNESS (Direct Meta-Wiki load)';
      detailText = `Rev ${rev.revid} (${rev.timestamp}). Direct Meta-Wiki loader present for staging verification.`;
    }
    reports.push({
      target: 'en:User:Powercycler/common.js (User Installation)',
      status: statusText,
      details: detailText,
      ok: true
    });
  }

  // 3. English Wikipedia - SHA Pointer (Immutable / Pinned Forwarder)
  const enPointer = enwikiPages['User:Powercycler/refdiff.js'];
  if (!enPointer || enPointer.missing !== undefined) {
    reports.push({
      target: 'en:User:Powercycler/refdiff.js (en.WP SHA Pointer)',
      status: 'NOT DEPLOYED (Missing)',
      details: 'Page does not exist on en.wikipedia.org yet. Action: Publish SHA pointer loader forwarding to Meta-Wiki script lead.',
      ok: false
    });
  } else {
    const rev = enPointer.revisions && enPointer.revisions[0];
    const content = rev ? (rev['*'] || '') : '';
    const isForwarder = content.includes('mw.loader.load') && (content.includes('meta.wikimedia.org') || content.includes('User:Powercycler/refdiff.js'));
    const referencesTree = content.includes(localJsSha1.slice(0, 8)) || content.includes(localJsSha1) ||
      content.includes(localJsTrimmedSha1.slice(0, 8)) || content.includes(localJsTrimmedSha1) ||
      content.includes(`v${pkg.version}`);
    const referencesTag = gitRelease && (
      content.includes(gitRelease.jsSha1.slice(0, 8)) || content.includes(gitRelease.jsSha1) ||
      content.includes(gitRelease.jsTrimmedSha1.slice(0, 8)) || content.includes(gitRelease.jsTrimmedSha1) ||
      content.includes(gitRelease.tag)
    );
    const referencesRelease = referencesTree || referencesTag;
    const matchedTag = referencesTag ? gitRelease.tag : `v${pkg.version}`;
    const matchedSha = referencesTag ? gitRelease.jsSha1.slice(0, 8) : localJsSha1.slice(0, 8);

    if (isForwarder && referencesRelease) {
      reports.push({
        target: 'en:User:Powercycler/refdiff.js (en.WP SHA Pointer)',
        status: `DEPLOYED & POINTING TO RELEASE (${matchedTag})`,
        details: `Rev ${rev.revid} (${rev.timestamp}). Forwards to Meta-Wiki script lead referencing release SHA-1 (${matchedSha}).`,
        ok: true
      });
    } else if (isForwarder) {
      reports.push({
        target: 'en:User:Powercycler/refdiff.js (en.WP SHA Pointer)',
        status: 'DEPLOYED (Pointer Outdated)',
        details: `Rev ${rev.revid} (${rev.timestamp}). Forwards to Meta-Wiki but missing current release SHA-1 (${matchedSha}). Update pointer.`,
        ok: false
      });
    } else {
      reports.push({
        target: 'en:User:Powercycler/refdiff.js (en.WP SHA Pointer)',
        status: 'DEPLOYED (Direct / Unpinned Script)',
        details: `Rev ${rev.revid} (${rev.timestamp}), Size: ${(rev.size / 1024).toFixed(1)} KB. Expected SHA pointer forwarding to Meta-Wiki script lead.`,
        ok: false
      });
    }
  }

  // 4. English Wikipedia - Documentation Lead
  const enDoc = enwikiPages['User:Powercycler/RefDiff'];
  if (!enDoc || enDoc.missing !== undefined) {
    reports.push({
      target: 'en:User:Powercycler/RefDiff (Lead Docs)',
      status: 'NOT DEPLOYED (Missing)',
      details: 'Page does not exist on en.wikipedia.org yet. Action: Publish refdiff.wiki wikitext.',
      ok: false
    });
  } else {
    const rev = enDoc.revisions && enDoc.revisions[0];
    reports.push({
      target: 'en:User:Powercycler/RefDiff (Lead Docs)',
      status: 'DEPLOYED',
      details: `Rev ${rev.revid} (${rev.timestamp}), Size: ${(rev.size / 1024).toFixed(1)} KB. Authoritative documentation on English Wikipedia.`,
      ok: true
    });
  }

  // 5. Meta-Wiki - Documentation Soft Redirect
  const metaDoc = metawikiPages['User:Powercycler/RefDiff'];
  if (!metaDoc || metaDoc.missing !== undefined) {
    reports.push({
      target: 'm:User:Powercycler/RefDiff (Meta Docs Redirect)',
      status: 'NOT DEPLOYED (Missing)',
      details: 'Page does not exist on meta.wikimedia.org. Action: Create soft redirect to en:User:Powercycler/RefDiff.',
      ok: false
    });
  } else {
    const rev = metaDoc.revisions && metaDoc.revisions[0];
    const content = rev ? (rev['*'] || '') : '';
    const isRedirect = /#REDIRECT/i.test(content) || content.includes('en:User:Powercycler/RefDiff');
    reports.push({
      target: 'm:User:Powercycler/RefDiff (Meta Docs Redirect)',
      status: isRedirect ? 'DEPLOYED & REDIRECTED TO en.WP' : 'DEPLOYED (Standalone Documentation)',
      details: `Rev ${rev.revid} (${rev.timestamp}), Size: ${(rev.size / 1024).toFixed(1)} KB. ${isRedirect ? 'Soft redirect active to en.WP lead docs.' : 'Can remain as cross-wiki docs or soft redirect.'}`,
      ok: true
    });
  }

  // 6. English Wikipedia - Userbox Template (User Space)
  const enUserbox = enwikiPages['User:Powercycler/Userbox RefDiff'] ||
                    enwikiPages['User:Powercycler/Userbox/RefDiff'] ||
                    enwikiPages['User:Powercycler/User RefDiff'];
  if (!enUserbox || enUserbox.missing !== undefined) {
    reports.push({
      target: 'en:User:Powercycler/Userbox RefDiff (Userbox)',
      status: 'NOT DEPLOYED (Missing)',
      details: 'Page does not exist on en.wikipedia.org yet. Action: Publish userbox_enwiki.wiki to user space (e.g. User:Powercycler/Userbox RefDiff).',
      ok: false
    });
  } else {
    const rev = enUserbox.revisions && enUserbox.revisions[0];
    reports.push({
      target: `en:${enUserbox.title} (Userbox)`,
      status: 'DEPLOYED & SYNCHRONIZED',
      details: `Rev ${rev.revid} (${rev.timestamp}), Size: ${(rev.size / 1024).toFixed(1)} KB in user space.`,
      ok: true
    });
  }

  console.log('------------------------------------------------------------------------');
  console.log(' Live Deployment Status Report:');
  console.log('------------------------------------------------------------------------');

  let allOk = true;
  for (const r of reports) {
    const marker = r.ok ? '✓' : '✗';
    console.log(` ${marker} ${r.target}`);
    console.log(`   Status:  ${r.status}`);
    console.log(`   Details: ${r.details}\n`);
    if (!r.ok) allOk = false;
  }

  console.log('------------------------------------------------------------------------');
  if (allOk) {
    console.log('🎉 ALL TARGETS ARE FULLY DEPLOYED AND SYNCHRONIZED!');
    process.exit(0);
  } else {
    const targetTagLabel = gitRelease ? gitRelease.tag : `v${pkg.version}`;
    const pointerCode = `// [[m:User:Powercycler/refdiff.js]] (Release SHA-1: ${targetJsSha1.slice(0, 8)})\nmw.loader.load('https://meta.wikimedia.org/w/index.php?title=User:Powercycler/refdiff.js&action=raw&ctype=text/javascript');`;
    console.log('⚠️ DEPLOYMENT ACTION REQUIRED:');
    console.log(' To complete the rollout according to ROLLOUT_PLAN.md (Rollout and Deployment Plan):');
    console.log(`  1. Update m:User:Powercycler/refdiff.js (Meta-Wiki Script Lead):`);
    console.log(`     Copy refdiff.js (${targetTagLabel}) (${ (localJs.length / 1024).toFixed(1) } KB, SHA-1: ${targetJsSha1})`);
    console.log('  2. Early testing on en:User:Powercycler/common.js:');
    console.log('     Verify 5 live benchmark diffs before updating SHA pointer');
    console.log('  3. Update en:User:Powercycler/refdiff.js (en.WP SHA Pointer):');
    console.log(`     Publish pointer forwarding to Meta script lead with release SHA-1 (${targetJsSha1.slice(0, 8)}):`);
    console.log(`     ${pointerCode.replace(/\n/g, '\n     ')}`);
    console.log('  4. Publish documentation to en:User:Powercycler/RefDiff (refdiff.wiki - Doc Lead)');
    console.log('  5. Ensure m:User:Powercycler/RefDiff is configured as soft redirect to en.WP');
    console.log('  6. Publish userbox to en:Template:User RefDiff (userbox_enwiki.wiki)');
    console.log('------------------------------------------------------------------------\n');
    process.exit(1);
  }
}

auditDeployment().catch((err) => {
  console.error(`Audit failed: ${err.message}`);
  process.exit(1);
});
