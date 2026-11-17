#!/usr/bin/env bash
# Integration fixture: real DEB/RPM archives, with no Rust compilation or signing key.
set -euo pipefail
bash "$(dirname "$0")/flatpak-update-test.sh"
script="$(realpath "$(dirname "$0")/package.sh")"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cd "$work"
mkdir -p crates/desktop/artcraft target/x86_64-unknown-linux-gnu/release/bundle/{deb,rpm,appimage}
printf '{"version":"0.42.0"}\n' > crates/desktop/artcraft/tauri.conf.json
mkdir -p stage/{DEBIAN,usr/bin,usr/share/applications}
cp /bin/true stage/usr/bin/artcraft
printf '[Desktop Entry]\nType=Application\nName=ArtCraft\nExec=artcraft\n' > stage/usr/share/applications/ArtCraft.desktop
cat > stage/DEBIAN/control <<'CONTROL'
Package: artcraft
Version: 0.42.0
Architecture: amd64
Maintainer: Fixture <fixture@example.invalid>
Description: Packaging fixture
CONTROL
dpkg-deb --build stage target/x86_64-unknown-linux-gnu/release/bundle/deb/ArtCraft.deb
mkdir -p rpmbuild/{BUILD,RPMS,SOURCES,SPECS,SRPMS}
cat > rpmbuild/SPECS/artcraft.spec <<'SPEC'
Name: artcraft
Version: 0.42.0
Release: 1
Summary: Packaging fixture
License: MIT
%description
Packaging fixture
%install
mkdir -p %{buildroot}/usr/bin
cp /bin/true %{buildroot}/usr/bin/artcraft
%files
/usr/bin/artcraft
SPEC
rpmbuild --define "_topdir $work/rpmbuild" -bb rpmbuild/SPECS/artcraft.spec
find rpmbuild/RPMS -name '*.rpm' -exec cp {} target/x86_64-unknown-linux-gnu/release/bundle/rpm/ \;
printf 'appimage fixture\n' > target/x86_64-unknown-linux-gnu/release/bundle/appimage/ArtCraft.AppImage
"$script" x86_64 x86_64-unknown-linux-gnu
for format in deb rpm AppImage AppImage.zsync tar.gz; do [[ -s "dist/release/artcraft-0.42.0-linux-x86_64.$format" ]]; done
mkdir unpacked
tar -xzf dist/release/artcraft-0.42.0-linux-x86_64.tar.gz -C unpacked
[[ -x unpacked/artcraft-0.42.0-linux-x86_64/bin/artcraft ]]
[[ -f unpacked/artcraft-0.42.0-linux-x86_64/share/applications/ai.artcraft.app.desktop ]]
rm target/x86_64-unknown-linux-gnu/release/bundle/rpm/*.rpm
if "$script" x86_64 x86_64-unknown-linux-gnu; then
  echo 'Packaging accepted a missing RPM' >&2
  exit 1
fi
echo 'Package integration checks passed'
