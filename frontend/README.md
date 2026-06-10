# Frontend

This is an `nx` monorepo that can contain multiple apps and shared libraries.

All commands to run these projects are performed from _this_ directory
(except the repo-root launcher scripts noted below).

## Requirements

- **Node.js 20+** (Nx 21 / Vite 6 requirement). Install via [nvm](https://github.com/nvm-sh/nvm),
  [nodejs.org](https://nodejs.org), or `brew install node`.
- **npm** (ships with Node).

> **We use npm, not pnpm.** pnpm was briefly adopted ("add pnpm to solve build
> issues") and later removed ("fix(frontend): consume video-editor libs via nx
> path aliases, drop pnpm"). If you have leftovers from that era — a
> `pnpm-lock.yaml`, `pnpm-workspace.yaml`, or a `node_modules/.pnpm` directory —
> npm installs will fail (typically with `ENOTEMPTY` rename errors). See
> Troubleshooting below.

## Install dependencies

```
npm install
```

## Running the apps in dev mode

From the **repository root**, the launcher scripts (these preflight your
environment, install dependencies, and free the dev port first):

```bash
./script/website/unix_frontend_dev.sh           # artcraft-website (marketing site), port 4200
./script/website/unix_frontend_webapp_dev.sh    # artcraft-webapp (user dashboard), port 4201
./script/artcraft/unix_frontend_dev.sh          # artcraft (Tauri app frontend), port 5173
```

Or directly from this directory:

```bash
nx dev artcraft-website
nx dev artcraft-webapp
nx dev artcraft        # NB: the Tauri app also needs the Rust dev server running
nx dev editor2d
```

## Building

```bash
npx nx build artcraft-website
npx nx build artcraft-webapp
npx nx build artcraft
npx nx build editor2d
```

Netlify deploys run `apps/<app>/script/netlify_build.sh` (see each app's
`netlify.toml`).

## Troubleshooting

### `npm install` fails with `ENOTEMPTY: directory not empty, rename ...`

Your `node_modules` tree is corrupted — usually an interrupted install, or a
tree written by pnpm back when the repo briefly used it. Fix:

```bash
./clean_modules.sh
npm install
```

Or the manual minimum:

```bash
rm -rf node_modules .nx pnpm-lock.yaml pnpm-workspace.yaml
npm install
```

### Stale build state after switching branches

Call this when starting on main or a new branch:

```bash
./clean_modules.sh
```

It removes all `dist/` outputs, resets the nx cache, and removes
`node_modules`.

## Import aliases

The names for `@frontend` and `@storyteller` come from the `package.json` file
in the libs folder:

```ts
import { Login } from "@frontend/login";
import { api } from "@storyteller/api";
```

For shared UI components, import from `@storyteller/ui-[componentname]`:

```ts
import { Button } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";
```

## Generating a new component library

```bash
# 1. Generate the library
npx nx g @nx/react:library libs/components/toaster --import-path=@storyteller/ui-toaster --bundler=vite
npm install

# 2. Import it somewhere in code

# 3. Sync and build
nx sync
nx build
```
