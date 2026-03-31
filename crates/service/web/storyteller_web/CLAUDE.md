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

When a handler uses `require_user_session`, prefer `require_user_session_using_connection` 
which reuses an existing DB connection.

## api_doc.rs

When adding new request/response/error types, add them to `src/docs/api_doc.rs` in the 
schemas section (alphabetically sorted). Types from `artcraft_api_defs` need explicit imports.

## Pager Integration

- The `Pager` is available on `ServerState` as `server_state.pager`
- Health check handler sends alerts when unhealthy
- Error alerting middleware sends alerts on HTTP 500s (when enabled)
- Use `NotificationDetailsBuilder` for constructing alerts
