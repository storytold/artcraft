# Image Models

Accepted `model` values for `artcraft_generate_image` (and image
`media_type` in `artcraft_estimate_cost`). Aliases in parentheses also
parse. Unknown values are rejected with an explicit error.

| Model                  | Aliases                | Notes                                  |
|------------------------|------------------------|----------------------------------------|
| `flux_1_dev`           | `flux1dev`             | General purpose, prompt adherence      |
| `flux_1_schnell`       | `flux1schnell`         | Fast generation                        |
| `flux_pro_1p1`         | `flux-pro-1.1`         | Cinematic quality                      |
| `flux_pro_1p1_ultra`   | `flux-pro-1.1-ultra`   | Highest fidelity Flux                  |
| `gpt_image_1`          | `gpt-image-1`          | Semantic adherence, text rendering     |
| `gpt_image_1p5`        | `gpt-image-1.5`        | Improved GPT image                     |
| `gpt_image_2`          | `gpt-image-2`          | Latest GPT image                       |
| `grok_imagine_image`   | `grok_imagine`         | Stylized, dynamic                      |
| `grok_imagine_image_q` |                        | Higher quality Grok                    |
| `midjourney_7`         | `mj7`                  | Photorealistic (linked MJ account)     |
| `midjourney_7_niji`    |                        | Anime-style Midjourney 7               |
| `midjourney_8`         | `mj8`                  | Latest Midjourney (linked MJ account)  |
| `nano_banana`          | `nanobanana`           | Editing/composition                    |
| `nano_banana_2`        | `nanobanana2`          | v2 editing/composition                 |
| `nano_banana_pro`      | `nanobananapro`        | Multi-image composition (up to 16 refs)|
| `seedream_4`           | `seedream4`            | Anime/illustration                     |
| `seedream_4p5`         | `seedream4p5`          | Improved Seedream                      |
| `seedream_5_lite`      | `seedream5lite`        | Lightweight Seedream 5                 |
| `seedream_5p0_pro`     | `seedream_5_pro`       | Seedream 5 Pro                         |
| `seedream_5p0_pro_u`   |                        | Seedream 5 Pro Ultra                   |
| `flux_2_lora_angles`   |                        | Camera-angle editing (see below)       |
| `qwen_edit_2511_angles`|                        | Camera-angle editing (see below)       |

## Camera-angle editing

For angle orbits prefer the dedicated `artcraft_edit_image_angle` tool
(`image_media_token`, `horizontal_angle`, `vertical_angle`, `zoom`,
`confirm`). The `flux_2_lora_angles` / `qwen_edit_2511_angles` image models
also accept `adjust_horizontal_angle` / `adjust_vertical_angle` /
`adjust_zoom` on `artcraft_generate_image`.

## Other parameters

- `aspect_ratio`: see [aspect-ratios.md](aspect-ratios.md)
- `resolution`: `half_k`, `one_k`, `two_k`, `three_k`, `four_k`,
  `four_eighty_p`/`480p`, `seven_twenty_p`/`720p`, `ten_eighty_p`/`1080p`
- `quality`: `low`, `medium`, `high`, `xhigh`, `max`, `auto`
- `image_batch_count`: integer 1-8 (default 1)
- `image_media_tokens`: array of `m_` tokens, max 16
