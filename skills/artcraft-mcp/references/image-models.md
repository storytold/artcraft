# Supported Image Models

The ArtCraft MCP server supports a wide variety of image models via the `model` parameter in the `generate_image` tool.

## General Usage Rules
When generating images, the agent MUST adhere to these rules:
- **`prompt`**: Mandatory. Detail the subject, style, lighting, and composition.
- **`aspect_ratio`**: Optional but highly recommended. Valid options: `square`, `wide_three_by_two`, `wide_sixteen_by_nine`, `wide_twenty_one_by_nine`, `tall_two_by_three`, `tall_nine_by_sixteen`. Defaults to `square` if omitted.
- **`quality`**: Optional. Valid options: `standard`, `high`. 
- **`image_batch_count`**: Number of images to generate (1 to 4).
- **`generation_mode`** (Used mainly in cost estimation): `text_to_image` or `image_edit`.

## Flux Models
- **`flux_1_dev`**: (Default model). Excellent general-purpose generation. Best for prompt adherence and realistic details.
- **`flux_1_schnell`**: Fast variant of Flux 1. Use when speed is preferred over ultra-fine details.
- **`flux_pro_1p1` / `flux_pro_1p1_ultra`**: Professional and ultra-high-quality variants. Use for cinematic or highly polished commercial outputs.
- **`flux_2_lora_angles`**: LoRA fine-tuned variant. Use when specific camera angles or character poses are requested.

## Nano Banana (Gemini)
Nano Banana models are unique in their support for advanced composition and editing.
- **`nano_banana_pro`**: Pro variant. 
  - **Capabilities**: Supports multi-image composition (up to 14 inputs), single image editing, and targeting specific resolutions (1K/2K/4K).
  - **Editing Workflow**: To edit an existing image, use `upload_media` to get a `MediaFileToken`, then pass it to the `image_reference_tokens` parameter. Specify the edit instructions clearly in the `prompt`.
  - **Composition Workflow**: Upload multiple images, pass their comma-separated tokens to `image_reference_tokens`, and describe how to combine them in the `prompt`.

## Seedream
- **`seedream_4` / `seedream_4p5`**: Highly aesthetic, anime, and illustration-friendly generation models. Best used with anime-style prompts.
- **`seedream_5_lite`**: Lightweight variant of the newer Seedream 5 model.

## Midjourney
Midjourney models require a linked `midjourney.web_login.toml` credential.
- **`midjourney_7` / `midjourney_8`**: Extremely high-quality photorealistic and artistic models. Do NOT use complex paragraph prompts; use comma-separated keywords and stylistic terms.
- **`midjourney_7_niji`**: Specially tuned for anime and illustrative styles.

## GPT / DALL-E
- **`gpt_image_1` / `gpt_image_1p5` / `gpt_image_2`**: GPT-powered image generation models. Excellent for highly specific semantic adherence and text rendering.

## Grok
- **`grok_imagine_image`**: Standard Grok image model. Good for stylized and dynamic scenes.
- **`grok_imagine_image_q`**: Higher quality Grok image model variant.
