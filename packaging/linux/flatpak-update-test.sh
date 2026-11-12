#!/usr/bin/env bash
# A bundle must reach releases, honor launcher choices, and invoke the verified host updater.
set -euo pipefail
manifest="$(dirname "$0")/flatpak.yml"
for permission in --share=network --talk-name=org.freedesktop.Flatpak --filesystem=xdg-data/ArtCraft/versions:ro; do
  if ! grep -Fxq -- "  - $permission" "$manifest"; then
    echo "Missing Flatpak update permission: $permission" >&2
    exit 1
  fi
done
