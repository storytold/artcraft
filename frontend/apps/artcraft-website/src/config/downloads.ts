// Current Mac version (update this when a new version is released)
// If a rollback is necessary, roll back to the last known good date.
// const MAC_VERSION = "2025.06.04";
// const MAC_VERSION = "2025.07.13";
// const MAC_VERSION = "2025.07.17";
// const MAC_VERSION = "2025.07.28";
// const MAC_VERSION = "2025.08.23"; // NB: The "08.22 (twenty two)" release is broken.
// const MAC_VERSION = "2025.09.23";
// const MAC_VERSION = "2025.09.24"; // Works! Good release.
// const MAC_VERSION = "2025.09.27";
export const MAC_VERSION = "2025.10.04"; // Sora 2

// Current Windows version (update this when a new version is released)
// If a rollback is necessary, roll back to the last known good date.
// const WINDOWS_VERSION = "2025.06.04";
// const WINDOWS_VERSION = "2025.07.13";
// const WINDOWS_VERSION = "2025.07.17";
// const WINDOWS_VERSION = "2025.07.28";
// const WINDOWS_VERSION = "2025.08.22";
// const WINDOWS_VERSION = "2025.09.23";
// const WINDOWS_VERSION = "2025.09.24"; // Works! Good release.
// const WINDOWS_VERSION = "2025.09.27";
export const WINDOWS_VERSION = "2025.10.04"; // Sora 2

const R2_BASE = "https://pub-3b58c874772a4e04b9c291815224128c.r2.dev";

export const DOWNLOAD_LINKS = {
  WINDOWS: `${R2_BASE}/windows/ArtCraft_0.0.1_x64-setup_${WINDOWS_VERSION}.exe`,
  MACOS: `${R2_BASE}/mac/ArtCraft_0.0.1_universal_${MAC_VERSION}.dmg`,
} as const;
