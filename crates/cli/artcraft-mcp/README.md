# ArtCraft MCP Server

A Model Context Protocol (MCP) server that exposes ArtCraft AI generation capabilities via JSON-RPC over stdio.

## Features

- **Image Generation**: Generate images using OmniGen with Flux, GPT-Image, NanoBanana, Seedream models
- **Video Generation**: Generate videos using Kling, Sora, Veo, Seedance, and more
- **Cost Estimation**: Estimate credits and USD cost before generating
- **Media Management**: Upload images, get media file details, delete media files
- **Job Pipeline**: List inference jobs and track their status
- **Account Info**: Query wallet credits (Artcraft and FakeYou namespaces)

## Authentication

The MCP server reads credentials from the ArtCraft desktop app credential files:

- `~/Artcraft/credentials/artcraft_session.txt` — Session cookie
- `~/Artcraft/credentials/artcraft_avt.txt` — AVT cookie

If no credentials are found, the server runs in unauthenticated mode.

## Building

```bash
cargo build --release -p artcraft-mcp
```

## Usage

Add the MCP server to your MCP client configuration:

```json
{
  "mcpServers": {
    "artcraft": {
      "command": "/path/to/artcraft-mcp.exe"
    }
  }
}
```

## Available Tools

### Generation
- `artcraft_generate_image` — Generate images from text prompts
- `artcraft_generate_video` — Generate videos from text prompts
- `artcraft_generate_3d_object` — Generate 3D objects (stub)
- `artcraft_generate_splat` — Generate Gaussian splats (stub)

### Cost & Models
- `artcraft_estimate_cost` — Estimate generation cost before running
- `artcraft_list_image_models` — List available image models
- `artcraft_list_video_models` — List available video models

### Media
- `artcraft_upload_image` — Upload an image file
- `artcraft_get_media_file` — Get media file details by token
- `artcraft_delete_media_file` — Delete a media file by token

### Jobs
- `artcraft_list_jobs` — List all session inference jobs
- `artcraft_get_job_status` — Get status of a specific job (stub)
- `artcraft_terminate_job` — Cancel a running job (stub)

### Account
- `artcraft_get_credits` — Query wallet credits
- `artcraft_get_session_info` — Get session info (stub)
- `artcraft_get_subscription` — Get subscription details (stub)

### Editing (stubs)
- `artcraft_edit_image`, `artcraft_remove_background`, `artcraft_inpaint_image`, etc.

### Characters, Prompts, TTS, Voice, Weights, Social (stubs)

## Architecture

- `main.rs` — Entry point, reads stdio lines
- `server.rs` — JSON-RPC MCP server core
- `auth.rs` — Desktop app credential loading
- `client.rs` — ArtCraft API client wrapper
- `types.rs` — JSON-RPC and tool data structures
- `tools/` — Tool definitions and implementations

## Dependencies

- `artcraft_client` — API client for ArtCraft/Storyteller
- `artcraft_api_defs` — Shared API request/response types
- `enums` — Common enums (models, aspect ratios, etc.)
- `tokio` — Async runtime
- `serde_json` — JSON serialization
- `anyhow` — Error handling
- `env_logger` — Logging
