#!/usr/bin/env bash
# This works on Linux and MacOS to launch the frontend dev server

root_dir=$(pwd)
frontend_path="${root_dir}/frontend"

source "${root_dir}/script/common/frontend_preflight.sh"
frontend_preflight "${frontend_path}"

echo "Running Artcraft Webapp in Dev Mode..."
echo ""

# Kill any process running on port 5741, which will block startup
if lsof -i tcp:4201 &>/dev/null; then
  lsof -i tcp:4201 -t | xargs kill -9
  echo "Killed process running on port 4200"
else
  echo "No process running on port 4201"
fi

pushd "${frontend_path}" || exit

frontend_npm_install

export VITE_ENVIRONMENT_TYPE="production"

# Backend devs: launch with USE_LOCAL_API=1 (or `export USE_LOCAL_API=1` once
# in your shell profile) to point the frontend at a local storyteller-web on
# http://localhost:12345. Unset/0 — the frontend-dev default — hits
# production. This replaces the comment/uncomment dance around
# StorytellerApiHostStore.setDevelopment() in src/main.tsx.
export VITE_USE_LOCAL_API="${USE_LOCAL_API:-0}"
if [[ "${VITE_USE_LOCAL_API}" == "1" ]]; then
  echo "USE_LOCAL_API=1 — API calls will target http://localhost:12345"
else
  echo "API calls will target production (set USE_LOCAL_API=1 for a local backend)"
fi

nx dev artcraft-webapp

popd || exit
