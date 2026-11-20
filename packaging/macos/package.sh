#!/usr/bin/env bash
# Build, sign and (optionally) notarize the macOS release artifact for ArtCraft Native:
#
#   $DIST/artcraft-native-<version>-macos-<arch>.dmg    ArtCraft.app on a drag-to-Applications DMG
#
# Usage: packaging/macos/package.sh [--arch universal|aarch64|x86_64] [--skip-build | --build-only]
#
# Options:
#   --arch         Target architecture(s): universal (default), aarch64, or x86_64
#   --skip-build   Package binary already present in $CARGO_TARGET_DIR/<target>/release
#   --build-only   Compile targets and exit before signing/packaging
#
# Signing (env):
#   MACOS_SIGN_IDENTITY   codesign identity (name or SHA-1). Default "-" = ad-hoc signing.
#   MACOS_KEYCHAIN        keychain holding MACOS_SIGN_IDENTITY (optional)
# Notarization (env; requires a real identity plus all three):
#   APPLE_ID, APPLE_PASSWORD, APPLE_TEAM_ID
set -euo pipefail
# shellcheck source=../env.sh
. "$(dirname "${BASH_SOURCE[0]}")/../env.sh"
HERE="$ROOT/packaging/macos"

ARCH=universal
SKIP_BUILD=0
BUILD_ONLY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --arch)
      if [ $# -lt 2 ]; then echo "missing value for --arch" >&2; exit 2; fi
      ARCH="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --build-only) BUILD_ONLY=1; shift ;;
    -h | --help) sed -n '2,17p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
case "$ARCH" in
  universal) TARGETS=(aarch64-apple-darwin x86_64-apple-darwin); WANT=(arm64 x86_64) ;;
  aarch64) TARGETS=(aarch64-apple-darwin); WANT=(arm64) ;;
  x86_64) TARGETS=(x86_64-apple-darwin); WANT=(x86_64) ;;
  *) echo "unknown --arch $ARCH" >&2; exit 2 ;;
esac
if [ "$SKIP_BUILD" = 1 ] && [ "$BUILD_ONLY" = 1 ]; then
  echo "--skip-build and --build-only can't be used together" >&2
  exit 2
fi

# Validate version and build SHA before Info.plist sed substitution and XML generation.
for value in "$VERSION" "${ARTCRAFT_BUILD_SHA:-unknown}"; do
  case "$value" in
    *[!0-9A-Za-z._+-]*)
      echo "error: version and build SHA may contain only letters, digits, '.', '_', '+' and '-': $value" >&2
      exit 2
      ;;
  esac
done

# Keep in sync with LSMinimumSystemVersion in Info.plist.in.
export MACOSX_DEPLOYMENT_TARGET=11.0
IDENTITY="${MACOS_SIGN_IDENTITY:--}"
SHORT_VERSION="${VERSION%%[-+]*}"
WORK="$CARGO_TARGET_DIR/macos-package"
APP="$WORK/ArtCraft.app"
DMG="$DIST/artcraft-native-$VERSION-macos-$ARCH.dmg"

NOTARIZE=0
SIGNING=adhoc
if [ "$IDENTITY" = "-" ]; then
  warn "macOS: ad-hoc signing (no MACOS_SIGN_IDENTITY); artifacts are not notarized"
elif [ -n "${APPLE_ID:-}" ] && [ -n "${APPLE_PASSWORD:-}" ] && [ -n "${APPLE_TEAM_ID:-}" ]; then
  NOTARIZE=1
  SIGNING=notarized
else
  SIGNING=signed
  warn "macOS: APPLE_ID / APPLE_PASSWORD / APPLE_TEAM_ID incomplete; signed but not notarized"
fi

echo "==> ArtCraft Native $VERSION for macOS ($ARCH), identity: $IDENTITY, notarize: $NOTARIZE"

# ---- build -------------------------------------------------------------------------------------
if [ "$SKIP_BUILD" = 0 ]; then
  args=()
  for t in "${TARGETS[@]}"; do args+=(--target "$t"); done
  (cd "$ROOT" && cargo build --release --locked -p artcraft_native --bin artcraft-native "${args[@]}")
fi

if [ "$BUILD_ONLY" = 1 ]; then
  echo "==> built; signing and packaging come next"
  exit 0
fi

rm -rf "$WORK"
mkdir -p "$WORK/bin"
inputs=()
for t in "${TARGETS[@]}"; do inputs+=("$CARGO_TARGET_DIR/$t/release/artcraft-native"); done
lipo -create -output "$WORK/bin/artcraft-native" "${inputs[@]}"
lipo -info "$WORK/bin/artcraft-native"
for arch in "${WANT[@]}"; do lipo "$WORK/bin/artcraft-native" -verify_arch "$arch"; done

# ---- signing helpers ---------------------------------------------------------------------------
sign() {
  local ts=(--timestamp)
  [ "$IDENTITY" = "-" ] && ts=(--timestamp=none)
  local kc=()
  [ -n "${MACOS_KEYCHAIN:-}" ] && kc=(--keychain "$MACOS_KEYCHAIN")
  codesign --force --sign "$IDENTITY" ${kc[@]+"${kc[@]}"} "${ts[@]}" "$@"
}

notarize() {
  local file="$1" out id status
  echo "==> notarizing $(basename "$file") (this can take a few minutes)"
  out="$(xcrun notarytool submit "$file" --apple-id "$APPLE_ID" --password "$APPLE_PASSWORD" \
    --team-id "$APPLE_TEAM_ID" --wait --timeout 1h --output-format json)" || true
  echo "$out"
  id="$(printf '%s' "$out" | plutil -extract id raw -o - - 2>/dev/null || true)"
  status="$(printf '%s' "$out" | plutil -extract status raw -o - - 2>/dev/null || true)"
  if [ "$status" != "Accepted" ]; then
    if [ -n "$id" ]; then
      xcrun notarytool log "$id" --apple-id "$APPLE_ID" --password "$APPLE_PASSWORD" --team-id "$APPLE_TEAM_ID" || true
    fi
    echo "error: notarization of $(basename "$file") failed (status: ${status:-unknown})" >&2
    exit 1
  fi
}

# hdiutil attaches a device while working, which can briefly fail with "Resource busy" in CI.
hdiutil_retry() {
  local what="$1" attempt
  for attempt in 1 2 3 4 5; do
    if hdiutil "$@"; then return 0; fi
    [ "$attempt" = 5 ] && { echo "hdiutil $what failed 5 times" >&2; return 1; }
    echo "hdiutil $what failed (attempt $attempt of 5); retrying in $((attempt * 5))s" >&2
    sleep $((attempt * 5))
  done
}

# ---- ArtCraft.app ------------------------------------------------------------------------------
echo "==> assembling $APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/Licenses"
cp "$WORK/bin/artcraft-native" "$APP/Contents/MacOS/ArtCraft"
ICON_SRC="$ROOT/crates/desktop/artcraft/icons/icon.icns"
if [ ! -f "$ICON_SRC" ]; then
  echo "error: missing app icon $ICON_SRC" >&2
  exit 1
fi
cp "$ICON_SRC" "$APP/Contents/Resources/ArtCraft.icns"
copy_docs "$APP/Contents/Resources/Licenses"

sed -e "s/@APP_ID@/$APP_ID/g" -e "s/@VERSION@/$VERSION/g" -e "s/@SHORT_VERSION@/$SHORT_VERSION/g" \
  -e "s/@BUILD_SHA@/${ARTCRAFT_BUILD_SHA:-unknown}/g" -e "s/@MIN_MACOS@/$MACOSX_DEPLOYMENT_TARGET/g" \
  "$HERE/Info.plist.in" >"$APP/Contents/Info.plist"
plutil -lint "$APP/Contents/Info.plist"
printf 'APPL????' >"$APP/Contents/PkgInfo"

# Sign inside-out: nested executable first, then the bundle itself.
sign --options runtime --entitlements "$HERE/entitlements.plist" "$APP/Contents/MacOS/ArtCraft"
sign --options runtime --entitlements "$HERE/entitlements.plist" "$APP"
codesign --verify --strict --deep --verbose=2 "$APP"

if [ "$NOTARIZE" = 1 ]; then
  ditto -c -k --keepParent "$APP" "$WORK/ArtCraft-notarize.zip"
  notarize "$WORK/ArtCraft-notarize.zip"
  xcrun stapler staple "$APP"
  xcrun stapler validate "$APP"
  spctl --assess --type execute -vvv "$APP"
fi

# ---- DMG ---------------------------------------------------------------------------------------
echo "==> building $DMG"
STAGE="$WORK/dmg"
mkdir -p "$STAGE"
ditto "$APP" "$STAGE/ArtCraft.app"
ln -s /Applications "$STAGE/Applications"
if [ -f "$HERE/dmg/background.tiff" ] && [ -f "$HERE/dmg/dmg-layout.DS_Store" ]; then
  mkdir -p "$STAGE/.background"
  cp "$HERE/dmg/background.tiff" "$STAGE/.background/background.tiff"
  cp "$HERE/dmg/dmg-layout.DS_Store" "$STAGE/.DS_Store"
fi
rm -f "$DMG"
hdiutil_retry create -volname "ArtCraft" -srcfolder "$STAGE" -fs HFS+ -format UDZO -imagekey zlib-level=9 -ov "$DMG"
sign "$DMG"
codesign --verify --strict --verbose=2 "$DMG"
if [ "$NOTARIZE" = 1 ]; then
  notarize "$DMG"
  xcrun stapler staple "$DMG"
  xcrun stapler validate "$DMG"
  spctl --assess --type open --context context:primary-signature -vvv "$DMG"
fi

if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "signing=$SIGNING" >>"$GITHUB_OUTPUT"; fi
echo "==> done (signing: $SIGNING)"
ls -lh "$DMG"
