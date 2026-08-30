# Pull Request: ArtCraft MCP Server, 5-Tool Automation Suite & 1-Click Installer

**Target Repository**: `storytold/artcraft:main`  
**Source Branch**: `theCosmicCrafter:mcp-server-release`  

---

## 📌 Title Suggestion
`feat(mcp): Add ArtCraft Model Context Protocol (MCP) Server, 5-Tool Automation Suite & One-Click Installer`

---

## 🚀 Executive Summary

This Pull Request introduces full **Model Context Protocol (MCP)** integration to the ArtCraft ecosystem. It equips AI coding assistants (Windsurf, Claude Desktop, Cursor) and automated creative agents with **40+ native ArtCraft generation endpoints** for images, videos, 3D meshes, Gaussian Splats, audio, and TTS voice conversion over stdio JSON-RPC.

All new code is isolated inside dedicated Rust crates (`crates/tools/servers/artcraft_mcp_server`), a standalone distribution package (`mcp-server-package/`), and a cross-platform Python automation suite (`tools/`), ensuring **zero conflict** with the core webapp or desktop applications.

---

## 📦 What Is Included in This Upgrade

### 1. 🦀 Native Rust MCP Server Implementation
- **Crate Locations**:
  - `crates/cli/artcraft-mcp` — Command-line launcher crate.
  - `crates/tools/servers/artcraft_mcp_server` — High-performance Rust server implementing the MCP `2024-11-05` stdio JSON-RPC specification.
- **Key Capabilities**:
  - **OmniGen Video**: Supports Kling (3.0/2.6/2.1), Veo (3/3.1), Seedance (2.0/1.5), Sora 2, and Grok.
  - **OmniGen Image**: Supports Flux 1 Dev/Schnell, Flux Pro 1.1 Ultra, Nano Banana Pro, Seedream 4/5, and Midjourney 7/8.
  - **3D & World Generation**: Hunyuan 3D (2.0/2.1) image-to-mesh conversion and WorldLabs Marble Gaussian Splatting.
  - **Authentication**: Auto-resolves credentials from user home directory (`~/Artcraft/credentials`) or Tauricookie stores.

---

### 2. 🧰 Cross-Platform CLI Tools Suite (`mcp-server-package/tools/`)
A suite of 5 standalone Python CLI utilities that interface directly with `artcraft-mcp-server` over stdio JSON-RPC. Designed with **dynamic binary discovery** (`find_mcp_executable()`) and **cross-platform path resolution** (Windows, macOS, Linux).

| Tool Script | Description & Capabilities |
| :--- | :--- |
| **`artcraft_runner.py`** | **Batch Video & Image Automator**: Enqueues $N$ parallel video/image jobs, polls status asynchronously, and downloads outputs (`.mp4` / `.jpg`). |
| **`artcraft_3d_runner.py`** | **3D & Gaussian Splat Automator**: Converts 2D source images into Hunyuan 3D meshes or WorldLabs Marble Splats, downloading assets to local output folders. |
| **`artcraft_angle_matrix.py`** | **Spatial Camera Orbit Generator**: Generates 4-quadrant camera orbit passes (Left -30°, Right +30°, High Pitch +20°, Zoom 1.4x) using `flux_2_lora_angles`. |
| **`artcraft_audio_weaver.py`** | **Audio & Voice Weaver**: Uploads reference audio stems and stages text prompts for ambient audio and voice conversion pipelines. |
| **`artcraft_cost_estimator.py`** | **Credit Balance & Cost Inspector**: Queries live credit balances, active subscription tiers, and calculates exact credit costs before firing heavy renders. |

---

### 3. 🚀 One-Click Client Installer (`mcp-server-package/setup_mcp.py`)
- Auto-detects installed AI client configurations (Windsurf, Claude Desktop, Cursor).
- Automatically registers `artcraft-mcp` into client JSON configs with zero manual editing needed.

---

### 4. 📚 Comprehensive Documentation & Agent Skills
- **`mcp-server-package/TOOLS.md`**: Complete command-line reference and usage guide for all 5 CLI tools.
- **`mcp-server-package/ArtCraft-MCP-Setup-Guide.md`**: Setup and configuration guide for end users.
- **`skills/artcraft-mcp/`**: Agent prompt skills and reference docs for video models, image models, aspect ratios, and 3D splatting.

---

### 5. 🛡️ Security & Privacy Hardening
- **Path Sanitization**: All documentation and scripts use generic placeholders—no hardcoded user paths or local drive letters.
- **Git Hardening**: Updated `.gitignore` to explicitly block `artcraft_session.txt`, `artcraft_avt.txt`, and `credentials/` from ever being tracked in Git.

---

## 🧪 Testing & Verification

- **Security Audit**: Scanned repository with automated secret scanner—100% clean of hardcoded keys or tokens.
- **End-to-End Execution**: Verified complete upload -> queue -> status poll -> download cycles for image-to-video (`Seedance 2.0`) and Hunyuan 3D workflows.
- **Build Verification**: Verified clean compilation of Rust crates (`cargo build --release --bin artcraft-mcp-server`).

---

## 📋 Checklist for Reviewers

- [x] Rust MCP crates build cleanly without workspace errors.
- [x] Isolated inside `crates/tools/servers/artcraft_mcp_server` and `mcp-server-package/`.
- [x] Tested with Windsurf, Claude Desktop, and CLI scripts.
- [x] Documentation & setup guides included.
