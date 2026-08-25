# Artcraft MCP server

Cloudflare Worker at `mcp.getartcraft.com`. Read `CLAUDE.md` first — it holds the constraints,
the architecture, and the working method; this file is only how to run things.

## Run locally

```sh
corepack enable            # once; provides the pinned pnpm
pnpm install
cp .dev.vars.example .dev.vars

pnpm --filter @artcraft/mcp-fake-upstream dev   # fake API on http://localhost:12345
pnpm dev                                        # MCP server on http://localhost:8787
```

Local never talks to production: `wrangler.toml`'s top-level block points at the fake, and
`src/config.ts` refuses to start otherwise.

## Check everything

```sh
pnpm check     # typecheck (regenerates Worker types) · lint · format · test
pnpm test      # vitest, inside workerd with the local bindings
```

## Deploy

Deploys run from `.github/workflows/mcp.yml` on `main` once the Cloudflare secrets exist
(`docs/infra-request.md`). Manual deploys, when needed:

```sh
pnpm deploy:preview       # workers.dev, talks to the deployed fake
pnpm deploy:production    # mcp.getartcraft.com, talks to api.storyteller.ai
```

## Layout

See `CLAUDE.md` → Layout.
