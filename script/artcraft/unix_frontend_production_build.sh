#!/usr/bin/env bash
# This works on Linux and MacOS to launch the frontend dev server

root_dir=$(pwd)
frontend_path="${root_dir}/frontend"

echo "Running Artcraft Frontend Build..."
echo ""

pushd "${frontend_path}" || exit

npm install --verbose

export VITE_ENVIRONMENT_TYPE="production"

nx build artcraft

popd || exit
