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

nx dev artcraft-webapp

popd || exit
