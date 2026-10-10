use anyhow::{anyhow, Result};
use serde_json::{json, Value};
use uuid::Uuid;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_audio_cost_and_generate_request::OmniGenAudioCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_mesh_cost_and_generate_request::OmniGenMeshCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_splat_cost_and_generate_request::OmniGenSplatCostAndGenerateRequest;

use artcraft_client::endpoints::omni_gen::generate::image::omni_gen_image::omni_gen_image_generate;
use artcraft_client::endpoints::omni_gen::generate::video::omni_gen_video::omni_gen_video_generate;
use artcraft_client::endpoints::omni_gen::generate::audio::omni_gen_audio::omni_gen_audio_generate;
use artcraft_client::endpoints::omni_gen::generate::mesh::omni_gen_mesh::omni_gen_mesh_generate;
use artcraft_client::endpoints::omni_gen::generate::splat::omni_gen_splat::omni_gen_splat_generate;

use enums::common::generation::common_image_model::CommonImageModel;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation::common_audio_model::CommonAudioModel;
use enums::common::generation::common_mesh_model::CommonMeshModel;
use enums::common::generation::common_splat_model::CommonSplatModel;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_quality::CommonQuality;
use enums::common::generation::common_bitrate::CommonBitrate;
use enums::common::generation::common_musical_key::CommonMusicalKey;
use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
use enums::common::generation::common_mesh_quality::CommonMeshQuality;
use enums::common::generation::common_polygon_type::CommonPolygonType;
use enums::common::generation::common_video_output_format::CommonVideoOutputFormat;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_generate_image".to_string(),
            description: "Generate images using ArtCraft's unified OmniGen API. Supports 18+ models including Flux, GPT-Image, Grok Imagine, Midjourney 7/8, Nano Banana, and Seedream 5.0.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Model to use (e.g., 'flux_1_dev', 'flux_1_schnell', 'gpt_image_1', 'seedream_5p0_pro', 'grok_imagine_image', 'midjourney_8', 'nano_banana_pro')"
                    },
                    "prompt": {
                        "type": "string",
                        "description": "Text prompt for generation"
                    },
                    "image_media_tokens": {
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Optional input image media tokens for image-to-image editing"
                    },
                    "aspect_ratio": {
                        "type": "string",
                        "description": "Aspect ratio: 'square', 'wide_16_9', 'tall_9_16', 'wide_21_9', 'tall_9_21', 'standard_4_3', 'standard_3_4'"
                    },
                    "resolution": {
                        "type": "string",
                        "description": "Resolution preset ('1k', '2k', '3k', '4k', 'half_k')"
                    },
                    "quality": {
                        "type": "string",
                        "description": "Quality: 'low', 'medium', 'high', 'ultra'"
                    },
                    "image_batch_count": {
                        "type": "integer",
                        "description": "Number of images to generate (default: 1)"
                    },
                    "adjust_horizontal_angle": {
                        "type": "number",
                        "description": "Horizontal angle adjustment (for angle manipulation models)"
                    },
                    "adjust_vertical_angle": {
                        "type": "number",
                        "description": "Vertical angle adjustment (for angle manipulation models)"
                    },
                    "adjust_zoom": {
                        "type": "number",
                        "description": "Zoom adjustment (for angle manipulation models)"
                    }
                },
                "required": ["model", "prompt"]
            })),
        },
        Tool {
            name: "artcraft_generate_video".to_string(),
            description: "Generate videos using ArtCraft's unified OmniGen API. Supports 25+ models including MiniMax H3, Seedance 2.5, Kling 3.0, Sora 2, Veo 3.1, Vidu Q3, Flux 3, and Grok Imagine.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Model to use (e.g., 'minimax_h3', 'seedance_2p5', 'kling_3p0_pro', 'sora_2_pro', 'veo_3p1', 'vidu_q3', 'flux_3', 'grok_imagine_video')"
                    },
                    "prompt": {
                        "type": "string",
                        "description": "Text prompt for generation"
                    },
                    "negative_prompt": {
                        "type": "string",
                        "description": "Negative prompt (for supported models)"
                    },
                    "start_frame_image_media_token": {
                        "type": "string",
                        "description": "Starting keyframe image token"
                    },
                    "end_frame_image_media_token": {
                        "type": "string",
                        "description": "Ending keyframe image token"
                    },
                    "reference_image_media_tokens": {
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Reference image tokens"
                    },
                    "reference_video_media_tokens": {
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Reference video tokens"
                    },
                    "reference_audio_media_tokens": {
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Reference audio tokens"
                    },
                    "reference_character_tokens": {
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Reference character tokens to mention in prompt as @CharacterName"
                    },
                    "aspect_ratio": {
                        "type": "string",
                        "description": "Aspect ratio ('16:9', '9:16', 'square', etc.)"
                    },
                    "resolution": {
                        "type": "string",
                        "description": "Resolution preset ('1k', '2k', '720p', '1080p')"
                    },
                    "bitrate": {
                        "type": "string",
                        "enum": ["normal", "high"],
                        "description": "Bitrate quality: 'normal' or 'high'"
                    },
                    "quality": {
                        "type": "string",
                        "description": "Quality: 'low', 'medium', 'high', 'ultra'"
                    },
                    "duration_seconds": {
                        "type": "integer",
                        "description": "Duration in seconds"
                    },
                    "video_batch_count": {
                        "type": "integer",
                        "description": "Number of videos to generate (default: 1)"
                    },
                    "generate_audio": {
                        "type": "boolean",
                        "description": "Whether to generate native sound effects/audio"
                    }
                },
                "required": ["model", "prompt"]
            })),
        },
        Tool {
            name: "artcraft_generate_audio".to_string(),
            description: "Generate music, remix audio, or synthesize sound effects using ArtCraft's OmniGen Audio API. Supports Suno Music, Suno Remix, Suno Sounds, Suno Sample, and Seed Audio 1.0.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Model: 'suno_music', 'suno_remix', 'suno_sounds', 'suno_sample', 'seed_audio_1p0' (default: suno_music)"
                    },
                    "prompt": {
                        "type": "string",
                        "description": "Lyrics or text prompt for the audio generation"
                    },
                    "style_prompt": {
                        "type": "string",
                        "description": "Genre/style tags (e.g. 'synthwave, electronic, upbeat 120bpm')"
                    },
                    "audio_media_tokens": {
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Reference audio or remix source media tokens"
                    },
                    "image_media_tokens": {
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Optional reference image for image-to-audio (Seed Audio)"
                    },
                    "keep_lyrics": {
                        "type": "boolean",
                        "description": "Whether to retain original lyrics (Suno Remix)"
                    },
                    "is_instrumental": {
                        "type": "boolean",
                        "description": "Whether to generate instrumental music without vocals"
                    },
                    "is_loopable": {
                        "type": "boolean",
                        "description": "Whether sound effect should cleanly loop (Suno Sounds)"
                    },
                    "bpm": {
                        "type": "integer",
                        "description": "Tempo in beats per minute (e.g. 120)"
                    },
                    "musical_key": {
                        "type": "string",
                        "description": "Musical key ('c_major', 'a_minor', 'auto', etc.)"
                    },
                    "sample_rate_hz": {
                        "type": "integer",
                        "description": "Sample rate in Hz: 8000, 16000, 24000, 32000, 44100, 48000 (Seed Audio)"
                    },
                    "speed": {
                        "type": "number",
                        "description": "Playback speed multiplier 0.5 - 2.0 (Seed Audio)"
                    },
                    "volume": {
                        "type": "number",
                        "description": "Volume multiplier 0.5 - 2.0 (Seed Audio)"
                    },
                    "pitch": {
                        "type": "number",
                        "description": "Pitch shift in semitones -12 to 12 (Seed Audio)"
                    }
                },
                "required": ["prompt"]
            })),
        },
        Tool {
            name: "artcraft_generate_3d_object".to_string(),
            description: "Generate 3D meshes using ArtCraft's OmniGen Mesh API. Supports Hunyuan 3D v2/v3/v3.1 (Pro, Rapid, Part, Topology) and Tripo3D H3.1 with multi-view camera inputs.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Model to use: 'hunyuan_3d_3', 'hunyuan_3d_3p1_pro', 'hunyuan_3d_3p1_rapid', 'hunyuan_3d_3_sketch', 'hunyuan_3d_3p1_part', 'hunyuan_3d_3p1_topology', 'tripo_3d_h3p1' (default: hunyuan_3d_3)"
                    },
                    "prompt": { "type": "string", "description": "Text prompt for text-to-3D" },
                    "image_media_token": { "type": "string", "description": "Primary input image (image-to-3D or sketch-to-3D)" },
                    "front_image_media_token": { "type": "string", "description": "Front camera view for multi-view input" },
                    "back_image_media_token": { "type": "string", "description": "Back camera view for multi-view input" },
                    "left_image_media_token": { "type": "string", "description": "Left camera view for multi-view input" },
                    "right_image_media_token": { "type": "string", "description": "Right camera view for multi-view input" },
                    "input_mesh_media_file_token": { "type": "string", "description": "Input mesh for retopology (Topology) or semantic part splitting (Part)" },
                    "output_type": { "type": "string", "enum": ["normal", "low_poly", "geometry"], "description": "Mesh output type" },
                    "quality": { "type": "string", "enum": ["standard", "detailed"], "description": "Quality level" },
                    "polygon_type": { "type": "string", "enum": ["triangle", "quad"], "description": "Polygon type" },
                    "target_face_count": { "type": "integer", "description": "Target face/polygon count" }
                }
            })),
        },
        Tool {
            name: "artcraft_generate_splat".to_string(),
            description: "Generate 3D Gaussian splat worlds using ArtCraft's OmniGen Splat API. Supports WorldLabs Marble (0.1, 1.0, 1.1) and TripoSplat with multi-view and 360 panoramic inputs.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Model to use: 'marble_1p1', 'marble_1p1_plus', 'marble_1p0', 'marble_1p0_draft', 'marble_0p1_plus', 'marble_0p1_mini', 'triposplat' (default: marble_1p1_plus)"
                    },
                    "prompt": { "type": "string", "description": "Text prompt describing the 3D world" },
                    "image_media_token": { "type": "string", "description": "Primary reference image" },
                    "reference_image_media_tokens": {
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Multiple reference images for multi-view splat generation"
                    },
                    "reference_video_media_token": { "type": "string", "description": "Optional reference video" },
                    "is_panoramic": { "type": "boolean", "description": "Whether the input image is a 360-degree equirectangular panorama" },
                    "disable_recaption": { "type": "boolean", "description": "Whether to bypass automatic prompt recaptioning" }
                }
            })),
        },
    ]
}

pub async fn generate_image(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let model_str = arguments["model"].as_str()
        .ok_or_else(|| anyhow!("model is required"))?;
    let prompt = arguments["prompt"].as_str()
        .ok_or_else(|| anyhow!("prompt is required"))?;

    let model = parse_image_model(model_str)?;
    let idempotency_token = Uuid::new_v4().to_string();

    let request = OmniGenImageCostAndGenerateRequest {
        idempotency_token: Some(idempotency_token),
        model: Some(model),
        prompt: Some(prompt.to_string()),
        image_media_tokens: parse_media_tokens(&arguments["image_media_tokens"]),
        resolution: parse_resolution(arguments["resolution"].as_str()),
        aspect_ratio: parse_aspect_ratio(arguments["aspect_ratio"].as_str()),
        quality: parse_quality(arguments["quality"].as_str()),
        image_batch_count: arguments["image_batch_count"].as_u64().map(|v| v as u16),
        adjust_horizontal_angle: arguments["adjust_horizontal_angle"].as_f64(),
        adjust_vertical_angle: arguments["adjust_vertical_angle"].as_f64(),
        adjust_zoom: arguments["adjust_zoom"].as_f64(),
    };

    let response = omni_gen_image_generate(
        &client.api_host,
        client.creds_ref(),
        request,
    ).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Image generation queued successfully.\nJob token: {}\nStatus: {}\n\nPoll for results using artcraft_get_job_status with job_token '{}'",
            response.inference_job_token.as_str(),
            if response.success { "success" } else { "failed" },
            response.inference_job_token.as_str()
        ),
    }])
}

pub async fn generate_video(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let model_str = arguments["model"].as_str()
        .ok_or_else(|| anyhow!("model is required"))?;
    let prompt = arguments["prompt"].as_str()
        .ok_or_else(|| anyhow!("prompt is required"))?;

    let model = parse_video_model(model_str)?;
    let idempotency_token = Uuid::new_v4().to_string();

    let request = OmniGenVideoCostAndGenerateRequest {
        idempotency_token: Some(idempotency_token),
        model: Some(model),
        prompt: Some(prompt.to_string()),
        negative_prompt: arguments["negative_prompt"].as_str().map(|s| s.to_string()),
        start_frame_image_media_token: parse_media_token(arguments["start_frame_image_media_token"].as_str()),
        end_frame_image_media_token: parse_media_token(arguments["end_frame_image_media_token"].as_str()),
        reference_image_media_tokens: parse_media_tokens(&arguments["reference_image_media_tokens"]),
        reference_video_media_tokens: parse_media_tokens(&arguments["reference_video_media_tokens"]),
        reference_audio_media_tokens: parse_media_tokens(&arguments["reference_audio_media_tokens"]),
        reference_character_tokens: parse_character_tokens(&arguments["reference_character_tokens"]),
        resolution: parse_resolution(arguments["resolution"].as_str()),
        aspect_ratio: parse_aspect_ratio(arguments["aspect_ratio"].as_str()),
        bitrate: parse_bitrate(arguments["bitrate"].as_str()),
        maybe_output_format: parse_video_output_format(arguments["output_format"].as_str()),
        quality: parse_quality(arguments["quality"].as_str()),
        duration_seconds: arguments["duration_seconds"].as_u64().map(|v| v as u16),
        video_batch_count: arguments["video_batch_count"].as_u64().map(|v| v as u16),
        generate_audio: arguments["generate_audio"].as_bool(),
        estimate_only: None,
    };

    let response = omni_gen_video_generate(
        &client.api_host,
        client.creds_ref(),
        request,
    ).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Video generation queued successfully.\nJob token: {}\nStatus: {}\n\nPoll for results using artcraft_get_job_status with job_token '{}'",
            response.inference_job_token.as_str(),
            if response.success { "success" } else { "failed" },
            response.inference_job_token.as_str()
        ),
    }])
}

pub async fn generate_audio(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let prompt = arguments["prompt"].as_str()
        .ok_or_else(|| anyhow!("prompt is required"))?;
    let model_str = arguments["model"].as_str().unwrap_or("suno_music");

    let model = parse_audio_model(model_str)?;
    let idempotency_token = Uuid::new_v4().to_string();

    let request = OmniGenAudioCostAndGenerateRequest {
        idempotency_token: Some(idempotency_token),
        model: Some(model),
        prompt: Some(prompt.to_string()),
        style_prompt: arguments["style_prompt"].as_str().map(|s| s.to_string()),
        audio_media_tokens: parse_media_tokens(&arguments["audio_media_tokens"]),
        image_media_tokens: parse_media_tokens(&arguments["image_media_tokens"]),
        keep_lyrics: arguments["keep_lyrics"].as_bool(),
        is_instrumental: arguments["is_instrumental"].as_bool(),
        is_loopable: arguments["is_loopable"].as_bool(),
        bpm: arguments["bpm"].as_u64().map(|v| v as u16),
        musical_key: parse_musical_key(arguments["musical_key"].as_str()),
        sample_rate_hz: arguments["sample_rate_hz"].as_u64().map(|v| v as u32),
        speed: arguments["speed"].as_f64(),
        volume: arguments["volume"].as_f64(),
        pitch: arguments["pitch"].as_f64(),
    };

    let response = omni_gen_audio_generate(
        &client.api_host,
        client.creds_ref(),
        request,
    ).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Audio generation queued successfully.\nJob token: {}\nStatus: {}\n\nPoll for results using artcraft_get_job_status with job_token '{}'",
            response.inference_job_token.as_str(),
            if response.success { "success" } else { "failed" },
            response.inference_job_token.as_str()
        ),
    }])
}

pub async fn generate_3d_object(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let model_str = arguments["model"].as_str().unwrap_or("hunyuan_3d_3");
    let model = parse_mesh_model(model_str)?;

    let prompt = arguments["prompt"].as_str().map(|s| s.to_string());
    let idempotency_token = Uuid::new_v4().to_string();

    // Primary image token can come from image_media_token or reference_image_media_tokens
    let primary_image = parse_media_token(arguments["image_media_token"].as_str());
    let mut ref_images = parse_media_tokens(&arguments["reference_image_media_tokens"]).unwrap_or_default();
    if let Some(img) = primary_image {
        if !ref_images.contains(&img) {
            ref_images.insert(0, img);
        }
    }
    let ref_images_opt = if ref_images.is_empty() { None } else { Some(ref_images) };

    let request = OmniGenMeshCostAndGenerateRequest {
        idempotency_token: Some(idempotency_token),
        model: Some(model),
        prompt,
        reference_image_media_tokens: ref_images_opt,
        front_image_media_token: parse_media_token(arguments["front_image_media_token"].as_str()),
        back_image_media_token: parse_media_token(arguments["back_image_media_token"].as_str()),
        left_image_media_token: parse_media_token(arguments["left_image_media_token"].as_str()),
        right_image_media_token: parse_media_token(arguments["right_image_media_token"].as_str()),
        input_mesh_media_token: parse_media_token(arguments["input_mesh_media_file_token"].as_str()),
        mesh_output_type: parse_mesh_output_type(arguments["output_type"].as_str()),
        polygon_type: parse_polygon_type(arguments["polygon_type"].as_str()),
        face_count: arguments["target_face_count"].as_u64(),
        enable_pbr: arguments["enable_pbr"].as_bool(),
        enable_texture: arguments["enable_texture"].as_bool(),
        texture_quality: parse_mesh_quality(arguments["texture_quality"].as_str()),
        geometry_quality: parse_mesh_quality(arguments["geometry_quality"].as_str()),
    };

    let response = omni_gen_mesh_generate(
        &client.api_host,
        client.creds_ref(),
        request,
    ).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "3D object generation queued successfully.\nJob token: {}\nStatus: {}\n\nPoll for results using artcraft_get_job_status with job_token '{}'",
            response.inference_job_token.as_str(),
            if response.success { "success" } else { "failed" },
            response.inference_job_token.as_str()
        ),
    }])
}

pub async fn generate_splat(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let model_str = arguments["model"].as_str().unwrap_or("marble_1p1_plus");
    let model = parse_splat_model(model_str)?;

    let prompt = arguments["prompt"].as_str().map(|s| s.to_string());
    let idempotency_token = Uuid::new_v4().to_string();

    let primary_image = parse_media_token(arguments["image_media_token"].as_str());
    let mut ref_images = parse_media_tokens(&arguments["reference_image_media_tokens"]).unwrap_or_default();
    if let Some(img) = primary_image {
        if !ref_images.contains(&img) {
            ref_images.insert(0, img);
        }
    }
    let ref_images_opt = if ref_images.is_empty() { None } else { Some(ref_images) };

    let request = OmniGenSplatCostAndGenerateRequest {
        idempotency_token: Some(idempotency_token),
        model: Some(model),
        prompt,
        reference_image_media_tokens: ref_images_opt,
        reference_video_media_token: parse_media_token(arguments["reference_video_media_token"].as_str()),
        is_panoramic: arguments["is_panoramic"].as_bool(),
        disable_recaption: arguments["disable_recaption"].as_bool(),
    };

    let response = omni_gen_splat_generate(
        &client.api_host,
        client.creds_ref(),
        request,
    ).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Splat generation queued successfully.\nJob token: {}\nStatus: {}\n\nPoll for results using artcraft_get_job_status with job_token '{}'",
            response.inference_job_token.as_str(),
            if response.success { "success" } else { "failed" },
            response.inference_job_token.as_str()
        ),
    }])
}

pub fn parse_image_model(model_str: &str) -> Result<CommonImageModel> {
    let model = match model_str.to_lowercase().as_str() {
        "flux_1_dev" | "flux1dev" | "flux.1-dev" => CommonImageModel::Flux1Dev,
        "flux_1_schnell" | "flux1schnell" | "flux.1-schnell" => CommonImageModel::Flux1Schnell,
        "flux_pro_1p1" | "flux-pro-1.1" => CommonImageModel::FluxPro11,
        "flux_pro_1p1_ultra" | "flux-pro-1.1-ultra" => CommonImageModel::FluxPro11Ultra,
        "gpt_image_1" | "gpt-image-1" | "gpt_image1" => CommonImageModel::GptImage1,
        "gpt_image_1p5" | "gpt-image-1.5" => CommonImageModel::GptImage1p5,
        "gpt_image_2" | "gpt-image-2" => CommonImageModel::GptImage2,
        "grok_imagine_image" | "grok-imagine-image" | "grok_imagine" => CommonImageModel::GrokImagineImage,
        "grok_imagine_image_q" | "grok_imagine_image_quality" => CommonImageModel::GrokImagineImageQuality,
        "midjourney_7" | "midjourney-7" | "mj7" => CommonImageModel::Midjourney7,
        "midjourney_7_niji" | "midjourney-7-niji" => CommonImageModel::Midjourney7Niji,
        "midjourney_8" | "midjourney-8" | "mj8" => CommonImageModel::Midjourney8,
        "nano_banana" | "nanobanana" => CommonImageModel::NanoBanana,
        "nano_banana_2" | "nanobanana2" => CommonImageModel::NanoBanana2,
        "nano_banana_pro" | "nanobananapro" => CommonImageModel::NanoBananaPro,
        "seedream_4" | "seedream4" => CommonImageModel::Seedream4,
        "seedream_4p5" | "seedream4p5" => CommonImageModel::Seedream4p5,
        "seedream_5_lite" | "seedream5lite" => CommonImageModel::Seedream5Lite,
        "seedream_5p0_pro" | "seedream-5.0-pro" | "seedream_5_pro" => CommonImageModel::Seedream5p0Pro,
        "seedream_5p0_pro_u" | "seedream-5.0-pro-ultra" => CommonImageModel::Seedream5p0ProUltra,
        "qwen_edit_2511_angles" => CommonImageModel::QwenEdit2511Angles,
        "flux_2_lora_angles" => CommonImageModel::Flux2LoraAngles,
        _ => return Err(anyhow!("Unknown image model: {}", model_str)),
    };

    Ok(model)
}

pub fn parse_video_model(model_str: &str) -> Result<CommonVideoModel> {
    let model = match model_str.to_lowercase().as_str() {
        "grok_video" | "grok-video" | "grok_imagine_video" | "grok-imagine-video" => CommonVideoModel::GrokImagineVideo,
        "grok_imagine_video_1p5" | "grok-imagine-video-1.5" => CommonVideoModel::GrokImagineVideo1p5,
        "flux_3" | "flux-3" => CommonVideoModel::Flux3,
        "flux_3_draft" | "flux-3-draft" => CommonVideoModel::Flux3Draft,
        "kling_1p6_pro" | "kling-1.6-pro" => CommonVideoModel::Kling16Pro,
        "kling_2p1_pro" | "kling-2.1-pro" => CommonVideoModel::Kling21Pro,
        "kling_2p1_master" | "kling-2.1-master" => CommonVideoModel::Kling21Master,
        "kling_2p5_turbo_pro" | "kling-2.5-turbo-pro" => CommonVideoModel::Kling2p5TurboPro,
        "kling_2p6_pro" | "kling-2.6-pro" => CommonVideoModel::Kling2p6Pro,
        "kling_3p0_standard" | "kling-3.0-standard" => CommonVideoModel::Kling3p0Standard,
        "kling_3p0_pro" | "kling-3.0-pro" => CommonVideoModel::Kling3p0Pro,
        "happy_horse_1p0" | "happy-horse-1.0" => CommonVideoModel::HappyHorse1p0,
        "minimax_h3" | "minimax-h3" | "hailuo_h3" => CommonVideoModel::MinimaxH3,
        "minimax_h3_turbo" | "minimax-h3-turbo" => CommonVideoModel::MinimaxH3Turbo,
        "minimax_h3_ultra" | "minimax-h3-ultra" => CommonVideoModel::MinimaxH3Ultra,
        "seedance_1p0_lite" | "seedance-1.0-lite" => CommonVideoModel::Seedance10Lite,
        "seedance_1p5_pro" | "seedance-1.5-pro" => CommonVideoModel::Seedance1p5Pro,
        "seedance_2p0" | "seedance-2.0" => CommonVideoModel::Seedance2p0,
        "seedance_2p0_fast" | "seedance-2.0-fast" => CommonVideoModel::Seedance2p0Fast,
        "seedance_2p0_bp" | "seedance-2.0-byteplus" => CommonVideoModel::Seedance2p0BytePlus,
        "seedance_2p0_bp_fast" => CommonVideoModel::Seedance2p0BytePlusFast,
        "seedance_2p0_bpu" => CommonVideoModel::Seedance2p0BytePlusUltra,
        "seedance_2p0_bpu_fast" => CommonVideoModel::Seedance2p0BytePlusUltraFast,
        "seedance_2p0_mini" => CommonVideoModel::Seedance2p0Mini,
        "seedance_2p0_bp_mini" => CommonVideoModel::Seedance2p0BytePlusMini,
        "seedance_2p0_bpu_mini" => CommonVideoModel::Seedance2p0BytePlusUltraMini,
        "seedance_2p5_preview" => CommonVideoModel::Seedance2p5Preview,
        "seedance_2p5" | "seedance-2.5" => CommonVideoModel::Seedance2p5,
        "seedance_2p5_u" | "seedance-2.5-ultra" => CommonVideoModel::Seedance2p5Ultra,
        "sora_2" | "sora-2" => CommonVideoModel::Sora2,
        "sora_2_pro" | "sora-2-pro" => CommonVideoModel::Sora2Pro,
        "veo_2" | "veo-2" => CommonVideoModel::Veo2,
        "veo_3" | "veo-3" => CommonVideoModel::Veo3,
        "veo_3_fast" | "veo-3-fast" => CommonVideoModel::Veo3Fast,
        "veo_3p1" | "veo-3.1" => CommonVideoModel::Veo3p1,
        "veo_3p1_fast" | "veo-3.1-fast" => CommonVideoModel::Veo3p1Fast,
        "veo_3p1_lite" | "veo-3.1-lite" => CommonVideoModel::Veo3p1Lite,
        "vidu_q3" | "vidu-q3" => CommonVideoModel::ViduQ3,
        "vidu_q3_turbo" | "vidu-q3-turbo" => CommonVideoModel::ViduQ3Turbo,
        _ => return Err(anyhow!("Unknown video model: {}", model_str)),
    };

    Ok(model)
}

pub fn parse_audio_model(model_str: &str) -> Result<CommonAudioModel> {
    let model = match model_str.to_lowercase().as_str() {
        "suno_music" | "suno" | "music" => CommonAudioModel::SunoMusic,
        "suno_remix" | "remix" => CommonAudioModel::SunoRemix,
        "suno_sounds" | "sounds" | "sfx" => CommonAudioModel::SunoSounds,
        "suno_sample" | "sample" => CommonAudioModel::SunoSample,
        "seed_audio_1p0" | "seed_audio" | "seed-audio-1.0" => CommonAudioModel::SeedAudio1p0,
        _ => return Err(anyhow!("Unknown audio model: {}", model_str)),
    };

    Ok(model)
}

pub fn parse_mesh_model(model_str: &str) -> Result<CommonMeshModel> {
    let model = match model_str.to_lowercase().as_str() {
        "hunyuan_3d_2p0" | "hunyuan-3d-2.0" => CommonMeshModel::Hunyuan3d2p0,
        "hunyuan_3d_2p1" | "hunyuan-3d-2.1" => CommonMeshModel::Hunyuan3d2p1,
        "hunyuan_3d_3" | "hunyuan-3d-3" | "hunyuan_3d" => CommonMeshModel::Hunyuan3d3,
        "hunyuan_3d_3_sketch" | "hunyuan-3d-3-sketch" => CommonMeshModel::Hunyuan3d3Sketch,
        "hunyuan_3d_3p1_pro" | "hunyuan-3d-3.1-pro" => CommonMeshModel::Hunyuan3d3p1Pro,
        "hunyuan_3d_3p1_rapid" | "hunyuan-3d-3.1-rapid" => CommonMeshModel::Hunyuan3d3p1Rapid,
        "hunyuan_3d_3p1_part" | "hunyuan-3d-3.1-part" => CommonMeshModel::Hunyuan3d3p1Part,
        "hunyuan_3d_3p1_topology" | "hunyuan-3d-3.1-topology" => CommonMeshModel::Hunyuan3d3p1SmartTopology,
        "tripo_3d_h3p1" | "tripo" | "tripo_3d" => CommonMeshModel::Tripo3dH3p1,
        _ => return Err(anyhow!("Unknown 3D mesh model: {}", model_str)),
    };

    Ok(model)
}

pub fn parse_splat_model(model_str: &str) -> Result<CommonSplatModel> {
    let model = match model_str.to_lowercase().as_str() {
        "marble_0p1_mini" | "marble-0.1-mini" => CommonSplatModel::Marble0p1Mini,
        "marble_0p1_plus" | "marble-0.1-plus" => CommonSplatModel::Marble0p1Plus,
        "marble_1p0" | "marble-1.0" => CommonSplatModel::Marble1p0,
        "marble_1p0_draft" | "marble-1.0-draft" => CommonSplatModel::Marble1p0Draft,
        "marble_1p1" | "marble-1.1" => CommonSplatModel::Marble1p1,
        "marble_1p1_plus" | "marble-1.1-plus" => CommonSplatModel::Marble1p1Plus,
        "triposplat" | "tripo_splat" => CommonSplatModel::TripoSplat,
        _ => return Err(anyhow!("Unknown splat model: {}", model_str)),
    };

    Ok(model)
}

pub fn parse_aspect_ratio(ratio: Option<&str>) -> Option<CommonAspectRatio> {
    ratio.and_then(|r| match r.to_lowercase().as_str() {
        "square" | "1:1" | "1_1" => Some(CommonAspectRatio::Square),
        "wide_16_9" | "16:9" | "16_9" => Some(CommonAspectRatio::WideSixteenByNine),
        "tall_9_16" | "9:16" | "9_16" => Some(CommonAspectRatio::TallNineBySixteen),
        "wide_21_9" | "21:9" | "21_9" => Some(CommonAspectRatio::WideTwentyOneByNine),
        "tall_9_21" | "9:21" | "9_21" => Some(CommonAspectRatio::TallNineByTwentyOne),
        "wide_4_3" | "4:3" | "4_3" => Some(CommonAspectRatio::WideFourByThree),
        "tall_3_4" | "3:4" | "3_4" => Some(CommonAspectRatio::TallThreeByFour),
        "wide_3_2" | "3:2" | "3_2" => Some(CommonAspectRatio::WideThreeByTwo),
        "tall_2_3" | "2:3" | "2_3" => Some(CommonAspectRatio::TallTwoByThree),
        "wide_5_4" | "5:4" | "5_4" => Some(CommonAspectRatio::WideFiveByFour),
        "tall_4_5" | "4:5" | "4_5" => Some(CommonAspectRatio::TallFourByFive),
        "auto" => Some(CommonAspectRatio::Auto),
        "wide" => Some(CommonAspectRatio::Wide),
        "tall" => Some(CommonAspectRatio::Tall),
        "square_hd" | "squarehd" => Some(CommonAspectRatio::SquareHd),
        _ => None,
    })
}

pub fn parse_resolution(res: Option<&str>) -> Option<CommonResolution> {
    res.and_then(|r| match r.to_lowercase().as_str() {
        "low" | "half_k" | "halfk" | "480p" => Some(CommonResolution::HalfK),
        "medium" | "one_k" | "1k" | "720p" => Some(CommonResolution::OneK),
        "high" | "two_k" | "2k" | "1080p" => Some(CommonResolution::TwoK),
        "ultra" | "three_k" | "3k" | "4k" | "four_k" => Some(CommonResolution::FourK),
        _ => None,
    })
}

pub fn parse_quality(quality: Option<&str>) -> Option<CommonQuality> {
    quality.and_then(|q| match q.to_lowercase().as_str() {
        "low" => Some(CommonQuality::Low),
        "medium" => Some(CommonQuality::Medium),
        "high" => Some(CommonQuality::High),
        _ => None,
    })
}

pub fn parse_bitrate(bitrate: Option<&str>) -> Option<CommonBitrate> {
    bitrate.and_then(|b| match b.to_lowercase().as_str() {
        "high" => Some(CommonBitrate::High),
        "normal" => Some(CommonBitrate::Normal),
        _ => None,
    })
}

pub fn parse_video_output_format(format: Option<&str>) -> Option<CommonVideoOutputFormat> {
    format.and_then(|f| match f.to_lowercase().as_str() {
        "mp4" => Some(CommonVideoOutputFormat::Mp4),
        "mov" => Some(CommonVideoOutputFormat::Mov),
        _ => None,
    })
}

pub fn parse_musical_key(key: Option<&str>) -> Option<CommonMusicalKey> {
    key.and_then(|k| match k.to_lowercase().as_str() {
        "c_major" => Some(CommonMusicalKey::CMajor),
        "c_minor" => Some(CommonMusicalKey::CMinor),
        "d_major" => Some(CommonMusicalKey::DMajor),
        "d_minor" => Some(CommonMusicalKey::DMinor),
        "f_major" => Some(CommonMusicalKey::FMajor),
        "f_minor" => Some(CommonMusicalKey::FMinor),
        "g_major" => Some(CommonMusicalKey::GMajor),
        "g_minor" => Some(CommonMusicalKey::GMinor),
        "a_major" => Some(CommonMusicalKey::AMajor),
        "a_minor" => Some(CommonMusicalKey::AMinor),
        "b_major" => Some(CommonMusicalKey::BMajor),
        "b_minor" => Some(CommonMusicalKey::BMinor),
        "auto" => Some(CommonMusicalKey::Auto),
        _ => None,
    })
}

pub fn parse_mesh_output_type(ot: Option<&str>) -> Option<CommonMeshOutputType> {
    ot.and_then(|o| match o.to_lowercase().as_str() {
        "normal" => Some(CommonMeshOutputType::Normal),
        "low_poly" | "lowpoly" => Some(CommonMeshOutputType::LowPoly),
        "geometry" => Some(CommonMeshOutputType::Geometry),
        _ => None,
    })
}

pub fn parse_mesh_quality(q: Option<&str>) -> Option<CommonMeshQuality> {
    q.and_then(|s| match s.to_lowercase().as_str() {
        "standard" => Some(CommonMeshQuality::Standard),
        "detailed" => Some(CommonMeshQuality::Detailed),
        _ => None,
    })
}

pub fn parse_polygon_type(pt: Option<&str>) -> Option<CommonPolygonType> {
    pt.and_then(|p| match p.to_lowercase().as_str() {
        "triangle" => Some(CommonPolygonType::Triangle),
        "quad" => Some(CommonPolygonType::Quad),
        _ => None,
    })
}

pub fn parse_media_token(token: Option<&str>) -> Option<MediaFileToken> {
    token.map(|t| MediaFileToken::new_from_str(t))
}

pub fn parse_media_tokens(value: &Value) -> Option<Vec<MediaFileToken>> {
    value.as_array().map(|arr| {
        arr.iter()
            .filter_map(|v| v.as_str().map(|s| MediaFileToken::new_from_str(s)))
            .collect()
    })
}

pub fn parse_character_tokens(value: &Value) -> Option<Vec<CharacterToken>> {
    value.as_array().map(|arr| {
        arr.iter()
            .filter_map(|v| v.as_str().map(|s| CharacterToken::new_from_str(s)))
            .collect()
    })
}
