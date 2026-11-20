---
title: ArtCraft crashes on launch under Wayland (Linux)
description: A source-built ArtCraft closes at start on Wayland with a WebKit error. Start it with WEBKIT_DISABLE_DMABUF_RENDERER=1.
order: 20
verified: 0.41.0
---

Start ArtCraft with the environment variable `WEBKIT_DISABLE_DMABUF_RENDERER=1`. This fixed the crash for the person who reported it. You need it only for a build you made yourself.

## Symptoms

- ArtCraft closes right after you start it, on a Wayland session.
- The terminal shows messages like these:

      Gdk-Message: Error 71 (Protocol error) dispatching to Wayland display.
      ERROR: WebKit encountered an internal error. This is a WebKit bug.

- The same output mentions `networkProcessCrashed`.

The reporter ran ArtCraft 0.42.0 built from source (unreleased code from main) as an AppImage, on CachyOS (Arch) with webkit2gtk-4.1 2.52.6. ArtCraft has no official Linux download yet. See [ArtCraft on Linux](../getting-started/install-linux.md).

## Fix

1. Open a terminal.
2. Start the app with the variable set. For an AppImage you built, run:

       WEBKIT_DISABLE_DMABUF_RENDERER=1 ./<the AppImage you built>

   Replace the file name with the name of your own build. It is not a download.
3. If you start ArtCraft from a launcher or a desktop file, add the same variable to the command there.

## Why this happens

ArtCraft draws its window with WebKitGTK. On this setup the WebKit process crashes when it uses the DMABUF renderer. The variable turns that renderer off.

The project's development scripts already set this variable. Release builds do not, so the crash shows up only outside development.

## Status of the fix

A fix is proposed in pull request [#2056](https://github.com/storytold/artcraft/pull/2056). It sets the variable for you on Linux, unless you set it yourself. The pull request was still open when this page was checked, and the issue ([#2055](https://github.com/storytold/artcraft/issues/2055)) was open. The author of the pull request did not rebuild the AppImage with the change. Until it is released, use the steps above.

The workaround has been reported on one setup only. It has not been tested on others.

## Still stuck?

Ask in [Discord](https://discord.gg/artcraft) or comment on [#2055](https://github.com/storytold/artcraft/issues/2055). Include:

- your distribution and version
- X11 or Wayland, and your graphics card and driver
- the WebKitGTK version
- how you built or installed ArtCraft
- the full text the terminal prints at start
