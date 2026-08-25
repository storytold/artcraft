# Backend handoff notes

Findings about `storyteller-web` and its published OpenAPI document that the MCP project works
around but cannot fix (this project never changes Rust — `mcp/CLAUDE.md`). Each entry says what
we observed, what we did about it on our side, and what a backend change would unlock. Newest
first. Add an entry whenever a PR description surfaces a discrepancy.

## Path parameters are declared as one object-typed parameter

**Observed (api.json, 2026-08-24).** Every operation with path parameters declares a single
parameter named `path` whose schema is a `$ref` to a `…PathInfo` object, e.g.
`GET /v1/jobs/job/{token}` → `{ "name": "path", "in": "path", "schema": { "$ref":
"…GetInferenceJobStatusPathInfo" } }`. OpenAPI expects one parameter per template variable;
typed literally this yields `params.path.path.token` while the URL needs `params.path.token`.

**Also observed.** `POST /v1/login` and `POST /v1/accounts/google_sso` declare their JSON body
*twice*: once correctly as `requestBody` and once as a path parameter named `request`
(`{ "name": "request", "in": "path", "schema": { "$ref": "…LoginRequest" } }`) on a path
that has no template variables at all. Generators that trust the document would require
`username_or_email` and `password` as path segments.

**Our side.** `scripts/gen-api.mjs` flattens template-matching object parameters into one per
property, and drops a path parameter whose schema duplicates the operation's `requestBody`
(`flattenObjectParameters`). It refuses to generate if it meets a shape it does not
recognise. The committed snapshot `test/fixtures/api.json` is therefore *not* byte-identical
to the published document for these operations.

**Backend fix.** In utoipa, annotate path/query structs with `#[into_params(parameter_in =
Path)]` / `Query` so each field becomes its own parameter, and remove the `params(...)` entry
for `Json<…>` request bodies on the affected handlers (`login_handler`, `google_sso_handler`).

## Cost estimates are anonymous

**Observed.** `POST /v1/omni_gen/cost/*` performs no session lookup, so `is_free` and
`is_unlimited` never reflect the caller's plan.

**Our side.** Tool output labels estimates as public pricing.

**Backend fix.** Look the caller up with the same session/API-key dual path the generate
handlers use.

## Session-only endpoints block API-key use

**Observed.** `/v1/credits/namespace/{ns}`, `/v1/session`, `/v1/jobs/session`, and
`/v1/subscriptions/namespace/{ns}` accept only the session cookie/header
(`maybe_get_user_session_from_connection`), not an `Authorization` API key.

**Our side.** The MCP forwards an Artcraft session rather than a per-connection API key.

**Backend fix.** Switch those handlers to `require_api_or_web_session`. That would let this
service move to least-privilege API keys and support header-based clients directly.

## Security observations (not blocking us)

- `api_keys.api_key` is stored in plaintext and matched by equality.
- No rate limiting on `/v1/login`, `/v1/create_account`, `/v1/api_keys/create`, or any
  `/v1/omni_api/*` route; the `limitless` header disables the limiter by presence alone.
- `user_sessions.expires_at` is never checked on read.
