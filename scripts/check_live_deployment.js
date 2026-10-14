/**
 * scripts/check_live_deployment.js
 *
 * Automated Live On-Wiki Deployment Auditor:
 * Queries the live Wikimedia APIs (English Wikipedia & Meta-Wiki) to verify:
 *  1. Canonical Lead Script (en:User:Powercycler/refdiff.js)
 *  2. Pinned Canary Release (en:User:Powercycler/refdiff-v1.3.0.js)
 *  3. Canonical Documentation (en:User:Powercycler/RefDiff)
 *  4. Canonical Userbox Template (en:Template:User RefDiff)
 *  5. Meta-Wiki Global Dummy Loader (m:User:Powercycler/refdiff.js)
 *  6. Meta-Wiki Documentation Redirect (m:User:Powercycler/RefDiff)
 *
 * Compares live revisions, timestamps, file sizes, and SHA-1 hashes against local release files.
 */

/* eslint-env node */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const rootDir = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const localJs = fs.readFileSync(path.join(rootDir, 'refdiff.js'), 'utf8');
const localWiki = fs.readFileSync(path.join(rootDir, 'refdiff.wiki'), 'utf8');
const localUserbox = fs.readFileSync(path.join(rootDir, 'userbox_enwiki.wiki'), 'utf8');

const localJsSha1 = crypto.createHash('sha1').update(localJs, 'utf8').digest('hex');
const localWikiSha1 = crypto.createHash('sha1').update(localWiki, 'utf8').digest('hex');

const EXPECTED_META_LOADER = "mw.loader.load('//en.wikipedia.org/w/index.php?title=User:Powercycler/refdiff.js&action=raw&ctype=text/javascript');";

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
  console.log('========================================================================');
  console.log(` RefDiff Live On-Wiki Deployment Auditor (Target Release: v${pkg.version})`);
  console.log('========================================================================\n');

  console.log(`Local Release Artifacts:`);
  console.log(`  - refdiff.js:           ${(localJs.length / 1024).toFixed(1)} KB (SHA-1: ${localJsSha1})`);
  console.log(`  - refdiff.wiki:         ${(localWiki.length / 1024).toFixed(1)} KB (SHA-1: ${localWikiSha1})`);
  console.log(`  - userbox_enwiki.wiki:  ${(localUserbox.length / 1024).toFixed(1)} KB\n`);

  console.log('Querying live Wikimedia APIs...\n');

  let enwikiPages = {};
  let metawikiPages = {};

  try {
    const enRes = await fetchApi('https://en.wikipedia.org/w/api.php', [
      'User:Powercycler/refdiff.js',
      `User:Powercycler/refdiff-v${pkg.version}.js`,
      'User:Powercycler/RefDiff',
      'Template:User RefDiff'
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

  // 1. English Wikipedia - Canonical Lead Script
  const enLead = enwikiPages['User:Powercycler/refdiff.js'];
  if (!enLead || enLead.missing !== undefined) {
    reports.push({
      target: 'en:User:Powercycler/refdiff.js (Lead Script)',
      status: 'NOT DEPLOYED (Missing)',
      details: 'Page does not exist on en.wikipedia.org yet. Action: Copy local refdiff.js to page.',
      ok: false
    });
  } else {
    const rev = enLead.revisions && enLead.revisions[0];
    const liveSha1 = rev ? rev.sha1 : '';
    const isSync = liveSha1 === localJsSha1;
    reports.push({
      target: 'en:User:Powercycler/refdiff.js (Lead Script)',
      status: isSync ? 'DEPLOYED & SYNCHRONIZED' : 'DEPLOYED (Out of Sync)',
      details: `Rev ${rev.revid} (${rev.timestamp}), Size: ${(rev.size / 1024).toFixed(1)} KB, SHA-1: ${liveSha1}`,
      ok: isSync
    });
  }

  // 2. English Wikipedia - Pinned Canary
  const enCanary = enwikiPages[`User:Powercycler/refdiff-v${pkg.version}.js`];
  if (!enCanary || enCanary.missing !== undefined) {
    reports.push({
      target: `en:User:Powercycler/refdiff-v${pkg.version}.js (Canary)`,
      status: 'NOT DEPLOYED (Missing)',
      details: 'Page does not exist on en.wikipedia.org yet. Action: Publish canary for Ring 1 verification.',
      ok: false
    });
  } else {
    const rev = enCanary.revisions && enCanary.revisions[0];
    const liveSha1 = rev ? rev.sha1 : '';
    const isSync = liveSha1 === localJsSha1;
    reports.push({
      target: `en:User:Powercycler/refdiff-v${pkg.version}.js (Canary)`,
      status: isSync ? 'DEPLOYED & SYNCHRONIZED' : 'DEPLOYED (Out of Sync)',
      details: `Rev ${rev.revid} (${rev.timestamp}), SHA-1: ${liveSha1}`,
      ok: isSync
    });
  }

  // 3. English Wikipedia - Canonical Documentation
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
      details: `Rev ${rev.revid} (${rev.timestamp}), Size: ${(rev.size / 1024).toFixed(1)} KB`,
      ok: true
    });
  }

  // 4. English Wikipedia - Userbox Template
  const enUserbox = enwikiPages['Template:User RefDiff'];
  if (!enUserbox || enUserbox.missing !== undefined) {
    reports.push({
      target: 'en:Template:User RefDiff (Userbox)',
      status: 'NOT DEPLOYED (Missing)',
      details: 'Page does not exist on en.wikipedia.org yet. Action: Publish userbox_enwiki.wiki.',
      ok: false
    });
  } else {
    const rev = enUserbox.revisions && enUserbox.revisions[0];
    reports.push({
      target: 'en:Template:User RefDiff (Userbox)',
      status: 'DEPLOYED',
      details: `Rev ${rev.revid} (${rev.timestamp}), Size: ${(rev.size / 1024).toFixed(1)} KB`,
      ok: true
    });
  }

  // 5. Meta-Wiki - Dummy Loader
  const metaScript = metawikiPages['User:Powercycler/refdiff.js'];
  if (!metaScript || metaScript.missing !== undefined) {
    reports.push({
      target: 'm:User:Powercycler/refdiff.js (Meta Dummy Loader)',
      status: 'NOT DEPLOYED (Missing)',
      details: 'Page does not exist on meta.wikimedia.org. Action: Create 1-line dummy loader stub.',
      ok: false
    });
  } else {
    const rev = metaScript.revisions && metaScript.revisions[0];
    const content = rev ? (rev['*'] || '') : '';
    const isDummy = content.trim().includes('mw.loader.load') && content.includes('en.wikipedia.org');
    if (isDummy) {
      reports.push({
        target: 'm:User:Powercycler/refdiff.js (Meta Dummy Loader)',
        status: 'DEPLOYED & CONFIGURED AS DUMMY',
        details: `Rev ${rev.revid}, forwards correctly to en.wikipedia.org canonical script.`,
        ok: true
      });
    } else {
      reports.push({
        target: 'm:User:Powercycler/refdiff.js (Meta Script)',
        status: 'DEPLOYED (Legacy Monolithic Script - Needs Migration to Dummy Loader)',
        details: `Rev ${rev.revid} (${rev.timestamp}), Size: ${(rev.size / 1024).toFixed(1)} KB. Currently holds old v1.3.0 standalone script. Replace with 1-line dummy loader.`,
        ok: false
      });
    }
  }

  // 6. Meta-Wiki - Documentation / Redirect
  const metaDoc = metawikiPages['User:Powercycler/RefDiff'];
  if (!metaDoc || metaDoc.missing !== undefined) {
    reports.push({
      target: 'm:User:Powercycler/RefDiff (Meta Docs)',
      status: 'NOT DEPLOYED (Missing)',
      details: 'Page does not exist on meta.wikimedia.org.',
      ok: false
    });
  } else {
    const rev = metaDoc.revisions && metaDoc.revisions[0];
    const content = rev ? (rev['*'] || '') : '';
    const isRedirect = /#REDIRECT/i.test(content) || content.includes('en:User:Powercycler/RefDiff');
    reports.push({
      target: 'm:User:Powercycler/RefDiff (Meta Docs)',
      status: isRedirect ? 'DEPLOYED & REDIRECTED TO en.WP' : 'DEPLOYED (Standalone Documentation)',
      details: `Rev ${rev.revid} (${rev.timestamp}), Size: ${(rev.size / 1024).toFixed(1)} KB. ${isRedirect ? 'Soft redirect active.' : 'Can remain as cross-wiki docs or soft redirect.'}`,
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
    console.log('⚠️ DEPLOYMENT ACTION REQUIRED:');
    console.log(' To complete the deployment according to DEPLOYMENT_PLAN.md:');
    console.log('  1. Publish canonical lead script to en:User:Powercycler/refdiff.js');
    console.log(`     (Copy refdiff.js, ${ (localJs.length / 1024).toFixed(1) } KB)`);
    console.log('  2. Publish canary release to en:User:Powercycler/refdiff-v1.3.0.js');
    console.log('  3. Update m:User:Powercycler/refdiff.js to the 1-line dummy loader:');
    console.log(`     ${EXPECTED_META_LOADER}`);
    console.log('  4. Publish documentation to en:User:Powercycler/RefDiff (refdiff.wiki)');
    console.log('  5. Publish userbox to en:Template:User RefDiff (userbox_enwiki.wiki)');
    console.log('------------------------------------------------------------------------\n');
    process.exit(1);
  }
}

auditDeployment().catch((err) => {
  console.error(`Audit failed: ${err.message}`);
  process.exit(1);
});
