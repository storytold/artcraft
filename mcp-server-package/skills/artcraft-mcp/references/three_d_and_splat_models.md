# Supported 3D and Gaussian Splat Models

The ArtCraft MCP server supports generating 3D assets and Gaussian Splats from images and text.

---

## 1. 3D Mesh Object Generation (`artcraft_generate_3d_object`)
Converts static 2D images or multi-view captures into fully realized 3D mesh assets.

### Available Models & Versions:
* **Hunyuan 3D**: `2.0` (Default), `2.1` (Higher geometry fidelity and texture resolution).
* **Tripo3D**: `tripo_h3_1` (State-of-the-art fast 3D reconstruction).

### Parameters:
* **`media_file_token`** (Required): The token of the primary input image. (Upload via `artcraft_upload_image`).
* **`model` / `version`** (Optional): Model version selection.
* **Multi-View Reference Tokens** (Optional): `back_media_file_token`, `left_media_file_token`, `right_media_file_token` for full 360° geometry consistency.
* **Retopology & Materials** (Optional):
  * `enable_pbr`: Generate physically-based rendering roughness/metallic maps.
  * `enable_texture`: Texture synthesis toggle.
  * `face_count`: Target polygon count (e.g. 10000, 50000).
  * `texture_quality`: `standard` or `high`.
  * `geometry_quality`: `draft`, `standard`, `ultra`.

---

## 2. WorldLabs Marble Gaussian Splatting (`artcraft_generate_splat`)
Generates high-fidelity interactive 3D radiance fields (Gaussian Splats) from text descriptions, reference images, or both.

### Available Models & Versions:
* **`marble_0p1_mini` / `mini`**: Fast prototyping of scene layouts.
* **`marble_0p1_plus` / `plus`**: Standard production-grade radiance fields.
* **`marble_1p0` / `marble_1p1`**: Next-gen WorldLabs Marble splatting models with high spatial depth and complex lighting.

### Parameters:
* **`image_media_file_token`**: Reference image to seed scene layout.
* **`prompt`**: Natural language scene description.
* **`is_panoramic`**: Set to `true` for 360° equirectangular environment splats.
* **`camera_distance` / `camera_height` / `camera_pitch`**: Initial viewing camera coordinates.

### Pre-generation Cost Check:
* Always run `artcraft_estimate_splat_cost` with the target `version` (e.g. `marble_0p1_plus`, `marble_1p1`) to report exact credit costs before execution.
