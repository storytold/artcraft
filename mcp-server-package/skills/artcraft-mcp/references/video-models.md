# Video Models

Accepted `model` values for `artcraft_generate_video` (and video
`media_type` in `artcraft_estimate_cost`). Unknown values are rejected
with an explicit error.

| Model                     | Aliases                    | Notes                          |
|---------------------------|----------------------------|--------------------------------|
| `seedance_2p0`            | `seedance-2.0`             | General purpose (default)      |
| `seedance_2p0_fast`       | `seedance-2.0-fast`        | Quick drafts                   |
| `seedance_2p0_bp`         | `seedance-2.0-byteplus`    | BytePlus tier                  |
| `seedance_2p0_bp_fast`    |                            | BytePlus fast                  |
| `seedance_2p0_bpu`        |                            | BytePlus ultra quality         |
| `seedance_2p0_bpu_fast`   |                            | BytePlus ultra fast            |
| `seedance_2p0_mini`       |                            | Seedance 2.0 mini              |
| `seedance_2p0_bp_mini`    |                            | BytePlus mini                  |
| `seedance_2p0_bpu_mini`   |                            | BytePlus ultra mini            |
| `seedance_2p5_preview`    |                            | Seedance 2.5 preview           |
| `seedance_2p5`            | `seedance-2.5`             | Seedance 2.5                   |
| `seedance_2p5_u`          | `seedance-2.5-ultra`       | Seedance 2.5 ultra             |
| `seedance_1p5_pro`        | `seedance-1.5-pro`         | Legacy 1.5                     |
| `seedance_1p0_lite`       | `seedance-1.0-lite`        | Legacy 1.0 lite                |
| `kling_3p0_standard`      | `kling-3.0-standard`       | Kling 3.0 standard             |
| `kling_3p0_pro`           | `kling-3.0-pro`            | Kling 3.0 pro, complex motion  |
| `kling_2p6_pro`           | `kling-2.6-pro`            | Kling 2.6                      |
| `kling_2p5_turbo_pro`     | `kling-2.5-turbo-pro`      | Kling 2.5 turbo                |
| `kling_2p1_pro`           | `kling-2.1-pro`            | Kling 2.1                      |
| `kling_2p1_master`        | `kling-2.1-master`         | Kling 2.1 master               |
| `kling_1p6_pro`           | `kling-1.6-pro`            | Kling 1.6                      |
| `sora_2`                  | `sora-2`                   | OpenAI Sora 2                  |
| `sora_2_pro`              | `sora-2-pro`               | Sora 2 pro, long scenes        |
| `veo_2`                   | `veo-2`                    | Google Veo 2                   |
| `veo_3`                   | `veo-3`                    | Veo 3, cinematic realism       |
| `veo_3_fast`              | `veo-3-fast`               | Veo 3 fast                     |
| `veo_3p1`                 | `veo-3.1`                  | Veo 3.1, prompt adherence      |
| `veo_3p1_fast`            | `veo-3.1-fast`             | Veo 3.1 fast                   |
| `veo_3p1_lite`            | `veo-3.1-lite`             | Veo 3.1 lite                   |
| `vidu_q3`                 | `vidu-q3`                  | Vidu Q3                        |
| `vidu_q3_turbo`           | `vidu-q3-turbo`            | Vidu Q3 turbo                  |
| `minimax_h3`              | `hailuo_h3`                | MiniMax Hailuo 3               |
| `minimax_h3_turbo`        | `minimax-h3-turbo`         | MiniMax H3 turbo               |
| `minimax_h3_ultra`        | `minimax-h3-ultra`         | MiniMax H3 ultra               |
| `flux_3`                  | `flux-3`                   | Flux video 3                   |
| `flux_3_draft`            | `flux-3-draft`             | Flux 3 draft                   |
| `grok_imagine_video`      | `grok_video`               | Grok video (linked account)    |
| `grok_imagine_video_1p5`  | `grok-imagine-video-1.5`   | Grok video 1.5                 |
| `happy_horse_1p0`         | `happy-horse-1.0`          | Happy Horse                    |

## Other parameters

- `duration_seconds`: integer 1-600
- `bitrate`: `normal` | `high`
- `quality`: `low` | `medium` | `high` | `xhigh` | `max` | `auto`
- `aspect_ratio`, `resolution`: see [aspect-ratios.md](aspect-ratios.md)
- `video_batch_count`: integer 1-8 (default 1)
- `generate_audio`: boolean — native soundtrack where the model supports it
- Keyframes/refs: `start_frame_image_media_token`,
  `end_frame_image_media_token`, `reference_image_media_tokens`,
  `reference_video_media_tokens`, `reference_audio_media_tokens`,
  `reference_character_tokens` (arrays of `m_`/`char_` tokens, max 16)
