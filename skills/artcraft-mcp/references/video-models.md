# Supported Video Models

The ArtCraft MCP server supports the following video generation models via the `model` parameter in the `generate_video` tool.

## General Usage Rules
When generating video, the agent MUST adhere to these rules:
- **`prompt`**: Mandatory. Detail the scene, camera movement (e.g., "pan left", "zoom in"), subject action, and lighting.
- **`duration`**: Video length in seconds. Typically 5 (default) or 10. Some advanced models support 15.
- **Image-to-Video Workflow**: To animate a static image, use `upload_media` to upload the image and retrieve its `MediaFileToken`. Pass this token to `start_frame_media_token` (or `image_reference_tokens`). Most top-tier models (Kling, Seedance, Veo) natively support Image-to-Video.
- **Video-to-Video Workflow**: Upload a source video and pass its token to `video_reference_tokens` to use it as a style or motion reference.

## Seedance (Default Family)
- **`seedance_2p0`**: (Default model) High quality general-purpose video generation. Supports text-to-video and image-to-video.
- **`seedance_2p0_fast`**: Faster variant for quick prototyping.
- **`seedance_2p0_bp` / `seedance_2p0_bp_fast`**: BytePlus variants for different backend infrastructure.
- **`seedance_2p0_u` / `seedance_2p0_u_fast`**: Ultra high quality variants for final renders.
- **`seedance_2p0_bpu` / `seedance_2p0_bpu_fast`**: BytePlus Ultra variants.

## Kling
Kling models excel at realistic physics, fluid motion, and adherence to complex prompts.
- **`kling_3p0_standard` / `kling_3p0_pro`**: Newest state-of-the-art Kling 3.0 models. Highly recommended for complex motion and high-fidelity output.
- **`kling_2p6_pro` / `kling_2p5_turbo_pro`**: Highly capable Kling 2.x models.
- **`kling_2p1_pro` / `kling_2p1_master`**: Legacy Kling 2.1 models.
- **`kling_1p6_pro`**: Oldest supported Kling model.

## Veo
Google's Veo models are exceptional for cinematic realism, accurate lighting, and consistent physics.
- **`veo_3` / `veo_3_fast`**: State-of-the-art Veo models. Strong support for complex cinematic prompts and image-to-video.
- **`veo_3p1` / `veo_3p1_fast`**: Incremental improvements on Veo 3 for better prompt adherence.
- **`veo_2`**: Legacy Veo 2 model.

## Sora
- **`sora_2` / `sora_2_pro`**: OpenAI's Sora 2 video generation models. Exceptional for long, continuous, consistent scenes with high detail.

## Grok
- **`grok_imagine_video`**: Standard Grok video model.
- **`grok_imagine_video_1p5`**: Updated Grok video model for better motion and clarity.

## Experimental / Others
- **`happy_horse_1p0`**: Experimental/specialized model.
- **`preview_model` / `preview_model_fast`**: Temporary model rollout slots used for beta testing new models.
