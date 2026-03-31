# artcraft_api_defs

Shared HTTP API type definitions used by both the server (`storyteller_web`) and clients.

## Structure

Organized by feature: `users/`, `media_file/`, `jobs/`, `moderation/`, etc.

## Conventions

- Request types: `#[derive(Deserialize, ToSchema)]`
- Response types: `#[derive(Serialize, ToSchema)]`
- Path params: `#[derive(Deserialize, ToSchema)]` with `PathInfo` suffix
- Query params: `#[derive(Deserialize, IntoParams)]`

## Orphan Rule

Types that need `ResponseError` impl (actix-web) CANNOT live here because of Rust's orphan rule. Keep error response types in `storyteller_web` and only put data types here.

## Dependencies

Only `serde`, `serde_derive`, `utoipa`, `chrono`, `url`, and internal schema crates (`enums`, `tokens`). No actix-web dependency.
