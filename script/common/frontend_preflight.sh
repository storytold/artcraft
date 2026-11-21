#!/usr/bin/env bash
# Shared preflight checks for the frontend dev/build scripts.
#
# Usage (from a script that has set ${frontend_path}):
#
#   source "${root_dir}/script/common/frontend_preflight.sh"
#   frontend_preflight "${frontend_path}"
#   ...
#   pushd "${frontend_path}"
#   frontend_npm_install
#

# Node 20+ is required by Nx 21 and comfortably covers Vite 6.
FRONTEND_MINIMUM_NODE_MAJOR=20

frontend_preflight() {
  local frontend_path="$1"

  if [ ! -d "${frontend_path}" ]; then
    echo "ERROR: frontend directory not found at: ${frontend_path}"
    echo "Run this script from the repository root."
    exit 1
  fi

  # --- Node and npm must be installed ---
  if ! command -v node &>/dev/null; then
    echo "ERROR: node is not installed (or not on PATH)."
    echo "Install Node.js ${FRONTEND_MINIMUM_NODE_MAJOR}+ via nvm (https://github.com/nvm-sh/nvm),"
    echo "https://nodejs.org, or:"
    echo "  brew install node"
    exit 1
  fi

  if ! command -v npm &>/dev/null; then
    echo "ERROR: npm is not installed (or not on PATH). It normally ships with Node.js."
    echo "Reinstall Node.js to get it back."
    exit 1
  fi

  # --- Node must be recent enough for Nx 21 / Vite 6 ---
  local node_major
  node_major=$(node --version | sed -E 's/^v([0-9]+).*/\1/')
  if [ "${node_major}" -lt "${FRONTEND_MINIMUM_NODE_MAJOR}" ]; then
    echo "ERROR: Node.js ${FRONTEND_MINIMUM_NODE_MAJOR}+ is required (found $(node --version))."
    echo "Upgrade via nvm ('nvm install --lts') or https://nodejs.org."
    exit 1
  fi

  # --- The frontend uses npm; stale pnpm state breaks installs ---
  # pnpm was briefly adopted ("add pnpm to solve build issues") and then dropped
  # ("fix(frontend): consume video-editor libs via nx path aliases, drop pnpm").
  # A node_modules tree written by pnpm makes npm fail with ENOTEMPTY errors.
  if [ -e "${frontend_path}/pnpm-lock.yaml" ] \
      || [ -e "${frontend_path}/pnpm-workspace.yaml" ] \
      || [ -d "${frontend_path}/node_modules/.pnpm" ]; then
    echo "ERROR: Stale pnpm artifacts detected in ${frontend_path}."
    echo "The frontend uses npm (pnpm was dropped; see frontend/README.md)."
    echo "Clean up with:"
    echo "  cd ${frontend_path} && rm -rf node_modules pnpm-lock.yaml pnpm-workspace.yaml && npm install"
    exit 1
  fi
}

# Run `npm install` in the current directory. If it fails (typically from a
# corrupted node_modules tree, eg. an interrupted install or a leftover pnpm
# layout causing ENOTEMPTY rename errors), wipe node_modules and the nx cache
# and retry once before giving up.
frontend_npm_install() {
  if npm install; then
    return 0
  fi

  echo ""
  echo "WARNING: npm install failed. node_modules may be corrupted (eg. an"
  echo "interrupted install or a mixed npm/pnpm tree). Wiping and retrying..."
  echo ""

  rm -rf node_modules .nx

  if ! npm install; then
    echo ""
    echo "ERROR: npm install failed again. See the npm output above and the"
    echo "troubleshooting section in frontend/README.md."
    exit 1
  fi
}
