# Changelog

All notable changes to the **ArtCraft Model Context Protocol (MCP) Server**
package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Server version is `0.1.0` (`crates/cli/artcraft-mcp/Cargo.toml`); MCP protocol
2024-11-05 and 2025-03-26 are negotiated at initialize.

---

## [Unreleased]

### Security
- **Credential hardening**: session/visitor tokens are never returned in tool
  output; credential files warn on permissive (group/world-readable) permissions.
- **Path traversal fix**: `artcraft_download_media_file` sanitizes filenames
  (no separators/`..`/absolute paths) and confines writes to allow-listed
  directories with a size cap.
- **Local file read restrictions**: `artcraft_upload_*` and
  `artcraft_upload_voice_sample` require `confirm: true` and enforce an
  allowed-directory check, extension allowlist, and size cap.
- **Paid/destructive gates**: generation, editing, checkout, delete,
  visibility, and terminate tools all require `confirm: true`; paid
  generation accepts a caller `idempotency_token` for safe retries.
- Bounded inputs: batch counts, durations, prompt lengths, token arrays,
  and list limits now reject out-of-range values instead of truncating.

### Changed
- **Protocol correctness**: MCP wire types serialize camelCase
  (`inputSchema`, `isError`, `serverInfo`); `arguments` defaults to `{}`;
  protocol version negotiates between 2024-11-05 and 2025-03-26.
- **Strict parsing**: unknown models, aspect ratios, resolutions, quality,
  bitrate, pack slugs, and job statuses now return invalid-params errors
  (no silent defaults; `3k`/`4k` map to distinct resolutions).
- **Real endpoints**: job status uses `GET /v1/jobs/job/{token}`,
  termination `DELETE /v1/jobs/job/{token}`, characters use `/v1/character/*`,
  bookmarks `/v1/user_bookmarks/*`, tags `/v1/tags/media_file/*`,
  comments `/v1/comments/*`, studio `/v1/studio_gen2/enqueue` — verified
  against `artcraft_api_defs` and frontend API classes.
- **Shared HTTP**: one reqwest client with timeouts and response-body caps;
  structured errors preserve status + truncated body; URL encoding on all
  path/query interpolation.
- **Async I/O**: non-blocking tokio stdio loop; tools list cached in a
  `OnceLock` instead of rebuilt per request.
- **Python suite**: all six tools rewritten on the shared
  `artcraft_mcp_client.py` (correct tool names/params, `isError` handling,
  drained stderr, missing-`arguments` default); healthcheck exits non-zero
  on failure.
- **Schemas**: all 61 `schemas/*.json` regenerated from the live
  `tools/list` (`inputSchema` shape) via `generate_schemas.py`; a parity
  test keeps them in sync.

### Added
- 26 Rust unit tests (parsers, path validation, confirm/idempotency,
  credential parsing) + Python integration test suite
  (`test_artcraft_mcp_client.py`, 12 tests including schema parity).
- `docs:` refreshed — README, setup guide, TOOLS.md, SKILL.md and
  references now match the implemented 61-tool surface.

---

## [1.1.0] - 2026-10-07

### Added
- **Full 61-Tool Engine Expansion**:
  - `artcraft_generate_audio`: Native audio and music generation powered by Suno.
  - `artcraft_download_media_file`: Direct downloading of generated or hosted media assets to local filesystem.
  - `artcraft_estimate_splat_cost`: Pre-generation exact credit estimation for WorldLabs Marble Gaussian splats.
  - `artcraft_create_checkout_session`: Instant Stripe credit package top-up checkout session generator.
  - `artcraft_create_subscription_checkout`: Direct Stripe subscription checkout session setup.
  - `artcraft_get_billing_portal_url`: Stripe customer billing and subscription portal access.
- **Enhanced 3D Mesh & Radiance Splatting**:
  - Added Tripo3D H3.1 (`tripo_h3_1`) model support to `artcraft_generate_3d_object`.
  - Added multi-view camera references (`back_media_file_token`, `left_media_file_token`, `right_media_file_token`).
  - Added retopology and PBR material synthesis controls (`enable_pbr`, `enable_texture`, `texture_quality`, `face_count`).
  - Added WorldLabs Marble 1.0 & 1.1 support with 360° panoramic mode (`is_panoramic`).
- **Extended Model Coverage**:
  - Video: MiniMax H3 / Turbo / Ultra, Seedance 2.5 / Fast / Ultra, Wan 3.0 / Prime, Kling 3.0 Pro, Sora 2, Beeble SwitchX.
  - Image: Flux 3 / Pro, Seedream 5 Pro / Ultra, GPT Image 2.5 (Flare / Sunburst), Midjourney 8.
- **Updated Schemas & Tool Definitions**:
  - 61 complete JSON-RPC tool schemas in `schemas/`.
  - Updated AI agent guidance in `skills/artcraft-mcp/SKILL.md` and reference tables.

---

## [1.0.0] - 2026-10-06

### Added
- **Native Rust MCP Server (`artcraft-mcp-server`)**:
  - Implements Model Context Protocol `2024-11-05` over stdio JSON-RPC.
  - Exposes 40+ native ArtCraft tools for Video, Image, 3D Mesh, Gaussian Splatting, TTS, and Audio generation.
  - Supports video models: Kling (3.0/2.6/2.1), Veo (3/3.1), Seedance (2.0/1.5), Sora 2, Grok.
  - Supports image models: Flux 1 Dev/Schnell, Flux Pro 1.1 Ultra, Nano Banana Pro, Seedream 4/5, Midjourney 7/8.
  - Supports 3D generation: Hunyuan 3D (2.0/2.1) and WorldLabs Marble Splatting.
- **5-Tool Cross-Platform CLI Suite (`mcp-server-package/tools/`)**:
  - `artcraft_runner.py`: Batch Video & Image automator with async polling.
  - `artcraft_3d_runner.py`: Hunyuan 3D mesh & Gaussian Splat generator.
  - `artcraft_angle_matrix.py`: 4-quadrant spatial camera orbit pass generator.
  - `artcraft_audio_weaver.py`: Audio prompt & TTS voice conversion weaver.
  - `artcraft_cost_estimator.py`: Live credit balance inspector & cost calculator.
- **Client Installer (`setup_mcp.py`)**:
  - 1-Click installer for Windsurf, Claude Desktop, and Cursor.
- **Agent Skill (`open-source-contributor`)**:
  - Encapsulates Open Source Guide best practices, PR workflows, and security checklists.
- **Documentation & Community Guidelines**:
  - Added `TOOLS.md`, `ArtCraft-MCP-Setup-Guide.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `SECURITY.md`.
