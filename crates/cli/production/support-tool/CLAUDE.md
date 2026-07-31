# support-tool

Production support CLI for debugging and manual operations against external services.

## Building & Running

```bash
cargo build -p support-tool
cargo run -p support-tool -- kinovi_web generate_video --prompt "A corgi at the lake"
```

## Environment

Requires a `.env-support-tool-secrets` file (or env vars) with:

- `SEEDANCE2PRO_COOKIES` — session cookies for Kinovi/KinoviWeb API auth
- `ARTCRAFT_COOKIES` — session cookies for ArtCraft API auth (format: `session=...; visitor=...`)

## Architecture

- Entry point: `src/main.rs` → normalizes args (underscores optional) → dispatches
- Top-level commands in `src/commands/run.rs` (`TopLevelCommand` enum)
- Each top-level command has its own module with `dispatch.rs`, `state.rs`, `subcommands/`
- Subcommands use `#[derive(Args)]` for their argument structs
- All subcommand `run()` functions are `async fn` returning `anyhow::Result<()>`

## Adding a New Subcommand (to kinovi_web)

1. Create `src/commands/kinovi_web/subcommands/my_command.rs`
2. Add `pub mod my_command;` to `subcommands/mod.rs`
3. Add the name to `SUBCOMMAND_NAMES` in `dispatch.rs`
4. Add a variant to `KinoviWebCommand` enum in `dispatch.rs`
5. Add a match arm in `dispatch.rs::run()`

## Utilities

- `src/utils/parse_video_model.rs` — shared parser for loose video model names → `CommonVideoModel`
- `src/utils/normalize_subcommands.rs` — underscore-insensitive arg normalizer

## Conventions

- Use `log::info!()` for status output, never `println!` (except for final results)
- Use `anyhow::anyhow!()` for ad-hoc errors
- Get `KinoviWebSession` from `state.cookies` via `from_cookies_string()`
- Get `StorytellerCredentialSet` from `state.creds` (parsed from ARTCRAFT_COOKIES)
- External crates used: `artcraft_client` (media file download, omni API), `kinovi_web_client` (Kinovi direct), `artcraft_api_defs` (request types)

## Subcommands

### kinovi_web (direct Kinovi API)

- `kinovi_web find_job --token <order_id>` — search for a job across all pages
- `kinovi_web failed_job_histogram` — histogram of failure reasons
- `kinovi_web generate_video --prompt <text_or_file> [--model seedance2p0] [--start_frame_media_token mf_xxx] [--localhost] [--download_path /tmp/media_files]`

### artcraft (omni API)

- `artcraft generate_video --prompt <text_or_file> [--model seedance2p0] [--start_frame_media_token mf_xxx] [--duration 5] [--localhost]`
