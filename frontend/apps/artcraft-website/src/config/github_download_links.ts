//const WINDOWS_VERSION = "0.7.0"; // 2026-02-23 Seedance
//const WINDOWS_VERSION = "0.11.0"; // 2026-03-02 Credits accounting
//const WINDOWS_VERSION = "0.14.0"; // 2026-03-10 WorldLabs native, Angles
//const WINDOWS_VERSION = "0.20.0"; // 2026-03-24 Reprompt, performance
const WINDOWS_VERSION = "0.32.0"; // 2026-04-03 characters + prompt box

//const MAC_VERSION = "0.7.0"; // 2026-02-23 Seedance
//const MAC_VERSION = "0.11.0"; // 2026-03-02 Credits accounting
//const MAC_VERSION = "0.14.0"; // 2026-03-10 WorldLabs native, Angles
//const MAC_VERSION = "0.20.0"; // 2026-03-24 Reprompt, performance
const MAC_VERSION = "0.32.0"; // 2026-04-03 characters + prompt box

// The published desktop builds are out of date — every download button and
// link on the site is hidden while this is false. Flip back on when a current
// release ships.
export const DOWNLOADS_ENABLED = false;

export const DOWNLOAD_LINKS = {
  WINDOWS: `https://github.com/storytold/artcraft/releases/download/artcraft-v${WINDOWS_VERSION}/ArtCraft_${WINDOWS_VERSION}_x64-setup.exe`,
  MACOS: `https://github.com/storytold/artcraft/releases/download/artcraft-v${MAC_VERSION}/ArtCraft_${MAC_VERSION}_universal.dmg`,
} as const;
