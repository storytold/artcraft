# Aspect Ratios, Resolution & Quality

## `aspect_ratio`

| Value        | Aliases   | Shape                |
|--------------|-----------|----------------------|
| `square`     | `1:1`     | 1:1                  |
| `square_hd`  | `squarehd`| 1:1 HD               |
| `wide_16_9`  | `16:9`    | Widescreen 16:9      |
| `tall_9_16`  | `9:16`    | Portrait 9:16        |
| `wide_21_9`  | `21:9`    | Ultrawide 21:9       |
| `tall_9_21`  | `9:21`    | Vertical ultrawide   |
| `wide_4_3`   | `4:3`     | Classic TV           |
| `tall_3_4`   | `3:4`     | Portrait classic     |
| `wide_3_2`   | `3:2`     | Photo standard       |
| `tall_2_3`   | `2:3`     | Portrait photo       |
| `wide_5_4`   | `5:4`     | Slightly wide        |
| `tall_4_5`   | `4:5`     | Social portrait      |
| `wide`       |           | Generic wide         |
| `tall`       |           | Generic tall         |
| `auto`       |           | Model default        |

## `resolution`

| Value           | Aliases | Pixels   |
|-----------------|---------|----------|
| `half_k`        | `0.5k`  | ~0.5K    |
| `one_k`         | `1k`    | ~1K      |
| `two_k`         | `2k`    | ~2K      |
| `three_k`       | `3k`    | ~3K      |
| `four_k`        | `4k`    | ~4K      |
| `four_eighty_p` | `480p`  | 480p     |
| `seven_twenty_p`| `720p`  | 720p     |
| `ten_eighty_p`  | `1080p` | 1080p    |

## `quality`

`low` | `medium` | `high` | `xhigh` | `max` | `auto`

## `bitrate` (video only)

`normal` | `high`

## Other enums

- `output_type` (mesh): `normal` | `low_poly` | `geometry`
- `polygon_type` (mesh): `triangle` | `quad`
- `texture_quality`, `geometry_quality` (mesh): `standard` | `detailed`
- `video output format`: `mp4` | `mov`
- `media_type` (cost): `image` | `video` | `splat`
- `generation_mode` (cost):
  - image: `text_to_image` | `image_edit`
  - video: `text_to_video` | `start_frame_to_video` |
    `start_and_end_frame_to_video` | `reference_image_to_video`

Unknown values for any of these are rejected — nothing silently
defaults. The server reports the failure as a tool result with
`isError: true` (a successful JSON-RPC response carrying an error
payload), not a JSON-RPC `-32602` invalid-params error; check
`result.isError`/`content[].text` rather than only the error field.
