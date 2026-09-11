#!/usr/bin/env bash
#
# Fast, safe cleanup of the cargo ./target directory.
#
# Why this script exists:
#   - `rm -rf target` hangs on huge target dirs (millions of small files).
#   - `rm target/prefix*` blows up the shell glob with too many completions.
#
# Strategy:
#   - Resolve target dir relative to the repo root, then sanity-check we're
#     actually inside it before touching anything.
#   - Walk the tree with `find -delete` (a single in-process traversal that
#     unlinks as it goes — much faster than spawning rm per file).
#   - Stream progress to stdout every N entries so it's clear something is
#     happening.

set -euo pipefail

# --- locate repo root and target dir -----------------------------------------

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
TARGET_DIR="${1:-$REPO_ROOT/target}"

# --- safety checks -----------------------------------------------------------

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "target dir does not exist: $TARGET_DIR"
  exit 0
fi

# Resolve to absolute path and refuse anything that doesn't end in /target.
TARGET_DIR="$(cd -- "$TARGET_DIR" && pwd)"
case "$TARGET_DIR" in
  */target) ;;
  *)
    echo "refusing to clean a path that doesn't end in /target: $TARGET_DIR"
    exit 1
    ;;
esac

# Refuse paths suspiciously close to root.
if [[ "$TARGET_DIR" == "/target" || "${#TARGET_DIR}" -lt 12 ]]; then
  echo "refusing to clean suspicious path: $TARGET_DIR"
  exit 1
fi

echo "Cleaning: $TARGET_DIR"
START=$(date +%s)

# --- delete with progress ----------------------------------------------------

# `find -delete` removes files and (now-empty) directories during traversal.
# We pipe -print through awk to emit a progress line every 5000 entries.
# Note: -print fires before -delete for files, after for dirs — fine for progress.
COUNT=$(
  find "$TARGET_DIR" -mindepth 1 -print -delete 2>/dev/null \
    | awk -v start="$START" '
        {
          n++
          if (n % 5000 == 0) {
            elapsed = systime() - start
            rate = (elapsed > 0) ? n / elapsed : n
            printf "  deleted %d entries (%.0f/s)\n", n, rate > "/dev/stderr"
          }
        }
        END { print n }
      '
)

ELAPSED=$(( $(date +%s) - START ))
echo "Done. Removed $COUNT entries in ${ELAPSED}s."

# Recreate empty target/ so cargo doesn't complain on next build.
mkdir -p "$TARGET_DIR"
