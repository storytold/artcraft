#!/bin/bash

set -euxo pipefail 

echo "Run build script (TODO: Make strict)"
nx build genhub

echo "Change to project dir"
pushd apps/genhub/

echo "Copy netlify configs into dist"
#cp _headers dist/
cp _redirects dist/

#echo "Copy netlify 404.html page into dist"
#cp "404.html" dist/

echo "List final files in build"
find dist/

