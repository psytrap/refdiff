import asyncio
import websockets
import json
import urllib.request
import urllib.parse
import os
import sys

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def get_version():
    try:
        with open(os.path.join(REPO_DIR, "package.json"), "r", encoding="utf-8") as f:
            return json.load(f).get("version", "unknown")
    except Exception:
        return "1.5.6"

def get_refdiff_src():
    with open(os.path.join(REPO_DIR, "refdiff.js"), "r", encoding="utf-8") as f:
        return f.read()

active_sessions = {}

async def handle_target(ws, session_id, target_info):
    url = target_info.get("url", "")
    target_id = target_info.get("targetId", "")
    t_type = target_info.get("type", "")

    if t_type != "page":
        return

    # Enable Network, Page and Runtime domains
    await ws.send(json.dumps({
        "id": 99,
        "sessionId": session_id,
        "method": "Network.enable"
    }))
    await ws.send(json.dumps({
        "id": 98,
        "sessionId": session_id,
        "method": "Network.setBlockedURLs",
        "params": {"urls": ["*refdiff.js*"]}
    }))
    await ws.send(json.dumps({
        "id": 100,
        "sessionId": session_id,
        "method": "Page.enable"
    }))
    await ws.send(json.dumps({
        "id": 101,
        "sessionId": session_id,
        "method": "Runtime.enable"
    }))

    # Add evaluate on new document (persists because connection stays open)
    await ws.send(json.dumps({
        "id": 102,
        "sessionId": session_id,
        "method": "Page.addScriptToEvaluateOnNewDocument",
        "params": {"source": get_refdiff_src()}
    }))

    # If this is already a diff page, evaluate immediately
    if "diff=" in url or "Special:Diff" in url:
        clean_expr = """
        (function() {
            if (window.RefDiff && typeof window.RefDiff.restoreOriginal === 'function') {
                const table = document.querySelector('table.diff');
                if (table) window.RefDiff.restoreOriginal(table);
            }
            const btn = document.getElementById('refdiff-ooui-btn');
            if (btn) btn.remove();
        })();
        """
        await ws.send(json.dumps({
            "id": 1025,
            "sessionId": session_id,
            "method": "Runtime.evaluate",
            "params": {"expression": clean_expr}
        }))
        await ws.send(json.dumps({
            "id": 103,
            "sessionId": session_id,
            "method": "Runtime.evaluate",
            "params": {"expression": get_refdiff_src()}
        }))
        print(f"[✓] Active diff tab patched immediately: {url[:60]}...")
    else:
        print(f"[✓] Persistent monkey patch armed for tab: {url[:60]}...")
    sys.stdout.flush()

async def main():
    target_diff_url = sys.argv[1] if len(sys.argv) > 1 else "https://en.wikipedia.org/w/index.php?title=Benny_Indra_Ardhianto&diff=prev&oldid=1337298010"
    print(f"[1] Initializing Persistent CDP Monkey Patch for target: {target_diff_url}")

    while True:
        try:
            req = urllib.request.urlopen("http://127.0.0.1:9222/json/version")
            info = json.loads(req.read().decode("utf-8"))
            browser_ws = info["webSocketDebuggerUrl"]
        except Exception as e:
            print(f"[-] Waiting for Chromium on 9222: {e}")
            await asyncio.sleep(2)
            continue

        try:
            print(f"[2] Connecting to browser target: {browser_ws}")
            async with websockets.connect(browser_ws, max_size=50_000_000) as ws:
                # Enable auto-attach to all targets with flattening (single websocket connection!)
                await ws.send(json.dumps({
                    "id": 1,
                    "method": "Target.setAutoAttach",
                    "params": {
                        "autoAttach": True,
                        "waitForDebuggerOnStart": False,
                        "flatten": True
                    }
                }))

                # Open / navigate to target diff tab
                print(f"[3] Ensuring diff tab is active: {target_diff_url}...")
                
                # Check existing tabs
                tabs_req = urllib.request.urlopen("http://127.0.0.1:9222/json/list")
                tabs = json.loads(tabs_req.read().decode("utf-8"))
                
                diff_tab = next((t for t in tabs if t.get("type") == "page" and target_diff_url in t.get("url", "")), None)
                if not diff_tab:
                    diff_tab = next((t for t in tabs if t.get("type") == "page" and "diff=" in t.get("url", "")), None)

                if diff_tab:
                    urllib.request.urlopen(f"http://127.0.0.1:9222/json/activate/{diff_tab['id']}")
                    print(f"[✓] Activated existing diff tab: {diff_tab['id']} ({diff_tab.get('url', '')[:60]}...)")
                else:
                    new_url = f"http://127.0.0.1:9222/json/new?{urllib.parse.quote(target_diff_url, safe='')}"
                    req_new = urllib.request.Request(new_url, method="PUT")
                    with urllib.request.urlopen(req_new) as resp:
                        new_tab = json.loads(resp.read().decode("utf-8"))
                        urllib.request.urlopen(f"http://127.0.0.1:9222/json/activate/{new_tab['id']}")
                        print(f"[✓] Created and activated diff tab: {new_tab['id']}")

                print("\n" + "=" * 65)
                print("PERSISTENT MONKEY PATCH RUNNING (WEBSOCKET HELD OPEN)")
                print(f"All navigations and new diff tabs will automatically execute RefDiff v{get_version()}.")
                print("=" * 65 + "\n")
                sys.stdout.flush()

                # Event loop: process target attached & navigations
                while True:
                    raw = await ws.recv()
                    msg = json.loads(raw)
                    method = msg.get("method")
                    params = msg.get("params", {})
                    session_id = msg.get("sessionId")

                    if method == "Target.attachedToTarget":
                        t_info = params.get("targetInfo", {})
                        s_id = params.get("sessionId")
                        active_sessions[s_id] = t_info
                        asyncio.create_task(handle_target(ws, s_id, t_info))

                    elif method == "Page.frameNavigated":
                        frame = params.get("frame", {})
                        url = frame.get("url", "")
                        if "diff=" in url or "Special:Diff" in url:
                            # Injects on navigation within the same tab
                            clean_expr = """
                            (function() {
                                if (window.RefDiff && typeof window.RefDiff.restoreOriginal === 'function') {
                                    const table = document.querySelector('table.diff');
                                    if (table) window.RefDiff.restoreOriginal(table);
                                }
                                const btn = document.getElementById('refdiff-ooui-btn');
                                if (btn) btn.remove();
                            })();
                            """
                            await ws.send(json.dumps({
                                "id": 199,
                                "sessionId": session_id,
                                "method": "Runtime.evaluate",
                                "params": {"expression": clean_expr}
                            }))
                            await ws.send(json.dumps({
                                "id": 200,
                                "sessionId": session_id,
                                "method": "Runtime.evaluate",
                                "params": {"expression": get_refdiff_src()}
                            }))
                            print(f"[✓] Navigated to diff -> Injected RefDiff on: {url[:60]}...")
                            sys.stdout.flush()
        except (websockets.exceptions.ConnectionClosed, asyncio.exceptions.IncompleteReadError) as e:
            print(f"[-] Connection dropped ({e}). Reconnecting in 2 seconds...")
            await asyncio.sleep(2)
        except Exception as e:
            print(f"[-] Error in patch loop ({e}). Retrying in 2 seconds...")
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(main())
