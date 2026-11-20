# 3D Mesh & Gaussian Splat Models

## `artcraft_generate_3d_object` — mesh generation

| Model                     | Aliases                | Notes                        |
|---------------------------|------------------------|------------------------------|
| `hunyuan_3d_2p0`          | `hunyuan-3d-2.0`       | Hunyuan 3D v2.0              |
| `hunyuan_3d_2p1`          | `hunyuan-3d-2.1`       | Hunyuan 3D v2.1              |
| `hunyuan_3d_3`            | `hunyuan_3d`           | Hunyuan 3D v3 (default)      |
| `hunyuan_3d_3_sketch`     |                        | Sketch-conditioned v3        |
| `hunyuan_3d_3p1_pro`      | `hunyuan-3d-3.1-pro`   | v3.1 pro quality             |
| `hunyuan_3d_3p1_rapid`    | `hunyuan-3d-3.1-rapid` | v3.1 fast                    |
| `hunyuan_3d_3p1_part`     |                        | Part-level decomposition     |
| `hunyuan_3d_3p1_topology` |                        | Smart retopology             |
| `tripo_3d_h3p1`           | `tripo`, `tripo_3d`    | Tripo3D H3.1                 |

Inputs: `prompt` (text-to-3D) or `image_media_token` (image-to-3D).
Multi-view: `front/back/left/right_image_media_token`.
Retopology/parts: `input_mesh_media_file_token`.

Mesh options:
- `output_type`: `normal` | `low_poly` | `geometry`
- `polygon_type`: `triangle` | `quad`
- `texture_quality` / `geometry_quality`: `standard` | `detailed`
- `enable_pbr`, `enable_texture`: booleans
- `target_face_count`: integer 100-10,000,000

## `artcraft_generate_splat` — Gaussian splat worlds

| Model             | Aliases          | Notes                  |
|-------------------|------------------|------------------------|
| `marble_0p1_mini` | `marble-0.1-mini`| Marble 0.1 mini        |
| `marble_0p1_plus` |                  | Marble 0.1 plus        |
| `marble_1p0`      | `marble-1.0`     | Marble 1.0             |
| `marble_1p0_draft`|                  | Marble 1.0 draft       |
| `marble_1p1`      | `marble-1.1`     | Marble 1.1             |
| `marble_1p1_plus` |                  | Marble 1.1+ (default)  |
| `triposplat`      | `tripo_splat`    | TripoSplat             |

Inputs: `prompt` or `image_media_token`; plus
`reference_image_media_tokens` (max 16), `reference_video_media_token`,
`is_panoramic` (360° equirectangular), `disable_recaption`.

## Cost estimate

`artcraft_estimate_splat_cost` covers splat models only (`model` +
`has_reference_image`) — it rejects mesh models like `hunyuan_3d_3`.
There is no mesh-cost estimate tool; ask the user to approve a mesh
generation based on the plan, not an estimate.
