# support-tool

Production support CLI for debugging and manual operations against external services.

## Building & Running

```bash
cargo build -p support-tool
cargo run -p support-tool -- seedance2pro generate_video --prompt "A corgi at the lake"
```

## Environment

Requires a `.env-support-tool-secrets` file (or env vars) with:

- `SEEDANCE2PRO_COOKIES` — session cookies for Kinovi/Seedance2Pro API auth

## Architecture

- Entry point: `src/main.rs` → normalizes args (underscores optional) → dispatches
- Top-level commands in `src/commands/run.rs` (`TopLevelCommand` enum)
- Each top-level command has its own module with `dispatch.rs`, `state.rs`, `subcommands/`
- Subcommands use `#[derive(Args)]` for their argument structs
- All subcommand `run()` functions are `async fn` returning `anyhow::Result<()>`

## Adding a New Subcommand (to seedance2pro)

1. Create `src/commands/seedance2pro/subcommands/my_command.rs`
2. Add `pub mod my_command;` to `subcommands/mod.rs`
3. Add the name to `SUBCOMMAND_NAMES` in `dispatch.rs`
4. Add a variant to `Seedance2proCommand` enum in `dispatch.rs`
5. Add a match arm in `dispatch.rs::run()`

## Conventions

- Use `log::info!()` for status output, never `println!` (except for final results)
- Use `anyhow::anyhow!()` for ad-hoc errors
- Get `Seedance2ProSession` from `state.cookies` via `from_cookies_string()`
- External crates used: `artcraft_client` (media file download), `seedance2pro_client` (video gen)

## Subcommands

- `seedance2pro find_job --token <order_id>` — search for a job across all pages
- `seedance2pro failed_job_histogram` — histogram of failure reasons
- `seedance2pro generate_video --prompt <text_or_file> [--model seedance2p0] [--reference_media_tokens "token1,token2"] [--localhost] [--download_path /tmp/media_files]`
