#!/bin/bash
#
# storyteller-docs (Netlify) runs this from the repository root and publishes ./build.
# The OpenAPI generator (`cargo run --bin docs-cli`) lives in storytold/artcraft-services
# with the API server. This script publishes the Swagger page and the committed spec.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

mkdir -p ./build
cp ./frontend/api_docs.html ./build/index.html
cp ./frontend/api.json ./build/api.json
