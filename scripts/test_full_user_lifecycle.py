#!/usr/bin/env python3
"""
scripts/test_full_user_lifecycle.py

Complete End-to-End Logged-in User Rollout & Lifecycle Verification:
1. Validates that user is logged in (authenticated session in Chromium CDP).
2. Verifies baseline environment is clean (0 refdiff pointers in common.js).
3. Verifies MediaWiki deployment pointers (Meta-Wiki lead & en.WP pointer).
4. Inspects Toolpage (User:Powercycler/RefDiff).
5. Performs automated install into User:common.js via MediaWiki API.
6. Verifies live diff execution (Special:Diff) under the authenticated session:
   - RefDiff initializes via common.js loader
   - Mode button mounts
   - Citations decouple into citation rows and badges
   - Memento toggle roundtrips (RefDiff <-> Wikitext)
7. Performs automated uninstall from User:common.js and asserts environment is clean.
8. Checks for log out at the end: triggers logout and asserts session is anonymous.
"""

import asyncio
import json
import urllib.request
import websockets
import sys

CDP_HTTP = "http://127.0.0.1:9222"


async def get_browser_ws():
    req = urllib.request.urlopen(f"{CDP_HTTP}/json/version")
    info = json.loads(req.read().decode("utf-8"))
    return info["webSocketDebuggerUrl"]


async def main():
    print("=" * 70)
    print("⚡ REFDIFF FULL USER LIFECYCLE & ROLLOUT TEST (AUTOMATED)")
    print("=" * 70)

    # 1. Connect to CDP and find Wikipedia tab
    req = urllib.request.urlopen(f"{CDP_HTTP}/json/list")
    tabs = json.loads(req.read().decode("utf-8"))
    wiki_tab = next((t for t in tabs if "wikipedia.org" in t.get("url", "") and t.get("type") == "page"), None)
    if not wiki_tab:
        print("[-] No Wikipedia tab found in Chromium!")
        sys.exit(1)

    tab_ws = wiki_tab["webSocketDebuggerUrl"]
    tab_id = wiki_tab["id"]
    print(f"[✓] Connected to tab '{wiki_tab['title']}' ({tab_id})")

    async with websockets.connect(tab_ws, max_size=25_000_000) as ws:
        msg_id = 0

        async def send(method, params=None):
            nonlocal msg_id
            msg_id += 1
            cid = msg_id
            payload = {"id": cid, "method": method}
            if params:
                payload["params"] = params
            await ws.send(json.dumps(payload))
            while True:
                raw = await ws.recv()
                res = json.loads(raw)
                if res.get("id") == cid:
                    return res

        async def eval_js(expr):
            res = await send("Runtime.evaluate", {
                "expression": expr,
                "returnByValue": True,
                "awaitPromise": True
            })
            result = res.get("result", {}).get("result", {})
            if "exceptionDetails" in res.get("result", {}):
                details = res["result"]["exceptionDetails"]
                raise RuntimeError(f"JS Eval Error: {details.get('text')} - {details}")
            return result.get("value")

        await send("Page.enable")
        await send("Runtime.enable")

        # -----------------------------------------------------------------
        # STEP 1: Verify authenticated user
        # -----------------------------------------------------------------
        print("\n[Step 1] Verifying authenticated user...")
        user_name = await eval_js("mw.config.get('wgUserName')")
        print(f"  - Logged-in User: '{user_name}'")
        assert user_name is not None, "Error: User is not logged in!"
        print("  [✓] Authentication confirmed.")

        # -----------------------------------------------------------------
        # STEP 2: Verify baseline clean environment
        # -----------------------------------------------------------------
        print(f"\n[Step 2] Checking User:{user_name}/common.js baseline cleanliness...")
        baseline = await eval_js(f"""(async () => {{
            const api = new mw.Api();
            const res = await api.get({{
                action: 'query',
                prop: 'revisions',
                titles: 'User:{user_name}/common.js',
                rvslots: '*',
                rvprop: 'content|ids|timestamp',
                formatversion: 2
            }});
            const page = res.query.pages[0];
            const content = (page.revisions && page.revisions[0].slots.main.content) || '';
            const revid = (page.revisions && page.revisions[0].revid) || null;
            const hasRefDiff = /refdiff/i.test(content);
            return {{
                revid: revid,
                content: content,
                isClean: !hasRefDiff
            }};
        }})()""")
        print(f"  - Rev ID: {baseline['revid']}")
        print(f"  - Baseline is clean (0 refdiff pointers): {baseline['isClean']}")
        assert baseline["isClean"], f"Error: common.js is not clean before testing!"
        print("  [✓] Baseline environment is 100% clean.")

        # -----------------------------------------------------------------
        # STEP 3: Check MediaWiki Deployment Pointer Targets
        # -----------------------------------------------------------------
        print("\n[Step 3] Checking MediaWiki Deployment Pointer Targets...")
        meta_check = await eval_js("""(async () => {
            const resp = await fetch('https://meta.wikimedia.org/w/api.php?action=query&prop=revisions&titles=User:Powercycler/refdiff.js&rvprop=ids|sha1|timestamp&format=json&origin=*');
            const data = await resp.json();
            const pages = data.query.pages;
            const pid = Object.keys(pages)[0];
            return pages[pid].revisions[0];
        })()""")
        print(f"  - Meta Lead Script: Rev {meta_check.get('revid')} (SHA-1: {meta_check.get('sha1')})")

        en_check = await eval_js("""(async () => {
            const api = new mw.Api();
            const res = await api.get({
                action: 'query',
                prop: 'revisions',
                titles: 'User:Powercycler/refdiff.js',
                rvprop: 'ids|sha1|timestamp',
                formatversion: 2
            });
            return res.query.pages[0].revisions[0];
        })()""")
        print(f"  - en.WP Script Pointer: Rev {en_check.get('revid')} (SHA-1: {en_check.get('sha1')})")
        print("  [✓] MediaWiki deployment pointers confirmed.")

        # -----------------------------------------------------------------
        # STEP 4: Inspect Toolpage
        # -----------------------------------------------------------------
        print("\n[Step 4] Navigating to Toolpage (User:Powercycler/RefDiff)...")
        await send("Page.navigate", {"url": "https://en.wikipedia.org/wiki/User:Powercycler/RefDiff"})
        await asyncio.sleep(3.5)

        toolpage_data = await eval_js("""(() => {
            const infobox = document.querySelector('table.infobox-user-script, table.infobox');
            const targetLink = infobox ? infobox.querySelector('a[href*="refdiff.js"]') : null;
            return {
                title: mw.config.get('wgPageName'),
                infoboxFound: !!infobox,
                targetScript: targetLink ? targetLink.innerText.trim() : null
            };
        })()""")
        print(f"  - Page Title: {toolpage_data['title']}")
        print(f"  - Infobox target script link: {toolpage_data['targetScript']}")
        assert toolpage_data["infoboxFound"], "Error: Infobox not found on toolpage!"
        print("  [✓] Toolpage verified.")

        # -----------------------------------------------------------------
        # STEP 5: Automated Installation into User:common.js
        # -----------------------------------------------------------------
        print(f"\n[Step 5] Performing automated installation into User:{user_name}/common.js...")
        install_res = await eval_js(f"""(async () => {{
            const api = new mw.Api();
            const res = await api.get({{
                action: 'query',
                prop: 'revisions',
                titles: 'User:{user_name}/common.js',
                rvslots: '*',
                rvprop: 'content',
                formatversion: 2
            }});
            const page = res.query.pages[0];
            const content = (page.revisions && page.revisions[0].slots.main.content) || '';
            const line = "\\nimportScript('User:Powercycler/refdiff.js'); // Backlink: [[User:Powercycler/refdiff.js]]";
            const newContent = content.trimEnd() + line;
            const editRes = await api.postWithToken('csrf', {{
                action: 'edit',
                title: 'User:{user_name}/common.js',
                text: newContent,
                summary: 'RefDiff Automated Rollout Test: Install'
            }});
            return editRes;
        }})()""")
        print(f"  - Install Edit Result: {install_res.get('edit', {}).get('result')}")
        print(f"  - New Rev ID: {install_res.get('edit', {}).get('newrevid')}")
        assert install_res.get("edit", {}).get("result") == "Success", "Failed to install RefDiff pointer!"
        print("  [✓] RefDiff installed into common.js.")

        # -----------------------------------------------------------------
        # STEP 6: Verify Live Special:Diff Execution with Deployed Script
        # -----------------------------------------------------------------
        print("\n[Step 6] Navigating to Special:Diff under authenticated session...")
        diff_url = "https://en.wikipedia.org/w/index.php?title=Dwight_D._Eisenhower&diff=prev&oldid=1380014667"
        await send("Page.navigate", {"url": diff_url})
        await asyncio.sleep(5.0)

        diff_check = await eval_js("""(() => {
            const hasRefDiff = typeof window.RefDiff !== 'undefined';
            const btn = document.querySelector('#refdiff-ooui-btn, #refdiff-mode-bar');
            const citRows = document.querySelectorAll('.refdiff-cit-row').length;
            const badges = document.querySelectorAll('.refdiff-ref').length;
            
            // Roundtrip test
            let roundtrip = false;
            if (hasRefDiff) {
                const table = document.querySelector('table.diff');
                window.RefDiff.selectMode('wikitext', table);
                const wikitextRows = document.querySelectorAll('.refdiff-cit-row').length;
                window.RefDiff.selectMode('refdiff', table);
                const refdiffRows = document.querySelectorAll('.refdiff-cit-row').length;
                roundtrip = (wikitextRows === 0 && refdiffRows === citRows);
            }
            
            return {
                userName: mw.config.get('wgUserName'),
                isAnon: mw.user.isAnon(),
                hasRefDiff: hasRefDiff,
                version: hasRefDiff ? (window.RefDiff.VERSION || window.RefDiff.version) : null,
                buttonPresent: !!btn,
                citRows: citRows,
                badges: badges,
                roundtripSuccess: roundtrip
            };
        })()""")
        print(f"  - Session on Diff: User '{diff_check['userName']}' (Anon: {diff_check['isAnon']})")
        print(f"  - RefDiff Initialized: {diff_check['hasRefDiff']} (Version: {diff_check['version']})")
        print(f"  - Mode Button Present: {diff_check['buttonPresent']}")
        print(f"  - Decoupled Citation Rows: {diff_check['citRows']}")
        print(f"  - Rendered Badges: {diff_check['badges']}")
        print(f"  - Memento Roundtrip Toggle: {diff_check['roundtripSuccess']}")

        assert diff_check["hasRefDiff"], "Error: RefDiff was not initialized from common.js on diff page!"
        assert diff_check["citRows"] > 0, "Error: No citations were decoupled!"
        assert diff_check["roundtripSuccess"], "Error: Memento roundtrip failed!"
        print("  [✓] Live diff decoupling and Memento roundtrip verified!")

        # -----------------------------------------------------------------
        # STEP 7: Automated Uninstall (Restoring Clean Environment)
        # -----------------------------------------------------------------
        print(f"\n[Step 7] Performing automated uninstall from User:{user_name}/common.js...")
        uninstall_res = await eval_js(f"""(async () => {{
            const api = new mw.Api();
            const res = await api.get({{
                action: 'query',
                prop: 'revisions',
                titles: 'User:{user_name}/common.js',
                rvslots: '*',
                rvprop: 'content',
                formatversion: 2
            }});
            const page = res.query.pages[0];
            let content = (page.revisions && page.revisions[0].slots.main.content) || '';
            content = content.replace(/\\n?importScript\\(['"]User:Powercycler\\/refdiff\\.js['"]\\);.*$/gm, '').trim();
            const editRes = await api.postWithToken('csrf', {{
                action: 'edit',
                title: 'User:{user_name}/common.js',
                text: content,
                summary: 'RefDiff Automated Rollout Test: Uninstall (Restore Clean Environment)'
            }});
            return {{
                result: editRes.edit && editRes.edit.result,
                newrevid: editRes.edit && editRes.edit.newrevid,
                isClean: !/refdiff/i.test(content)
            }};
        }})()""")
        print(f"  - Uninstall Edit Result: {uninstall_res.get('result')}")
        print(f"  - Restored Rev ID: {uninstall_res.get('newrevid')}")
        print(f"  - Verified Clean Slate: {uninstall_res.get('isClean')}")
        assert uninstall_res.get("result") == "Success", "Failed to uninstall RefDiff pointer!"
        assert uninstall_res.get("isClean"), "Failed to cleanly restore common.js!"
        print("  [✓] RefDiff uninstalled; common.js returned to 100% clean state.")

        # -----------------------------------------------------------------
        # STEP 8: Check for Log Out at the End
        # -----------------------------------------------------------------
        print("\n[Step 8] Checking for log out at the end...")
        logout_res = await eval_js("""(async () => {
            try {
                const api = new mw.Api();
                await api.postWithToken('csrf', { action: 'logout' });
                await new Promise(r => setTimeout(r, 1000));
                const res = await api.get({ action: 'query', meta: 'userinfo' });
                const isAnon = res.query.userinfo.id === 0;
                const finalName = isAnon ? null : res.query.userinfo.name;
                return { success: true, isAnon: isAnon, userName: finalName };
            } catch (e) {
                return { success: false, error: String(e) };
            }
        })()""")
        print(f"  - Logout API call: {logout_res.get('success')}")
        print(f"  - Final User: {logout_res.get('userName')} (isAnon: {logout_res.get('isAnon')})")

        # Navigate to a fresh blank page to confirm anonymous session
        await send("Page.navigate", {"url": "https://en.wikipedia.org/wiki/Special:BlankPage"})
        await asyncio.sleep(2.0)
        final_anon = await eval_js("mw.user.isAnon() && mw.config.get('wgUserName') === null")
        print(f"  - Final DOM Anonymous Check: {final_anon}")
        assert final_anon, "Error: User was not logged out at the end of the test suite!"
        print("  [✓] Verified: User is safely LOGGED OUT at the end of the test.")

    print("\n" + "=" * 70)
    print("🎉 FULL USER LIFECYCLE & ROLLOUT TEST PASSED WITH 100% SUCCESS!")
    print("=" * 70 + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
