# ArtCraft MCP Server & Automation Suite

[![Protocol: MCP](https://img.shields.io/badge/MCP-2024--11--05%20%2F%202025--03--26-blue.svg)](https://modelcontextprotocol.io)
[![Language: Rust](https://img.shields.io/badge/Language-Rust%202021-orange.svg)](https://www.rust-lang.org)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10%2B-green.svg)](https://python.org)

MCP server, automation CLI tools, agent skills, and JSON schemas for the
**ArtCraft** generative media platform. Lets MCP-compatible AI clients
(Claude Desktop, Windsurf, Cursor, Devin) generate images, videos, 3D
meshes, Gaussian splats, and audio — and manage media, jobs, and billing —
through natural language.

The Rust server source lives in the monorepo at `crates/cli/artcraft-mcp`;
this directory is the distributable package (docs, schemas, skills,
Python tools, installer).

---

## 📁 Project Structure

```
mcp-server-package/
├── schemas/                     # 61 JSON tool schemas — GENERATED
│   ├── generate_schemas.py      # Regenerates from the binary's tools/list
│   └── artcraft_*.json
│
├── skills/
│   ├── artcraft-mcp/
│   │   ├── SKILL.md             # Agent behavior guide (safety, workflows)
│   │   └── references/          # Model/enum value tables (verified)
│   │       ├── aspect-ratios.md
│   │       ├── audio-models.md
│   │       ├── billing-and-credits.md
│   │       ├── image-models.md
│   │       ├── three_d_and_splat_models.md
│   │       └── video-models.md
│   └── open-source-contributor/
│       └── SKILL.md
│
├── tools/                       # Python automation CLI (stdio JSON-RPC)
│   ├── artcraft_mcp_client.py   # Shared client — used by all scripts
│   ├── test_artcraft_mcp_client.py  # Integration test suite
│   ├── artcraft_runner.py       # Batch video/image generation + polling
│   ├── artcraft_3d_runner.py    # Hunyuan 3D mesh & Marble splat pipeline
│   ├── artcraft_angle_matrix.py # Camera orbit matrix (edit_image_angle)
│   ├── artcraft_audio_weaver.py # Suno/Seed audio generation
│   ├── artcraft_cost_estimator.py # Credits, subscription, cost estimates
│   └── artcraft_healthcheck.py  # Diagnostics (non-zero exit on failure)
│
├── README.md                    # This file
├── ArtCraft-MCP-Setup-Guide.md  # Client-by-client setup manual
├── TOOLS.md                     # Python CLI usage reference
├── CHANGELOG.md                 # Release history
└── setup_mcp.py                 # MCP client config installer
```

The server binary is **not** checked in — build it from the repo root:

```bash
cargo build --release -p artcraft-mcp
# → target/release/artcraft-mcp (or .exe on Windows)
```

---

## ⚡ Quick Start

### 1. Build the server

```bash
# from the repository root
cargo build --release -p artcraft-mcp
```

### 2. Provide credentials

Easiest: install and log into the **ArtCraft Desktop App** — the server
reads its cookie store automatically. Or create the two files below:

```
~/Artcraft/credentials/artcraft_session.txt   # session cookie value
~/Artcraft/credentials/artcraft_avt.txt       # visitor cookie value
```

(One raw token per file. On Unix, keep them `chmod 600`. Never commit them.)

### 3. Verify

```bash
PYTHONUTF8=1 python mcp-server-package/tools/artcraft_healthcheck.py
```

Exit code 0 = everything works; non-zero prints which check failed.

### 4. Point your MCP client at the binary

```json
{
  "mcpServers": {
    "artcraft": {
      "command": "C:\\path\\to\\target\\release\\artcraft-mcp.exe",
      "args": []
    }
  }
}
```

Or run `python mcp-server-package/setup_mcp.py` from the repository root to write the config for supported clients.

---

## 🔑 Authentication

The server resolves credentials in this order:

1. `~/Artcraft/credentials/artcraft_session.txt` + `artcraft_avt.txt`
2. The desktop app's cookie store (`%LOCALAPPDATA%\ai.artcraft.app\.cookies`
   on Windows; platform equivalent elsewhere)

There are no `ARTCRAFT_API_KEY`/env-var auth inputs today — credentials come
from files or the desktop cookie store. Without credentials the server runs
unauthenticated and auth-required tools return clean errors.

---

## 🛡️ Safety model

- **Paid, destructive, privacy-changing, and local-file tools require
  `confirm: true`** — the AI client must obtain user approval first.
- Generation/editing accepts a caller `idempotency_token` for safe retries.
- Uploads are restricted to allow-listed directories/extensions/size caps;
  downloads are confined to approved directories with sanitized filenames.
- Set `ARTCRAFT_MCP_ALLOWED_DIRS` (OS path list) to widen allowed local dirs.

---

## 🛠️ CLI Automation Suite

All scripts share `tools/artcraft_mcp_client.py` — the binary path is found
via `ARTCRAFT_MCP_PATH`, packaged `bin/`, the cargo `target/` dirs, or PATH.
Running a script that generates or uploads constitutes the `confirm`
approval for those operations.

```bash
# Diagnostics — exits non-zero on any failure
PYTHONUTF8=1 python tools/artcraft_healthcheck.py

# Credits + cost estimates (read-only)
PYTHONUTF8=1 python tools/artcraft_cost_estimator.py --video-model seedance_2p0 --duration 5

# Batch video generation (paid)
PYTHONUTF8=1 python tools/artcraft_runner.py \
  --prompt "Cinematic cyberpunk alleyway at dusk, neon reflections" \
  --model seedance_2p0 --copies 2 --duration 5

# 3D mesh + Gaussian splat (paid)
PYTHONUTF8=1 python tools/artcraft_3d_runner.py --image ref.png --mode both

# Camera-angle orbit matrix (paid)
PYTHONUTF8=1 python tools/artcraft_angle_matrix.py --image subject.png

# Music / SFX generation (paid)
PYTHONUTF8=1 python tools/artcraft_audio_weaver.py \
  --prompt "Lo-fi beat, rain on window, 90bpm" --style "lofi,chill" --bpm 90
```

Full flag reference: [TOOLS.md](TOOLS.md).

---

## 🤖 Agent Skills

`skills/artcraft-mcp/` contains the behavioral skill (safety gates,
estimate→approve→generate workflow, exact parameter names) plus verified
reference tables for every model and enum the parsers accept.

`schemas/` mirrors the server's live `tools/list` — regenerate with
`python schemas/generate_schemas.py` and keep it synced (the test suite
checks parity).

---

## 📜 Documentation

- [Setup Guide](ArtCraft-MCP-Setup-Guide.md) — full client setup manual
- [CLI Tools](TOOLS.md) — every Python script's flags and examples
- [Rust crate README](../crates/cli/artcraft-mcp/README.md) — server
  architecture and the complete tool list
- [Changelog](CHANGELOG.md)
