#!/usr/bin/env python3
"""
scripts/check_toolpage_installer.py

Read-Only Verification of ScriptInstaller Button on Toolpage:
1. Connects to Chromium CDP on port 9222.
2. Navigates to or inspects en:User:Powercycler/RefDiff.
3. Checks user login status (wgUserName).
4. Verifies presence and state of the ScriptInstaller button:
   - "Install" (when not yet active in common.js)
   - "Uninstall" (when already active in common.js)
5. Zero write operations: purely inspects DOM rendering.
"""

import asyncio
import json
import sys
import urllib.parse
import urllib.request
import websockets

CDP_HTTP = "http://127.0.0.1:9222"
TOOLPAGE_URL = "https://en.wikipedia.org/wiki/User:Powercycler/RefDiff"


async def get_browser_ws():
    try:
        req = urllib.request.urlopen(f"{CDP_HTTP}/json/version", timeout=3)
        info = json.loads(req.read().decode("utf-8"))
        return info["webSocketDebuggerUrl"]
    except Exception as e:
        print(f"[-] Chromium CDP not reachable on port 9222 ({e}).")
        print("    Please launch Chromium with: /snap/bin/chromium --remote-debugging-port=9222 --user-data-dir=/tmp/chromium-agent")
        return None


async def check_installer_button():
    ws_url = await get_browser_ws()
    if not ws_url:
        return 1

    print("=" * 70)
    print("RefDiff Toolpage ScriptInstaller Button Auditor (Read-Only)")
    print("=" * 70)

    # Find or open toolpage tab
    tabs_req = urllib.request.urlopen(f"{CDP_HTTP}/json/list", timeout=3)
    tabs = json.loads(tabs_req.read().decode("utf-8"))
    tool_tab = next((t for t in tabs if "User:Powercycler/RefDiff" in t.get("url", "") and "diff=" not in t.get("url", "")), None)

    if not tool_tab:
        print(f"[+] Opening toolpage: {TOOLPAGE_URL}")
        new_url = f"{CDP_HTTP}/json/new?{urllib.parse.quote(TOOLPAGE_URL, safe='')}"
        req = urllib.request.Request(new_url, method="PUT")
        with urllib.request.urlopen(req, timeout=5) as resp:
            tool_tab = json.loads(resp.read().decode("utf-8"))
    else:
        print(f"[+] Found existing toolpage tab: {tool_tab['id']}")

    tab_ws = tool_tab["webSocketDebuggerUrl"]

    async with websockets.connect(tab_ws, max_size=25 * 1024 * 1024) as ws:
        msg_id = 0

        async def eval_js(expr):
            nonlocal msg_id
            msg_id += 1
            cid = msg_id
            payload = {
                "id": cid,
                "method": "Runtime.evaluate",
                "params": {
                    "expression": expr,
                    "returnByValue": True,
                    "awaitPromise": True
                }
            }
            await ws.send(json.dumps(payload))
            while True:
                raw = await ws.recv()
                res = json.loads(raw)
                if res.get("id") == cid:
                    return res.get("result", {}).get("result", {}).get("value")

        # Wait for page ready
        print("[+] Waiting for page and gadgets to load...")
        for _ in range(15):
            ready = await eval_js("document.readyState === 'complete'")
            if ready:
                break
            await asyncio.sleep(0.5)

        # Allow ScriptInstaller extra time to execute and insert button
        await asyncio.sleep(1.5)

        data = await eval_js("""(() => {
            const user = (window.mw && mw.config && mw.config.get('wgUserName')) || null;
            const infobox = document.querySelector('table.infobox-user-script, table.infobox');
            const targetLink = infobox ? infobox.querySelector('a[href*="refdiff.js"]') : null;

            // ScriptInstaller button search:
            // Look for buttons, links, or spans created by User:Enterprisey/script-installer
            const buttons = Array.from(document.querySelectorAll('a, button, span')).filter(el => {
                const t = (el.innerText || '').trim().toLowerCase();
                const cls = el.className || '';
                return (t === 'install' || t === 'uninstall' || t.includes('install script') || t.includes('uninstall script') || cls.includes('script-installer'));
            });

            const buttonDetails = buttons.map(b => ({
                text: b.innerText.trim(),
                tag: b.tagName.toLowerCase(),
                href: b.getAttribute('href'),
                className: b.className
            }));

            // Check if ScriptInstaller gadget is loaded in mw
            const hasScriptInstaller = typeof window.scriptInstaller !== 'undefined' ||
                                       (window.mw && mw.loader && mw.loader.getState('ext.gadget.script-installer') === 'ready');

            return {
                user,
                infoboxFound: !!infobox,
                targetScript: targetLink ? targetLink.innerText.trim() : null,
                targetHref: targetLink ? targetLink.getAttribute('href') : null,
                hasScriptInstaller,
                buttonDetails
            };
        })()""")

        print(f"\n[1] User Session:         {data.get('user') or 'Anonymous / Logged out'}")
        print(f"[2] Infobox Found:        {data.get('infoboxFound')}")
        print(f"[3] Target Script Link:   {data.get('targetScript')} ({data.get('targetHref')})")
        print(f"[4] ScriptInstaller:      {'Active' if data.get('hasScriptInstaller') else 'Not loaded or not enabled'}")

        btn_list = data.get("buttonDetails", [])
        if btn_list:
            print(f"\n[5] ScriptInstaller Buttons Found ({len(btn_list)}):")
            for b in btn_list:
                print(f"    - Text: [{b['text']}], Tag: <{b['tag']}>, Class: '{b['className']}'")
            state = btn_list[0]['text'].upper()
            print(f"\n[✓] VERIFIED: Toolpage renders button in state: **{state}**")
            return 0
        else:
            print("\n[-] No ScriptInstaller button detected on page.")
            if not data.get("user"):
                print("    Hint: Log in with an account that has ScriptInstaller enabled in Special:Preferences.")
            elif not data.get("hasScriptInstaller"):
                print("    Hint: Enable ScriptInstaller in Special:Preferences -> Gadgets -> 'Install scripts without having to manually edit JavaScript files'.")
            return 1


def main():
    code = asyncio.run(check_installer_button())
    sys.exit(code)


if __name__ == "__main__":
    main()
