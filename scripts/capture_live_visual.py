#!/usr/bin/env python3
"""
scripts/capture_live_visual.py
Navigates to Meta Showcase diff, injects latest refdiff.js,
and captures high-resolution screenshots of Section 1 (modified) and Section 3 (added).
"""

import asyncio
import base64
import json
import os
import sys
import urllib.request
import websockets

CDP_HTTP = 'http://127.0.0.1:9222'
ARTIFACTS_DIR = '/home/mik/.gemini/antigravity/brain/42bcc6c0-adbf-448b-bfea-f1f1d1b28b96'
REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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
        self.ws = await websockets.connect(self.ws_url, max_size=25 * 1024 * 1024)
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
        return

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
    print(f"Saved: {output_path}")


async def main():
    with open(REFDIFF_JS, 'r', encoding='utf-8') as f:
        refdiff_code = f.read()

    tab = get_page_tab()
    async with CDPClient(tab['webSocketDebuggerUrl']) as cdp:
        await cdp.send("Page.enable")
        await cdp.send("Runtime.enable")

        showcase_url = "https://meta.wikimedia.org/w/index.php?title=User:Powercycler/RefDiff/Show_case&diff=31142550&oldid=31142549"
        await cdp.send("Page.navigate", {"url": showcase_url})
        await asyncio.sleep(3.5)

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

        # 1. Dark Mode
        await cdp.send("Runtime.evaluate", {
            "expression": """(() => {
                document.documentElement.classList.remove('skin-theme-clientpref-day');
                document.documentElement.classList.add('skin-theme-clientpref-night');
            })()"""
        })
        await asyncio.sleep(0.5)

        # Capture Section 1: Modified citation
        await capture_element(cdp, '[id*="cit-ref2"]', os.path.join(ARTIFACTS_DIR, "live_section1_modified_dark.png"), pad=15)
        # Capture Section 3: Added citation
        await capture_element(cdp, '[id*="cit-esa2022"]', os.path.join(ARTIFACTS_DIR, "live_section3_added_clean_dark.png"), pad=15, include_prev=True)

        # 2. Light Mode
        await cdp.send("Runtime.evaluate", {
            "expression": """(() => {
                document.documentElement.classList.remove('skin-theme-clientpref-night');
                document.documentElement.classList.add('skin-theme-clientpref-day');
            })()"""
        })
        await asyncio.sleep(0.5)

        # Capture Section 1: Modified citation
        await capture_element(cdp, '[id*="cit-ref2"]', os.path.join(ARTIFACTS_DIR, "live_section1_modified_light.png"), pad=15)
        # Capture Section 3: Added citation
        await capture_element(cdp, '[id*="cit-esa2022"]', os.path.join(ARTIFACTS_DIR, "live_section3_added_clean_light.png"), pad=15, include_prev=True)

    print("Capture complete!")


if __name__ == '__main__':
    asyncio.run(main())
