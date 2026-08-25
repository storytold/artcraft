# Artcraft MCP Server (`mcp/`)

A standalone TypeScript service at `mcp.getartcraft.com` that lets people connect Claude,
ChatGPT, Gemini CLI and other MCP clients to their own Artcraft account. Read-only in M1
(credits, account, job status, model catalog, cost estimates). It talks to the production
Artcraft API (`storyteller_web`) exactly like a browser would, on the user's behalf.

Design doc (decisions, auth flow, tool table, milestones):
https://claude.ai/code/artifact/ba27f019-b444-4d93-ba45-b6703edec913

This file is the standing context for anyone (human or Claude) working in `mcp/`. The rules
below are constraints, not suggestions. When a rule and convenience conflict, the rule wins;
raise it with the owner rather than working around it.

## Hard constraints (decided 2026-08-24)

- **No changes to the Rust backend.** Ever, from this project. Every gap is absorbed here.
  Findings that need backend work go in `mcp/docs/backend-handoff.md`, not in a PR to `crates/`.
- **No changes to the webapp (`frontend/apps/artcraft-webapp`) without explicit owner approval.**
  The only candidate changes are (a) a "Connected AI apps" settings link and (b) the M2
  `/connect` sign-in hand-off. Bring the exact diff and the justification *before* writing it.
- **Do not hand-roll the OAuth authorization server.** Use `@cloudflare/workers-oauth-provider`.
  It is a solved problem; owning one is not a good use of this project's time. Wrap it behind
  our interfaces; never fork it.
- **Minimize involvement of other teams and surface area outside `mcp/`.** DNS, Google Cloud
  console, repo secrets are other people's; design so their absence delays nothing (ship on
  `*.workers.dev`, fall back to password sign-in until the Google origin is added, etc.).
- **Hosting is Cloudflare Workers.** KV for OAuth state. `wrangler deploy` is the release.
- **Read-only in M1.** No tool may spend credits, upload, mutate, or delete. The upstream path
  allowlist enforces this in code (see Architecture) — not tool descriptions, not model behaviour.

## Environments — one code path, bindings not branches

The MCP Worker has exactly one code path. Which upstream it talks to, which KV namespace it
uses, and which Google client id it presents are **Worker bindings** read once at
construction (`UPSTREAM_API_HOST`, KV id, `GOOGLE_CLIENT_ID`). There is no `if (env)` in
`mcp/src`, no debug mode, no test-only behaviour. Configuration lives in `wrangler.toml`
`[env.*]` blocks and is reviewed in git like code.

| Env          | MCP server                              | Upstream                                  | Used for                                                        |
|--------------|-----------------------------------------|-------------------------------------------|-----------------------------------------------------------------|
| `local`      | `wrangler dev`                          | `fake-upstream` on `localhost:12345`      | the daily loop: unit / contract / OAuth tests, MCP Inspector, SDK client |
| `preview`    | PR deploy on `*.workers.dev`, own KV    | deployed `fake-upstream` Worker           | real Claude.ai / ChatGPT / Gemini CLI end-to-end, fake data and credits |
| `production` | `mcp.getartcraft.com`, own KV           | `https://api.storyteller.ai`              | read-only smoke with the demo account, post-deploy and weekly   |

### `mcp/fake-upstream/` — a fake of the API, not of this server

A separate package with its own `wrangler.toml` and Worker name (`artcraft-api-fake`):
in-memory, seeded fixture, stateful for a session, no database, no third-party calls,
sign-in as `localdev1` / `localdev1pass`. It implements only the allowlisted routes plus
sign-in/sign-out, and every response it emits is validated against the published
`api.json` in CI so it cannot drift silently.

It is **ported from** the unmerged `infra/fake-storyteller-web` branch (same seeded-fixture
approach, same test account) — not copied wholesale, and not maintained as a second copy of
anything. If a route already exists there, port it; do not reinvent it.

Boundary rules, all enforced mechanically:
- `mcp/src` never imports from `mcp/fake-upstream` (eslint `no-restricted-imports` plus a
  test that the production bundle contains no fake-upstream module).
- `[env.production]` pins the literal `https://api.storyteller.ai`; a CI test parses
  `wrangler.toml` and asserts production → real host, preview → not the real host.
- The Worker asserts at startup that the configured upstream host matches its environment's
  expected host; on mismatch every request fails 500 naming the mismatch. An invariant, not
  a switch.
- The production deploy job deploys `artcraft-mcp --env production` only; the fake deploys
  only from the preview job.
- Credentials cannot cross: a fake session never validates against production (different
  signing) and a real session never validates against the fake (seeded users only).

### Keeping the fake honest

- Contract tests validate the fake's responses and our fixtures against `api.json` (Ajv).
- A scheduled CI job runs the allowlisted read-only calls against production with the demo
  account, redacts, and diffs response *shapes* against the fake's fixtures. Production is
  touched by that job, not by people during development.

### What still needs production

Post-deploy read-only smoke, the weekly e2e run, the scheduled recorder, directory review.
Nothing else. The demo account's credentials live only in `mcp/.dev.vars` (gitignored) and
in repo secrets (`SMOKE_USERNAME`, `SMOKE_PASSWORD`) — never in code, fixtures, or test
names. Tests assert shapes, not values, and never assume specific data on that account.

### Other-team dependencies

Cloudflare account, GitHub repo secrets, and the Google Cloud console are held by the
backend team. Setup is one-time: batch every ask into `mcp/docs/infra-request.md` and hand it
over once. Until it lands nothing blocks development — `local` needs nothing external,
preview deploys can run from a developer's `wrangler login`, and sign-in is password-only
until the Google origin is added. All MCP work happens on `mcp/*` branches in the dedicated
worktree (a sibling checkout such as `../storyteller-mcp`), never on frontend or Rust branches.

## Working method — verify as you go

This is auth code fronting a live product. Errors here are account-security errors, and they
must never arrive in bulk.

1. **Build in small units and verify each one before moving on.** A function, a route, a
   schema. Write or extend its test, run the test, read the output, *then* start the next unit.
   Never implement a whole feature and only then check whether it works — the scope is too big
   to debug, and a wrong assumption in the first unit poisons everything built on it.
2. **Every PR ships with the tests that prove it.** No "tests in a follow-up". A PR without
   tests for its new behaviour is not mergeable. Tests are part of the change, not a companion.
3. **Keep PRs small and single-purpose.** Scaffold; upstream client + types; OAuth provider
   wiring; consent page; one tool group; connections page — each its own PR. If a PR needs
   more than one paragraph to describe, split it.
4. **Do a broader debug pass after the feature is assembled** — run the full suite, the e2e
   client test, and MCP Inspector against `wrangler dev`. This pass is *in addition to*
   step 1, never a replacement for it. It must include things unit tests cannot show: boot
   the Worker for real (`wrangler dev` + curl), `wrangler deploy --dry-run` for every target,
   and `pnpm install --frozen-lockfile` (what CI runs).
5. **A guardrail test must prove it fires.** Any test that exists to catch a bad edit (config
   invariants, import boundaries, environment-name isolation) needs a case that feeds it the
   bad edit and asserts the failure. A guardrail that has only ever passed is unproven —
   express the check as a pure function and test it against mutated input.
6. **"Small unit" means one thing, then run — and pick the grain by blast radius.** Ask how
   far a wrong assumption would travel before something else caught it. Function-level
   wherever an assumption about the outside world enters the code (the spec, a library's
   contract, a header format, a tool's behaviour) — that is where verification is worth the
   most and reading is worth the least. File-level where the file *is* the contract (the
   allowlist, the config invariant). Module-level for glue with no external assumption.
   A verification cycle costs seconds; the only cost of fine grain is momentum, which is the
   thing this rule exists to interrupt. If a batch passes first time, that was luck.
   Reading a library's installed `.d.ts` before writing against it counts as verification —
   it is the cheapest kind and has caught real contract drift.
7. **Verify claims about the upstream API against the spec or the Rust source, not memory.**
   The published spec is https://storyteller-docs.netlify.app/api.json; the handlers are under
   `crates/service/web/storyteller_web/src/http_server/`. Read-only reference — see constraints.
8. **When something is uncertain, say so in the PR description** and pin it with a test that
   documents the assumed behaviour, so a wrong assumption fails loudly later instead of silently.

## Architecture

Layered so that the three things most likely to change are behind interfaces and can be
swapped without touching tools or transport.

```
MCP client ──► Worker entry (OAuthProvider wraps the Hono app)
                 │
                 ├── /.well-known/*, /authorize, /token, /register, /revoke   (library)
                 ├── /authorize UI  ──► Authenticator            ← swap point 1
                 ├── /mcp, /sse     ──► TokenResolver → Principal ← swap point 2
                 │                        │
                 │                        ▼
                 │                  UpstreamClient (allowlist + UpstreamCredential) ← swap point 3
                 │                        │
                 │                        ▼
                 │                  tools/* (pure functions of Principal + input)
                 ├── /connections   (list / revoke grants; later: personal tokens)
                 └── /, /healthz
```

### Interfaces (the seams)

- **`Authenticator`** — turns a consent interaction into an `UpstreamCredential`.
  M1 implementation: `MpcHostFormAuthenticator` (Google Sign-In primary, username/password
  fallback, both proxied server-side to `POST /v1/accounts/google_sso` / `POST /v1/login`).
  Planned M2: `WebappRedirectAuthenticator` (`app.getartcraft.com/connect` hand-off). The
  consent route must not know which one it has.
- **`UpstreamCredential`** — what we hold for a grant and how it is attached to a request.
  M1: `{ kind: "session", signedSession }` sent as the `session` header. Designed to admit
  `{ kind: "api_key" }` or `{ kind: "backend_token" }` later if the backend grows a proper
  token system. Store `kind` in grant props from day one; never assume "session" outside
  the credential module. `revoke()` is part of the interface (session → `POST /v1/logout`).
- **`TokenResolver`** — `resolveToken(bearer) → Principal | null`. M1: OAuth access tokens
  via the library. M2: personal tokens (`artcraft_mcp_` prefix) via `resolveExternalToken`.
  Tools and the upstream client receive a `Principal` and must not know which token kind
  produced it.
- **`GrantStore`** — thin adapter over KV. Not because we plan to leave Workers, but so tests
  run against an in-memory implementation and the encryption scheme lives in one place.
- **`UpstreamClient`** — `openapi-fetch` client built from generated types; refuses any path
  not in `upstream/allowlist.ts`. Adding a path is a deliberate, reviewed change with a test.

### Principal

```ts
type Principal = {
  grantId: string;
  scopes: Scope[];            // "read:account" | "read:jobs" | "read:catalog" | (later) "generate"
  credential: UpstreamCredential;
  client: { label: string };  // "Claude", "ChatGPT", "personal token · Gemini API"
};
```

### Lifetimes (why 90 days)

An Artcraft session cannot be refreshed — there is no endpoint — only held or deleted. So:
access tokens 1 h; refresh tokens rotate, 30 days idle, **90 days absolute**, then re-consent.
Personal tokens (M2) inherit the same 90-day ceiling. On expiry or revoke, always call the
credential's `revoke()`. The 90-day window is also the runway for swapping `UpstreamCredential`
to a stronger backend token system if one appears: grants naturally roll over.

## Verified facts about the upstream API (2026-08-24)

Cite these; re-verify if the file references stop matching.

- Sessions: signed JWT, accepted as the `session` **cookie or** a lowercase `session` **header**
  (`crates/lib/actix_artcraft/src/sessions/user_sessions/http_user_session_manager.rs:143-163`).
  `POST /v1/login` and `POST /v1/accounts/google_sso` return `signed_session` in the body.
  Each login creates a new `user_sessions` row. `POST /v1/logout` with the header deletes
  that row and purges its Redis cache (`endpoints/users/logout_handler.rs:40-48`).
- No captcha or bot gate on `/v1/login`. No upstream rate limit on it either — ours is required.
- Session-only endpoints (unreachable with an API key): `/v1/credits/namespace/{ns}`,
  `/v1/session`, `/v1/jobs/session`, `/v1/subscriptions/namespace/{ns}`. This is why the
  forwarded credential is a session, not an API key.
- `POST /v1/omni_gen/cost/*` is anonymous → estimates are plan-blind. Label them so.
  `GET /v1/omni_gen/models/*` is plan-aware when a session is sent.
- Google Sign-In audience is one hardcoded client id checked server-side
  (`endpoints/users/google_sso/check_claims.rs`). Using that client id from
  `mcp.getartcraft.com` only needs the origin added in the Google Cloud console.
- Job tokens are `jinf_…`; batch status accepts mixed prefixes (`jinf_`, `batch_g_`).
- Error bodies: `{ success: false, error_code, error_code_str, message? }`.

## Client requirements that bite

- Unauthenticated `/mcp` → **401** with
  `WWW-Authenticate: Bearer resource_metadata="https://mcp.getartcraft.com/.well-known/oauth-protected-resource"`.
  Claude ignores this header on any status other than 401.
- Protected-resource `resource` must equal the MCP URL byte-for-byte as users paste it.
  One canonical URL: `https://mcp.getartcraft.com/mcp`; 301 everything else.
- Authorization-server metadata must advertise `code_challenge_methods_supported: ["S256"]`,
  `client_id_metadata_document_supported: true`, and `"none"` in
  `token_endpoint_auth_methods_supported`, or Claude falls back to DCR per connection.
- `/token` accepts `application/x-www-form-urlencoded`; `/register` accepts JSON. Dead
  refresh tokens return `invalid_grant`, not a custom code.
- Redirect allowlist: `https://claude.ai/api/mcp/auth_callback`, ChatGPT's callback, and
  loopback `http://localhost/callback` + `http://127.0.0.1/callback` with **any port**.
- Claude waits 10 s for discovery/register/token, 30 s for refresh. Anthropic egress is
  `160.79.104.0/21`; never WAF-block it on either host.
- Keep a legacy `GET /sse` alongside Streamable HTTP `/mcp`.

## Security rules

- Credentials (sessions, tokens, passwords) are never logged, never in URLs, never in error
  messages. The fetch wrapper redacts the `session` header; logs carry `grantId` only.
- Grant props stay encrypted with the library's token-wrapped keys. Do not add a plaintext
  copy anywhere "for convenience".
- Bearer tokens only in the `Authorization` header. Query-string tokens are rejected.
- Rate limits: per token on `/mcp`; per IP **and** per username on the consent POST; per IP
  on `/register`, `/authorize`, `/token`.
- Scopes are enforced at the tool boundary and at the allowlist. Reserve `generate` now; no
  M1 grant may carry it.

## Tool conventions

- One file per tool in `src/mcp/tools/`, exporting `{ name, description, inputSchema,
  outputSchema, annotations, handler }`. Handlers are pure functions of `(principal, input)`
  and call only `UpstreamClient`.
- Annotations in M1: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: false`.
- Return `structuredContent` **and** a short text block (ChatGPT needs both).
- Descriptions are written for the model: what it returns, when to call it, what the
  arguments mean, what tokens look like. Not marketing copy.
- Error mapping: upstream 401 → MCP 401 (metadata pointer); upstream 400 → tool error with
  the server's `message`; upstream 5xx → one retry then tool error. Never swallow.
- Upstream types are **generated** from the published `api.json` into
  `src/upstream/schema.d.ts` (`pnpm gen:api`). Never hand-write a DTO for an upstream shape.

### Source of truth for API shape

- **The published OpenAPI document is the source of truth**:
  https://storyteller-docs.netlify.app/api.json (rendered at
  https://storyteller-docs.netlify.app/). It is generated from the Rust handlers by
  `cargo run --bin docs-cli`, so it is the backend's own statement of the contract.
- App usage (`frontend/libs/api` = `@storyteller/api`, the desktop app's `ApiManager`, the
  webapp's call sites) is a **secondary reference** for how endpoints are used in practice —
  which fields matter, what values are sent, sequencing — never for shape.
- **When the two disagree, surface it; don't silently pick one.** Note the discrepancy in
  the PR description and in `docs/backend-handoff.md` (endpoint, what the spec says, what the
  app sends/expects, which we followed). Known examples at time of writing: the TS
  `OmniGen{Image,Video}CostResponse` omit `failures_are_refunded`; the TS image-generate
  response omits `all_job_tokens`. Build against the spec; flag the drift.
- If the spec itself is wrong (a response observed from production doesn't validate against
  it), that is a backend bug: record it in the handoff note with the captured, redacted
  response, and pin our behaviour with a test that documents the observed shape.

## Testing

Four layers; all run offline in CI (`pnpm test`), inside the Workers runtime via
`@cloudflare/vitest-pool-workers`.

1. **Unit** — tool handlers, credential module, allowlist, resolver — against an MSW-mocked
   upstream with fixtures captured from real responses.
2. **Contract** — every fixture validated with Ajv against `api.json`. A regenerated spec that
   changes a shape fails here first.
3. **OAuth conformance** — metadata shape, CIMD flags, DCR, PKCE S256, form-encoded `/token`,
   refresh rotation and reuse detection, `invalid_grant`, the 401 header, loopback matching.
4. **End-to-end** — the real `@modelcontextprotocol/sdk` client with an `OAuthClientProvider`
   that completes our consent page, against the Worker in miniflare.

Manual: MCP Inspector against `wrangler dev`. Post-deploy: `pnpm smoke` with a dedicated test
account against production. Weekly scheduled e2e run against production.

## Code style

- TypeScript strict, ESM, two-space indent, Node 22 / Workers runtime, pnpm.
- Top-to-bottom reading order in every file, matching the repo convention: constants, then
  the primary exported type/function, then supporting types, then helpers below their callers.
- No `any`; no `as` casts to silence the generated types — fix the fixture or the schema.
- `maybe_` is the upstream's optional-field prefix; keep upstream field names verbatim in
  generated types, camelCase only in our own domain types.
- eslint 10 flat config (`typescript-eslint` strict + stylistic, type-checked) + prettier at
  100 columns. `pnpm check` runs typecheck → lint → format → test and must be green before a
  PR is opened; CI runs the same four steps.
- Binding types come from `wrangler types` (`pnpm types`), not from `@cloudflare/workers-types`.
  Rerun it after any `wrangler.toml` change; `pnpm typecheck` does so automatically.
- No feature flags or environment-dependent behaviour in production code paths (repo-wide
  rule). Configuration is secrets and bindings, not branches.

## Deferred, not removed

Keep these possible; do not build them in M1.

- Personal tokens for header-based clients (Gemini API/Vertex, OpenAI Responses API,
  Anthropic Messages API connector): `resolveExternalToken` + `/connections` UI. Read-only
  scopes only, 90-day max, shown once, hashed at rest.
- `WebappRedirectAuthenticator` (`app.getartcraft.com/connect`) replacing the password form.
- `generate` scope and generation tools with cost confirmation via elicitation.
- Swapping `UpstreamCredential` to a backend-issued token if the backend ever offers one.
- Directory submissions (Claude connector directory, ChatGPT apps) — keep annotations and
  output schemas review-ready from day one so this is a form, not a refactor.

## Layout

```
mcp/
├── CLAUDE.md               # this file
├── package.json            # packageManager: pnpm@11 (via corepack), engines.node >=22, type: module
├── pnpm-workspace.yaml     # workspace = root server package + fake-upstream; pnpm build-script allowlist lives here
├── wrangler.toml           # local (top-level) / preview / production blocks; the security boundary for upstream hosts
├── worker-configuration.d.ts  # GENERATED by `pnpm types` (wrangler types); gitignored; regenerated in typecheck and CI
├── docs/backend-handoff.md # findings for the storyteller-web owner; not our work
├── docs/infra-request.md   # one-time batched asks for the backend team (Cloudflare, secrets, Google)
├── fake-upstream/          # separate Worker faking the allowlisted API routes; never imported by src/
├── scripts/gen-api.mjs     # fetch api.json → trim to allowlist → test/fixtures/api.json + src/upstream/schema.d.ts
├── src/
│   ├── index.ts            # Worker entry: OAuthProvider wrapping the Hono app
│   ├── app.ts              # Hono routes
│   ├── auth/               # provider config, Authenticator impls, consent page (Hono JSX)
│   ├── tokens/             # TokenResolver, Principal, GrantStore adapter
│   ├── upstream/
│   │   ├── allowlist.json  # the ONLY upstream routes, with `use: auth | read`; also drives the generator
│   │   ├── allowlist.ts    # validation + lookups by template path and by concrete pathname
│   │   ├── credential.ts   # UpstreamCredential interface; session implementation (swap point 2)
│   │   ├── client.ts       # openapi-fetch client; middleware enforces allowlist, use, origin, credential
│   │   └── schema.d.ts     # GENERATED from the spec snapshot by `pnpm gen:api`; do not edit
│   ├── mcp/                # McpServer factory, tools/, resources, prompts
│   └── pages/              # landing, connections
└── test/
    ├── fixtures/api.json   # GENERATED spec snapshot (trimmed); the contract tests' reference
    ├── helpers/            # pure check functions so guardrail tests can prove they fire
    └── upstream/, oauth/, e2e/, *.test.ts
```
