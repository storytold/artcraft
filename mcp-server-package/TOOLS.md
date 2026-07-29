# ArtCraft MCP CLI Tools Suite (Community Release Edition)

A suite of standalone, cross-platform Python CLI tools that interface directly with `artcraft-mcp-server` over stdio Model Context Protocol (JSON-RPC).

### 🚀 Portability Features
- **Dynamic Binary Discovery**: Automatically locates `artcraft-mcp.exe` or `artcraft-mcp-server` relative to script paths.
- **Environment Overrides**: Set `ARTCRAFT_MCP_PATH` to specify a custom binary location or `ARTCRAFT_3D_OUT` for custom output directories.
- **Cross-Platform**: Runs on Windows, macOS, and Linux without hardcoded user paths.

---

## 1. `artcraft_runner.py` — Batch Video & Image Automation
Enqueues parallel video and image generation jobs, polls status asynchronously, and downloads outputs.

```pwsh
python tools/artcraft_runner.py `
  --image "C:\path\to\image.jpg" `
  --prompt "Retro VHS glitch push-in with sodium flare" `
  --model seedance_2p0 `
  --copies 2 `
  --out-dir "D:\output"
```

---

## 2. `artcraft_3d_runner.py` — Hunyuan 3D & WorldLabs Splat Automator
Converts 2D images into 3D meshes (Hunyuan 3D 2.0/2.1) or Gaussian Splat environments (WorldLabs Marble).

```pwsh
python tools/artcraft_3d_runner.py `
  --image "C:\path\to\anomaly.jpg" `
  --mode both `
  --out-dir "F:\AI_Art\3D_Assets"
```

---

## 3. `artcraft_angle_matrix.py` — Spatial Camera Orbit Generator
Generates a 4-quadrant camera orbit pass (Left -30°, Right +30°, High Pitch +20°, Zoom 1.4x) using `flux_2_lora_angles`.

```pwsh
python tools/artcraft_angle_matrix.py `
  --image "C:\path\to\subject.jpg" `
  --prompt "Maintain subject details while orbiting camera" `
  --out-dir "D:\output"
```

---

## 4. `artcraft_audio_weaver.py` — Audio & Voice Synthesis Weaver
Uploads reference audio stems and stages text prompts for ambient audio and voice conversion pipelines.

---

## 5. `artcraft_cost_estimator.py` — Credit Balance & Generation Cost Inspector
Queries live credit balances, subscription status, and estimates exact credit costs before firing heavy video, image, or 3D generations.

```pwsh
python tools/artcraft_cost_estimator.py `
  --check-balance `
  --video-model seedance_2p0 `
  --duration 5
```

---

## 🚀 One-Click Setup Utility (`setup_mcp.py`)
Auto-detects installed MCP client configurations (Windsurf, Claude Desktop, Cursor) and automatically registers `artcraft-mcp` into their JSON config files.

```pwsh
python setup_mcp.py
```

