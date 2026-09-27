#!/usr/bin/env bash
# Start the desktop frontend and Rust/Tauri watcher together on macOS or Linux.
set -euo pipefail

root_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
frontend_path="${root_dir}/frontend"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'HELP'
Usage: ./script/artcraft/unix_dev.sh

Starts Vite with React/CSS hot reload and Tauri with Rust rebuild/restart.
Finds and binds a free loopback port starting at ARTCRAFT_DEV_PORT (default: 5193),
then passes that exact URL to Tauri. HMR shares the frontend port.
Rust uses native Tauri IPC and does not need a second HTTP port.
Ctrl-C stops this launcher's frontend, Rust watcher, and desktop app.

Requires Node.js 20+, npm, Rust, cargo-tauri 2, and Tauri platform prerequisites.
Installs frontend dependencies only when the local Vite installation is missing.
Run this command instead of running the two legacy dev scripts together.
HELP
  exit 0
fi

if [[ $# -ne 0 ]]; then
  echo "Unknown argument: $1 (see --help)" >&2
  exit 1
fi

source "${root_dir}/script/common/frontend_preflight.sh"
frontend_preflight "${frontend_path}"

if ! command -v cargo >/dev/null || ! cargo tauri --version >/dev/null 2>&1; then
  echo 'ERROR: Install Rust and the Tauri CLI: cargo install tauri-cli --version "^2" --locked' >&2
  exit 1
fi

cd "${frontend_path}"
if [[ ! -f node_modules/vite/package.json ]]; then
  # Do not use the legacy install helper: its failure recovery deletes caches.
  npm install
fi

exec node "${frontend_path}/scripts/unix-dev.mjs"
