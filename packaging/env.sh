# shellcheck shell=bash
# Shared setup for ArtCraft Native macOS packaging scripts. Source it: `. "$(dirname "$0")/../env.sh"`.
# Adapted from MailCraft, FieldCraft, and ProjectCraft packaging (MIT OR Apache-2.0).
#
# Exports:
#   ROOT                    workspace root
#   VERSION                 [package] version from artcraft-native/Cargo.toml (override: ARTCRAFT_NATIVE_VERSION)
#   DIST                    output directory for release artifacts (default: $ROOT/dist/release)
#   ARTCRAFT_BUILD_SHA      git commit recorded in the macOS Info.plist
#   ARTCRAFT_BUILD_DATE     UTC build date, YYYY-MM-DD
#   CARGO_TARGET_DIR        absolute cargo target dir (default: $ROOT/target)
#   APP_ID                  reverse-DNS macOS bundle identifier

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export ROOT

# Read [package] version from artcraft-native/Cargo.toml.
package_version() {
  awk '
    /^\[/ { in_pkg = ($0 == "[package]") ; next }
    in_pkg && $1 == "version" { gsub(/[" ]/, "", $3); print $3; exit }
  ' "$ROOT/artcraft-native/Cargo.toml"
}

VERSION="${ARTCRAFT_NATIVE_VERSION:-$(package_version)}"
if [ -z "$VERSION" ]; then
  echo "error: could not read [package] version from $ROOT/artcraft-native/Cargo.toml" >&2
  exit 1
fi
export VERSION

DIST="${DIST:-$ROOT/dist/release}"
mkdir -p "$DIST"
DIST="$(cd "$DIST" && pwd)"
export DIST

ARTCRAFT_BUILD_SHA="${ARTCRAFT_BUILD_SHA:-$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)}"
export ARTCRAFT_BUILD_SHA
ARTCRAFT_BUILD_DATE="${ARTCRAFT_BUILD_DATE:-$(date -u +%Y-%m-%d)}"
export ARTCRAFT_BUILD_DATE

# Resolve any relative CARGO_TARGET_DIR override against the caller's working directory
# before subshells cd into $ROOT for cargo build.
case "${CARGO_TARGET_DIR:-}" in
  "") CARGO_TARGET_DIR="$ROOT/target" ;;
  /*) ;;
  *) CARGO_TARGET_DIR="$PWD/$CARGO_TARGET_DIR" ;;
esac
export CARGO_TARGET_DIR

APP_ID="ai.artcraft.native"
export APP_ID

# Emit a GitHub Actions warning (plain stderr outside Actions).
warn() {
  if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::warning::$*"; else echo "warning: $*" >&2; fi
}

# Copy repository licence and readme files into a package directory.
copy_docs() {
  local dest="$1" f
  for f in README.md LICENSE LICENSE-MIT LICENSE-APACHE NOTICE ATTRIBUTION.md COPYRIGHT; do
    if [ -f "$ROOT/$f" ]; then cp "$ROOT/$f" "$dest/"; fi
  done
  if [ -f "$ROOT/artcraft-native/README.md" ]; then
    cp "$ROOT/artcraft-native/README.md" "$dest/README-artcraft-native.md"
  fi
  copy_font_licences "$dest"
}

# Copy bundled font licences (ArtCraft Native fonts, egui default fonts, and optional CRAFT_FONTS_DIR).
copy_font_licences() {
  local dest="$1" f
  mkdir -p "$dest/artcraft-native-fonts" "$dest/egui-default-fonts"
  for f in OFL-Archivo.txt OFL-GeistMono.txt OFL-Inter.txt; do
    if [ ! -f "$ROOT/artcraft-native/assets/fonts/$f" ]; then
      echo "error: missing required bundled font licence $ROOT/artcraft-native/assets/fonts/$f" >&2
      exit 1
    fi
    cp "$ROOT/artcraft-native/assets/fonts/$f" "$dest/artcraft-native-fonts/"
  done
  for f in Hack-Regular.txt NOTICES.txt OFL.txt UFL.txt emoji-icon-font-mit-license.txt; do
    if [ ! -f "$ROOT/licenses/egui-default-fonts/$f" ]; then
      echo "error: missing required egui default font licence $ROOT/licenses/egui-default-fonts/$f" >&2
      exit 1
    fi
    cp "$ROOT/licenses/egui-default-fonts/$f" "$dest/egui-default-fonts/"
  done
  [ -n "${CRAFT_FONTS_DIR:-}" ] || return 0
  for f in "$CRAFT_FONTS_DIR"/fonts/*/OFL.txt; do
    if [ -f "$f" ]; then cp "$f" "$dest/OFL-$(basename "$(dirname "$f")").txt"; fi
  done
}

# Portable SHA-256 checksum helper.
sha256() {
  if command -v sha256sum >/dev/null; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi
}
