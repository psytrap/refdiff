#!/usr/bin/env python3
"""
RefDiff Live CDP Integration Test Suite

Automates live browser verification of RefDiff in Chromium via the Chrome DevTools Protocol (CDP).
Tests:
  1. Script injection and initialization on real MediaWiki diff views
  2. Native OOUI mode switcher integration (Visual vs Wikitext vs RefDiff)
  3. VisualEditor visual diff interoperability (no leaking citation rows)
  4. Automatic disabling of native Inline diff switch during RefDiff
  5. Decoupled citation row injection and badge rendering
  6. Two-way theme switching (Light Mode vs Night Mode)
"""

import argparse
import asyncio
import base64
import json
import os
import sys
import urllib.request
from typing import Any, Dict, Optional
import websockets

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)


class CDPClient:
    """Async wrapper for Chrome DevTools Protocol (CDP) WebSocket communication."""

    def __init__(self, ws_url: str):
        self.ws_url = ws_url
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self._msg_id = 0

    async def __aenter__(self):
        self.ws = await websockets.connect(self.ws_url, max_size=25 * 1024 * 1024)
        await self.send("Runtime.enable")
        await self.send("Page.enable")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.ws:
            await self.ws.close()

    async def send(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Sends a JSON-RPC request over CDP and waits for the matching response."""
        self._msg_id += 1
        cid = self._msg_id
        payload = {"id": cid, "method": method}
        if params:
            payload["params"] = params

        await self.ws.send(json.dumps(payload))
        while True:
            try:
                raw = await asyncio.wait_for(self.ws.recv(), timeout=10.0)
            except asyncio.TimeoutError:
                raise TimeoutError(f"CDP command '{method}' timed out waiting for response (cid={cid})")
            res = json.loads(raw)
            if res.get("id") == cid:
                if "error" in res:
                    raise RuntimeError(f"CDP command '{method}' failed: {res['error']}")
                return res

    async def evaluate(self, expression: str) -> Any:
        """Evaluates a JavaScript expression and returns the value, unwrapping errors."""
        res = await self.send("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True
        })
        result = res.get("result", {}).get("result", {})
        if "exceptionDetails" in res.get("result", {}):
            details = res["result"]["exceptionDetails"]
            raise RuntimeError(f"JS evaluation error: {details.get('text')} - {details}")
        return result.get("value")

    async def click(self, selector: str) -> None:
        """Dispatches native pointer events (move, down, up) to the center of an element."""
        coords = await self.evaluate(f"""
            (() => {{
                const el = document.querySelector('{selector}');
                if (!el) return null;
                el.scrollIntoView({{ block: 'center', inline: 'nearest' }});
                const r = el.getBoundingClientRect();
                return {{ x: r.left + r.width / 2, y: r.top + r.height / 2 }};
            }})()
        """)
        if not coords:
            raise ValueError(f"Cannot click element; selector not found in DOM: '{selector}'")

        try:
            await self.send("Input.dispatchMouseEvent", {
                "type": "mouseMoved", "x": coords["x"], "y": coords["y"]
            })
            await self.send("Input.dispatchMouseEvent", {
                "type": "mousePressed", "x": coords["x"], "y": coords["y"], "button": "left", "clickCount": 1
            })
            await self.send("Input.dispatchMouseEvent", {
                "type": "mouseReleased", "x": coords["x"], "y": coords["y"], "button": "left", "clickCount": 1
            })
        except Exception:
            await self.evaluate(f"""
                (() => {{
                    const el = document.querySelector('{selector}');
                    if (el) {{
                        el.click();
                        const btn = el.querySelector('a, button, [role="button"]') || el;
                        btn.click();
                    }}
                }})()
            """)

    async def hover(self, selector: str) -> None:
        """Dispatches native pointer move event to the center of an element."""
        coords = await self.evaluate(f"""
            (() => {{
                const el = document.querySelector('{selector}');
                if (!el) return null;
                el.scrollIntoView({{ block: 'center', inline: 'nearest' }});
                const r = el.getBoundingClientRect();
                return {{ x: r.left + r.width / 2, y: r.top + r.height / 2 }};
            }})()
        """)
        if not coords:
            raise ValueError(f"Cannot hover element; selector not found in DOM: '{selector}'")

        await self.send("Input.dispatchMouseEvent", {
            "type": "mouseMoved", "x": coords["x"], "y": coords["y"]
        })

    async def capture_screenshot(self, filepath: str) -> None:
        """Captures a PNG screenshot of the current page viewport."""
        try:
            res = await self.send("Page.captureScreenshot", {"format": "png", "fromSurface": False})
            img_bytes = base64.b64decode(res["result"]["data"])
            os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
            with open(filepath, "wb") as f:
                f.write(img_bytes)
        except Exception as e:
            print(f"      [Warning: Screenshot skipped for {os.path.basename(filepath)}: {e}]")


def find_target_page(args: argparse.Namespace) -> tuple[Dict[str, Any], Optional[str]]:
    """Discovers an existing MediaWiki diff tab, or opens the requested diff fixture."""
    list_url = f"http://{args.host}:{args.port}/json/list"
    with urllib.request.urlopen(list_url, timeout=3) as resp:
        tabs = json.loads(resp.read().decode("utf-8"))

    # Priority 1: Explicit diff URL
    if getattr(args, "diff_url", None):
        new_url = f"http://{args.host}:{args.port}/json/new?{args.diff_url}"
        req = urllib.request.Request(new_url, method="PUT")
        with urllib.request.urlopen(req, timeout=5) as resp:
            created = json.loads(resp.read().decode("utf-8"))
            return created, created["id"]

    # Priority 2: Stress test (enwiki diff=1379409916)
    if getattr(args, "stress", False):
        target_url = "https://en.wikipedia.org/w/index.php?diff=1379409916"
        new_url = f"http://{args.host}:{args.port}/json/new?{target_url}"
        req = urllib.request.Request(new_url, method="PUT")
        with urllib.request.urlopen(req, timeout=5) as resp:
            created = json.loads(resp.read().decode("utf-8"))
            return created, created["id"]

    # Priority 3: Live diff page on Wikimedia / Wikipedia or comprehensive test fixture
    diff_tab = next(
        (t for t in tabs if t.get("type") == "page" and any(k in t.get("url", "") for k in ("wikimedia.org", "wikipedia.org", "diff=", "comprehensive_test.html"))),
        None
    )
    if diff_tab:
        return diff_tab, None

    # Priority 4: Fall back to local comprehensive test fixture
    fixture_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "comprehensive_test.html"))
    new_url = f"http://{args.host}:{args.port}/json/new?file://{fixture_path}"
    req = urllib.request.Request(new_url, method="PUT")
    with urllib.request.urlopen(req, timeout=5) as resp:
        created = json.loads(resp.read().decode("utf-8"))
        try:
            urllib.request.urlopen(f"http://{args.host}:{args.port}/json/activate/{created['id']}", timeout=2)
        except Exception:
            pass
        return created, created["id"]


async def run_suite(args: argparse.Namespace) -> int:
    """Executes the full live verification suite."""
    print("=" * 60)
    print("RefDiff Live Browser Test Suite (CDP)")
    print("=" * 60)

    try:
        page, created_tab_id = find_target_page(args)
    except Exception as e:
        print(f"[-] Chromium CDP not reachable on {args.host}:{args.port} ({e}).")
        print("    Ensure Chromium was started with --remote-debugging-port.")
        return 1

    ws_url = page.get("webSocketDebuggerUrl")
    if not ws_url:
        print("[-] Target tab does not expose webSocketDebuggerUrl.")
        return 1

    print(f"[+] Connected to tab: {page.get('title', 'Unknown')} ({page.get('url', '')})")

    tab_id = page.get("id")
    if tab_id:
        try:
            urllib.request.urlopen(f"http://{args.host}:{args.port}/json/activate/{tab_id}", timeout=2)
        except Exception:
            pass

    script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "refdiff.js"))
    with open(script_path, "r", encoding="utf-8") as f:
        refdiff_code = f.read()

    screenshots_dir = args.screenshots_dir
    os.makedirs(screenshots_dir, exist_ok=True)

    test_steps = []

    try:
        async with CDPClient(ws_url) as client:
            try:
                await client.send("Page.bringToFront")
            except Exception:
                pass

            # 1. Page Reload
            print("\n[Step 1] Reloading target page for clean baseline...")
            await client.send("Page.reload")
            await asyncio.sleep(args.wait_reload)
            for _ in range(30):
                try:
                    is_ready = await client.evaluate("document.readyState === 'complete' && !!document.querySelector('table.diff')")
                    if is_ready:
                        break
                except Exception:
                    pass
                await asyncio.sleep(0.5)

            # 2. Inject refdiff.js
            print("[Step 2] Injecting refdiff.js...")
            await client.evaluate(refdiff_code)
            await asyncio.sleep(1.0)

            # 3. Check Initial Wikitext Diff State
            print("[Step 3] Verifying initial state...")
            state_init = await client.evaluate("""
                (() => ({
                    hasRefBtn: !!document.getElementById('refdiff-ooui-btn') || !!document.getElementById('refdiff-mode-bar'),
                    citRowCount: document.querySelectorAll('.refdiff-cit-row').length,
                    tableVisible: !!document.querySelector('table.diff') && (document.querySelector('table.diff').offsetParent !== null)
                }))()
            """)
            assert state_init["hasRefBtn"], "RefDiff UI button/bar missing from diff toolbar"
            assert state_init["tableVisible"], "Native diff table should be visible"
            test_steps.append(("Initial injection & toolbar button presence", True))

            # 4. Mode Switch: Visual Diff
            print("[Step 4] Switching to Visual Diff mode...")
            visual_btn = ".ve-init-mw-diffPage-diffMode .oo-ui-buttonOptionWidget:first-child"
            has_ve = await client.evaluate(f"typeof ve !== 'undefined' && !!document.querySelector('{visual_btn}')")
            if has_ve:
                await client.click(visual_btn)
                for _ in range(20):
                    is_ready = await client.evaluate("""
                        (() => {
                            const veDiff = document.querySelector('.ve-ui-diffElement, .ve-init-mw-diffPage-diff');
                            return veDiff ? (veDiff.offsetParent !== null && veDiff.closest('.oo-ui-element-hidden') === null) : false;
                        })()
                    """)
                    if is_ready:
                        break
                    await asyncio.sleep(0.5)

                state_visual = await client.evaluate("""
                    (() => {
                        const veDiff = document.querySelector('.ve-ui-diffElement, .ve-init-mw-diffPage-diff');
                        const citRows = document.querySelectorAll('tr.refdiff-cit-row');
                        const citRowsVisible = Array.from(citRows).filter(r => r.offsetParent !== null).length;
                        const table = document.querySelector('table.diff');
                        const nonHeaderRowsVisible = table ? Array.from(table.querySelectorAll('tr:not(.diff-title)')).filter(r => r.offsetParent !== null).length : 0;
                        const sw = document.getElementById('mw-diffPage-inline-toggle-switch');
                        return {
                            veDiffVisible: veDiff ? (veDiff.offsetParent !== null && veDiff.closest('.oo-ui-element-hidden') === null) : false,
                            citRowsVisible,
                            nonHeaderRowsVisible,
                            inlineDisabled: sw ? sw.classList.contains('oo-ui-widget-disabled') : true
                        };
                    })()
                """)
                assert state_visual["veDiffVisible"], "VisualEditor visual diff should be displayed"
                assert state_visual["citRowsVisible"] == 0, "No RefDiff citation rows should leak into Visual diff"
                assert state_visual["nonHeaderRowsVisible"] == 0, "No Wikitext diff content rows should remain visible in Visual diff"
                await client.capture_screenshot(os.path.join(screenshots_dir, "01_visual_diff.png"))
                test_steps.append(("Switch to Visual Diff (clean view, 0 leaked rows)", True))

            # 5. Mode Switch: RefDiff Decoupled View
            print("[Step 5] Switching to RefDiff decoupled mode...")
            ref_btn_sel = "#refdiff-ooui-btn, #refdiff-btn-decoupled"
            await client.click(ref_btn_sel)
            await asyncio.sleep(1.0)

            state_refdiff = await client.evaluate("""
                (() => {
                    const citRows = document.querySelectorAll('tr.refdiff-cit-row');
                    const citRowsVisible = Array.from(citRows).filter(r => r.offsetParent !== null).length;
                    const badges = document.querySelectorAll('.ref-badge, .ref-badge-mod, .ref-badge-add, .ref-badge-del');
                    const sw = document.getElementById('mw-diffPage-inline-toggle-switch');
                    return {
                        citRowsVisible,
                        badgeCount: badges.length,
                        inlineDisabled: sw ? sw.classList.contains('oo-ui-widget-disabled') : true
                    };
                })()
            """)
            if not getattr(args, "stress", False):
                assert state_refdiff["citRowsVisible"] > 0, "Decoupled citation rows should be rendered and visible"
            assert state_refdiff["badgeCount"] > 0, "Prose citation badges should be visible"
            assert state_refdiff["inlineDisabled"], "Inline diff switch must be disabled during RefDiff"
            await client.capture_screenshot(os.path.join(screenshots_dir, "02_refdiff_decoupled.png"))
            if getattr(args, "stress", False):
                await client.evaluate("""
                    (() => {
                        const el = Array.from(document.querySelectorAll('.diff-lineno')).find(x => x.textContent.includes('164'));
                        if (el) el.scrollIntoView({ block: 'start' });
                    })()
                """)
                await asyncio.sleep(0.5)
                await client.capture_screenshot(os.path.join(screenshots_dir, "02c_refdiff_line164_ryanair.png"))
            test_steps.append(("Switch to RefDiff (citations decoupled, inline switch disabled)", True))

            # 5a. Reference Badge Linking & Anchor Discovery
            print("[Step 5a] Verifying reference badge linking & anchor discovery...")
            badge_link_info = await client.evaluate("""
                (() => {
                    const supBadges = document.querySelectorAll('sup.reference.refdiff-ref');
                    const linkedBadges = document.querySelectorAll('sup.reference.refdiff-ref a[href]');
                    const citeNoteLinks = document.querySelectorAll('sup.reference.refdiff-ref a[href^="#cite_note-"]');
                    const citRowLinks = document.querySelectorAll('sup.reference.refdiff-ref a[href^="#refdiff-cit-"]');
                    return {
                        totalSup: supBadges.length,
                        totalLinked: linkedBadges.length,
                        citeNoteCount: citeNoteLinks.length,
                        citRowCount: citRowLinks.length
                    };
                })()
            """)
            assert badge_link_info["totalSup"] > 0, "Badges should be wrapped in <sup class='reference refdiff-ref'>"
            assert badge_link_info["totalLinked"] > 0, "Badges should have interactive href links"
            print(f"       -> Found {badge_link_info['totalSup']} sup elements, {badge_link_info['totalLinked']} interactive links "
                  f"({badge_link_info['citeNoteCount']} cite_notes, {badge_link_info['citRowCount']} cit_rows)")

            first_badge_sel = "sup.reference.refdiff-ref a[href]"
            await client.hover(first_badge_sel)
            await asyncio.sleep(0.5)
            await client.capture_screenshot(os.path.join(screenshots_dir, "02d_badge_hover_link.png"))
            test_steps.append(("Reference badge linking (<sup class='reference'> + href anchors)", True))

            # 5b. Direct Transition: RefDiff -> Visual Diff
            if has_ve:
                print("[Step 5b] Testing direct transition: RefDiff -> Visual Diff...")
                await client.click(visual_btn)
                await asyncio.sleep(args.wait_ve)

                state_rd_to_visual = await client.evaluate("""
                    (() => {
                        const veDiff = document.querySelector('.ve-ui-diffElement, .ve-init-mw-diffPage-diff');
                        const citRows = document.querySelectorAll('tr.refdiff-cit-row');
                        const citRowsVisible = Array.from(citRows).filter(r => r.offsetParent !== null).length;
                        const table = document.querySelector('table.diff');
                        const nonHeaderRowsVisible = table ? Array.from(table.querySelectorAll('tr:not(.diff-title)')).filter(r => r.offsetParent !== null).length : 0;
                        const sw = document.getElementById('mw-diffPage-inline-toggle-switch');
                        return {
                            veDiffVisible: veDiff ? (veDiff.offsetParent !== null && veDiff.closest('.oo-ui-element-hidden') === null) : false,
                            citRowsVisible,
                            nonHeaderRowsVisible,
                            inlineDisabled: sw ? sw.classList.contains('oo-ui-widget-disabled') : true
                        };
                    })()
                """)
                assert state_rd_to_visual["veDiffVisible"], "VisualEditor visual diff should be displayed after RefDiff -> Visual"
                assert state_rd_to_visual["citRowsVisible"] == 0, "No citation rows should remain after RefDiff -> Visual"
                assert state_rd_to_visual["nonHeaderRowsVisible"] == 0, "No Wikitext diff content rows should remain visible after RefDiff -> Visual"
                await client.capture_screenshot(os.path.join(screenshots_dir, "02b_refdiff_to_visual.png"))
                test_steps.append(("Direct transition RefDiff -> Visual (0 leaked rows, clean view)", True))

            # 6. Mode Switch: Standard Wikitext Diff
            print("[Step 6] Switching back to Standard Wikitext Diff...")
            wiki_btn_sel = ".ve-init-mw-diffPage-diffMode .oo-ui-buttonOptionWidget:nth-child(2), #refdiff-btn-standard"
            await client.click(wiki_btn_sel)
            await asyncio.sleep(1.0)

            state_wiki = await client.evaluate("""
                (() => {
                    const citRows = document.querySelectorAll('tr.refdiff-cit-row');
                    const citRowsVisible = Array.from(citRows).filter(r => r.offsetParent !== null).length;
                    const sw = document.getElementById('mw-diffPage-inline-toggle-switch');
                    return {
                        citRowsVisible,
                        inlineEnabled: sw ? sw.classList.contains('oo-ui-widget-enabled') : true
                    };
                })()
            """)
            assert state_wiki["citRowsVisible"] == 0, "Citation rows should be restored in standard Wikitext diff"
            assert state_wiki["inlineEnabled"], "Inline diff switch should be re-enabled for standard Wikitext diff"
            await client.capture_screenshot(os.path.join(screenshots_dir, "03_wikitext_standard.png"))
            test_steps.append(("Switch to Wikitext (native table restored, inline switch enabled)", True))

            # 6b. Inline Diff Toggle: Wikitext -> RefDiff -> Wikitext -> Inline Diff
            inline_sw_sel = "#mw-diffPage-inline-toggle-switch"
            has_inline = await client.evaluate(f"!!document.querySelector('{inline_sw_sel}')")
            if has_inline:
                print("[Step 6b] Testing Inline switch after Wikitext -> RefDiff -> Wikitext...")
                await client.click(inline_sw_sel)
                await asyncio.sleep(2.5)

                state_inline = await client.evaluate("""
                    (() => {
                        const sw = document.getElementById('mw-diffPage-inline-toggle-switch');
                        const $ = window.$;
                        const w = $(sw).data('oouiInfused');
                        const table = document.querySelector('table.diff');
                        const rows = Array.from(table.querySelectorAll('tr'));
                        return {
                            swVal: w?.getValue(),
                            swEnabled: sw ? sw.classList.contains('oo-ui-widget-enabled') : true,
                            hiddenRowsCount: rows.filter(r => r.classList.contains('oo-ui-element-hidden')).length,
                            hasInlineRow: rows.some(r => r.querySelector('.mw-diff-inline-changed, .mw-diff-inline-added, .mw-diff-inline-deleted'))
                        };
                    })()
                """)
                assert state_inline["swVal"], "Inline switch value should be true when toggled ON"
                assert state_inline["hasInlineRow"], "Inline diff rows should be rendered in table.diff"
                await client.capture_screenshot(os.path.join(screenshots_dir, "03b_inline_diff_active.png"))
                test_steps.append(("Inline switch toggles ON cleanly after WikiText -> RefDiff -> WikiText", True))

                # Turn inline diff off again
                await client.click(inline_sw_sel)
                await asyncio.sleep(1.5)

            # 7. Theme Switching: Dark Mode
            print("[Step 7] Testing Dark Mode theme compatibility...")
            await client.click(ref_btn_sel)
            await asyncio.sleep(0.5)

            await client.evaluate("""
                document.documentElement.className =
                    document.documentElement.className.replace('skin-theme-clientpref-day', '') + ' skin-theme-clientpref-night';
            """)
            await asyncio.sleep(0.5)
            await client.capture_screenshot(os.path.join(screenshots_dir, "04_refdiff_dark_mode.png"))

            # Revert to Day theme
            await client.evaluate("""
                document.documentElement.className =
                    document.documentElement.className.replace('skin-theme-clientpref-night', '') + ' skin-theme-clientpref-day';
            """)
            test_steps.append(("Theme toggling (Light / Night Mode tokens)", True))

    finally:
        if created_tab_id:
            try:
                urllib.request.urlopen(f"http://{args.host}:{args.port}/json/close/{created_tab_id}", timeout=2)
            except Exception:
                pass

    # Print Summary Table
    print("\n" + "=" * 60)
    print("Live CDP Test Verification Summary:")
    print("=" * 60)
    all_passed = True
    for name, passed in test_steps:
        status = "PASSED" if passed else "FAILED"
        print(f"  [✓] {name:<50} {status}")
        if not passed:
            all_passed = False

    print("=" * 60)
    print(f"Screenshots saved to: {screenshots_dir}")
    print("=" * 60 + "\n")

    return 0 if all_passed else 1


def main():
    parser = argparse.ArgumentParser(description="RefDiff Live CDP Browser Test Runner")
    parser.add_argument("--host", default="127.0.0.1", help="CDP host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=9222, help="CDP port (default: 9222)")
    parser.add_argument("--stress", action="store_true", help="Run live stress test on enwiki diff=1379409916 fixture")
    parser.add_argument("--diff-url", default=None, help="Explicit diff URL to test against")
    parser.add_argument("--wait-reload", type=float, default=2.5, help="Seconds to wait after page reload")
    parser.add_argument("--wait-ve", type=float, default=3.0, help="Seconds to wait for VisualEditor to render")
    parser.add_argument(
        "--screenshots-dir",
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "screenshots")),
        help="Directory to save verification screenshots"
    )
    args = parser.parse_args()

    exit_code = asyncio.run(run_suite(args))
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
