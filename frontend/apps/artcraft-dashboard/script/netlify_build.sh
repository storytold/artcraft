#!/bin/bash

set -euxo pipefail

echo "Build the dashboard"
npx nx build artcraft-dashboard

echo "Change to project dir"
pushd apps/artcraft-dashboard/

echo "Copy netlify configs into dist"
cp _redirects dist/

echo "List final files in build"
find dist/

popd
