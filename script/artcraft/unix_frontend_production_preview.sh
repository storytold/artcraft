#!/usr/bin/env bash
# This works on Linux and MacOS to launch the frontend dev server

root_dir=$(pwd)
frontend_path="${root_dir}/frontend"

echo "Running Artcraft Frontend in Production Build + Preview Mode... (It won't hot reload!)"
echo ""

echo "You'll need to launch the Rust dev server as a second script!"
echo ""

# Kill any process running on port 5741, which will block startup
if lsof -i tcp:5173 &>/dev/null; then
  lsof -i tcp:5173 -t | xargs kill -9
  echo "Killed process running on port 5173"
else
  echo "No process running on port 5173"
fi

pushd "${frontend_path}" || exit

npm install --verbose

export VITE_ENVIRONMENT_TYPE="production"

nx production-preview artcraft

popd || exit
