#!/usr/bin/env bash
set -euo pipefail
arch="$(uname -m)"
version="$(jq -r .version crates/desktop/artcraft/tauri.conf.json)"
base="artcraft-$version-linux-$arch"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/stage" dist/release
tar -xzf "dist/linux/$base.tar.gz" --strip-components=1 -C "$work/stage"
cp packaging/linux/flatpak.yml "$work/manifest.yml"
cp packaging/linux/artcraft-wrapper "$work/artcraft-wrapper"
flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
sign=()
keys=()
if [[ -n "${SIGNING_FPR:-}" ]]; then
  sign=(--gpg-sign="$SIGNING_FPR" --gpg-homedir="$GNUPGHOME")
  gpg --batch --armor --export "$SIGNING_FPR" > "$work/public.asc"
  keys=(--gpg-keys="$work/public.asc")
fi
flatpak-builder --user --install-deps-from=flathub --disable-rofiles-fuse --force-clean \
  --default-branch=stable --repo="$work/repo" "${sign[@]}" "$work/build" "$work/manifest.yml"
# Fail on missing WebKitGTK or other runtime libraries rather than shipping an unloadable binary.
# shellcheck disable=SC2016 # Expand these variables inside the Flatpak runtime shell.
flatpak build --runtime "$work/build" sh -c '
  dependencies=$(ldd /app/bin/artcraft.real) || exit 1
  printf "%s\n" "$dependencies"
  case "$dependencies" in *"not found"*) exit 1 ;; esac
'
flatpak build-bundle --runtime-repo=https://dl.flathub.org/repo/flathub.flatpakrepo \
  "${keys[@]}" "$work/repo" "dist/release/$base.flatpak" ai.artcraft.app stable
flatpak build-bundle --oci "$work/repo" "dist/release/$base-oci" ai.artcraft.app stable
skopeo inspect "oci:dist/release/$base-oci" >/dev/null
if [[ -n "${SIGNING_FPR:-}" ]]; then
  registry="ghcr.io/${GITHUB_REPOSITORY,,}"
  creds="$GITHUB_ACTOR:$GITHUB_TOKEN"
  skopeo copy --format oci --dest-creds "$creds" "oci:dist/release/$base-oci" "docker://$registry:$version-$arch"
  if [[ "$version" != *-* && ( "$GITHUB_REF" == refs/heads/release || "$GITHUB_REF" == refs/heads/artcraft-release ) ]]; then
    skopeo copy --format oci --dest-creds "$creds" "oci:dist/release/$base-oci" "docker://$registry:stable-$arch"
  fi
  skopeo inspect --raw --creds "$creds" "docker://$registry:$version-$arch" >"dist/release/$base.oci-manifest.json"

  if [[ -n "${DOCKERHUB_USERNAME:-}" && -n "${DOCKERHUB_TOKEN:-}" ]]; then
    dh_registry="docker.io/storytold/${GITHUB_REPOSITORY##*/}"
    dh_creds="$DOCKERHUB_USERNAME:$DOCKERHUB_TOKEN"
    skopeo copy --format oci --dest-creds "$dh_creds" "oci:dist/release/$base-oci" "docker://$dh_registry:$version-$arch"
    if [[ "$version" != *-* && ( "$GITHUB_REF" == refs/heads/release || "$GITHUB_REF" == refs/heads/artcraft-release ) ]]; then
      skopeo copy --format oci --dest-creds "$dh_creds" "oci:dist/release/$base-oci" "docker://$dh_registry:stable-$arch"
    fi
  fi
fi
