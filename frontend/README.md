# Artcraft frontend

This Nx workspace contains the Tauri desktop frontend in `apps/artcraft` and its
shared libraries in `libs`. Website and Netlify builds live in `artcraft-services`.

Use Node.js 20 or newer and npm. Run the following commands from `frontend/`:

```bash
npm ci
npx nx dev artcraft
npx nx build artcraft
```

The frontend development server uses port 5173. Start the Rust app separately
from the repository root:

```bash
./script/artcraft/unix_rust_dev.sh
```

The repository-root frontend launcher installs dependencies and starts the same
server:

```bash
./script/artcraft/unix_frontend_dev.sh
```

On Windows, use `script/artcraft/windows_frontend_dev.ps1` and
`script/artcraft/windows_rust_dev.ps1` in separate terminals. See
[development setup](../_docs/dev_setup.md) for Rust and Tauri prerequisites.

The Vite build writes `apps/artcraft/dist`, which Tauri bundles. Public resources
come from `apps/artcraft/app/public`. The app also needs its retained libraries,
root package lock, TypeScript project references, and Nx/Vite configuration.
The aliases in `tsconfig.base.json` resolve shared libraries to their source for
both development and production. The desktop build does not require library
`dist/` outputs or a separate library build.

Import shared libraries by the names declared in their `package.json` files:

```ts
import { Button } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";
```

Use the workspace-local Nx version through `npx nx`. `npm ci` and the release
workflows use the checked-in lockfile; do not reinstall different Nx versions
inside CI.

`clean_modules.sh` is an explicit cleanup command that removes build outputs,
Nx caches, and frontend dependencies. Do not run it when preserving local build
outputs during repository pruning.
