# ArtCraft MCP Server — Setup Guide

## What Is This?

The ArtCraft MCP Server is a standalone executable that connects your AI coding assistant (Windsurf, Claude Desktop, or any MCP-compatible client) to the ArtCraft AI generation platform. It exposes **40+ tools** for generating images, videos, 3D objects, voice, and more — all through natural language commands.

---

## What You Need

### 1. The Executable
A single file: **`artcraft-mcp.exe`** (~12 MB)

This is a fully self-contained Rust binary. No runtime dependencies, no DLLs, no Python, no Node.js required. Place it anywhere on your system.

### 2. An ArtCraft Account
You need an active ArtCraft account with valid session credentials. The server authenticates using your ArtCraft session cookies.

### 3. An MCP-Compatible Client
Any client that supports the Model Context Protocol (MCP) over stdio. This guide covers Windsurf, but the setup is similar for Claude Desktop and others.

---

## Step 1: Place the Executable

Put `artcraft-mcp.exe` anywhere on your system. Common locations:

- `C:\Tools\artcraft-mcp.exe`
- `C:\Users\YourName\artcraft-mcp.exe`
- Any folder you prefer

**The location does not matter.** All credential paths are resolved from your user home directory, not the executable's location.

---

## Step 2: Set Up Your ArtCraft Credentials

The server needs your ArtCraft session cookies to authenticate API requests. There are two methods:

### Method A: Credential Files (Recommended)

Create the following folder and files:

```
C:\Users\YourUsername\Artcraft\credentials\
    ├── artcraft_session.txt    ← Your session cookie token
    └── artcraft_avt.txt        ← Your visitor cookie token
```

Each file should contain only the raw cookie token value (no quotes, no formatting, just the token string).

### Method B: ArtCraft Desktop App (Automatic)

If you have the **ArtCraft Desktop App** installed and have logged in at least once, the server will automatically find your credentials in the Tauri cookie store at:

```
C:\Users\YourUsername\AppData\Local\ai.artcraft.app\.cookies
```

If this file exists, you don't need to create the credential files manually.

### How to Get Your Cookie Tokens

1. Log in to [ArtCraft](https://artcraft.ai) in your web browser
2. Open Developer Tools (F12) → Application → Cookies
3. Find the `session` cookie — copy its value into `artcraft_session.txt`
4. Find the `visitor` cookie — copy its value into `artcraft_avt.txt`

---

## Step 3: Configure Your MCP Client

### For Windsurf

Open your MCP config file. On Windows, this is typically:

```
C:\Users\YourUsername\.windsurf\mcp_config.json
```

Add the following entry inside the `mcpServers` object:

```json
"artcraft": {
  "command": "C:\\path\\to\\artcraft-mcp.exe",
  "args": [],
  "description": "ArtCraft AI generation platform - images, video, 3D, voice, TTS, characters, and more",
  "enabled": true
}
```

**Replace `C:\\path\\to\\` with the actual path where you placed the executable.** Remember to use double backslashes (`\\`) in JSON strings on Windows.

### For Claude Desktop

Open `claude_desktop_config.json` and add the same entry to the `mcpServers` object.

---

## Step 4: Install the Skill Files (Optional but Recommended)

The skill files teach your AI assistant how to use the ArtCraft tools effectively — which models to choose, how to handle workflows, and best practices.

Copy the entire `artcraft-mcp` folder (including the `references` subdirectory) into your skills directory:

```
artcraft-mcp/
    ├── SKILL.md                          ← Main skill definition
    └── references/
        ├── image-models.md              ← Supported image models
        ├── video-models.md              ← Supported video models
        ├── three_d_and_splat_models.md  ← 3D and Gaussian Splat models
        └── aspect-ratios.md             ← Supported aspect ratios
```

For Windsurf, skills typically go in your `.windsurf/skills/` directory or project-level `.skills/` folder.

---

## Step 5: Verify It Works

1. Restart your MCP client (or reload the MCP servers)
2. Ask your AI assistant: *"Can you check my ArtCraft credits?"*
3. If configured correctly, it should call the `artcraft_get_credits` tool and report your balance

If you get an error about missing credentials, double-check Step 2.

---

## Available Tools (40+)

### Generation
| Tool | Description |
|---|---|
| `artcraft_generate_image` | Generate images from text prompts (Flux, Midjourney, Nano Banana, Seedream, GPT, Grok) |
| `artcraft_generate_video` | Generate videos from text (Seedance, Kling, Sora, Veo, Grok) |
| `artcraft_generate_3d_object` | Convert images to 3D models (Hunyuan 3D) |
| `artcraft_generate_splat` | Generate Gaussian Splat 3D worlds (WorldLabs Marble) |

### Editing
| Tool | Description |
|---|---|
| `artcraft_edit_image` | Re-edit an existing image |
| `artcraft_remove_background` | Remove background from an image |
| `artcraft_inpaint_image` | Inpaint specific regions of an image |
| `artcraft_edit_image_angle` | Manipulate camera angle of an image |
| `artcraft_edit_video` | Edit a video using Beeble SwitchX |

### Media Management
| Tool | Description |
|---|---|
| `artcraft_upload_image` | Upload a local image for use as reference |
| `artcraft_upload_video` | Upload a local video for use as reference |
| `artcraft_upload_audio` | Upload a local audio file |
| `artcraft_get_media_file` | Get details about a media file |
| `artcraft_list_media_files` | List all your media files |
| `artcraft_search_media` | Search session or featured media |
| `artcraft_delete_media_file` | Delete a media file |
| `artcraft_rename_media_file` | Rename a media file |
| `artcraft_set_media_visibility` | Set media to public or private |

### Jobs
| Tool | Description |
|---|---|
| `artcraft_get_job_status` | Check status of a generation job |
| `artcraft_list_jobs` | List all session jobs |
| `artcraft_terminate_job` | Cancel a running or pending job |

### Cost & Models
| Tool | Description |
|---|---|
| `artcraft_estimate_cost` | Estimate cost before generating |
| `artcraft_list_image_models` | List available image models |
| `artcraft_list_video_models` | List available video models |

### Characters
| Tool | Description |
|---|---|
| `artcraft_create_character` | Create a character from a reference image |
| `artcraft_list_characters` | List all your characters |
| `artcraft_get_character` | Get character details |
| `artcraft_delete_character` | Delete a character |

### Voice & TTS
| Tool | Description |
|---|---|
| `artcraft_tts_generate` | Generate speech from text |
| `artcraft_tts_search_models` | Discover available TTS voices |
| `artcraft_voice_convert` | Convert voice using a trained model |
| `artcraft_list_voice_conversion_models` | List voice conversion models |
| `artcraft_create_voice` | Create a custom voice |
| `artcraft_list_voices` | List available voices |
| `artcraft_create_voice_dataset` | Create a voice training dataset |
| `artcraft_upload_voice_sample` | Add a sample to a voice dataset |

### Prompts & Weights
| Tool | Description |
|---|---|
| `artcraft_create_prompt` | Save a prompt for reuse |
| `artcraft_get_prompt` | Retrieve a saved prompt |
| `artcraft_list_weights` | List available model weights (LoRAs) |
| `artcraft_search_weights` | Search weights by keyword |
| `artcraft_get_weight` | Get weight details |
| `artcraft_delete_weight` | Delete a model weight |

### Studio
| Tool | Description |
|---|---|
| `artcraft_studio_gen2` | Video style transfer / image+video compositing |

### Account
| Tool | Description |
|---|---|
| `artcraft_get_session_info` | Get current user info |
| `artcraft_get_credits` | Check credit balance |
| `artcraft_get_subscription` | Check subscription tier and limits |

### Social
| Tool | Description |
|---|---|
| `artcraft_create_bookmark` | Bookmark a media file |
| `artcraft_list_bookmarks` | List your bookmarks |
| `artcraft_rate_media` | Rate a media file (thumbs up/down) |
| `artcraft_create_comment` | Comment on a media file |
| `artcraft_list_comments` | List comments on a media file |
| `artcraft_list_tags` | List tags on a media file |
| `artcraft_set_tags` | Add or remove tags on a media file |

### Referrals
| Tool | Description |
|---|---|
| `artcraft_create_referral_code` | Create a referral code |
| `artcraft_list_referral_codes` | View your referral codes |

---

## Supported Image Models

| Model | Best For |
|---|---|
| `flux_1_dev` | General-purpose, prompt adherence (default) |
| `flux_1_schnell` | Fast generation |
| `flux_pro_1p1` / `flux_pro_1p1_ultra` | Cinematic, commercial quality |
| `flux_2_lora_angles` | Camera angle manipulation |
| `nano_banana_pro` | Multi-image composition (up to 14), editing, 1K/2K/4K |
| `seedream_4` / `seedream_4p5` | Anime, illustration |
| `seedream_5_lite` | Lightweight Seedream 5 |
| `midjourney_7` / `midjourney_8` | Photorealistic, artistic (requires linked MJ account) |
| `midjourney_7_niji` | Anime-style Midjourney |
| `gpt_image_1` / `gpt_image_1p5` / `gpt_image_2` | Semantic adherence, text rendering |
| `grok_imagine_image` / `grok_imagine_image_q` | Stylized, dynamic scenes |

## Supported Video Models

| Model | Best For |
|---|---|
| `seedance_2p0` | General-purpose video (default) |
| `seedance_2p0_fast` | Quick prototyping |
| `seedance_2p0_u` / `seedance_2p0_bpu` | Ultra high quality final renders |
| `kling_3p0_standard` / `kling_3p0_pro` | Complex motion, high fidelity |
| `kling_2p1_pro` / `kling_2p1_master` | Legacy Kling 2.1 |
| `veo_3` / `veo_3_fast` | Cinematic realism |
| `veo_3p1` / `veo_3p1_fast` | Improved prompt adherence |
| `sora_2` / `sora_2_pro` | Long continuous scenes |
| `grok_imagine_video` / `grok_imagine_video_1p5` | Grok video generation |

## Supported Aspect Ratios

`square`, `wide_three_by_two`, `wide_four_by_three`, `wide_sixteen_by_nine`, `wide_twenty_one_by_nine`, `tall_two_by_three`, `tall_three_by_four`, `tall_four_by_five`, `tall_nine_by_sixteen`, `tall_nine_by_twenty_one`, `auto`, `auto_2k`, `auto_3k`, `auto_4k`

---

## Troubleshooting

### "No ArtCraft credentials found"
- Ensure credential files exist at `C:\Users\YourUsername\Artcraft\credentials\`
- Or ensure the ArtCraft Desktop App is installed and you've logged in
- Check that the token files are not empty

### "Method not found" errors
- Make sure you're using the latest `artcraft-mcp.exe` build
- Restart your MCP client after updating the executable

### Generation fails with credential errors for specific models
- Some models (Midjourney, Grok) require third-party API keys linked in the ArtCraft Desktop App
- Open ArtCraft Desktop App → Settings → API Keys → Link the required provider

### Server doesn't appear in your client
- Verify the path in `mcp_config.json` is correct (use double backslashes on Windows)
- Ensure `"enabled": true` is set
- Restart the client after saving the config

---

## Quick Start Checklist

- [ ] Copy `artcraft-mcp.exe` to a permanent location
- [ ] Set up ArtCraft credentials (cookie files or install Desktop App)
- [ ] Add MCP config entry to `mcp_config.json` with correct path
- [ ] Copy `artcraft-mcp` skill folder to your skills directory
- [ ] Restart your MCP client
- [ ] Test with: *"Check my ArtCraft credits"*

---

*ArtCraft MCP Server v0.1.0 | Protocol: 2025-03-26*
