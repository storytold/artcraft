#!/usr/bin/env bash
# Normalize Tauri packages and derive the suite's bin/share tarball from its Debian package.
set -euo pipefail
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
arch="${1:?architecture required}"
target="${2:?Rust target required}"
version="$(jq -r .version crates/desktop/artcraft/tauri.conf.json)"
case "$arch" in x86_64|aarch64|riscv64) ;; *) exit 2 ;; esac
base="artcraft-$version-linux-$arch"
bundle="target/$target/release/bundle"
mkdir -p dist/release
for format in deb rpm AppImage; do
  mapfile -t files < <(find "$bundle" -type f -name "*.$format")
  if [[ "$arch" == riscv64 && "$format" == AppImage ]]; then continue; fi
  [[ ${#files[@]} == 1 ]] || { echo "Expected one $format in $bundle, found ${#files[@]}" >&2; exit 1; }
  cp "${files[0]}" "dist/release/$base.$format"
done
if [[ "$arch" != riscv64 ]]; then
  zsyncmake -u "https://github.com/storytold/artcraft/releases/download/artcraft-v$version/$base.AppImage" \
    -o "dist/release/$base.AppImage.zsync" "dist/release/$base.AppImage"
fi
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
dpkg-deb -x "dist/release/$base.deb" "$work/deb"
mkdir -p "$work/$base"
cp -a "$work/deb/usr/." "$work/$base/"
mapfile -t desktops < <(find "$work/$base/share/applications" -name '*.desktop')
[[ ${#desktops[@]} == 1 ]] || { echo 'Expected one desktop entry' >&2; exit 1; }
if [[ "${desktops[0]}" != "$work/$base/share/applications/ai.artcraft.app.desktop" ]]; then
  mv "${desktops[0]}" "$work/$base/share/applications/ai.artcraft.app.desktop"
fi
install -Dm644 "$script_dir/ai.artcraft.app.metainfo.xml" "$work/$base/share/metainfo/ai.artcraft.app.metainfo.xml"
sed -i 's/^Name=.*/Name=ArtCraft Studio/' "$work/$base/share/applications/ai.artcraft.app.desktop"
test -x "$work/$base/bin/artcraft"
case "$arch" in
  x86_64) machine='Advanced Micro Devices X86-64' ;;
  aarch64) machine='AArch64' ;;
  riscv64) machine='RISC-V' ;;
esac
readelf -h "$work/$base/bin/artcraft" | grep -F "$machine"
if [[ "$arch" == "$(uname -m)" ]]; then
  dependencies="$(ldd "$work/$base/bin/artcraft")"
  if grep -q 'not found' <<< "$dependencies"; then
    printf '%s\n' "$dependencies" >&2
    exit 1
  fi
fi
# The tarball layout is consumed by the launcher, Arch packaging and Flatpak.
tar -czf "dist/release/$base.tar.gz" -C "$work" "$base"
case "$arch" in x86_64) deb_arch=amd64 ;; aarch64) deb_arch=arm64 ;; riscv64) deb_arch=riscv64 ;; esac
[[ "$(dpkg-deb -f "dist/release/$base.deb" Architecture)" == "$deb_arch" ]]
[[ "$(rpm -qp --qf '%{ARCH}' "dist/release/$base.rpm")" == "$arch" ]]
dpkg-deb --info "dist/release/$base.deb"
rpm -qp --requires "dist/release/$base.rpm"
