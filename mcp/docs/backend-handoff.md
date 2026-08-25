# Backend handoff notes

Findings about `storyteller-web` and its published OpenAPI document that the MCP project works
around but cannot fix (this project never changes Rust — `mcp/CLAUDE.md`). Each entry says what
we observed, what we did about it on our side, and what a backend change would unlock. Newest
first. Add an entry whenever a PR description surfaces a discrepancy.

## A signed-in webapp user cannot be handed to the MCP without exporting their browser session

**Observed (2026-08-25).** The industry-standard consent shape is "redirect to the product's own
sign-in, come back with a credential" (`app.getartcraft.com/connect`). The webapp holds the
signed session JWT in `localStorage["artcraft_signed_session"]` (`frontend/libs/api/src/lib/ApiManager.ts`),
so such a page *could* post it to the MCP — but that is the user's long-lived browser session,
not a purpose-made one. The only other route to it is `GET /v1/session_token`, which the handler
itself marks as a security hole. There is no endpoint that lets a logged-in user mint a second,
independently revocable session, and `/v1/api_keys/*` keys are accepted only by the
`omni_api`/`omni_gen` generate, upload and `job_status` routes — none of the session-only reads
below.

**Our side.** Not built. The MCP keeps its own consent page, which signs the user in with
`/v1/login` or Google SSO and therefore holds a session created *for that grant*; `/v1/logout`
on disconnect ends exactly that session and nothing else. A grant that carried the browser
session would make "disconnect" unable to end upstream access without logging the user out of
the webapp, and would make the 90-day grant cap cosmetic upstream.

**What a backend change would unlock.** One endpoint pair, e.g.
`POST /v1/sessions/handoff` (session-authenticated; returns a single-use code with a ~60 s TTL,
bound to an `audience` string) and `POST /v1/sessions/redeem` (anonymous; returns a fresh
`signed_session` for that user, recorded with the audience so it can be listed/revoked
separately). With that, `/connect` becomes a ~80-line webapp page and the MCP's
`WebappRedirectAuthenticator` replaces the password form with no credential ever leaving the
user's own sign-in. Until then the password/Google consent page is the safer design, not a
compromise.

## Disconnecting an MCP grant cannot end its upstream session

**Observed.** The MCP holds each grant's Artcraft session encrypted with key material wrapped
by that grant's tokens. When a user disconnects an app on `mcp.getartcraft.com/connections`
we revoke the grant (its tokens die and the session becomes cryptographically unreachable),
but we cannot call `POST /v1/logout` for it — the props can no longer be decrypted. The
`user_sessions` row therefore lives until its (unchecked) one-year expiry.

**Our side.** Documented on the page; sessions that fail upstream are logged out from the
handler path whenever a token is still live. Personal tokens (`/connections` → Personal
tokens) have the same shape: revoking one deletes its sealed record, and the session inside
is unreachable but not logged out.

**Backend fix.** A session-scoped endpoint to end *other* sessions of the same user (or a
"revoke all sessions created via API key/MCP" action) would let the connections page finish
the job. Checking `expires_at` on read would bound the exposure regardless.

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
