#!/bin/bash
#
set -euxo pipefail

# Resolve the repo root regardless of where this script is invoked from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

# Install system dependencies
# libclang-dev is required by boring-sys2's build script, which uses bindgen
# (a libclang-based tool) to generate Rust FFI bindings for BoringSSL.
# Without it, clang cannot find stddef.h and the build fails.
sudo apt-get update -y
sudo apt-get install -y libclang-dev

# Install Rust toolchain
rustup update
rustup default stable

# Emit versions
rustup show

mkdir -p ./build

SQLX_OFFLINE=true cargo run --bin docs-cli

mv api.json ./build
cp ./frontend/api_docs.html ./build/index.html


