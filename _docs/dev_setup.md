Dev Setup
=========

# ArtCraft 

ArtCraft is a Rust / Tauri app.

To set up the ArtCraft development environment,  install the following:

1. [Install Rust](https://doc.rust-lang.org/cargo/getting-started/installation.html). (rustc/cargo version `1.96.0` works at time of writing.)
2. Install cmake, e.g. `brew install cmake` on macOS. (Version `4.4.2` works at time of writing.) This is required to build BoringSSL via `boring-sys2` (a dependency of `wreq`); without it, the Rust build fails with "is `cmake` not installed?".
3. [Install npm](https://nodejs.org/en/download) or [nvm](https://github.com/nvm-sh/nvm). Node `v22.22.2` / npm `10.9.7` work at time of writing (minimum: Node ≥ 20).
4. [Install nx](https://nx.dev/docs/getting-started/installation) **globally** (`npm install -g nx`). Nx version `23.1.1` works at time of writing. The frontend dev script calls bare `nx`, which is not resolved from `node_modules/.bin` when run from a shell script, so a global install is required.
5. [Install Tauri CLI](https://v2.tauri.app/reference/cli/). (Version `cargo-tauri 2.11.4` works at time of writing.)

An easy way to get started with running the app in development is to run the two commands (in separate terminals):

**Mac and Linux Development** 

```bash
# Run the frontend dev server
./script/artcraft/unix_frontend_dev.sh

# Run the Tauri Rust application
./script/artcraft/unix_rust_dev.sh
```

**Windows Development**

```powershell
# Run the frontend dev server
.\script\artcraft\windows_frontend_dev.ps1

# Run the Tauri Rust application
.\script\artcraft\windows_rust_dev.ps1
```


# ArtCraft Server

ArtCraft's server is a Rust / Actix app called `storyteller-web`.

You don't need to run this to develop the ArtCraft application, but it can be useful to spin up 
a development instance for adding new server functions or as your own private local copy.

See [dev_setup_server.md](./dev_setup_server.md) for instructions.
