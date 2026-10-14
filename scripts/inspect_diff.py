#!/usr/bin/env python3
"""
scripts/inspect.py

Automated Interactive Visual Inspection Helper for RefDiff.
Provides a unified, friction-free workflow for visual inspection:
  1. Starts a lightweight background HTTP server hosting local refdiff.js on port 8000
     with CORS (Access-Control-Allow-Origin: *) for direct loading in any browser.
  2. If Chromium is reachable on port 9222 (remote debugging), navigates to the target
     diff page, injects refdiff.js via CDP, and leaves the tab open for human review.
  3. Prints one-line loader snippets for external browsers (e.g. Firefox).
  4. Keeps running until the reviewer presses Enter or Ctrl+C.
"""

import argparse
import asyncio
import http.server
import json
import os
import socketserver
import sys
import threading
import urllib.request

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFDIFF_JS_PATH = os.path.join(ROOT_DIR, "refdiff.js")

DEFAULT_DIFF = 1379207737  # Bihar Legislative Assembly (quotes & apostrophes)


class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_GET(self):
        if self.path in ("/refdiff.js", "/"):
            try:
                with open(REFDIFF_JS_PATH, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/javascript; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                self.send_error(500, f"Error reading refdiff.js: {e}")
        else:
            self.send_error(404, "Not Found")

    def log_message(self, format, *args):
        # Suppress routine GET logging to keep output clean
        pass


def start_http_server(port: int = 8000) -> socketserver.TCPServer:
    # Allow address reuse so quick restarts don't fail
    socketserver.TCPServer.allow_reuse_address = True
    server = socketserver.TCPServer(("127.0.0.1", port), CORSRequestHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


async def inject_into_chromium(host: str, port: int, diff_id: int) -> bool:
    try:
        import websockets
    except ImportError:
        print("[-] Note: websockets package not available; skipping automated CDP injection.")
        return False

    url = f"https://en.wikipedia.org/w/index.php?diff={diff_id}"

    # Check if Chromium CDP is accessible
    try:
        with urllib.request.urlopen(f"http://{host}:{port}/json/version", timeout=1) as resp:
            pass
    except Exception:
        print(f"[-] Chromium remote debugging not detected on {host}:{port} (skipping auto-tab injection).")
        return False

    try:
        # Read local refdiff.js
        with open(REFDIFF_JS_PATH, "r", encoding="utf-8") as f:
            refdiff_code = f.read()

        # Open tab via CDP HTTP endpoint
        req = urllib.request.Request(f"http://{host}:{port}/json/new?{url}", method="PUT")
        with urllib.request.urlopen(req, timeout=3) as resp:
            tab = json.loads(resp.read().decode("utf-8"))
        ws_url = tab["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=25 * 1024 * 1024) as ws:
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

            async def evaluate(expr):
                res = await send("Runtime.evaluate", {
                    "expression": expr,
                    "returnByValue": True,
                    "awaitPromise": True
                })
                return res.get("result", {}).get("result", {}).get("value")

            await send("Page.enable")
            await send("Runtime.enable")

            # Wait for diff table to render
            loaded = False
            for _ in range(30):
                is_ready = await evaluate("document.readyState === 'complete' && !!document.querySelector('table.diff')")
                if is_ready:
                    loaded = True
                    break
                await asyncio.sleep(0.5)

            if not loaded:
                print("[-] Warning: Timed out waiting for table.diff; injecting anyway...")

            # Inject local refdiff.js
            await evaluate(refdiff_code)
            await asyncio.sleep(0.5)

            # Confirm mounting
            mounted = await evaluate("!!document.getElementById('refdiff-ooui-btn') || !!document.getElementById('refdiff-mode-bar')")
            cit_rows = await evaluate("document.querySelectorAll('.refdiff-cit-row').length")

            print(f"[✓] Successfully injected into Chromium tab!")
            print(f"    - Target URL: {url}")
            print(f"    - RefDiff Mode Button Mounted: {mounted}")
            print(f"    - Decoupled Citation Rows: {cit_rows}")
            return True

    except Exception as e:
        print(f"[-] Could not inject into Chromium via CDP: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="RefDiff Interactive Visual Inspection Helper")
    parser.add_argument("--diff", type=int, default=DEFAULT_DIFF, help=f"Diff ID to test (default: {DEFAULT_DIFF})")
    parser.add_argument("--http-port", type=int, default=8000, help="Local HTTP server port (default: 8000)")
    parser.add_argument("--cdp-host", type=str, default="127.0.0.1", help="CDP host (default: 127.0.0.1)")
    parser.add_argument("--cdp-port", type=int, default=9222, help="CDP port (default: 9222)")
    parser.add_argument("--non-interactive", action="store_true", help="Exit immediately after injection without waiting")
    args = parser.parse_args()

    print("=" * 70)
    print("RefDiff Interactive Visual Inspection (Stage 5 Gate)")
    print("=" * 70)

    # 1. Start local CORS HTTP server
    try:
        server = start_http_server(args.http_port)
        print(f"[✓] Local CORS server active at: http://127.0.0.1:{args.http_port}/refdiff.js")
    except Exception as e:
        print(f"[-] Warning: Failed to bind port {args.http_port}: {e}")
        server = None

    # 2. Try automated Chromium CDP injection
    diff_url = f"https://en.wikipedia.org/w/index.php?diff={args.diff}"
    print(f"[-] Target diff: {diff_url}")
    try:
        asyncio.run(inject_into_chromium(args.cdp_host, args.cdp_port, args.diff))
    except Exception as e:
        print(f"[-] Automated injection exception: {e}")

    # 3. Print instructions for manual inspection in other browsers
    print("\n" + "-" * 70)
    print("INSPECTION OPTIONS:")
    print("1. Chromium (Port 9222): Check the newly opened tab in your Chromium browser.")
    print("2. Firefox or other browser: Open the diff page above, press F12, and run:")
    print(f"   mw.loader.load('http://127.0.0.1:{args.http_port}/refdiff.js');")
    print("-" * 70)

    if args.non_interactive:
        if server:
            server.shutdown()
        return

    try:
        input("\n[>] Press Enter or Ctrl+C when finished with visual inspection to stop server...")
    except (KeyboardInterrupt, EOFError):
        pass
    finally:
        if server:
            print("\nShutting down local inspection server...")
            server.shutdown()
        print("Done.")


if __name__ == "__main__":
    main()
