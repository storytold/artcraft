# Changelog

All notable changes to the **ArtCraft Model Context Protocol (MCP) Server** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-07-29

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
