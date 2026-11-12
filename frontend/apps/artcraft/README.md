# ArtCraft desktop frontend

This directory contains the React and Vite frontend packaged by the Tauri
desktop app. Backend services and website builds live in the separate
`artcraft-services` repository.

## Local development

Start with the [desktop development setup](../../../_docs/dev_setup.md) for
Rust, Tauri, Node.js, and platform prerequisites.

On macOS or Linux, run the combined launcher from the repository root:

```bash
./script/artcraft/unix_dev.sh
```

The launcher starts the frontend and Rust/Tauri together and selects an
available loopback port. The setup guide covers Windows commands, port
configuration, hot reload, and shutdown.

For frontend-only development, follow the [frontend workspace guide](../../README.md).
Install dependencies from `frontend/` and use the workspace-local Nx commands
documented there. A standalone frontend server does not start the Tauri app.

## Coding Rules and Styles

```
Short Style Guide TS React and Engine:

No use of lets

No basic for loop operators.
Use the collection operators and array operators.

React Side / No modules over 200 lines. ( loose rule )

Don't do:
if (condition) return;

Do:
if (condition) {
	return;
}

No use of any type.
If you can use chat gpt to create the interface.
```
