import asyncio
import websockets
import json
import urllib.request
import urllib.parse
import os
import sys

REPO_DIR = "/home/mik/Documents/Bastel/2023-/einzelnachweise"
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

    # Enable Page and Runtime domains
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
    print("[1] Initializing Persistent CDP Monkey Patch...")
    
    # 1. Fetch browser websocket URL
    try:
        req = urllib.request.urlopen("http://127.0.0.1:9222/json/version")
        info = json.loads(req.read().decode("utf-8"))
        browser_ws = info["webSocketDebuggerUrl"]
    except Exception as e:
        print(f"[-] Could not connect to Chromium on 9222: {e}")
        return

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

        # Open / navigate to User:Powercycler/RefDiff
        print("[3] Ensuring https://en.wikipedia.org/wiki/User:Powercycler/RefDiff is active...")
        doc_url = "https://en.wikipedia.org/wiki/User:Powercycler/RefDiff"
        
        # Check existing tabs
        tabs_req = urllib.request.urlopen("http://127.0.0.1:9222/json/list")
        tabs = json.loads(tabs_req.read().decode("utf-8"))
        doc_tab = next((t for t in tabs if "User:Powercycler/RefDiff" in t.get("url", "") and "diff=" not in t.get("url", "")), None)

        if doc_tab:
            urllib.request.urlopen(f"http://127.0.0.1:9222/json/activate/{doc_tab['id']}")
            print(f"[✓] Activated existing documentation tab: {doc_tab['id']}")
        else:
            new_url = f"http://127.0.0.1:9222/json/new?{urllib.parse.quote(doc_url, safe='')}"
            req_new = urllib.request.Request(new_url, method="PUT")
            with urllib.request.urlopen(req_new) as resp:
                new_tab = json.loads(resp.read().decode("utf-8"))
                urllib.request.urlopen(f"http://127.0.0.1:9222/json/activate/{new_tab['id']}")
                print(f"[✓] Created and activated documentation tab: {new_tab['id']}")

        print("\n" + "=" * 65)
        print("PERSISTENT MONKEY PATCH RUNNING (WEBSOCKET HELD OPEN)")
        print("All navigations and new diff tabs will automatically execute RefDiff v1.5.3.")
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
                    await ws.send(json.dumps({
                        "id": 200,
                        "sessionId": session_id,
                        "method": "Runtime.evaluate",
                        "params": {"expression": get_refdiff_src()}
                    }))
                    print(f"[✓] Navigated to diff -> Injected RefDiff on: {url[:60]}...")
                    sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(main())
