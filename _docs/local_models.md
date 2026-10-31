Local models (ComfyUI)
======================

ArtCraft can generate and edit images with your own ComfyUI, at no credit cost. See storytold/artcraft#968.

# Setup

1. Run ComfyUI (default address `http://127.0.0.1:8188`).
2. Export each workflow you want from ComfyUI with **Export (API)**.
3. Describe them in `local_models.json` in ArtCraft's settings folder (`settings/` in the ArtCraft data folder,
   next to `app_preferences.json`). A relative `workflow` path is relative to that folder:

```json
{
  "comfy_url": "http://127.0.0.1:8188",
  "models": [
    { "id": "local_z_image_turbo", "name": "Z-Image Turbo (local)",
      "workflow": "workflows/z_image_turbo_api.json",
      "prompt": ["8", "text"], "seed": ["11", "seed"], "images": [], "output_node": "13",
      "width": ["10", "width"], "height": ["10", "height"] },
    { "id": "local_qwen_image_edit", "name": "Qwen Image Edit (local)",
      "workflow": "workflows/qwen_image_edit_api.json",
      "prompt": ["6", "prompt"], "seed": ["10", "seed"],
      "images": [["4", "image"]], "output_node": "12", "megapixels": ["13", "megapixels"] }
  ]
}
```

Model ids must start with `local_`. The file is read again on every request, so workflow and binding edits apply to
the next generation; the model picker is built when ArtCraft starts, so new or renamed models and changed picker
options appear after a restart. Save the file as UTF-8 (a byte-order mark is fine).

## Bindings

Each binding is `[node id, input name]` in the API-format workflow:

| Key                         | What ArtCraft writes there                                                         |
|-----------------------------|------------------------------------------------------------------------------------|
| `prompt`                    | the text from the prompt box                                                       |
| `negative_prompt`           | the request's negative prompt, if it has one (else the workflow's text stays)      |
| `seed`                      | a new random seed for every image (without it, one image per request)              |
| `images`                    | the reference images, in order: canvas, scene, then the other references           |
| `width`, `height`           | the size from the picker's aspect ratio and resolution (multiples of 16)           |
| `megapixels`                | the picker's resolution, in ComfyUI's unit of 1024 x 1024 pixels (`one_k` = 1.0)   |
| `output_node`               | the node whose images are the result (default: every SaveImage output)             |

A model takes exactly as many images as it has `images` bindings, the canvas and scene images included: a request
with more or fewer is refused before anything is uploaded. On the Draw page the canvas fills the first binding, so
a one-image model takes no extra reference there. Naming `output_node` also accepts a PreviewImage node.

## Picker options

| Key                    | Meaning                                    | Default                                     |
|------------------------|--------------------------------------------|---------------------------------------------|
| `aspect_ratios`        | aspect ratios offered (needs width+height) | the common ratios, square to 21:9 both ways |
| `resolutions`          | resolutions offered (needs a size binding) | `half_k`, `one_k`, `two_k`                  |
| `aspect_ratio_default` | preselected aspect ratio                   | the first one offered                       |
| `resolution_default`   | preselected resolution                     | `one_k` if offered, else the first one      |

Resolutions are pixel counts: `half_k` = 512², `one_k` = 1024², `two_k` = 2048². When the picker sends no value (or
"auto"), the workflow's own size is kept. An empty list hides that picker. Values ArtCraft does not know (e.g.
`"16:9"`) are left out, with a warning in the log.

# Using them

The models appear in the image model picker, in their own "Local" group at the top. Their cost is 0 and they work
with a 0-credit balance. Models that take reference images are also offered on the image-edit pages.

Results go to your ArtCraft library like any other generation, so you need to be logged in. To also keep them on
disk, turn on automatic downloads (Settings → Downloads); they are saved to your download folder.

# How it works

- `list_image_models_command` appends the local models to the catalog.
- `estimate_image_cost_command` returns a free estimate for them.
- `generate_image_command` records a task (provider `local`) and hands the job to `services/local_comfy`.
  Reference images are resolved like an Omni request: raw canvas or scene bytes are uploaded to the library first.
- One worker runs the jobs in order. It uploads the reference images to ComfyUI, runs the workflow once per
  requested image, uploads the outputs to your library, and completes the task (the same steps as the Grok and
  Midjourney results). A failure marks the task failed and shows the reason.
- The provider value `local` exists only in the desktop app's task database; it is never sent to the API.
- Runs are queued in ComfyUI under a client id kept in `settings/local_comfy_client_id.txt`, so the cleanup after a
  restart never touches runs from other apps sharing the same ComfyUI.

# Limits

- Images only (no video, audio or 3D); requests with an inpainting mask are refused.
- No queue cancel; one job at a time. A run that takes over 30 minutes is cancelled in ComfyUI and fails.
- Jobs are not resumed after a restart: tasks left pending are marked failed, and the runs the last session left in
  ComfyUI are cancelled.
