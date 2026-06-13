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
- [Aspect Ratios](references/aspect-ratios.md): Supported aspect ratios (Square, Widescreen, Tall, etc.)

## Available Tools

### 1. generate_image
Enqueues an image generation request using ArtCraft's omni-gen image endpoint.
- **Required parameter**: `prompt` (The text describing the desired image).
- **Optional parameters**:
  - `model`: e.g., `flux_1_dev` (default), `nano_banana_pro`, `seedream_4`, `midjourney_8`.
  - `aspect_ratio`: e.g., `square`, `wide_sixteen_by_nine`, `tall_nine_by_sixteen`.
  - `quality`: `standard` or `high`.
  - `image_batch_count`: Number of images to generate (integer, default is 1).

### 2. generate_video
Enqueues a video generation request using ArtCraft's omni-gen video endpoint.
- **Required parameter**: `prompt` (Text describing the video action/scene).
- **Optional parameters**:
  - `model`: e.g., `seedance_2p0` (default), `sora_2`, `veo_3`.
  - `duration`: Duration in seconds (integer, default is 5).
  - `start_frame_media_token` & `end_frame_media_token`: MediaFileToken strings for the first/last frames.
  - `image_reference_tokens`, `video_reference_tokens`, `audio_reference_tokens`: Comma-separated strings of MediaFileTokens.

### 3. generate_object_3d
Enqueues an Image-to-3D generation request using Hunyuan 3D.
- **Required parameter**: `media_file_token` (The uploaded image token to convert to 3D).
- **Optional parameter**: `version` (`2.0` or `2.1`, default is `2.0`).

### 4. generate_splat_3d
Enqueues a Gaussian Splat generation request using WorldLabs Marble.
- **Optional parameters**:
  - `image_media_file_token` (Optional input image token to seed world generation).
  - `prompt` (Optional text description of the world/scene).
  - `version` (`mini` or `plus`, default is `mini`).
  *(Note: Either `prompt` or `image_media_file_token` must be provided).*

### 5. upload_media
Uploads a local image or video file from the filesystem to ArtCraft to get a `MediaFileToken`.
- **Required parameter**: `file_path` (Absolute path to the local media file like PNG, JPG, MP4).

### 6. list_jobs
Lists the recent ArtCraft generation jobs, showing status, progress, and CDN links to results.
- **Optional parameters**: `include_states`, `exclude_states` (comma-separated state names like `pending,started`).

### 7. get_job_status
Retrieves detailed status for a specific generation job using its job token.
- **Required parameter**: `job_token` (The unique token of the job, e.g., `job_xxx`).

### 8. get_credits
Retrieves the user's current credit balance, including free, monthly, and banked credits, as well as the sum total.

### 9. get_subscription
Retrieves details about the user's active ArtCraft subscription, including plan slug, status, and billing dates.

### 10. create_checkout_session
Generates a Stripe checkout URL.
- **Required parameters**: `type` ('credits' or 'subscription').
- **Optional parameters**: `quantity` (for credits), `plan_id` (for subscriptions).

### 11. get_billing_portal_url
Generates a Stripe portal URL for the user to securely manage their payment methods and subscription.

### 12. estimate_image_cost / estimate_video_cost
Estimates the cost in credits for generating media.
- **Required parameters**: `model`, `provider`, `generation_mode` ('text_to_image', 'image_edit', etc.).
- **Optional parameters**: `aspect_ratio`, `image_batch_count`, `duration_seconds`.

### 13. get_media_file / download_media_file / delete_media_file
Tools to interact with uploaded or generated media files.
- **get_media_file**: Retrieves rich metadata for a given `media_token`.
- **download_media_file**: Downloads the media file to the local disk. Requires `media_token` and `download_directory`.
- **delete_media_file**: Deletes a media file from the user's account using its `media_token`.

### 14. create_prompt
Saves a text prompt to the backend and returns a `PromptToken`.
- **Required parameter**: `prompt`.
- **Optional parameter**: `is_negative` (boolean).

### 15. list_models
Returns a list of supported image and video models, along with their capabilities and required provider credentials.

### 16. check_provider_credentials
Lists the configured 3rd-party API keys (e.g., FAL API Key, Midjourney Login) by checking local settings securely without exposing the key contents.

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

