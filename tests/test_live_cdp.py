#!/usr/bin/env python3
import asyncio
import json
import urllib.request
import websockets
import base64
import os

async def run_live_test():
    try:
        with urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=2) as resp:
            tabs = json.loads(resp.read().decode("utf-8"))
        page = next((t for t in tabs if t.get("type") == "page" and "wikipedia.org" in t.get("url", "")), None)
        if not page:
            print("No active Wikipedia page found on CDP port 9222. Skipping live test.")
            return
    except Exception as e:
        print(f"Chromium CDP not reachable on port 9222 ({e}). Skipping live test.")
        return

    ws_url = page["webSocketDebuggerUrl"]
    print(f"Connecting to CDP: {ws_url}")

    with open("refdiff.js", "r", encoding="utf-8") as f:
        refdiff_js = f.read()

    async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
        msg_id = 1

        async def cdp(method, params=None):
            nonlocal msg_id
            msg_id += 1
            cur_id = msg_id
            payload = {"id": cur_id, "method": method}
            if params:
                payload["params"] = params
            await ws.send(json.dumps(payload))
            while True:
                raw = await ws.recv()
                res = json.loads(raw)
                if res.get("id") == cur_id:
                    return res

        # 1. Reload page to ensure clean native state
        print("Reloading Wikipedia page...")
        await cdp("Page.reload")
        await asyncio.sleep(2.5)

        # 2. Inject updated refdiff.js
        print("Injecting updated refdiff.js...")
        res = await cdp("Runtime.evaluate", {"expression": refdiff_js})
        if "exceptionDetails" in res.get("result", {}):
            raise RuntimeError(f"JS execution error: {res['result']['exceptionDetails']}")

        # 3. Verify DOM elements
        res = await cdp("Runtime.evaluate", {
            "expression": """
                ({
                    hasModeBar: !!document.getElementById('refdiff-mode-bar'),
                    citRowCount: document.querySelectorAll('.refdiff-cit-row').length,
                    badgeModCount: document.querySelectorAll('.ref-badge-mod').length,
                    badgeCount: document.querySelectorAll('.ref-badge').length,
                    statsNote: (document.getElementById('refdiff-stats-note') || {}).textContent || ''
                })
            """,
            "returnByValue": True
        })
        info = res["result"]["result"]["value"]
        print(f"Decoupled state: {info}")
        assert info["hasModeBar"], "Mode bar was not found"
        assert info["citRowCount"] > 0, "No citation rows were created"
        assert info["badgeModCount"] > 0, "No modified badges found"

        # 4. Capture screenshot of Light Mode
        print("Capturing Light Mode screenshot...")
        sc_res = await cdp("Page.captureScreenshot", {"format": "png"})
        img_bytes = base64.b64decode(sc_res["result"]["data"])
        light_path = "/home/mik/.gemini/antigravity/brain/42bcc6c0-adbf-448b-bfea-f1f1d1b28b96/wikipedia_polished_light.png"
        with open(light_path, "wb") as f:
            f.write(img_bytes)

        # 5. Switch to Dark Mode (skin-theme-clientpref-night)
        print("Testing Dark Mode...")
        await cdp("Runtime.evaluate", {
            "expression": "document.documentElement.className = document.documentElement.className.replace('skin-theme-clientpref-day', '') + ' skin-theme-clientpref-night';"
        })
        await asyncio.sleep(0.5)

        sc_dark_res = await cdp("Page.captureScreenshot", {"format": "png"})
        dark_bytes = base64.b64decode(sc_dark_res["result"]["data"])
        dark_path = "/home/mik/.gemini/antigravity/brain/42bcc6c0-adbf-448b-bfea-f1f1d1b28b96/wikipedia_polished_dark.png"
        with open(dark_path, "wb") as f:
            f.write(dark_bytes)

        # Revert theme
        await cdp("Runtime.evaluate", {
            "expression": "document.documentElement.className = document.documentElement.className.replace('skin-theme-clientpref-night', '') + ' skin-theme-clientpref-day';"
        })

        # 6. Test toggle to Standard Wikidiff
        print("Testing toggle to Standard Wikidiff...")
        await cdp("Runtime.evaluate", {"expression": "document.getElementById('refdiff-btn-standard').click()"})
        await asyncio.sleep(0.5)

        res_std = await cdp("Runtime.evaluate", {
            "expression": """
                ({
                    citRowCount: document.querySelectorAll('.refdiff-cit-row').length,
                    badgeModCount: document.querySelectorAll('.ref-badge-mod').length,
                    statsNote: (document.getElementById('refdiff-stats-note') || {}).textContent || ''
                })
            """,
            "returnByValue": True
        })
        std_info = res_std["result"]["result"]["value"]
        print(f"Standard view state: {std_info}")
        assert std_info["citRowCount"] == 0, "Citation rows should be removed in standard view"
        assert std_info["badgeModCount"] == 0, "Badges should be removed in standard view"
        assert std_info["statsNote"] == "", "Stats note should be empty in standard view"

        # 7. Test toggle back to Decoupled
        print("Testing toggle back to Decoupled...")
        await cdp("Runtime.evaluate", {"expression": "document.getElementById('refdiff-btn-decoupled').click()"})
        await asyncio.sleep(0.5)

        res_dec = await cdp("Runtime.evaluate", {
            "expression": """
                ({
                    citRowCount: document.querySelectorAll('.refdiff-cit-row').length,
                    badgeModCount: document.querySelectorAll('.ref-badge-mod').length,
                    statsNote: (document.getElementById('refdiff-stats-note') || {}).textContent || ''
                })
            """,
            "returnByValue": True
        })
        dec_info = res_dec["result"]["result"]["value"]
        print(f"Re-decoupled view state: {dec_info}")
        assert dec_info["citRowCount"] > 0, "Citation rows should be restored"
        assert dec_info["badgeModCount"] > 0, "Badges should be restored"

        print("All live CDP verification checks passed successfully!")

if __name__ == "__main__":
    asyncio.run(run_live_test())
