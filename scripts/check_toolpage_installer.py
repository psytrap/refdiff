#!/usr/bin/env python3
"""
scripts/check_toolpage_installer.py

Toolpage ScriptInstaller Button Verifier & Interactive Tester:
1. Connects to Chromium CDP on port 9222.
2. Navigates to or inspects en:User:Powercycler/RefDiff.
3. Checks user login status (wgUserName).
4. Detects presence and state of the ScriptInstaller button:
   - "Install" (when not yet active in common.js)
   - "Uninstall" (when already active in common.js)
5. Supports interactive button clicking (--press or --toggle-roundtrip) to verify
   that ScriptInstaller properly updates common.js via real UI interaction.

GOVERNANCE & PERMISSION NOTE:
Per repository deployment governance (ROLLOUT_PLAN.md & AUDIT_STRATEGY.md),
automated pushing to remotes and automated deployment edits are strictly
forbidden. This script is the SOLE AND ONLY EXCEPTION authorized to perform
read-write UI actions by pressing the ScriptInstaller Install/Uninstall button
on the toolpage to verify button responsiveness and common.js state transitions.
"""

import argparse
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


async def run_toolpage_check(args):
    ws_url = await get_browser_ws()
    if not ws_url:
        return 1

    print("=" * 70)
    print("RefDiff Toolpage ScriptInstaller Button Inspector")
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
        await asyncio.sleep(2.0)

        # Inspect DOM state
        data = await eval_js("""(() => {
            const user = (window.mw && mw.config && mw.config.get('wgUserName')) || null;
            const infobox = document.querySelector('table.infobox-user-script, table.infobox');
            const targetLink = infobox ? infobox.querySelector('a[href*="refdiff.js"]') : null;

            // ScriptInstaller button search:
            // Look for buttons, links, or spans created by User:Enterprisey/script-installer
            const buttons = Array.from(document.querySelectorAll('td.script-installer-ibx button, #script-installer-main-install, .script-installer-button, button.mw-ui-button')).filter(el => {
                const t = (el.innerText || '').trim().toLowerCase();
                return (t === 'install' || t === 'uninstall' || t.includes('install script') || t.includes('uninstall script'));
            });

            const buttonDetails = buttons.map(b => ({
                text: b.innerText.trim(),
                tag: b.tagName.toLowerCase(),
                id: b.id,
                className: b.className
            }));

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
        if not btn_list:
            print("\n[-] No ScriptInstaller button detected on page.")
            if not data.get("user"):
                print("    Hint: Log in with an account that has ScriptInstaller enabled in Special:Preferences.")
            elif not data.get("hasScriptInstaller"):
                print("    Hint: Enable ScriptInstaller in Special:Preferences -> Gadgets -> 'Install scripts without having to manually edit JavaScript files'.")
            return 1

        print(f"\n[5] ScriptInstaller Buttons Found ({len(btn_list)}):")
        for b in btn_list:
            print(f"    - Text: [{b['text']}], Tag: <{b['tag']}>, Class: '{b['className']}'")

        current_state = btn_list[0]['text'].strip()
        print(f"\n[✓] VERIFIED: Toolpage renders button in state: **{current_state}**")

        # Interactive button clicking action (if requested)
        if args.press or args.toggle_roundtrip:
            if not data.get("user"):
                print("[-] Cannot perform write action: No user is logged in.")
                return 1

            print("\n" + "=" * 50)
            print("PERFORMING SCRIPT-INSTALLER BUTTON PRESS ACTION")
            print("=" * 50)

            async def click_button_and_wait(expected_from):
                await eval_js("window.confirm = () => true;")
                print(f"[+] Clicking button: '{expected_from}'...")
                await eval_js("""(() => {
                    const btn = document.querySelector('td.script-installer-ibx button, #script-installer-main-install, .script-installer-button');
                    if (btn) btn.click();
                })()""")

                # Wait for state change
                for _ in range(20):
                    await asyncio.sleep(0.5)
                    txt = await eval_js("""(() => {
                        const btn = document.querySelector('td.script-installer-ibx button, #script-installer-main-install, .script-installer-button');
                        return btn ? btn.innerText.trim() : null;
                    })()""")
                    if txt and txt != expected_from and "..." not in txt and "ing" not in txt.lower():
                        return txt
                return None

            # First click
            new_state = await click_button_and_wait(current_state)
            if not new_state:
                print("[-] Failed: Button text did not transition after click.")
                return 1

            print(f"[✓] Transition 1 Successful: [{current_state}] -> [{new_state}]")

            # Check common.js via API
            common_check = await eval_js("""(async () => {
                try {
                    const api = new mw.Api();
                    const res = await api.get({
                        action: 'query',
                        prop: 'revisions',
                        titles: 'User:' + mw.config.get('wgUserName') + '/common.js',
                        rvslots: '*',
                        rvprop: 'content',
                        formatversion: 2
                    });
                    const content = res.query.pages[0].revisions[0].slots.main.content;
                    return { hasRefdiff: content.includes('refdiff.js') };
                } catch(e) {
                    return { error: String(e) };
                }
            })()""")
            print(f"    common.js refdiff pointer present: {common_check.get('hasRefdiff')}")

            if args.toggle_roundtrip:
                print("\n[+] Performing roundtrip: clicking button again to restore original state...")
                restored_state = await click_button_and_wait(new_state)
                if not restored_state:
                    print("[-] Failed: Button text did not restore after second click.")
                    return 1

                print(f"[✓] Transition 2 Successful: [{new_state}] -> [{restored_state}]")
                assert restored_state.lower() == current_state.lower(), f"Expected return to {current_state}, got {restored_state}"
                print(f"[✓] ROUNDTRIP VERIFIED: ScriptInstaller button cleanly toggled and restored!")

        return 0


def main():
    parser = argparse.ArgumentParser(description="Toolpage ScriptInstaller Button Inspector & Tester")
    parser.add_argument("--press", action="store_true", help="Press the button once and verify state transition")
    parser.add_argument("--toggle-roundtrip", action="store_true", help="Press button, verify transition, then press again to restore original state")
    args = parser.parse_args()

    code = asyncio.run(run_toolpage_check(args))
    sys.exit(code)


if __name__ == "__main__":
    main()
