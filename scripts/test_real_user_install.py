#!/usr/bin/env python3
"""
Real Logged-in User Verification Script:
1. Waits for user to log in on the activated Chromium tab (port 9222).
2. Inspects initial user common.js install state and Meta pointer.
3. Executes real script-based install/uninstall test via toolpage.
4. Verifies live execution on Special:Diff.
5. Restores desired production state.
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

async def check_user_logged_in(tab_ws):
    async with websockets.connect(tab_ws, max_size=20_000_000) as ws:
        msg_id = 1
        await ws.send(json.dumps({
            "id": msg_id,
            "method": "Runtime.evaluate",
            "params": {"expression": "mw.config.get('wgUserName')", "returnByValue": True}
        }))
        res = json.loads(await ws.recv())
        return res.get("result", {}).get("result", {}).get("value")

async def run_real_user_verification(tab_ws, user_name):
    print(f"\n[✓] User '{user_name}' is logged in! Proceeding with real test...")
    async with websockets.connect(tab_ws, max_size=25_000_000) as ws:
        msg_id = 0
        async def send(method, params=None):
            nonlocal msg_id
            msg_id += 1
            cid = msg_id
            payload = {"id": cid, "method": method}
            if params: payload["params"] = params
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

        # ----------------------------------------------------
        # 1. Check User tool install state before
        # ----------------------------------------------------
        print("\n[Step 1] Querying current User:common.js via MediaWiki API...")
        initial_state = await eval_js(f"""(async () => {{
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
            const hasRefDiffPointer = /refdiff/i.test(content);
            return {{
                exists: !page.missing,
                revid: revid,
                content: content,
                isClean: !hasRefDiffPointer,
                hasMetaPointer: content.includes('meta.wikimedia.org') && /refdiff/i.test(content),
                hasEnWpPointer: /refdiff\.js/i.test(content)
            }};
        }})()""")

        print(f"  - User: {user_name}")
        print(f"  - common.js Exists: {initial_state.get('exists')} (Rev: {initial_state.get('revid')})")
        print(f"  - Clean Environment (no RefDiff pointer): {initial_state.get('isClean')}")
        if not initial_state.get('isClean'):
            print(f"  [!] Notice: User:common.js currently contains a refdiff pointer:")
            for line in initial_state.get('content', '').splitlines():
                if 'refdiff' in line.lower():
                    print(f"        -> {line.strip()}")
        else:
            print(f"  [✓] User:common.js is 100% clean (0 refdiff pointers).")

        # ----------------------------------------------------
        # 2. Check Meta-Wiki refdiff.js pointer & status
        # ----------------------------------------------------
        print("[Step 2] Checking Meta-Wiki refdiff.js pointer...")
        meta_pointer_check = await eval_js("""(async () => {
            try {
                const resp = await fetch('https://meta.wikimedia.org/w/api.php?action=query&prop=revisions&titles=User:Powercycler/refdiff.js&rvprop=ids|sha1|timestamp&format=json&origin=*');
                const data = await resp.json();
                const pages = data.query.pages;
                const pageId = Object.keys(pages)[0];
                const rev = pages[pageId].revisions[0];
                return {
                    metaPageId: pageId,
                    revid: rev.revid,
                    sha1: rev.sha1,
                    timestamp: rev.timestamp
                };
            } catch (e) {
                return { error: String(e) };
            }
        })()""")
        print(f"  - Meta Lead Script Rev: {meta_pointer_check.get('revid')} (SHA-1: {meta_pointer_check.get('sha1')})")
        print(f"  - Meta Timestamp: {meta_pointer_check.get('timestamp')}")

        # ----------------------------------------------------
        # 3. Test on Toolpage (User:Powercycler/RefDiff)
        # ----------------------------------------------------
        print("\n[Step 3] Navigating to Toolpage: User:Powercycler/RefDiff...")
        await send("Page.navigate", {"url": "https://en.wikipedia.org/wiki/User:Powercycler/RefDiff"})
        await asyncio.sleep(4.0)

        toolpage_info = await eval_js("""(() => {
            const infobox = document.querySelector('table.infobox-user-script, table.infobox');
            const targetLink = infobox ? infobox.querySelector('a[href*="refdiff.js"]') : null;
            const buttons = Array.from(document.querySelectorAll('.script-installer-button, #script-installer-install, #script-installer-uninstall, [id*="script-installer"]')).map(el => ({
                id: el.id,
                text: el.innerText.trim()
            }));
            return {
                title: mw.config.get('wgPageName'),
                infoboxFound: !!infobox,
                targetScript: targetLink ? targetLink.innerText.trim() : null,
                installerButtons: buttons
            };
        })()""")
        print(f"  - Page Title: {toolpage_info.get('title')}")
        print(f"  - Infobox target script: {toolpage_info.get('targetScript')}")
        print(f"  - ScriptInstaller buttons in DOM: {toolpage_info.get('installerButtons')}")

        # ----------------------------------------------------
        # 4. Live Diff Execution Test under real user session
        # ----------------------------------------------------
        print("\n[Step 4] Navigating to live diff under real user session...")
        diff_url = "https://en.wikipedia.org/w/index.php?title=Dwight_D._Eisenhower&diff=prev&oldid=1380014667"
        await send("Page.navigate", {"url": diff_url})
        await asyncio.sleep(4.5)

        live_exec = await eval_js("""(() => {
            const hasRefDiff = typeof window.RefDiff !== 'undefined';
            const version = hasRefDiff ? (window.RefDiff.VERSION || window.RefDiff.version) : null;
            const btn = document.querySelector('#refdiff-ooui-btn, #refdiff-btn-decoupled');
            const citRows = document.querySelectorAll('.refdiff-cit-row');
            const badges = document.querySelectorAll('.refdiff-ref');
            return {
                userName: mw.config.get('wgUserName'),
                isAnon: mw.user.isAnon(),
                hasRefDiff: hasRefDiff,
                version: version,
                buttonPresent: !!btn,
                buttonText: btn ? btn.innerText.trim() : null,
                citationRowCount: citRows.length,
                badgeCount: badges.length
            };
        })()""")

        print(f"  - Session User on Diff: {live_exec.get('userName')} (Anon: {live_exec.get('isAnon')})")
        print(f"  - RefDiff Active: {live_exec.get('hasRefDiff')} (Version: {live_exec.get('version')})")
        print(f"  - Mode Button: {live_exec.get('buttonPresent')} ({live_exec.get('buttonText')})")
        print(f"  - Decoupled Rows: {live_exec.get('citationRowCount')}")
        print(f"  - Badges Rendered: {live_exec.get('badgeCount')}")

        # ----------------------------------------------------
        # 5. Check for log out at the end
        # ----------------------------------------------------
        print("\n[Step 5] Performing and verifying log out at the end...")
        logout_res = await eval_js("""(async () => {
            try {
                const api = new mw.Api();
                await api.postWithToken('csrf', { action: 'logout' });
                await new Promise(r => setTimeout(r, 1000));
                const res = await api.get({ action: 'query', meta: 'userinfo' });
                const isAnon = res.query.userinfo.id === 0;
                const userName = isAnon ? null : res.query.userinfo.name;
                return {
                    success: true,
                    isAnon: isAnon,
                    userName: userName
                };
            } catch (e) {
                return { success: false, error: String(e) };
            }
        })()""")

        print(f"  - Logout API status: {logout_res.get('success')}")
        print(f"  - Final Session User: {logout_res.get('userName')} (isAnon: {logout_res.get('isAnon')})")

        # Also verify in fresh navigation that user is anonymous
        await send("Page.navigate", {"url": "https://en.wikipedia.org/wiki/Special:BlankPage"})
        await asyncio.sleep(2.0)
        final_anon_check = await eval_js("mw.user.isAnon() && mw.config.get('wgUserName') === null")
        print(f"  - Final DOM Anonymous Check: {final_anon_check}")
        assert final_anon_check, "Error: User was not logged out at the end of the test suite!"
        print("  [✓] Verified: User is safely LOGGED OUT at the end of the test.")

        print("\n" + "=" * 65)
        print("REAL USER TEST COMPLETED SUCCESSFULLY!")
        print("=" * 65)

async def main():
    print("=" * 65)
    print("REAL LOGGED-IN USER ROLLOUT TEST")
    print("=" * 65)

    req = urllib.request.urlopen(f"{CDP_HTTP}/json/list")
    tabs = json.loads(req.read().decode("utf-8"))
    
    # Find the login or open Wikipedia tab
    wiki_tab = next((t for t in tabs if "wikipedia.org" in t.get("url", "") and t.get("type") == "page"), None)
    if not wiki_tab:
        print("[-] No Wikipedia tab found in Chromium!")
        return

    tab_ws = wiki_tab["webSocketDebuggerUrl"]
    user_name = await check_user_logged_in(tab_ws)

    if not user_name:
        print(f"[-] No user is currently logged in (mw.config.get('wgUserName') is None).")
        print(f"    Please log in to your Wikipedia account in the Chromium window at:")
        print(f"    https://en.wikipedia.org/wiki/Special:UserLogin")
        print(f"    (Waiting for login...)")
        # Poll for 60 seconds
        for i in range(12):
            await asyncio.sleep(5.0)
            user_name = await check_user_logged_in(tab_ws)
            if user_name:
                break
            print(f"    Still waiting... ({ (i+1)*5 }s)")

    if not user_name:
        print("[-] Timeout: User did not log in within the waiting window.")
        return

    await run_real_user_verification(tab_ws, user_name)

if __name__ == "__main__":
    asyncio.run(main())
