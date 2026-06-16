# storyteller-web

The main HTTP API monolith. This is the backend for the ArtCraft application.

## Building

```
cargo check -p storyteller-web
```

There are ~370 pre-existing warnings. Check the last 8-10 lines of output for actual errors.

## Structure

- `src/http_server/endpoints/` - HTTP handlers organized by feature
- `src/http_server/middleware/` - Actix middleware (error alerting, etc.)
- `src/http_server/common_responses/` - Shared error types (`CommonWebError`)
- `src/http_server/web_utils/` - Session checking, auth helpers
- `src/state/` - Server state, feature flags
- `src/startup/` - Initialization (pager, etc.)
- `src/threads/` - Background threads (health checker, etc.)
- `src/docs/` - OpenAPI/Swagger documentation (`api_doc.rs`)

## Handler Pattern

Handlers return `Result<Json<Response>, ErrorType>`. The `Result<HttpResponse, ErrorType>` pattern is
deprecated or only used when setting other HTTP headers, like cookies.

Prefer `CommonWebError` for new handlers unless you need custom error variants.

The session helpers (`require_user_session`, `require_user_session_extended`, `require_moderator`
in `http_server/web_utils/user_session/`) take a generic `mysql_executor` argument. Pass an
already-open connection (`&mut *conn`) so the helper reuses it; do NOT pass
`&server_state.mysql_pool` when the handler already holds a connection, since that self-acquires a
second one and adds pool pressure (this crate has had pool-timeout incidents). There is no
`require_user_session_using_connection` / `require_moderator_using_connection` — the
reuse-vs-acquire behavior is determined by the argument.

## Database Access

Do NOT write SQLx queries in this crate. `storyteller-web` contains **zero** direct SQLx queries —
all MySQL access goes through the `mysql_queries` crate. Add a function there (or reuse an existing
one) and call it from the handler; never embed `sqlx::query!` / `sqlx::query()` in a handler or
helper here. See `crates/schema/database/mysql_queries/CLAUDE.md` for the query-writing conventions
(compile-time `query!` / `query_as!` macros, offline cache, the `Args`/`Executor` pattern, etc.).

## api_doc.rs

When adding new request/response/error types, add them to `src/docs/api_doc.rs` in the 
schemas section (alphabetically sorted). Types from `artcraft_api_defs` need explicit imports.

## Running locally

Environment variables are auto-loaded by Rust at startup from these files:

- `.env` (repo root)
- `crates/service/web/storyteller_web/config/storyteller-web.common.env`
- `crates/service/web/storyteller_web/config/storyteller-web.development.env`
- `crates/service/web/storyteller_web/config/storyteller-web.development-secrets.env`

**Do NOT** use `SQLX_OFFLINE=true` — the server needs live DB access.

```bash
# From the repo root, just run:
cargo run --bin storyteller-web
```

The server binds to `0.0.0.0:12345` by default. Compilation takes ~3 minutes on first build.

## Testing endpoints with curl

```bash
# 1. Log in to get session cookies:
curl -s -c /tmp/cookies.txt -X POST http://localhost:12345/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username_or_email":"newuser4","password":"newuser4"}'

# 2. Generate video (GmiCloud Seedance 2.0 Fast Global):
#    Requires a UUID-format idempotency_token.
curl -s -b /tmp/cookies.txt -X POST http://localhost:12345/v1/omni_gen/generate/video \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance_2p0_fast_g",
    "prompt": "a corgi running through a field",
    "duration_seconds": 5,
    "aspect_ratio": "wide_sixteen_by_nine",
    "idempotency_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }'

# 3. Generate video (GmiCloud Seedance 2.0 Global, 720p):
curl -s -b /tmp/cookies.txt -X POST http://localhost:12345/v1/omni_gen/generate/video \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance_2p0_g",
    "prompt": "a corgi running through a field",
    "duration_seconds": 5,
    "resolution": "seven_twenty_p",
    "aspect_ratio": "wide_sixteen_by_nine",
    "idempotency_token": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
  }'
```

A successful response returns 200 with `{"success": true, "inference_job_token": "jinf_..."}`.

**Notes:**
- `idempotency_token` must be UUID format (32 hex chars or 36 with dashes)
- `resolution` uses enum names: `four_eighty_p`, `seven_twenty_p`, `ten_eighty_p`
- `aspect_ratio` uses enum names: `wide_sixteen_by_nine`, `tall_nine_by_sixteen`, `square`, etc.
- Use a new `idempotency_token` for each request to avoid duplicate detection

## Pager Integration

- The `Pager` is available on `ServerState` as `server_state.pager`
- Health check handler sends alerts when unhealthy
- Error alerting middleware sends alerts on HTTP 500s (when enabled)
- Use `NotificationDetailsBuilder` for constructing alerts
