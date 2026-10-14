#!/usr/bin/env bash
# Reproducibly fetches the Ultraviolet build that is currently deployed on
# English Wikipedia, plus the matching source tree, into this folder.
#
#   dist/      minified build exactly as served to users (+ source map, loader)
#   repo/      full git clone of gitlab.wikimedia.org/repos/10nm/ultraviolet
#   deployed/  git worktree of repo/ checked out at the deployed commit
#
# Ultraviolet publishes no `_dev.js`: the on-wiki loader (User:10nm/beta.js)
# pins a commit hash and loads minified webpack bundles from tools-static.
# The readable equivalent is the git tree at that commit (see deployed/).
set -euo pipefail
cd "$(dirname "$0")"

UA="RefDiff-comparison/0.1 (https://github.com/m-k/einzelnachweise)"
LOADER_URL="https://en.wikipedia.org/w/index.php?title=User:10nm/beta.js&action=raw"
REPO_URL="https://gitlab.wikimedia.org/repos/10nm/ultraviolet.git"

mkdir -p dist/deps dist/lang
curl -sSf -A "$UA" -o dist/beta.js "$LOADER_URL"

COMMIT=$(grep -oE 'var commit = "[0-9a-f]{40}"' dist/beta.js | grep -oE '[0-9a-f]{40}')
echo "Deployed commit: $COMMIT"
BASE="https://tools-static.wmflabs.org/ultraviolet/builds/$COMMIT"

# Entry points listed in the loader, plus the source map of the main bundle.
for f in ultraviolet.js ultraviolet.js.map \
         deps/ultraviolet.dep.tsmodules.js lang/ultraviolet.lang.en-US.js; do
  curl -sSf -A "$UA" -o "dist/$f" "$BASE/$f"
  echo "  fetched dist/$f ($(wc -c < "dist/$f") bytes)"
done
echo "$COMMIT" > dist/COMMIT

if [ ! -d repo/.git ]; then
  git clone --quiet --filter=blob:none "$REPO_URL" repo
fi
git -C repo fetch --quiet origin
if [ ! -e deployed/.git ]; then
  git -C repo worktree add --quiet --detach ../deployed "$COMMIT"
else
  git -C deployed checkout --quiet --detach "$COMMIT"
fi
echo "Source at deployed commit: deployed/ ($(git -C deployed log -1 --format='%ci %s'))"
