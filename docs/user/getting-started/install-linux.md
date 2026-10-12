---
title: ArtCraft on Linux
description: ArtCraft has no official Linux download yet. This page says what exists today and what is still open.
order: 40
verified: 0.42.0
---

There is no official Linux download yet. Releases and the download page cover Windows and macOS only. You can build ArtCraft from source.

## Status

- The latest release, 0.41.0, has a Windows installer, a Windows `.msi` and a macOS disk image. It has no Linux file.
- Linux installers (an Ubuntu `.deb` and an AppImage) are proposed in pull request [#2007](https://github.com/storytold/artcraft/pull/2007). It was still open when this page was checked.
- People have asked for Linux support in [#2002](https://github.com/storytold/artcraft/issues/2002), [#1392](https://github.com/storytold/artcraft/issues/1392), [#2075](https://github.com/storytold/artcraft/issues/2075) and [#2035](https://github.com/storytold/artcraft/issues/2035). All are open.
- NixOS (flake) and Flatpak support is requested in [#1974](https://github.com/storytold/artcraft/issues/1974). It is open and has no replies.

## Build from source

The README points Linux users to the [development setup guide](https://github.com/storytold/artcraft/blob/main/_docs/dev_setup.md). That guide is written for developers.

The repository has a build script, `script/artcraft/unix_build.sh`. In issue [#2055](https://github.com/storytold/artcraft/issues/2055) a user built an AppImage with it.

## Known problem: crash on Wayland

A source build can crash at start on Wayland with a WebKit error. The reporter in [#2055](https://github.com/storytold/artcraft/issues/2055) started the app with this environment variable set:

    WEBKIT_DISABLE_DMABUF_RENDERER=1 ./ArtCraft_0.42.0_amd64.AppImage

Their fix is proposed in pull request [#2056](https://github.com/storytold/artcraft/pull/2056), which was still open when this page was checked. The workaround worked for that reporter. It has not been tested on other setups.

## What is not supported yet

This page does not list which Linux distributions or graphics drivers work, because the project has not published that. Some issues mention packages made by the community. Those are not checked here.

## Still stuck?

Ask in [Discord](https://discord.gg/artcraft) or comment on one of the issues above.
