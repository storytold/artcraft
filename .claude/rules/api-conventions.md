# API Conventions

## HTTP Handlers (Actix-Web)

Handlers in `storyteller_web` follow this structure:

1. **Request/Response types** with `#[derive(Deserialize/Serialize, ToSchema)]`
2. **Error enum** implementing `ResponseError`, `Display`, `Serialize`, `ToSchema`
3. **Handler function** annotated with `#[utoipa::path(...)]` for OpenAPI docs
4. Handler returns `Result<Json<Response>, ErrorType>`. Only use `Result<HttpResponse, ErrorType>` when you need to set headers/cookies.

### Error Types

- Use `CommonWebError` for simple handlers that only need standard HTTP error codes
- Use a custom error enum when you need endpoint-specific error variants (e.g. `LoginErrorType::InvalidCredentials`)
- Custom error enums MUST implement `ResponseError` (actix), `Display`, and `Serialize`
- When adding `From<RequireUserSessionError>` or similar conversions, implement them on `CommonWebError` in its own module (orphan rule)
- Error response bodies include: `success: false`, `error_code`, `error_code_str`

### Session/Auth

Helpers live in `storyteller_web` under `http_server/web_utils/user_session/`. Each takes a
generic `mysql_executor: E` (any `sqlx::Executor`), so whether it reuses a connection or acquires
its own depends on the **argument you pass**:

- `require_user_session(http_request, session_checker, mysql_executor)` — require a logged-in user.
- `require_user_session_extended(...)` — same, with extra session detail.
- `require_moderator(http_request, session_checker, mysql_executor)` — admin-only endpoints.

PREFER passing an already-open connection (`&mut *conn`) so the helper reuses it. Passing
`&server_state.mysql_pool` makes it acquire a fresh connection — avoid that when the handler
already holds one (the double-acquire adds pool pressure; this crate has had pool-timeout
incidents). There is no `*_using_connection` variant — the reuse/acquire choice is the argument.

### API Type Definitions

- Shared request/response types go in `artcraft_api_defs` crate (under `crates/api_clients/artcraft/artcraft_api_defs/`)
- Types that need `ResponseError` impl must stay in `storyteller_web` (orphan rule)
- New types must be added to `api_doc.rs` schemas (in storyteller-web) for Swagger generation

## Enums (Database-backed)

- Located in `crates/schema/public/enums/src/by_table/{table_name}/`
- Require manual `to_str()` and `from_str()` implementations
- Use `impl_enum_display_and_debug_using_to_str!` and `impl_mysql_enum_coders!` macros
- Add comprehensive tests: serialization, round-trip, variant count
- YOU CAN ADD NEW VALUES but DO NOT CHANGE EXISTING VALUES without a migration strategy
- Note that adding new values can break older versions of the Tauri desktop app that read
  responses over Rust - make sure it consumes variants with an "Unknown(String)" variant 
  catch-all to future proof the APIs.

## Tokens (Primary Keys)

- Located in `crates/schema/public/tokens/src/tokens/`
- Opaque `String` wrappers with Stripe-like prefixes (e.g. `user_`, `mf_`)
- Use `impl_string_token!`, `impl_mysql_token_from_row!`, `impl_crockford_generator!` macros
