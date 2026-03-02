#!/bin/bash
#
set -euxo pipefail

# Resolve the repo root regardless of where this script is invoked from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

# boring-sys2 uses bindgen (libclang) to generate Rust FFI bindings for BoringSSL.
# On Netlify's build image, clang is available but can't locate stddef.h on its
# own because the GCC system header path isn't in its default search path.
# Pointing bindgen at GCC's own include directory resolves this without any
# package installation.
export BINDGEN_EXTRA_CLANG_ARGS="-I$(gcc -print-file-name=include)"

# Install Rust toolchain
rustup update
rustup default stable

# Emit versions
rustup show

mkdir -p ./build

SQLX_OFFLINE=true cargo run --bin docs-cli

mv api.json ./build
cp ./frontend/api_docs.html ./build/index.html


