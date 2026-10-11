#!/usr/bin/env bash
set -euo pipefail

readonly APP_ID="ai.artcraft.app"
readonly BRANCH="stable"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
readonly ROOT_DIR
readonly RELEASE_TAG="${1:-}"
readonly PAGES_URL="${2:-}"
readonly BUILD_DIR="${FLATPAK_BUILD_DIR:-$ROOT_DIR/build/flatpak-builder}"
readonly REPO_DIR="${FLATPAK_REPO_DIR:-$ROOT_DIR/build/flatpak-repo}"
readonly MANIFEST="$ROOT_DIR/.github/flatpak/ai.artcraft.app.yml"

if [[ ! "$PAGES_URL" =~ ^https://[^[:space:]]+$ ]]; then
  echo "An HTTPS repository URL is required as the second argument" >&2
  exit 2
fi

: "${FLATPAK_GPG_KEY_ID:?FLATPAK_GPG_KEY_ID is required}"
: "${GNUPGHOME:?GNUPGHOME is required}"

for command in base64 curl flatpak flatpak-builder gpg node ostree; do
  command -v "$command" >/dev/null || {
    echo "Required command is unavailable: $command" >&2
    exit 1
  }
done

gpg --batch --list-secret-keys "$FLATPAK_GPG_KEY_ID" >/dev/null
RELEASE_VERSION="$(
  node "$ROOT_DIR/.github/scripts/verify-flatpak-pages-release.cjs" \
    "$RELEASE_TAG"
)"
readonly RELEASE_VERSION

rm -rf "$BUILD_DIR" "$REPO_DIR"
mkdir -p "$BUILD_DIR" "$REPO_DIR"
ostree --repo="$REPO_DIR" init --mode=archive-z2

ARCH="$(flatpak --default-arch)"
readonly ARCH
readonly APP_REF="app/$APP_ID/$ARCH/$BRANCH"

# Mirror recent published objects when available so upgrades and static deltas
# can use prior commits. A missing summary is the expected first-release case.
if curl --fail --silent --show-error --location \
  --output /dev/null "$PAGES_URL/summary"; then
  ostree --repo="$REPO_DIR" remote add --if-not-exists \
    --no-gpg-verify pages "$PAGES_URL"
  ostree --repo="$REPO_DIR" pull --mirror --depth=3 pages "$APP_REF"
fi

flatpak-builder \
  --user \
  --install-deps-from=flathub \
  --disable-rofiles-fuse \
  --force-clean \
  --gpg-sign="$FLATPAK_GPG_KEY_ID" \
  --repo="$REPO_DIR" \
  "$BUILD_DIR" \
  "$MANIFEST"

flatpak build-update-repo \
  --title=ArtCraft \
  --comment='Official ArtCraft desktop releases' \
  --description='Stable Flatpak releases of ArtCraft' \
  --homepage='https://getartcraft.com/' \
  --generate-static-deltas \
  --gpg-homedir="$GNUPGHOME" \
  --gpg-sign="$FLATPAK_GPG_KEY_ID" \
  --prune \
  --prune-depth=3 \
  "$REPO_DIR"

GPG_KEY="$(gpg --batch --export "$FLATPAK_GPG_KEY_ID" | base64 | tr -d '\n')"
readonly GPG_KEY

cat >"$REPO_DIR/artcraft.flatpakrepo" <<EOF
[Flatpak Repo]
Title=ArtCraft
Url=$PAGES_URL
Homepage=https://getartcraft.com/
Comment=Official ArtCraft desktop releases
Description=Signed stable Flatpak releases of ArtCraft
Icon=$PAGES_URL/icon.png
GPGKey=$GPG_KEY
EOF

cat >"$REPO_DIR/artcraft.flatpakref" <<EOF
[Flatpak Ref]
Name=$APP_ID
Branch=$BRANCH
Title=ArtCraft
IsRuntime=false
Url=$PAGES_URL
Homepage=https://getartcraft.com/
Comment=The IDE for interactive AI image and video creation
Icon=$PAGES_URL/icon.png
RuntimeRepo=https://dl.flathub.org/repo/flathub.flatpakrepo
GPGKey=$GPG_KEY
EOF

cp "$ROOT_DIR/crates/desktop/artcraft/icons/128x128.png" "$REPO_DIR/icon.png"
touch "$REPO_DIR/.nojekyll"

cat >"$REPO_DIR/index.html" <<EOF
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ArtCraft Flatpak repository</title>
</head>
<body>
  <main>
    <h1>ArtCraft Flatpak repository</h1>
    <p>Stable release <strong>$RELEASE_VERSION</strong> for <code>$ARCH</code>.</p>
    <p><a href="artcraft.flatpakrepo">Add the ArtCraft repository</a></p>
    <p>Or add the repository manually:</p>
    <pre>flatpak remote-add --if-not-exists artcraft $PAGES_URL/artcraft.flatpakrepo
flatpak install artcraft $APP_ID</pre>
    <p><a href="https://github.com/storytold/artcraft">Source and documentation</a></p>
  </main>
</body>
</html>
EOF

ostree --repo="$REPO_DIR" refs --list | grep --fixed-strings --line-regexp "$APP_REF"
test -s "$REPO_DIR/summary"
test -s "$REPO_DIR/summary.sig"
printf 'Prepared ArtCraft %s from %s in %s\n' \
  "$RELEASE_VERSION" "$RELEASE_TAG" "$REPO_DIR"
