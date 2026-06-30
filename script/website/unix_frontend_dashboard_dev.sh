#!/usr/bin/env bash
# Launch the Artcraft admin/moderator dashboard dev server.
#
# NOTE: frontend/apps/artcraft-dashboard is a STANDALONE app (its own
# package.json + pnpm-lock.yaml + node_modules, package manager: pnpm). It is
# NOT part of the Nx workspace, so we do NOT use `nx` or the nx preflight here.

root_dir=$(pwd)
dashboard_path="${root_dir}/frontend/apps/artcraft-dashboard"

if [ ! -d "${dashboard_path}" ]; then
  echo "ERROR: dashboard directory not found at: ${dashboard_path}"
  echo "Run this script from the repository root."
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "ERROR: node is not installed (or not on PATH)."
  exit 1
fi

# pnpm is the dashboard's declared package manager. Prefer a real pnpm on PATH;
# otherwise run it through corepack (ships with Node) which provisions the
# version pinned in package.json's "packageManager" field.
if command -v pnpm &>/dev/null; then
  pnpm_cmd=(pnpm)
elif command -v corepack &>/dev/null; then
  pnpm_cmd=(corepack pnpm)
else
  echo "ERROR: pnpm is not available. Install it with one of:"
  echo "  corepack enable          # ships with Node.js"
  echo "  npm install -g pnpm"
  exit 1
fi

echo "Running Artcraft Dashboard in Dev Mode..."
echo ""

# Kill any process running on port 4202, which will block startup
if lsof -i tcp:4202 &>/dev/null; then
  lsof -i tcp:4202 -t | xargs kill -9
  echo "Killed process running on port 4202"
else
  echo "No process running on port 4202"
fi

pushd "${dashboard_path}" || exit

"${pnpm_cmd[@]}" install

export VITE_ENVIRONMENT_TYPE="production"

"${pnpm_cmd[@]}" dev

popd || exit
