# Supported 3D and Gaussian Splat Models

The ArtCraft MCP server supports generating 3D assets and Gaussian Splats from images and text.

---

## 1. Hunyuan 3D (Object Generation)
Converts a static 2D image into a fully realized 3D mesh model.

### Available Tool: `generate_object_3d`
* **`media_file_token`** (Required): The token of the source image to convert. You must first upload the image using the `upload_media` tool to obtain this token.
* **`version`** (Optional):
  * `2.0` (Default): Standard Hunyuan 3D 2.0 conversion.
  * `2.1`: Upgraded Hunyuan 3D 2.1 model with higher geometry fidelity and better texture resolution.

### Guidelines for Agents:
1. Ensure the input image contains a clear, single subject (like a chair, a weapon, a toy, or a character) with a plain background if possible.
2. Recommend `version: "2.1"` if the user requests maximum detail or high-resolution textures.

---

## 2. WorldLabs Marble (Gaussian Splat World Gen)
Generates high-fidelity interactive 3D environments/scenes (Gaussian Splats) from text descriptions, reference images, or both.

### Available Tool: `generate_splat_3d`
* **Inputs** (At least one must be provided):
  * `image_media_file_token`: Reference image to seed the visual style, layout, or subject of the world.
  * `prompt`: Description of the scene or environment to generate.
* **`version`** (Optional):
  * `mini` (Default): Faster generation, ideal for quick prototyping of scene layouts.
  * `plus`: High-fidelity, detailed world generation with complex geometry and reflections.

### Guidelines for Agents:
1. When generating a world, if the user does not specify a version, default to `mini`.
2. Encourage the user to provide both a text `prompt` and an `image_media_file_token` to get the most consistent and aesthetically controlled results.
