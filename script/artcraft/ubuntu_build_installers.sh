#!/usr/bin/env bash
# Build the ArtCraft Linux installers (.deb and AppImage) on Ubuntu 22.04 or newer.
#
#   ./script/artcraft/ubuntu_build_installers.sh [--install-deps] [--bundles deb,appimage,rpm]
#
# Output: target/release/bundle/{deb,appimage,rpm}/
# Install the .deb with: sudo apt install ./target/release/bundle/deb/ArtCraft_*_amd64.deb

set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
frontend_path="${root_dir}/frontend"
rust_crate_path="${root_dir}/crates/desktop/artcraft"

install_deps=0
bundles="deb,appimage"
while [ $# -gt 0 ]; do
  case "$1" in
    --install-deps) install_deps=1; shift ;;
    --bundles) bundles="$2"; shift 2 ;;
    -h | --help) sed -n '2,7p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [ "${install_deps}" = 1 ]; then
  # Tauri needs WebKitGTK 4.1 and GTK 3; wreq (BoringSSL) needs cmake, perl, nasm and clang.
  sudo apt-get update
  sudo apt-get install -y build-essential clang cmake file libayatana-appindicator3-dev \
    libgtk-3-dev librsvg2-dev libssl-dev libwebkit2gtk-4.1-dev libxdo-dev nasm patchelf perl
fi

if ! cargo tauri --version >/dev/null 2>&1; then
  echo 'ERROR: Install the Tauri CLI: cargo install tauri-cli --version "^2" --locked' >&2
  exit 1
fi

pushd "${frontend_path}" >/dev/null
npm ci
NODE_OPTIONS="--max-old-space-size=8192" npx nx run artcraft:build
popd >/dev/null

pushd "${rust_crate_path}" >/dev/null
# The frontend is already built, so skip Tauri's beforeBuildCommand. AppImage tooling runs
# without FUSE when extracted.
SQLX_OFFLINE=true APPIMAGE_EXTRACT_AND_RUN=1 \
  cargo tauri build --bundles "${bundles}" --config '{"build":{"beforeBuildCommand":""}}'
popd >/dev/null

ls -lh "${root_dir}"/target/release/bundle/*/ArtCraft*
