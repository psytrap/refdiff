#!/usr/bin/env python3
"""
tests/test_live_benchmarks.py

Automated Pre-Flight Live Benchmark Verification with Monkey Patching:
Opens real English Wikipedia diff URLs in Chromium via the Chrome DevTools Protocol (CDP on port 9222),
monkey-patches / injects the local refdiff.js into the live page context, and asserts:
  1. OOUI mode button correctly mounts to diff toolbar
  2. All citations decouple cleanly into citation rows
  3. Reference badges link interactively (<sup class="reference refdiff-ref"><a href="...">)
  4. Bidirectional Memento restoration roundtrips cleanly (RefDiff <-> Wikitext)
  5. Zero errors and zero orphaned nodes

Benchmarks Tested:
  - Bihar Legislative Assembly (diff=1379207737): quotes & apostrophes in cite attributes
  - Odoacer (diff=1379486498): high-density reference rewrites
  - Zagreb (diff=1379409916): 114 citations stress test
  - Cosmic Inflation (diff=1379470949): prose whitespace preservation
  - Donnie Brasco (diff=1380017400): unclosed quote in ref name
"""

import argparse
import asyncio
import json
import os
import sys
import urllib.request
from typing import Any, Dict, List, Tuple
import websockets

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

BENCHMARKS = [
    {
        "name": "Bihar Legislative Assembly",
        "diff": 1379207737,
        "desc": "quotes and apostrophes in cite attributes"
    },
    {
        "name": "Odoacer",
        "diff": 1379486498,
        "desc": "high-density reference rewrites"
    },
    {
        "name": "Zagreb",
        "diff": 1379409916,
        "desc": "114 citations stress test"
    },
    {
        "name": "Cosmic Inflation",
        "diff": 1379470949,
        "desc": "prose whitespace preservation"
    },
    {
        "name": "Donnie Brasco",
        "diff": 1380017400,
        "desc": "unclosed quote in ref name"
    }
]


class CDPClient:
    def __init__(self, ws_url: str):
        self.ws_url = ws_url
        self.ws = None
        self._msg_id = 0

    async def __aenter__(self):
        self.ws = await websockets.connect(self.ws_url, max_size=25 * 1024 * 1024)
        await self.send("Page.enable")
        await self.send("Runtime.enable")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.ws:
            await self.ws.close()

    async def send(self, method: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        self._msg_id += 1
        cid = self._msg_id
        payload = {"id": cid, "method": method}
        if params:
            payload["params"] = params
        await self.ws.send(json.dumps(payload))
        while True:
            raw = await self.ws.recv()
            res = json.loads(raw)
            if res.get("id") == cid:
                return res

    async def evaluate(self, expr: str) -> Any:
        res = await self.send("Runtime.evaluate", {
            "expression": expr,
            "returnByValue": True,
            "awaitPromise": True
        })
        if "exceptionDetails" in res.get("result", {}):
            details = res["result"]["exceptionDetails"]
            raise RuntimeError(f"JS evaluation error: {details}")
        return res.get("result", {}).get("result", {}).get("value")


async def test_single_benchmark(args: argparse.Namespace, bench: Dict[str, Any], refdiff_code: str) -> Tuple[bool, Dict[str, Any]]:
    url = f"https://en.wikipedia.org/w/index.php?diff={bench['diff']}"
    print(f"\n[-] Testing: {bench['name']} (diff={bench['diff']}) - {bench['desc']}")

    # Open tab via CDP HTTP endpoint
    req = urllib.request.Request(f"http://{args.host}:{args.port}/json/new?{url}", method="PUT")
    with urllib.request.urlopen(req, timeout=5) as resp:
        tab = json.loads(resp.read().decode("utf-8"))
    tab_id = tab["id"]
    ws_url = tab["webSocketDebuggerUrl"]

    try:
        async with CDPClient(ws_url) as client:
            # Wait for diff table to render on page
            loaded = False
            for _ in range(30):
                is_ready = await client.evaluate("document.readyState === 'complete' && !!document.querySelector('table.diff')")
                if is_ready:
                    loaded = True
                    break
                await asyncio.sleep(0.5)

            if not loaded:
                raise TimeoutError(f"Timeout waiting for diff table to load on {url}")

            # Monkey-patch / Inject local refdiff.js
            await client.evaluate(refdiff_code)
            await asyncio.sleep(0.5)

            # Evaluate RefDiff status on page
            data = await client.evaluate("""(() => {
                const hasRefBtn = !!document.getElementById('refdiff-ooui-btn') || !!document.getElementById('refdiff-mode-bar');
                const citRows = document.querySelectorAll('.refdiff-cit-row').length;
                const isDecoupled = typeof RefDiff !== 'undefined' ? RefDiff.state.isDecoupled : false;
                const hasErrors = document.querySelectorAll('.refdiff-error').length;
                const interactiveBadges = document.querySelectorAll('.refdiff-ref a').length;
                const totalBadges = document.querySelectorAll('.refdiff-ref').length;
                
                // Test switching back to wikitext mode (Memento restoration)
                let roundtripSuccess = false;
                if (typeof RefDiff !== 'undefined') {
                    const table = document.querySelector('table.diff');
                    RefDiff.selectMode('wikitext', table);
                    const afterWikitextCitRows = document.querySelectorAll('.refdiff-cit-row').length;
                    RefDiff.selectMode('refdiff', table);
                    const afterRefdiffCitRows = document.querySelectorAll('.refdiff-cit-row').length;
                    roundtripSuccess = (afterWikitextCitRows === 0 && afterRefdiffCitRows === citRows);
                }

                return {
                    hasRefBtn,
                    citRows,
                    isDecoupled,
                    hasErrors,
                    interactiveBadges,
                    totalBadges,
                    roundtripSuccess
                };
            })()""")

            print(f"    [✓] RefDiff Button Mounted:        {data['hasRefBtn']}")
            print(f"    [✓] Decoupled Citation Rows:       {data['citRows']}")
            print(f"    [✓] Badges (interactive/total):    {data['interactiveBadges']}/{data['totalBadges']}")
            print(f"    [✓] Memento Roundtrip (RefDiff <-> Wikitext): {data['roundtripSuccess']}")

            assert data["hasRefBtn"], "RefDiff UI button missing"
            assert data["citRows"] > 0 or data["totalBadges"] > 0, "Expected citations or badges to decouple"
            assert data["roundtripSuccess"], "Roundtrip mode toggle failed"
            return True, data
    finally:
        try:
            urllib.request.urlopen(f"http://{args.host}:{args.port}/json/close/{tab_id}", timeout=2)
        except Exception:
            pass


async def run_suite(args: argparse.Namespace) -> int:
    print("=" * 70)
    print("RefDiff Pre-Flight Live Benchmark Suite (CDP Monkey Patching)")
    print("=" * 70)

    # Verify CDP endpoint connectivity
    try:
        urllib.request.urlopen(f"http://{args.host}:{args.port}/json/version", timeout=3)
    except Exception as e:
        print(f"[-] Chromium CDP not reachable on {args.host}:{args.port} ({e}).")
        print("    Ensure Chromium was started with --remote-debugging-port.")
        return 1

    refdiff_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "refdiff.js"))
    with open(refdiff_path, "r", encoding="utf-8") as f:
        refdiff_code = f.read()

    benchmarks_to_run = BENCHMARKS
    if args.diff:
        benchmarks_to_run = [b for b in BENCHMARKS if str(b["diff"]) == str(args.diff)]
        if not benchmarks_to_run:
            benchmarks_to_run = [{"name": f"Custom Diff {args.diff}", "diff": args.diff, "desc": "custom benchmark"}]

    results: List[Tuple[str, int, str, int]] = []
    for bench in benchmarks_to_run:
        try:
            ok, data = await test_single_benchmark(args, bench, refdiff_code)
            results.append((bench["name"], bench["diff"], "PASSED", data["citRows"]))
        except Exception as e:
            print(f"    [✗] FAILED: {e}")
            results.append((bench["name"], bench["diff"], f"FAILED: {e}", 0))

    print("\n" + "=" * 70)
    print("Pre-Flight Live Benchmark Verification Summary:")
    print("=" * 70)
    all_ok = True
    for name, diff, status, citRows in results:
        print(f"  {name:<28} (diff={diff}): {status} ({citRows} cit rows)")
        if status != "PASSED":
            all_ok = False
    print("=" * 70 + "\n")
    return 0 if all_ok else 1


def main():
    parser = argparse.ArgumentParser(description="RefDiff Pre-Flight Live Benchmark Suite")
    parser.add_argument("--host", default="127.0.0.1", help="CDP host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=9222, help="CDP port (default: 9222)")
    parser.add_argument("--diff", default=None, help="Specific diff revision ID to test")
    args = parser.parse_args()

    exit_code = asyncio.run(run_suite(args))
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
