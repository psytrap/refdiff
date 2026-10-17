#!/usr/bin/env python3
"""
scripts/check_clean_user_env.py

Automated Environment Cleanliness & Pointer Auditor:
Verifies whether a user's on-wiki environment is 100% clean for rollout & install testing.
Checks:
  1. en:User:{username}/common.js: Must NOT contain any refdiff.js / RefDiff import or pointer.
  2. m:User:{username}/common.js: Must NOT contain any refdiff.js / RefDiff import or pointer.
  3. Meta-Wiki script lead (m:User:Powercycler/refdiff.js): Reports current live revision and SHA-1.
  4. en.WP pointer (en:User:Powercycler/refdiff.js): Reports target pointer state.
"""

import argparse
import json
import re
import sys
import urllib.request

HEADERS = {"User-Agent": "RefDiffCleanEnvChecker/1.0 (https://en.wikipedia.org/wiki/User:Powercycler/RefDiff)"}


def query_page_content(wiki_api_url: str, title: str):
    url = f"{wiki_api_url}?action=query&prop=revisions&titles={urllib.parse.quote(title)}&rvslots=*&rvprop=content|ids|timestamp|sha1&formatversion=2&format=json"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    page = data["query"]["pages"][0]
    if page.get("missing", False):
        return {"exists": False, "title": title}
    rev = page["revisions"][0]
    content = rev.get("slots", {}).get("main", {}).get("content", "")
    return {
        "exists": True,
        "title": title,
        "revid": rev.get("revid"),
        "timestamp": rev.get("timestamp"),
        "sha1": rev.get("sha1"),
        "content": content
    }


def find_refdiff_pointers(content: str):
    matching_lines = []
    for line in content.splitlines():
        if re.search(r"refdiff", line, re.IGNORECASE):
            matching_lines.append(line.strip())
    return matching_lines


def main():
    parser = argparse.ArgumentParser(description="Check user environment cleanliness for RefDiff")
    parser.add_argument("--user", default="Powercycler", help="Target Wikipedia username (default: Powercycler)")
    args = parser.parse_args()

    username = args.user
    print("=" * 70)
    print(f"RefDiff User Environment Cleanliness Check (User:{username})")
    print("=" * 70)

    is_clean = True

    # 1. Check en.WP User:common.js
    en_common_title = f"User:{username}/common.js"
    en_data = query_page_content("https://en.wikipedia.org/w/api.php", en_common_title)
    if not en_data["exists"]:
        print(f"[✓] en:{en_common_title}: Does not exist (Clean)")
    else:
        pointers = find_refdiff_pointers(en_data["content"])
        if pointers:
            is_clean = False
            print(f"[✗] en:{en_common_title}: NOT CLEAN - Found {len(pointers)} RefDiff pointer(s):")
            for p in pointers:
                print(f"      -> {p}")
        else:
            print(f"[✓] en:{en_common_title}: Rev {en_data['revid']} exists and is 100% CLEAN (0 RefDiff pointers)")

    # 2. Check Meta-Wiki User:common.js
    meta_common_title = f"User:{username}/common.js"
    meta_data = query_page_content("https://meta.wikimedia.org/w/api.php", meta_common_title)
    if not meta_data["exists"]:
        print(f"[✓] m:{meta_common_title}: Does not exist (Clean)")
    else:
        pointers = find_refdiff_pointers(meta_data["content"])
        if pointers:
            is_clean = False
            print(f"[✗] m:{meta_common_title}: NOT CLEAN - Found {len(pointers)} RefDiff pointer(s):")
            for p in pointers:
                print(f"      -> {p}")
        else:
            print(f"[✓] m:{meta_common_title}: Rev {meta_data['revid']} exists and is 100% CLEAN (0 RefDiff pointers)")

    # 3. Check MediaWiki pointer targets
    print("\n[-] Checking MediaWiki Deployment Pointer Targets:")
    meta_lead = query_page_content("https://meta.wikimedia.org/w/api.php", "User:Powercycler/refdiff.js")
    if meta_lead["exists"]:
        print(f"  [✓] Meta-Wiki Lead Script: m:User:Powercycler/refdiff.js")
        print(f"      Rev: {meta_lead['revid']}, Timestamp: {meta_lead['timestamp']}, SHA-1: {meta_lead['sha1']}")
    else:
        print(f"  [✗] Meta-Wiki Lead Script MISSING!")

    en_lead = query_page_content("https://en.wikipedia.org/w/api.php", "User:Powercycler/refdiff.js")
    if en_lead["exists"]:
        print(f"  [✓] en.WP Script Pointer:  en:User:Powercycler/refdiff.js")
        print(f"      Rev: {en_lead['revid']}, Timestamp: {en_lead['timestamp']}, SHA-1: {en_lead['sha1']}")
    else:
        print(f"  [✗] en.WP Script Pointer MISSING!")

    print("\n" + "=" * 70)
    if is_clean:
        print("🎉 ENVIRONMENT IS 100% CLEAN! Ready for clean install / rollout testing.")
        print("=" * 70)
        return 0
    else:
        print("⚠️  ENVIRONMENT IS NOT CLEAN!")
        print("    Please remove the refdiff.js pointer line(s) from your common.js")
        print("    to establish a clean environment before testing the installation.")
        print("=" * 70)
        return 1


if __name__ == "__main__":
    import urllib.parse
    sys.exit(main())
