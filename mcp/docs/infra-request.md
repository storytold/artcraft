# Artcraft MCP — one-time infrastructure request

For the backend team, who hold the Cloudflare account, the GitHub repo secrets, and the
Google Cloud console. Everything below is one-time setup; nothing recurring. Items are
ordered so that partial completion still unblocks something. None of it changes
`storyteller-web` or any Rust code.

Context: `mcp/CLAUDE.md` and the design doc linked there.

## 1. Cloudflare (unblocks real deploys)

| Item                         | Value / notes                                                                 |
|------------------------------|-------------------------------------------------------------------------------|
| Workers project              | name `artcraft-mcp` (matches `mcp/wrangler.toml`)                             |
| KV namespace                 | one, named `artcraft-mcp-oauth`; id goes into `wrangler.toml` `[[kv_namespaces]]` |
| API token                    | scoped to: Workers Scripts:Edit, Workers KV Storage:Edit, Account Settings:Read (for the account id). Not a global key. |
| Account id                   | needed alongside the token                                                    |
| Custom domain (can be later) | `mcp.getartcraft.com` → Workers custom domain if the zone is on Cloudflare; otherwise a CNAME to the `workers.dev` hostname we'll provide |
| Secrets on the Worker        | we set these ourselves via `wrangler secret put` once we have the token; nothing for you to enter |

## 2. GitHub repository secrets (unblocks CI deploys)

| Secret name             | Value                                        |
|-------------------------|----------------------------------------------|
| `CLOUDFLARE_API_TOKEN`  | the token from §1                            |
| `CLOUDFLARE_ACCOUNT_ID` | the account id from §1                       |
| `SMOKE_USERNAME`        | the production demo account's username       |
| `SMOKE_PASSWORD`        | its password                                 |

The workflow that reads them is `.github/workflows/mcp.yml`, path-filtered on `mcp/**`.
It only deploys on `main`; pull requests run lint/typecheck/tests and nothing else.

## 3. Google Cloud console (unblocks "Continue with Google" on the consent page)

On the existing OAuth client `788843034237-uqcg8tbgofrcf1to37e1bqphd924jaf6.apps.googleusercontent.com`
(the one `storyteller-web` already verifies against — no backend change needed):

- Add `https://mcp.getartcraft.com` to **Authorized JavaScript origins**.
- Add `https://artcraft-mcp.<account-subdomain>.workers.dev` as well, for previews.

No new client, no new secret. Until this is done, the consent page offers password sign-in
only.

## 4. Demo account

Confirm the production demo account may be used for automated read-only smoke tests
after each deploy and a weekly scheduled run. The tests never generate, upload, or delete,
so credits are not consumed.

## What we'll send back once §1 is done

- The `workers.dev` hostname (for the CNAME in §1 and the origin in §3).
- The KV namespace id confirmation in `wrangler.toml`.
