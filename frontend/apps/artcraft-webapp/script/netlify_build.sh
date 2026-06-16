#!/bin/bash

set -euxo pipefail

# The webapp bundles every workspace lib's source into one large bundle, and the
# vite-plugin-top-level-await (swc) transform over it exhausts V8's default heap on
# Netlify's builder ("Reached heap limit / heap out of memory"). Raise the heap ceiling
# for the build. (Caps don't pre-allocate; tasks only use what they need.)
export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=8192"

echo "Run build script (TODO: Make strict)"
nx build artcraft-webapp

echo "Change to project dir"
pushd apps/artcraft-webapp/

echo "Copy netlify configs into dist"
#cp _headers dist/
cp _redirects dist/

#echo "Copy netlify 404.html page into dist"
#cp "404.html" dist/

echo "List final files in build"
find dist/

