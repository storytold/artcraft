# ArtCraft Launcher Flatpak Build

This directory contains the Flatpak manifest for building the ArtCraft Launcher.

## Building

```bash
flatpak-builder --repo=artcraft-launcher-repo build-dir manifest.json
flatpak build-export artcraft-launcher-repo build-dir
flatpak build-bundle artcraft-launcher-repo artcraft-launcher.flatpak ai.storyteller.artcraft-launcher
```

## Installation

```bash
flatpak install --user --bundle artcraft-launcher.flatpak
```

## Key Fixes in This Manifest

1. **D-Bus Permissions**: Added missing service permissions for tray icons and notifications
2. **Cleanup**: Removes development artifacts that cause sandbox conflicts
3. **Binary Stripping**: Reduces size and removes debug symbols
4. **Environment Variables**: Proper X11/Wayland and D-Bus setup

## Testing

The app should now:
- Launch without hanging in `do_epoll_wait`
- Connect to D-Bus services successfully
- Display tray icons (if supported)
- Access GPU resources via DRI

## Troubleshooting

If issues persist:
1. Check logs: `flatpak run --log-level=debug ai.storyteller.artcraft-launcher`
2. Verify D-Bus: `dbus-send --session --dest=org.freedesktop.DBus --print-reply /org/freedesktop/DBus org.freedesktop.DBus.ListNames`
3. Check sandbox: `flatpak enter ai.storyteller.artcraft-launcher bash`
