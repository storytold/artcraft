# ArtCraft MCP Server

A Model Context Protocol (MCP) server that exposes ArtCraft AI generation
capabilities via JSON-RPC over stdio. Protocol versions 2024-11-05 and
2025-03-26 are negotiated at initialize.

## Features

- **61 tools** across image/video/3D/audio generation, editing, media
  management, jobs, account, billing, characters, prompts, TTS, voice,
  weights, social, and referrals
- **Safety gates**: paid, destructive, privacy-changing, and local-file
  operations require `confirm: true`; generation accepts a caller-supplied
  `idempotency_token` for safe retries
- **Local file restrictions**: uploads are limited to allow-listed
  directories, extensions, and size caps; downloads are confined to
  approved directories with sanitized filenames
- Endpoint calls verified against `artcraft_api_defs` and the frontend
  `ApiManager` classes

## Authentication

The server resolves credentials in this order:

1. `~/Artcraft/credentials/artcraft_session.txt` and `artcraft_avt.txt`
   (session + visitor cookie values, one token per file). On Unix the
   server warns if these files are group/world-readable — restrict them
   (`chmod 600`).
2. The ArtCraft desktop app's cookie store
   (`%LOCALAPPDATA%\ai.artcraft.app\.cookies` on Windows, platform
   equivalent elsewhere).

If no credentials are found the server runs unauthenticated; tools that
need auth will fail cleanly. Never commit or share credential files.

## Building

```bash
cargo build --release -p artcraft-mcp
# binary: target/release/artcraft-mcp[.exe]
```

## Usage

```json
{
  "mcpServers": {
    "artcraft": {
      "command": "/path/to/artcraft-mcp"
    }
  }
}
```

Optional environment variables:

| Variable                     | Purpose                                                        |
|------------------------------|----------------------------------------------------------------|
| `ARTCRAFT_MCP_ALLOWED_DIRS`  | Extra directories (OS path-list) allowed for uploads/downloads |
| `RUST_LOG`                   | Log level for stderr diagnostics (`info`, `debug`, `warn`)     |

## Available Tools

### Generation (paid — `confirm: true` required)
- `artcraft_generate_image` — OmniGen images (Flux, GPT-Image, Midjourney, Nano Banana, Seedream, Grok, angle-edit models)
- `artcraft_generate_video` — OmniGen videos (Seedance, Kling, Sora, Veo, Vidu, Minimax, Grok, Happy Horse)
- `artcraft_generate_audio` — Music/SFX (Suno Music/Remix/Sounds/Sample, Seed Audio)
- `artcraft_generate_3d_object` — Meshes (Hunyuan 3D 2.0-3.1, Tripo3D)
- `artcraft_generate_splat` — Gaussian splat worlds (WorldLabs Marble, TripoSplat)
- `artcraft_studio_gen2` — Studio Gen2 image+video compositing

### Editing (paid — `confirm: true` required)
- `artcraft_edit_image`, `artcraft_remove_background`, `artcraft_inpaint_image`,
  `artcraft_edit_image_angle`, `artcraft_edit_video`

### Cost & Models
- `artcraft_estimate_cost`, `artcraft_estimate_splat_cost`,
  `artcraft_list_image_models`, `artcraft_list_video_models`

### Media
- `artcraft_upload_image` / `artcraft_upload_video` / `artcraft_upload_audio`
  (local file read — `confirm: true`)
- `artcraft_get_media_file`, `artcraft_download_media_file`,
  `artcraft_list_media_files`, `artcraft_search_media`,
  `artcraft_rename_media_file`
- `artcraft_delete_media_file` (destructive — `confirm: true`),
  `artcraft_set_media_visibility` (privacy — `confirm: true`)

### Jobs
- `artcraft_get_job_status` — single-job lookup (`/v1/jobs/job/{token}`)
- `artcraft_list_jobs` — status filter (`pending`/`started`/`completed`/`failed`/`cancelled`), `limit`
- `artcraft_terminate_job` — destructive (`confirm: true`)

### Account & Billing
- `artcraft_get_session_info` (non-sensitive fields only),
  `artcraft_get_credits`, `artcraft_get_subscription`
- `artcraft_create_checkout_session`, `artcraft_create_subscription_checkout`
  (paid — `confirm: true`), `artcraft_get_billing_portal_url`

### Characters, Prompts, TTS, Voice, Weights, Social, Referrals
- `artcraft_create_character`, `artcraft_list_characters`,
  `artcraft_get_character`, `artcraft_delete_character` (confirm)
- `artcraft_create_prompt`, `artcraft_get_prompt`
- `artcraft_tts_generate`, `artcraft_tts_search_models`
- `artcraft_voice_convert`, `artcraft_list_voice_conversion_models`,
  `artcraft_create_voice`, `artcraft_list_voices`,
  `artcraft_create_voice_dataset`, `artcraft_upload_voice_sample`
- `artcraft_list_weights`, `artcraft_search_weights`, `artcraft_get_weight`,
  `artcraft_delete_weight` (confirm)
- `artcraft_create_bookmark`, `artcraft_list_bookmarks`,
  `artcraft_rate_media`, `artcraft_create_comment`,
  `artcraft_list_comments`, `artcraft_list_tags`, `artcraft_set_tags`
- `artcraft_create_referral_code`, `artcraft_list_referral_codes`

## Architecture

- `main.rs` — async stdio read/write loop (tokio)
- `server.rs` — JSON-RPC dispatch, protocol negotiation, cached tools list
- `auth.rs` — credential resolution + file permission warnings
- `client.rs` — API host + credential set
- `types.rs` — MCP wire types (camelCase serialization)
- `tools/safety.rs` — confirm gates, rate limit, audit, bounded inputs,
  path/extension/size validation, sanitization
- `tools/http.rs` — shared reqwest client (timeouts, body caps) for raw routes

## Testing

```bash
cargo test -p artcraft-mcp
```

Unit tests cover parsers, path validation, confirm/idempotency gates, and
credential parsing. The companion Python suite in `mcp-server-package/tools`
adds a subprocess integration test against the built binary.
