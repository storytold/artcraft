#!/bin/bash

set -euxo pipefail

# Runs from the Netlify base directory (= the Nx workspace root, `frontend/`).

echo "Building video-info-website"
npx nx build @frontend/video-info-website

echo "Copy netlify configs into dist"
pushd apps/video-info-website/
cp _redirects dist/
popd

echo "Final build files:"
find apps/video-info-website/dist/
