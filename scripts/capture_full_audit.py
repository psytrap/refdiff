#!/usr/bin/env python3
"""
scripts/capture_full_audit.py
Captures comprehensive visual inspection screenshots for all citation change cases
across Meta Showcase diff (31142550) and Bihar diff (1379207737) in both Light and Dark modes.
"""

import asyncio
import base64
import json
import os
import sys
import urllib.request
import websockets

CDP_HTTP = 'http://127.0.0.1:9222'
REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.environ.get('ARTIFACTS_DIR') or os.path.join(REPO_DIR, 'tests', 'screenshots')
os.makedirs(ARTIFACTS_DIR, exist_ok=True)
REFDIFF_JS = os.path.join(REPO_DIR, 'refdiff.js')


def get_page_tab():
    req = urllib.request.urlopen(f"{CDP_HTTP}/json")
    tabs = json.loads(req.read().decode())
    pages = [t for t in tabs if t.get('type') == 'page']
    if not pages:
        raise RuntimeError("No active page tab found in Chromium")
    return pages[0]


class CDPClient:
    def __init__(self, ws_url: str):
        self.ws_url = ws_url
        self.ws = None
        self._msg_id = 0

    async def __aenter__(self):
        self.ws = await websockets.connect(self.ws_url, max_size=30 * 1024 * 1024)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.ws:
            await self.ws.close()

    async def send(self, method: str, params: dict = None) -> dict:
        self._msg_id += 1
        msg = {"id": self._msg_id, "method": method, "params": params or {}}
        await self.ws.send(json.dumps(msg))
        while True:
            res = json.loads(await self.ws.recv())
            if res.get("id") == self._msg_id:
                return res.get("result", {})


async def capture_element(cdp: CDPClient, selector: str, output_path: str, pad: int = 15, include_prev: bool = False):
    eval_res = await cdp.send("Runtime.evaluate", {
        "expression": f"""(() => {{
            const el = document.querySelector('{selector}');
            if (!el) return null;
            let topY = el.getBoundingClientRect().y + window.scrollY;
            if ({str(include_prev).lower()} && el.previousElementSibling) {{
                const prev = el.previousElementSibling;
                topY = prev.getBoundingClientRect().y + window.scrollY;
            }}
            const r = el.getBoundingClientRect();
            const bottomY = r.bottom + window.scrollY;
            const leftX = r.x + window.scrollX;
            return {{
                x: leftX,
                y: topY,
                width: r.width,
                height: bottomY - topY
            }};
        }})()""",
        "returnByValue": True
    })
    box = eval_res.get('result', {}).get('value')
    if not box:
        print(f"Could not find element {selector}")
        return False

    x = max(0, box['x'] - pad)
    y = max(0, box['y'] - pad)
    w = box['width'] + (pad * 2)
    h = box['height'] + (pad * 2)

    res = await cdp.send("Page.captureScreenshot", {
        "format": "png",
        "clip": {"x": x, "y": y, "width": w, "height": h, "scale": 1}
    })
    with open(output_path, "wb") as f:
        f.write(base64.b64decode(res["data"]))
    print(f"Captured: {os.path.basename(output_path)}")
    return True


async def set_theme(cdp: CDPClient, theme: str):
    if theme == 'dark':
        expr = """(() => {
            document.documentElement.classList.remove('skin-theme-clientpref-day');
            document.documentElement.classList.add('skin-theme-clientpref-night');
        })()"""
    else:
        expr = """(() => {
            document.documentElement.classList.remove('skin-theme-clientpref-night');
            document.documentElement.classList.add('skin-theme-clientpref-day');
        })()"""
    await cdp.send("Runtime.evaluate", {"expression": expr})
    await asyncio.sleep(0.4)


async def main():
    with open(REFDIFF_JS, 'r', encoding='utf-8') as f:
        refdiff_code = f.read()

    tab = get_page_tab()
    async with CDPClient(tab['webSocketDebuggerUrl']) as cdp:
        await cdp.send("Page.enable")
        await cdp.send("Runtime.enable")

        # ==========================================================
        # PART 1: Meta Showcase Diff (31142550)
        # Covers:
        # - Sec 1: Modified citation (pages 50-55 -> 80-88)
        # - Sec 2: Modified named citation (schmidt2020)
        # - Sec 3: Pure added citation on added line (esa2022)
        # - Sec 4: Added citation within modified line (esa-press)
        # - Sec 5: Pure deleted citation within modified line (venera1982)
        # ==========================================================
        showcase_url = "https://meta.wikimedia.org/w/index.php?title=User:Powercycler/RefDiff/Show_case&diff=31142550&oldid=31142549"
        print(f"\n[1/2] Loading Meta Showcase Diff...")
        await cdp.send("Page.navigate", {"url": showcase_url})
        await asyncio.sleep(3.5)

        print("Injecting refdiff.js...")
        await cdp.send("Runtime.evaluate", {"expression": refdiff_code})
        await asyncio.sleep(1.0)
        await cdp.send("Runtime.evaluate", {
            "expression": """(() => {
                const btn = document.querySelector('#refdiff-mode-btn');
                if (btn && btn.click) btn.click();
                else if (window.RefDiff && window.RefDiff.applyDecoupling) {
                    window.RefDiff.applyDecoupling(document.querySelector('table.diff'));
                }
            })()"""
        })
        await asyncio.sleep(1.0)

        for theme in ['dark', 'light']:
            await set_theme(cdp, theme)
            # Case 1: Modified citation (Sec 1)
            await capture_element(cdp, '[id*="cit-ref2"]', os.path.join(ARTIFACTS_DIR, f"audit_sec1_modified_{theme}.png"), pad=15)
            # Case 2: Modified named citation (Sec 2)
            await capture_element(cdp, '[id*="cit-schmidt2020"]', os.path.join(ARTIFACTS_DIR, f"audit_sec2_modified_{theme}.png"), pad=15)
            # Case 3: Pure added citation (Sec 3 esa2022)
            await capture_element(cdp, '[id*="cit-esa2022"]', os.path.join(ARTIFACTS_DIR, f"audit_sec3_added_{theme}.png"), pad=15, include_prev=True)
            # Case 4: Added citation from modified line (Sec 4 esa-press)
            await capture_element(cdp, '[id*="cit-esa-press"]', os.path.join(ARTIFACTS_DIR, f"audit_sec4_added_{theme}.png"), pad=15, include_prev=True)
            # Case 5: Deleted citation from modified line (Sec 5 venera1982)
            await capture_element(cdp, '[id*="cit-venera1982"]', os.path.join(ARTIFACTS_DIR, f"audit_sec5_deleted_{theme}.png"), pad=15, include_prev=True)

        # ==========================================================
        # PART 2: Bihar Legislative Assembly Diff (1379207737)
        # Covers:
        # - Real Wikipedia article diff with multiple all-new added citations
        # ==========================================================
        bihar_url = "https://en.wikipedia.org/w/index.php?diff=1379207737"
        print(f"\n[2/2] Loading Bihar Diff (1379207737)...")
        await cdp.send("Page.navigate", {"url": bihar_url})
        await asyncio.sleep(4.0)

        print("Injecting refdiff.js...")
        await cdp.send("Runtime.evaluate", {"expression": refdiff_code})
        await asyncio.sleep(1.0)
        await cdp.send("Runtime.evaluate", {
            "expression": """(() => {
                const btn = document.querySelector('#refdiff-mode-btn');
                if (btn && btn.click) btn.click();
                else if (window.RefDiff && window.RefDiff.applyDecoupling) {
                    window.RefDiff.applyDecoupling(document.querySelector('table.diff'));
                }
            })()"""
        })
        await asyncio.sleep(1.2)

        # Inspect row ids in Bihar diff
        res_bihar = await cdp.send("Runtime.evaluate", {
            "expression": """(() => {
                const rows = Array.from(document.querySelectorAll('.refdiff-cit-row')).map(r => r.id);
                return rows;
            })()""",
            "returnByValue": True
        })
        bihar_rows = res_bihar.get('result', {}).get('value', [])
        print(f"Found {len(bihar_rows)} citation rows in Bihar diff: {bihar_rows}")

        first_bihar_row = bihar_rows[0] if bihar_rows else None
        second_bihar_row = bihar_rows[1] if len(bihar_rows) > 1 else None

        for theme in ['dark', 'light']:
            await set_theme(cdp, theme)
            if first_bihar_row:
                # Capture prose line + first added citation row
                await capture_element(cdp, f"#{first_bihar_row}", os.path.join(ARTIFACTS_DIR, f"audit_bihar_added1_{theme}.png"), pad=15, include_prev=True)
            if second_bihar_row:
                await capture_element(cdp, f"#{second_bihar_row}", os.path.join(ARTIFACTS_DIR, f"audit_bihar_added2_{theme}.png"), pad=15, include_prev=True)

    print("\nVisual audit capture complete!")


if __name__ == '__main__':
    asyncio.run(main())
