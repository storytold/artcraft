#!/bin/bash
#
# storyteller-docs (Netlify) runs this from the repository root and publishes ./build.
# The public spec is generated from frontend/openapi/upstream.openapi.json.
# Refresh that export in storytold/artcraft-services with:
#   SQLX_OFFLINE=true cargo run --bin docs-cli
# then run: python3 script/openapi/generate_public_openapi.py
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

python3 script/openapi/generate_public_openapi.py --check

mkdir -p ./build
cp ./frontend/api_docs.html ./build/index.html
cp ./frontend/api.json ./build/api.json
