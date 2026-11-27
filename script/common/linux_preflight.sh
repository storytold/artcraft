#!/usr/bin/env bash
# Shared Linux system-dependency checks for the ArtCraft build scripts.
#
# Tauri links against GTK, WebKit, and D-Bus at build time. Installing only the
# runtime libraries is not enough: the matching -devel/-dev packages provide the
# pkg-config (.pc) files that Cargo's *-sys crates look up. Without them the
# build fails in crates such as gobject-sys with a misleading message about
# PKG_CONFIG_PATH not being set.
#
# Call linux_preflight before starting a Rust build. It returns immediately on
# non-Linux hosts, when the required modules are present, or when
# ARTCRAFT_SKIP_SYSTEM_PREFLIGHT=1.

# Keep this list aligned with the *-sys crates in Cargo.lock. gtk+-3.0 pulls in
# its own transitive requirements (atk, cairo, pango, gdk-pixbuf, gio, ...).
ARTCRAFT_LINUX_PKGCONFIG_MODULES=(
  glib-2.0
  gobject-2.0
  gtk+-3.0
  webkit2gtk-4.1
  javascriptcoregtk-4.1
  libsoup-3.0
  dbus-1
)

linux_preflight() {
  if [[ "$(uname -s)" != "Linux" ]] || [[ "${ARTCRAFT_SKIP_SYSTEM_PREFLIGHT:-0}" == "1" ]]; then
    return 0
  fi

  local pkg_config="${PKG_CONFIG:-pkg-config}"
  if ! command -v "${pkg_config}" >/dev/null 2>&1; then
    echo "ERROR: pkg-config is not installed (or not on PATH)." >&2
    echo "It is required to locate the GTK/WebKit/D-Bus build files." >&2
    echo "" >&2
    linux_preflight_print_install_hint >&2
    exit 1
  fi

  local missing=()
  local module
  for module in "${ARTCRAFT_LINUX_PKGCONFIG_MODULES[@]}"; do
    if ! "${pkg_config}" --exists "${module}"; then
      missing+=("${module}")
    fi
  done

  if [[ ${#missing[@]} -eq 0 ]]; then
    return 0
  fi

  echo "ERROR: Missing Linux build dependencies for the ArtCraft desktop app." >&2
  echo "" >&2
  echo "pkg-config could not find:" >&2
  for module in "${missing[@]}"; do
    echo "  - ${module}" >&2
  done
  echo "" >&2
  echo "These come from development packages, not the runtime libraries." >&2
  echo "A message about PKG_CONFIG_PATH being unset usually means the .pc files" >&2
  echo "are missing, not that the environment variable needs to be set by hand." >&2
  echo "" >&2
  linux_preflight_print_install_hint >&2
  echo "" >&2
  echo "If the packages are installed in a nonstandard prefix, set PKG_CONFIG_PATH" >&2
  echo "to the directory containing the .pc files." >&2
  echo "Set ARTCRAFT_SKIP_SYSTEM_PREFLIGHT=1 to bypass this check." >&2
  exit 1
}

linux_preflight_print_install_hint() {
  if command -v dnf >/dev/null 2>&1; then
    echo "Install them with:"
    echo "  sudo dnf install -y pkgconf-pkg-config glib2-devel gtk3-devel \\"
    echo "    webkit2gtk4.1-devel javascriptcoregtk4.1-devel libsoup3-devel \\"
    echo "    dbus-devel libappindicator-gtk3-devel"
  elif command -v apt-get >/dev/null 2>&1; then
    echo "Install them with:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install -y pkg-config libglib2.0-dev libgtk-3-dev \\"
    echo "    libwebkit2gtk-4.1-dev libsoup-3.0-dev libdbus-1-dev \\"
    echo "    libayatana-appindicator3-dev"
  elif command -v pacman >/dev/null 2>&1; then
    echo "Install them with:"
    echo "  sudo pacman -S --needed webkit2gtk-4.1 dbus libappindicator-gtk3 \\"
    echo "    pkgconf base-devel"
  else
    echo "Install your distribution's development packages for GLib, GTK 3,"
    echo "WebKitGTK 4.1, libsoup 3, D-Bus, and libappindicator, plus pkg-config"
    echo "and a C toolchain."
  fi
}
