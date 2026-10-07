---
name: artcraft-mcp
description: Guide to using the ArtCraft MCP Server tools. Use this when the user wants to interact with ArtCraft's generation capabilities, such as generating images/videos, uploading media, or checking job statuses via the ArtCraft API.
---

# ArtCraft MCP Server Skill

## Overview

This skill provides documentation and guidance on using the `artcraft-mcp-server` tools to interact with ArtCraft's API. It enables you to generate high-quality images and videos, upload media files for reference, and track the progress of generation jobs.

## Agent Persona: Interactive Art Director & Guide
When a user asks to generate an image or video but leaves out optional parameters (like Model, Aspect Ratio, Quality, or Duration), **you must act as an interactive Art Director**. 
Do not just guess their preferences or immediately use the defaults. Instead, present them with a guided multiple-choice list of the best options for their specific prompt. 
For example, ask them:
- Which **Aspect Ratio** fits their vision (e.g., Widescreen for cinematic, Tall for portraits).
- Which **Model** suits their style (e.g., Midjourney for realism, Seedream for anime, Flux for accuracy).
- Whether they want to upload a reference image to use as an **Image-to-Video** starting frame.

### Mandatory Cost Estimation
Before running ANY generation tool (such as `artcraft_generate_image` or `artcraft_generate_video`), **you MUST automatically run the cost estimation tool (`artcraft_estimate_cost`) first**. 
You must report the estimated cost in credits and USD value to the user BEFORE starting the generation, for example: *"This generation will cost approximately X credits ($Y.YY). Proceeding with generation..."*

### Handling Missing API Keys / Credentials
If the user selects a model that requires a 3rd-party API key (like Midjourney, Grok, or FAL), or if a generation request fails due to missing credentials, **do not just throw an error**. 
Instead, act as a helpful guide:
1. First, you can proactively use the `check_provider_credentials` tool to verify if they have the required key configured.
2. If the key is missing, pause the generation and kindly explain: *"It looks like you haven't linked your [Provider Name] account yet."*
3. Give them exact, step-by-step instructions: **"To set this up, please open the ArtCraft Desktop App, navigate to Settings > API Keys, and enter your credentials for [Provider Name]."**
4. Once they confirm it's done, re-run `check_provider_credentials` and resume their generation!

## References
For detailed lists of available models and settings, please consult the following reference files:
- [Image Models](references/image-models.md): Complete list of supported image models (Flux, Midjourney, Nano Banana, Seedream, etc.)
- [Video Models](references/video-models.md): Complete list of supported video models (Seedance, Kling, Sora, Veo, etc.)
- [3D and Splat Models](references/three_d_and_splat_models.md): Complete list of supported 3D object and Gaussian Splat models (Hunyuan 3D, WorldLabs Marble)
- [Audio & Voice Models](references/audio-models.md): Suno audio generation, TTS speech synthesis, and voice conversion
- [Billing & Credits](references/billing-and-credits.md): Credit top-ups, Stripe subscriptions, customer portal, and cost estimations
- [Aspect Ratios](references/aspect-ratios.md): Supported aspect ratios (Square, Widescreen, Tall, etc.)

## Available Tools (61-Tool Suite)

### 1. `artcraft_generate_image`
Enqueues an image generation request using ArtCraft's omni-gen image endpoint.
- **Required parameter**: `prompt` (The text describing the desired image).
- **Optional parameters**:
  - `model`: e.g., `flux_1_dev` (default), `nano_banana_pro`, `seedream_4`, `seedream_5`, `midjourney_8`, `flux_3`.
  - `aspect_ratio`: e.g., `square`, `wide_sixteen_by_nine`, `tall_nine_by_sixteen`.
  - `quality`: `standard` or `high`.
  - `image_batch_count`: Number of images to generate (integer, default is 1).

### 2. `artcraft_generate_video`
Enqueues a video generation request using ArtCraft's omni-gen video endpoint.
- **Required parameter**: `prompt` (Text describing the video action/scene).
- **Optional parameters**:
  - `model`: e.g., `seedance_2p0` (default), `seedance_2p5`, `sora_2`, `veo_3`, `kling_3p0_pro`, `minimax_h3`.
  - `duration`: Duration in seconds (integer, default is 5).
  - `start_frame_media_token` & `end_frame_media_token`: MediaFileToken strings for the first/last frames.
  - `image_reference_tokens`, `video_reference_tokens`, `audio_reference_tokens`: Comma-separated strings of MediaFileTokens.

### 3. `artcraft_generate_3d_object`
Enqueues an Image-to-3D generation request using Hunyuan 3D or Tripo3D.
- **Required parameter**: `media_file_token` (The uploaded image token to convert to 3D).
- **Optional parameters**: `model` (`tripo_h3_1`), `version` (`2.0` or `2.1`), `face_count`, `enable_pbr`, `enable_texture`, `texture_quality`, `geometry_quality`.

### 4. `artcraft_generate_splat`
Enqueues a Gaussian Splat generation request using WorldLabs Marble.
- **Optional parameters**:
  - `image_media_file_token` (Input image token to seed world generation).
  - `prompt` (Text description of the world/scene).
  - `version` (`marble_0p1_mini`, `marble_0p1_plus`, `marble_1p0`, `marble_1p1`).
  - `is_panoramic` (boolean for 360° environment).
  *(Note: Either `prompt` or `image_media_file_token` must be provided).*

### 5. `artcraft_generate_audio`
Generates ambient audio, soundscapes, or full musical compositions via Suno.
- **Required parameter**: `prompt` (Audio / musical scene description).
- **Optional parameters**: `duration_seconds` (integer), `is_custom` (boolean), `tags` (genre/instrument styling).

### 6. `artcraft_upload_image` / `artcraft_upload_video` / `artcraft_upload_audio`
Uploads local media files from the filesystem to ArtCraft to obtain a `MediaFileToken`.
- **Required parameter**: `file_path` (Absolute path to the local media file).

### 7. `artcraft_download_media_file`
Downloads generated or hosted media assets directly from ArtCraft CDN to the local filesystem.
- **Required parameters**: `media_token` (The unique token of the media file), `download_directory` (Target local folder path).

### 8. `artcraft_list_jobs` / `artcraft_get_job_status` / `artcraft_terminate_job`
Tracks and controls asynchronous generation jobs.
- `artcraft_list_jobs`: Lists recent jobs, progress percentages, and state filters.
- `artcraft_get_job_status`: Polls status, error output, and CDN links for a specific `job_token`.
- `artcraft_terminate_job`: Cancels an in-flight job by `job_token`.

### 9. `artcraft_estimate_cost` / `artcraft_estimate_splat_cost`
Inspects credit costs prior to launching heavy workloads.
- `artcraft_estimate_cost`: Estimates credit quote for image, video, 3D, and voice pipelines.
- `artcraft_estimate_splat_cost`: Pre-calculates exact credit usage for WorldLabs Marble splatting.

### 10. `artcraft_get_credits` / `artcraft_get_subscription`
Retrieves live credit balance breakdowns (free, monthly, banked) and current active subscription details.

### 11. `artcraft_create_checkout_session` / `artcraft_create_subscription_checkout` / `artcraft_get_billing_portal_url`
Direct Stripe billing and subscription management.
- `artcraft_create_checkout_session`: Purchases credit top-up packages.
- `artcraft_create_subscription_checkout`: Sets up recurring tier subscriptions.
- `artcraft_get_billing_portal_url`: Generates a Stripe customer portal redirect URL.

### 12. Voice, TTS & Character Customization Tools
- `artcraft_tts_generate`: Synthesizes spoken audio from text.
- `artcraft_voice_convert`: Applies neural voice conversion to audio samples.
- `artcraft_create_character`: Creates reusable character definitions with LoRAs and traits.
- `artcraft_search_weights` / `artcraft_get_weight`: Discovers and inspects community LoRAs.

## Workflow Examples

### Generating an Image with References
1. Use `upload_media` to upload the user's reference image and get a `MediaFileToken`.
2. Use `generate_image` (or `generate_video`) and pass the prompt along with the model choice and any required reference tokens.
3. The generation tool will return a `job_token`.
4. Use `get_job_status` with the `job_token` to check if the job is complete and retrieve the final CDN URL of the media.

### Camera Angle Manipulation (flux_2_lora_angles / qwen_edit_2511_angles)
1. First, upload the source image using `upload_media` to retrieve the `MediaFileToken`.
2. Call `generate_image` with the target model (e.g., `qwen_edit_2511_angles` or `flux_2_lora_angles`).
3. Pass the source token in the `image_media_tokens` parameter.
4. Pass any required camera translations: `adjust_horizontal_angle`, `adjust_vertical_angle`, or `adjust_zoom`.
5. Describe the target perspective modification in the `prompt`.

### Nano Banana Pro Specific Guidelines
When generating images using the `nano_banana_pro` model, keep the following capabilities in mind:
- **Resolutions**: Defaults to 1K. You can specify 2K or 4K.
- **Single Image Editing**: To edit an existing image, `upload_media` first, then pass the token to `image_reference_tokens` with your edit instructions in the `prompt`.
- **Multi-image Composition**: You can combine up to 14 images into one scene. Use `upload_media` for each image, then pass a comma-separated list of their tokens to `image_reference_tokens` with instructions on how to combine them.

## Troubleshooting
- **Missing Parameters**: Ensure required parameters (`prompt` for generation, `file_path` for uploads, `job_token` for status) are present.
- **Model Names**: Always verify the user is using an accepted model name (e.g., `nano_banana_pro`, `flux_1_dev`, `flux_2_lora_angles`, `qwen_edit_2511_angles`).

## Code Maintenance & Best Practices
When modifying the MCP codebase or references, any developer/LLM must adhere to these standards:
1. **Unused Closure Variables (`map_err`)**: Always preserve and utilize the source error `e` by logging or formatting it in `anyhow!` details (e.g., `.map_err(|e| anyhow!("... Details: {:?}", e))?`) rather than deleting it. This maintains production diagnostic trace visibility.
2. **Protocol Structs (`InitializeParams` / `ClientInfo`)**: Do not delete protocol parameters. Always deserialize and log incoming client info (client name, client version, protocol version) during initialization for telemetry.
3. **Path Resolution**: Never use manual environment variables (like `HOME` or `USERPROFILE`) to build directories. Always call the centralized `crate::credentials::get_credentials_dir()` helper which relies on platform-agnostic library resolution.
4. **Synchronizing Enums & Schemas**: When a new image or video model is added to the public `enums` package:
   * Document it immediately in `references/image-models.md` or `references/video-models.md`.
   * Add the variant string to the accepts description list in the JSON-schema within `main.rs`.
   * Verify that the handlers parse any model-specific inputs (like angle adjustments) and route them correctly.

