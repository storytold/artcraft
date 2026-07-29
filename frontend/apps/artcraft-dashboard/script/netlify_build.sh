#!/bin/bash

set -euxo pipefail

# Build the ArtCraft admin dashboard.
#
# Like the other apps, this runs from the Netlify base directory (= the Nx
# workspace root, `frontend/`). But unlike them, the dashboard is intentionally
# ISOLATED from the Nx/npm workspace: it pins its own React 19 + Vite 7 +
# Tailwind 4 toolchain and installs with pnpm into its own node_modules.
#
# We build it entirely inside its own folder with pnpm, so it never depends on
# (or conflicts with) the workspace's React 18 install. The dashboard is
# excluded from the root npm `workspaces` globs, so Netlify's automatic
# `npm install` at the base directory ignores it — that exclusion is what keeps
# the workspace install fast and prevents the multi-minute dependency-resolution
# hangs we hit when the dashboard was a workspace member.

echo "Building artcraft-dashboard (standalone pnpm build)"

pushd apps/artcraft-dashboard

# Use the pnpm version pinned in package.json's `packageManager` field, via
# corepack (bundled with Node on Netlify). Disable the interactive download
# prompt so CI never blocks waiting for confirmation.
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

corepack pnpm install --frozen-lockfile
corepack pnpm build

echo "Final build files:"
find dist/

popd
