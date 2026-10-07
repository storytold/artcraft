# ArtCraft MCP Server & Automation Suite

[![Protocol: MCP](https://img.shields.io/badge/MCP-2024--11--05-blue.svg)](https://modelcontextprotocol.io)
[![Language: Rust](https://img.shields.io/badge/Language-Rust%202021-orange.svg)](https://www.rust-lang.org)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10%2B-green.svg)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](./LICENSE.md)

Standalone repository bundling all **Model Context Protocol (MCP)** server implementations, automation CLI tools, agent skills, JSON-RPC schemas, and companion bridge routes from the **ArtCraft** generative media platform.

This project enables AI coding assistants (Claude Desktop, Windsurf, Cursor, Antigravity, OpenClaw) to natively generate images, videos, 3D meshes, Gaussian splats, TTS, and manage media assets through natural language commands or automated scripts.

---

## 📁 Project Structure

```
artcraft-mcp/
├── bin/                                # Standalone, ready-to-run 64-bit Windows binary
│   └── artcraft-mcp.exe                # Full 61-tool ArtCraft MCP server
│
├── rust/                               # Rust Source Implementation
│   ├── README.md                       # Architecture & crate guide
│   └── artcraft_mcp_cli/               # Full 61-tool MCP server crate
│       ├── Cargo.toml
│       ├── README.md
│       └── src/
│           ├── main.rs, server.rs, auth.rs, client.rs, types.rs
│           └── tools/                  # 15 tool modules (image, video, 3D, voice, jobs...)
│
├── tools/                              # Standalone Python Automation CLI Suite
│   ├── artcraft_runner.py              # Batch video & image generator with async polling
│   ├── artcraft_3d_runner.py           # Hunyuan 3D & WorldLabs Marble Splat pipeline
│   ├── artcraft_angle_matrix.py        # 4-quadrant camera orbit generator (flux_2_lora_angles)
│   ├── artcraft_audio_weaver.py        # Audio stem reference & voice synthesis weaver
│   └── artcraft_cost_estimator.py      # Live credit balance inspector & cost estimator
│
├── skills/                             # AI Agent Skills & Knowledge References
│   ├── artcraft-mcp/
│   │   ├── SKILL.md                    # Main agent instruction skill
│   │   └── references/                 # Model matrices, aspect ratios & specs
│   │       ├── aspect-ratios.md
│   │       ├── image-models.md
│   │       ├── video-models.md
│   │       └── three_d_and_splat_models.md
│   └── open-source-contributor/
│       └── SKILL.md                    # Open source contributor workflows & checklist
│
├── companion/                          # Desktop App & API Companion Integration
│   ├── mcp_routes.py                   # FastAPI / FastMCP lifecycle routes (start, stop, health, token)
│   └── docs_mcp_server.md              # Architecture & companion integration guide
│
├── schemas/                            # Complete JSON-RPC tool definitions (61 tools)
│   ├── artcraft_generate_image.json
│   ├── artcraft_generate_video.json
│   ├── artcraft_generate_3d_object.json
│   ├── artcraft_generate_audio.json
│   ├── artcraft_download_media_file.json
│   ├── artcraft_estimate_splat_cost.json
│   └── ... (55 more schemas)
│
├── ArtCraft-MCP-Setup-Guide.md         # Full client setup guide (Claude, Windsurf, Cursor)
├── TOOLS.md                            # Comprehensive CLI documentation
├── DEV-NOTES.md                        # Development notes & architecture
├── CHANGELOG.md                        # Release history
├── CONTRIBUTING.md                     # Contribution guidelines
├── CODE_OF_CONDUCT.md                  # Code of conduct
├── SECURITY.md                         # Security policies
├── PULL_REQUEST_TEMPLATE.md            # Pull request template
├── LICENSE.md                          # License terms
└── setup_mcp.py                        # 1-Click MCP client configuration utility
```

---

## ⚡ Quick Start

### 1. One-Click Setup (Automatic)

Run the included configuration script to auto-detect and register `artcraft-mcp` across Claude Desktop, Windsurf, or Cursor:

```powershell
python setup_mcp.py
```

### 2. Manual Configuration

Add to your MCP client configuration file (e.g., `claude_desktop_config.json` or `~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "artcraft": {
      "command": "C:\\path\\to\\artcraft-mcp\\bin\\artcraft-mcp.exe",
      "args": [],
      "description": "ArtCraft AI generative media platform (Full 61-tool engine)"
    }
  }
}
```

---

## 🔑 Authentication

The server resolves credentials in the following order:

1. **`ARTCRAFT_MCP_PRIVATE_SESSION_TOKEN`**: Dedicated MCP session Bearer token (`mcp_session_private_...`).
2. **`ARTCRAFT_API_KEY`**: Automatically exchanged with `POST /v1/mcp/session/create` for an active session.
3. **`ARTCRAFT_SESSION` and `ARTCRAFT_AVT`**: Session cookie environment variables.
4. **Credential Files**: Auto-detected from `~/Artcraft/credentials/`:
   - `artcraft_session.txt` — Your session cookie
   - `artcraft_avt.txt` — Your visitor cookie
5. **ArtCraft Desktop App Store**: Auto-detected from `%LOCALAPPDATA%\ai.artcraft.app\.cookies`.

---

## 🛠️ CLI Automation Suite

All scripts in `tools/` communicate directly with `bin/artcraft-mcp-server.exe` over stdio JSON-RPC without needing external servers:

### Check Credits & Generation Costs
```powershell
python tools/artcraft_cost_estimator.py --check-balance --video-model seedance_2p0 --duration 5
```

### Batch Image & Video Generation
```powershell
python tools/artcraft_runner.py `
  --prompt "Cinematic cyberpunk alleyway at dusk, anamorphic lens, neon reflections" `
  --model flux_1_dev `
  --copies 2 `
  --out-dir "./outputs"
```

### Hunyuan 3D Mesh & Gaussian Splat Generation
```powershell
python tools/artcraft_3d_runner.py `
  --image "path/to/character.png" `
  --mode both `
  --out-dir "./outputs/3d"
```

### 4-Quadrant Camera Orbit Pass
```powershell
python tools/artcraft_angle_matrix.py `
  --image "path/to/subject.png" `
  --prompt "Maintain facial details during camera orbit" `
  --out-dir "./outputs/orbit"
```

---

## 🤖 AI Agent Skills

Agent skills and prompt guidance are provided in `skills/artcraft-mcp/`:
- **`SKILL.md`**: Behavioral instructions, parameter schemas, and error handling for LLM agents.
- **`references/`**: Model capability tables, aspect ratio rules, and duration limits for:
  - **Image**: Flux 1 Dev/Schnell, Flux Pro 1.1 Ultra, Nano Banana Pro, Seedream 4/4.5/5, Midjourney 7/8.
  - **Video**: Kling (3.0/2.6/2.1), Veo (3/3.1), Seedance (2.0/1.5), Sora 2, Grok Imagine Video.
  - **3D & Splat**: Hunyuan 3D 2.0/2.1, WorldLabs Marble Gaussian Splatting.

---

## 🖥️ Companion API Bridge

For applications integrating the MCP server as a managed subprocess, `companion/mcp_routes.py` provides FastAPI endpoints:
- `GET /api/mcp/health` — Check process state and PID.
- `POST /api/mcp/start` — Spawn the binary with stdio pipes.
- `POST /api/mcp/stop` — Gracefully terminate or kill the process.
- `POST /api/mcp/token` — Exchange API keys/cookies for an MCP session token.

---

## 📜 Documentation

- [Setup Guide](ArtCraft-MCP-Setup-Guide.md) — Comprehensive client installation manual.
- [CLI Tools Guide](TOOLS.md) — Detailed parameters for all Python tools.
- [Developer Notes](DEV-NOTES.md) — Architecture and protocol details.
- [Rust Source Guide](rust/README.md) — Source code walkthrough for both crates.
- [Companion Guide](companion/docs_mcp_server.md) — FastAPI / FastMCP bridge architecture.
