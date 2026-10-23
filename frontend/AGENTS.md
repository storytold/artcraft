# Frontend boundaries

Read the root instructions and `_docs/agent-repository-guide.md` from the repository
root. Use the existing Nx/React/Vite/Zustand/Three.js structure and two-space style.
Inspect the owning package's scripts and test configuration before choosing a command;
do not assume every library exposes the same test target.

- Keep host-specific HTTP, upload, auth and navigation in the owning adapter. Reuse
  existing components and stores rather than creating a parallel state authority.
- For UI defects, reproduce the observable event/state sequence in the owning test
  suite before fixing. Include refusal, cancellation and teardown paths where relevant.
- In pagescene, load its nested instructions: keep canvases mounted, preserve the
  engine → bus → bridge → store → React flow and route shortcuts through the registry.
- Mechanical interaction checks and native-webview/visual evidence are separate.
  Browser-only success does not prove Tauri IPC, cookies or native filesystem behavior.
- Use synthetic fixtures and local servers by default. Live uploads, provider calls,
  account operations and paid generation are not ordinary test dependencies.

Run affected tests/build targets and broaden for shared libraries. For login, origin,
port or session changes also follow `docs/desktop-session-regression.md` from the root.
