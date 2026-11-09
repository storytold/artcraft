use anyhow::{anyhow, Result};
use serde_json::{json, Value};

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
use crate::tools::safety::{
    audit, bounded_array, bounded_f64, bounded_str, bounded_u64, idempotency_token, rate_limit,
    require_confirm,
};

const MAX_PROMPT_LEN: usize = 8000;
const MAX_TOKEN_ARRAY: usize = 16;
const MAX_BATCH_COUNT: u64 = 8;
const MAX_DURATION_SECONDS: u64 = 600;

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_generate_image".to_string(),
            description: "Generate images using ArtCraft's unified OmniGen API. PAID action (spends credits); requires confirm: true.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Model id (e.g., 'flux_1_dev', 'gpt_image_1', 'seedream_5p0_pro', 'midjourney_8', 'nano_banana_pro')"
                    },
                    "prompt": {
                        "type": "string",
                        "description": "Text prompt (max 8000 chars)"
                    },
                    "image_media_tokens": {
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Optional input image media tokens for image-to-image (max 16)"
                    },
                    "aspect_ratio": {
                        "type": "string",
                        "description": "Aspect ratio: 'square', 'wide_16_9', 'tall_9_16', 'wide_21_9', 'tall_9_21', 'wide_4_3', 'tall_3_4', 'wide_3_2', 'tall_2_3', 'wide_5_4', 'tall_4_5', 'wide', 'tall', 'square_hd', 'auto'"
                    },
                    "resolution": {
                        "type": "string",
                        "description": "Resolution preset: 'half_k', 'one_k', 'two_k', 'three_k', 'four_k', 'four_eighty_p', 'seven_twenty_p', 'ten_eighty_p' (aliases: 480p, 720p, 1080p, 1k-4k)"
                    },
                    "quality": {
                        "type": "string",
                        "description": "Quality: 'low', 'medium', 'high', 'xhigh', 'max', 'auto'"
                    },
                    "image_batch_count": {
                        "type": "integer",
                        "description": "Number of images to generate (1-8, default 1)"
                    },
                    "adjust_horizontal_angle": { "type": "number", "description": "Horizontal angle -180..180" },
                    "adjust_vertical_angle": { "type": "number", "description": "Vertical angle -180..180" },
                    "adjust_zoom": { "type": "number", "description": "Zoom adjustment 0..10" },
                    "idempotency_token": { "type": "string", "description": "Optional client idempotency token for safe retries" },
                    "confirm": { "type": "boolean", "description": "Must be true to confirm this paid generation." }
                },
                "required": ["model", "prompt", "confirm"]
            })),
        },
        Tool {
            name: "artcraft_generate_video".to_string(),
            description: "Generate videos using ArtCraft's unified OmniGen API. PAID action (spends credits); requires confirm: true.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Model id (e.g., 'minimax_h3', 'seedance_2p5', 'kling_3p0_pro', 'sora_2_pro', 'veo_3p1', 'vidu_q3')"
                    },
                    "prompt": { "type": "string", "description": "Text prompt (max 8000 chars)" },
                    "negative_prompt": { "type": "string", "description": "Negative prompt (max 8000 chars)" },
                    "start_frame_image_media_token": { "type": "string", "description": "Starting keyframe image token" },
                    "end_frame_image_media_token": { "type": "string", "description": "Ending keyframe image token" },
                    "reference_image_media_tokens": { "type": "array", "items": { "type": "string" }, "description": "Reference image tokens (max 16)" },
                    "reference_video_media_tokens": { "type": "array", "items": { "type": "string" }, "description": "Reference video tokens (max 16)" },
                    "reference_audio_media_tokens": { "type": "array", "items": { "type": "string" }, "description": "Reference audio tokens (max 16)" },
                    "reference_character_tokens": { "type": "array", "items": { "type": "string" }, "description": "Reference character tokens (max 16)" },
                    "aspect_ratio": { "type": "string", "description": "Aspect ratio: 'wide_16_9', 'tall_9_16', 'square', etc." },
                    "resolution": { "type": "string", "description": "Resolution preset ('one_k'-'four_k', '480p'-'1080p')" },
                    "bitrate": { "type": "string", "enum": ["normal", "high"], "description": "Bitrate quality" },
                    "quality": { "type": "string", "description": "Quality: 'low', 'medium', 'high', 'xhigh', 'max', 'auto'" },
                    "duration_seconds": { "type": "integer", "description": "Duration in seconds (1-600)" },
                    "video_batch_count": { "type": "integer", "description": "Number of videos (1-8, default 1)" },
                    "generate_audio": { "type": "boolean", "description": "Whether to generate native sound" },
                    "idempotency_token": { "type": "string", "description": "Optional client idempotency token" },
                    "confirm": { "type": "boolean", "description": "Must be true to confirm this paid generation." }
                },
                "required": ["model", "prompt", "confirm"]
            })),
        },
        Tool {
            name: "artcraft_generate_audio".to_string(),
            description: "Generate music, remix audio, or synthesize sound effects via OmniGen Audio (Suno Music/Remix/Sounds/Sample, Seed Audio). PAID action; requires confirm: true.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": { "type": "string", "description": "'suno_music', 'suno_remix', 'suno_sounds', 'suno_sample', 'seed_audio_1p0' (default: suno_music)" },
                    "prompt": { "type": "string", "description": "Lyrics or text prompt (max 8000 chars)" },
                    "style_prompt": { "type": "string", "description": "Genre/style tags (max 2000 chars)" },
                    "audio_media_tokens": { "type": "array", "items": { "type": "string" }, "description": "Reference/remix source audio tokens (max 16)" },
                    "image_media_tokens": { "type": "array", "items": { "type": "string" }, "description": "Reference image tokens for image-to-audio (max 16)" },
                    "keep_lyrics": { "type": "boolean", "description": "Retain original lyrics (Suno Remix)" },
                    "is_instrumental": { "type": "boolean", "description": "Generate instrumental without vocals" },
                    "is_loopable": { "type": "boolean", "description": "Cleanly looping sound effect (Suno Sounds)" },
                    "bpm": { "type": "integer", "description": "Tempo in BPM (30-300)" },
                    "musical_key": { "type": "string", "description": "Musical key ('c_major', 'a_minor', ..., 'auto')" },
                    "sample_rate_hz": { "type": "integer", "description": "Sample rate: 8000/16000/24000/32000/44100/48000" },
                    "speed": { "type": "number", "description": "Speed multiplier 0.5-2.0" },
                    "volume": { "type": "number", "description": "Volume multiplier 0.5-2.0" },
                    "pitch": { "type": "number", "description": "Pitch shift in semitones (-12 to 12)" },
                    "idempotency_token": { "type": "string", "description": "Optional client idempotency token" },
                    "confirm": { "type": "boolean", "description": "Must be true to confirm this paid generation." }
                },
                "required": ["prompt", "confirm"]
            })),
        },
        Tool {
            name: "artcraft_generate_3d_object".to_string(),
            description: "Generate 3D meshes via OmniGen Mesh (Hunyuan 3D v2/v3/v3.1, Tripo3D). PAID action; requires confirm: true.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": { "type": "string", "description": "'hunyuan_3d_2p0', 'hunyuan_3d_2p1', 'hunyuan_3d_3', 'hunyuan_3d_3_sketch', 'hunyuan_3d_3p1_pro', 'hunyuan_3d_3p1_rapid', 'hunyuan_3d_3p1_part', 'hunyuan_3d_3p1_topology', 'tripo_3d_h3p1' (default: hunyuan_3d_3)" },
                    "prompt": { "type": "string", "description": "Text prompt for text-to-3D (max 8000 chars)" },
                    "image_media_token": { "type": "string", "description": "Primary input image" },
                    "reference_image_media_tokens": { "type": "array", "items": { "type": "string" }, "description": "Additional reference images (max 16)" },
                    "front_image_media_token": { "type": "string", "description": "Front view" },
                    "back_image_media_token": { "type": "string", "description": "Back view" },
                    "left_image_media_token": { "type": "string", "description": "Left view" },
                    "right_image_media_token": { "type": "string", "description": "Right view" },
                    "input_mesh_media_file_token": { "type": "string", "description": "Input mesh for retopology/parts" },
                    "output_type": { "type": "string", "enum": ["normal", "low_poly", "geometry"], "description": "Mesh output type" },
                    "polygon_type": { "type": "string", "enum": ["triangle", "quad"], "description": "Polygon type" },
                    "texture_quality": { "type": "string", "enum": ["standard", "detailed"], "description": "Texture quality" },
                    "geometry_quality": { "type": "string", "enum": ["standard", "detailed"], "description": "Geometry quality" },
                    "enable_pbr": { "type": "boolean", "description": "Enable PBR materials" },
                    "enable_texture": { "type": "boolean", "description": "Enable textures" },
                    "target_face_count": { "type": "integer", "description": "Target face count (100-10000000)" },
                    "idempotency_token": { "type": "string", "description": "Optional client idempotency token" },
                    "confirm": { "type": "boolean", "description": "Must be true to confirm this paid generation." }
                },
                "required": ["confirm"]
            })),
        },
        Tool {
            name: "artcraft_generate_splat".to_string(),
            description: "Generate 3D Gaussian splat worlds via OmniGen Splat (WorldLabs Marble, TripoSplat). PAID action; requires confirm: true.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": { "type": "string", "description": "'marble_0p1_mini', 'marble_0p1_plus', 'marble_1p0', 'marble_1p0_draft', 'marble_1p1', 'marble_1p1_plus', 'triposplat' (default: marble_1p1_plus)" },
                    "prompt": { "type": "string", "description": "Text prompt describing the 3D world (max 8000 chars)" },
                    "image_media_token": { "type": "string", "description": "Primary reference image" },
                    "reference_image_media_tokens": { "type": "array", "items": { "type": "string" }, "description": "Multi-view reference images (max 16)" },
                    "reference_video_media_token": { "type": "string", "description": "Optional reference video" },
                    "is_panoramic": { "type": "boolean", "description": "Input is a 360-degree equirectangular panorama" },
                    "disable_recaption": { "type": "boolean", "description": "Bypass automatic prompt recaptioning" },
                    "idempotency_token": { "type": "string", "description": "Optional client idempotency token" },
                    "confirm": { "type": "boolean", "description": "Must be true to confirm this paid generation." }
                },
                "required": ["confirm"]
            })),
        },
    ]
}

pub async fn generate_image(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    require_confirm(&arguments, "spend credits on image generation")?;
    rate_limit("artcraft_generate_image")?;

    let model_str = arguments["model"].as_str()
        .ok_or_else(|| anyhow!("model is required"))?;
    let prompt = bounded_str(&arguments, "prompt", MAX_PROMPT_LEN)?
        .ok_or_else(|| anyhow!("prompt is required"))?;

    let model = parse_image_model(model_str)?;
    let idem = idempotency_token(&arguments)?;

    let request = OmniGenImageCostAndGenerateRequest {
        idempotency_token: Some(idem),
        model: Some(model),
        prompt: Some(prompt.to_string()),
        image_media_tokens: parse_media_tokens(bounded_array(&arguments, "image_media_tokens", MAX_TOKEN_ARRAY)?)?,
        resolution: parse_resolution(arguments["resolution"].as_str())?,
        aspect_ratio: parse_aspect_ratio(arguments["aspect_ratio"].as_str())?,
        quality: parse_quality(arguments["quality"].as_str())?,
        image_batch_count: bounded_u64(&arguments, "image_batch_count", 1, MAX_BATCH_COUNT)?.map(|v| v as u16),
        adjust_horizontal_angle: bounded_f64(&arguments, "adjust_horizontal_angle", -180.0, 180.0)?,
        adjust_vertical_angle: bounded_f64(&arguments, "adjust_vertical_angle", -180.0, 180.0)?,
        adjust_zoom: bounded_f64(&arguments, "adjust_zoom", 0.0, 10.0)?,
    };

    let response = omni_gen_image_generate(
        &client.api_host,
        client.creds_ref(),
        request,
    ).await?;
    audit("generate_image", model_str, if response.success { "success" } else { "failure" });

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
    require_confirm(&arguments, "spend credits on video generation")?;
    rate_limit("artcraft_generate_video")?;

    let model_str = arguments["model"].as_str()
        .ok_or_else(|| anyhow!("model is required"))?;
    let prompt = bounded_str(&arguments, "prompt", MAX_PROMPT_LEN)?
        .ok_or_else(|| anyhow!("prompt is required"))?;
    let negative_prompt = bounded_str(&arguments, "negative_prompt", MAX_PROMPT_LEN)?;

    let model = parse_video_model(model_str)?;
    let idem = idempotency_token(&arguments)?;

    let request = OmniGenVideoCostAndGenerateRequest {
        idempotency_token: Some(idem),
        model: Some(model),
        prompt: Some(prompt.to_string()),
        negative_prompt: negative_prompt.map(|s| s.to_string()),
        start_frame_image_media_token: parse_media_token(arguments["start_frame_image_media_token"].as_str()),
        end_frame_image_media_token: parse_media_token(arguments["end_frame_image_media_token"].as_str()),
        reference_image_media_tokens: parse_media_tokens(bounded_array(&arguments, "reference_image_media_tokens", MAX_TOKEN_ARRAY)?)?,
        reference_video_media_tokens: parse_media_tokens(bounded_array(&arguments, "reference_video_media_tokens", MAX_TOKEN_ARRAY)?)?,
        reference_audio_media_tokens: parse_media_tokens(bounded_array(&arguments, "reference_audio_media_tokens", MAX_TOKEN_ARRAY)?)?,
        reference_character_tokens: parse_character_tokens(bounded_array(&arguments, "reference_character_tokens", MAX_TOKEN_ARRAY)?)?,
        resolution: parse_resolution(arguments["resolution"].as_str())?,
        aspect_ratio: parse_aspect_ratio(arguments["aspect_ratio"].as_str())?,
        bitrate: parse_bitrate(arguments["bitrate"].as_str())?,
        maybe_output_format: parse_video_output_format(arguments["output_format"].as_str())?,
        quality: parse_quality(arguments["quality"].as_str())?,
        duration_seconds: bounded_u64(&arguments, "duration_seconds", 1, MAX_DURATION_SECONDS)?.map(|v| v as u16),
        video_batch_count: bounded_u64(&arguments, "video_batch_count", 1, MAX_BATCH_COUNT)?.map(|v| v as u16),
        generate_audio: arguments["generate_audio"].as_bool(),
        estimate_only: None,
    };

    let response = omni_gen_video_generate(
        &client.api_host,
        client.creds_ref(),
        request,
    ).await?;
    audit("generate_video", model_str, if response.success { "success" } else { "failure" });

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
    require_confirm(&arguments, "spend credits on audio generation")?;
    rate_limit("artcraft_generate_audio")?;

    let prompt = bounded_str(&arguments, "prompt", MAX_PROMPT_LEN)?
        .ok_or_else(|| anyhow!("prompt is required"))?;
    let model_str = arguments["model"].as_str().unwrap_or("suno_music");
    let model = parse_audio_model(model_str)?;
    let idem = idempotency_token(&arguments)?;

    let sample_rate_hz = match bounded_u64(&arguments, "sample_rate_hz", 8000, 48000)? {
        Some(rate) => {
            if ![8000, 16000, 24000, 32000, 44100, 48000].contains(&rate) {
                return Err(anyhow!("sample_rate_hz must be one of 8000, 16000, 24000, 32000, 44100, 48000"));
            }
            Some(rate as u32)
        }
        None => None,
    };

    let request = OmniGenAudioCostAndGenerateRequest {
        idempotency_token: Some(idem),
        model: Some(model),
        prompt: Some(prompt.to_string()),
        style_prompt: bounded_str(&arguments, "style_prompt", 2000)?.map(|s| s.to_string()),
        audio_media_tokens: parse_media_tokens(bounded_array(&arguments, "audio_media_tokens", MAX_TOKEN_ARRAY)?)?,
        image_media_tokens: parse_media_tokens(bounded_array(&arguments, "image_media_tokens", MAX_TOKEN_ARRAY)?)?,
        keep_lyrics: arguments["keep_lyrics"].as_bool(),
        is_instrumental: arguments["is_instrumental"].as_bool(),
        is_loopable: arguments["is_loopable"].as_bool(),
        bpm: bounded_u64(&arguments, "bpm", 30, 300)?.map(|v| v as u16),
        musical_key: parse_musical_key(arguments["musical_key"].as_str())?,
        sample_rate_hz,
        speed: bounded_f64(&arguments, "speed", 0.5, 2.0)?,
        volume: bounded_f64(&arguments, "volume", 0.5, 2.0)?,
        pitch: bounded_f64(&arguments, "pitch", -12.0, 12.0)?,
    };

    let response = omni_gen_audio_generate(
        &client.api_host,
        client.creds_ref(),
        request,
    ).await?;
    audit("generate_audio", model_str, if response.success { "success" } else { "failure" });

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
    require_confirm(&arguments, "spend credits on 3D mesh generation")?;
    rate_limit("artcraft_generate_3d_object")?;

    let model_str = arguments["model"].as_str().unwrap_or("hunyuan_3d_3");
    let model = parse_mesh_model(model_str)?;

    let prompt = bounded_str(&arguments, "prompt", MAX_PROMPT_LEN)?.map(|s| s.to_string());
    let idem = idempotency_token(&arguments)?;

    let primary_image = parse_media_token(arguments["image_media_token"].as_str());
    let mut ref_images = parse_media_tokens(bounded_array(&arguments, "reference_image_media_tokens", MAX_TOKEN_ARRAY)?)?.unwrap_or_default();
    if let Some(img) = primary_image {
        if !ref_images.contains(&img) {
            ref_images.insert(0, img);
        }
    }
    let ref_images_opt = if ref_images.is_empty() { None } else { Some(ref_images) };

    let request = OmniGenMeshCostAndGenerateRequest {
        idempotency_token: Some(idem),
        model: Some(model),
        prompt,
        reference_image_media_tokens: ref_images_opt,
        front_image_media_token: parse_media_token(arguments["front_image_media_token"].as_str()),
        back_image_media_token: parse_media_token(arguments["back_image_media_token"].as_str()),
        left_image_media_token: parse_media_token(arguments["left_image_media_token"].as_str()),
        right_image_media_token: parse_media_token(arguments["right_image_media_token"].as_str()),
        input_mesh_media_token: parse_media_token(arguments["input_mesh_media_file_token"].as_str()),
        mesh_output_type: parse_mesh_output_type(arguments["output_type"].as_str())?,
        polygon_type: parse_polygon_type(arguments["polygon_type"].as_str())?,
        face_count: bounded_u64(&arguments, "target_face_count", 100, 10_000_000)?,
        enable_pbr: arguments["enable_pbr"].as_bool(),
        enable_texture: arguments["enable_texture"].as_bool(),
        texture_quality: parse_mesh_quality_named(&arguments, "texture_quality")?,
        geometry_quality: parse_mesh_quality_named(&arguments, "geometry_quality")?,
    };

    let response = omni_gen_mesh_generate(
        &client.api_host,
        client.creds_ref(),
        request,
    ).await?;
    audit("generate_3d_object", model_str, if response.success { "success" } else { "failure" });

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
    require_confirm(&arguments, "spend credits on splat generation")?;
    rate_limit("artcraft_generate_splat")?;

    let model_str = arguments["model"].as_str().unwrap_or("marble_1p1_plus");
    let model = parse_splat_model(model_str)?;

    let prompt = bounded_str(&arguments, "prompt", MAX_PROMPT_LEN)?.map(|s| s.to_string());
    let idem = idempotency_token(&arguments)?;

    let primary_image = parse_media_token(arguments["image_media_token"].as_str());
    let mut ref_images = parse_media_tokens(bounded_array(&arguments, "reference_image_media_tokens", MAX_TOKEN_ARRAY)?)?.unwrap_or_default();
    if let Some(img) = primary_image {
        if !ref_images.contains(&img) {
            ref_images.insert(0, img);
        }
    }
    let ref_images_opt = if ref_images.is_empty() { None } else { Some(ref_images) };

    let request = OmniGenSplatCostAndGenerateRequest {
        idempotency_token: Some(idem),
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
    audit("generate_splat", model_str, if response.success { "success" } else { "failure" });

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

/// Strict optional parsers: absent -> Ok(None); present-but-unknown -> Err.
pub fn parse_aspect_ratio(ratio: Option<&str>) -> Result<Option<CommonAspectRatio>> {
    match ratio {
        None => Ok(None),
        Some(r) => match r.to_lowercase().as_str() {
            "square" | "1:1" | "1_1" => Ok(Some(CommonAspectRatio::Square)),
            "wide_16_9" | "16:9" | "16_9" => Ok(Some(CommonAspectRatio::WideSixteenByNine)),
            "tall_9_16" | "9:16" | "9_16" => Ok(Some(CommonAspectRatio::TallNineBySixteen)),
            "wide_21_9" | "21:9" | "21_9" => Ok(Some(CommonAspectRatio::WideTwentyOneByNine)),
            "tall_9_21" | "9:21" | "9_21" => Ok(Some(CommonAspectRatio::TallNineByTwentyOne)),
            "wide_4_3" | "4:3" | "4_3" => Ok(Some(CommonAspectRatio::WideFourByThree)),
            "tall_3_4" | "3:4" | "3_4" => Ok(Some(CommonAspectRatio::TallThreeByFour)),
            "wide_3_2" | "3:2" | "3_2" => Ok(Some(CommonAspectRatio::WideThreeByTwo)),
            "tall_2_3" | "2:3" | "2_3" => Ok(Some(CommonAspectRatio::TallTwoByThree)),
            "wide_5_4" | "5:4" | "5_4" => Ok(Some(CommonAspectRatio::WideFiveByFour)),
            "tall_4_5" | "4:5" | "4_5" => Ok(Some(CommonAspectRatio::TallFourByFive)),
            "auto" => Ok(Some(CommonAspectRatio::Auto)),
            "wide" => Ok(Some(CommonAspectRatio::Wide)),
            "tall" => Ok(Some(CommonAspectRatio::Tall)),
            "square_hd" | "squarehd" => Ok(Some(CommonAspectRatio::SquareHd)),
            _ => Err(anyhow!("Unknown aspect_ratio: {}", r)),
        },
    }
}

pub fn parse_resolution(res: Option<&str>) -> Result<Option<CommonResolution>> {
    match res {
        None => Ok(None),
        Some(r) => match r.to_lowercase().as_str() {
            "half_k" | "halfk" | "0.5k" => Ok(Some(CommonResolution::HalfK)),
            "one_k" | "1k" => Ok(Some(CommonResolution::OneK)),
            "two_k" | "2k" => Ok(Some(CommonResolution::TwoK)),
            "three_k" | "3k" => Ok(Some(CommonResolution::ThreeK)),
            "four_k" | "4k" => Ok(Some(CommonResolution::FourK)),
            "four_eighty_p" | "480p" => Ok(Some(CommonResolution::FourEightyP)),
            "seven_twenty_p" | "720p" => Ok(Some(CommonResolution::SevenTwentyP)),
            "ten_eighty_p" | "1080p" => Ok(Some(CommonResolution::TenEightyP)),
            _ => Err(anyhow!("Unknown resolution: {}", r)),
        },
    }
}

pub fn parse_quality(quality: Option<&str>) -> Result<Option<CommonQuality>> {
    match quality {
        None => Ok(None),
        Some(q) => match q.to_lowercase().as_str() {
            "low" => Ok(Some(CommonQuality::Low)),
            "medium" => Ok(Some(CommonQuality::Medium)),
            "high" => Ok(Some(CommonQuality::High)),
            "xhigh" | "x_high" | "extra_high" => Ok(Some(CommonQuality::XHigh)),
            "max" => Ok(Some(CommonQuality::Max)),
            "auto" => Ok(Some(CommonQuality::Auto)),
            _ => Err(anyhow!("Unknown quality: {}", q)),
        },
    }
}

pub fn parse_bitrate(bitrate: Option<&str>) -> Result<Option<CommonBitrate>> {
    match bitrate {
        None => Ok(None),
        Some(b) => match b.to_lowercase().as_str() {
            "high" => Ok(Some(CommonBitrate::High)),
            "normal" => Ok(Some(CommonBitrate::Normal)),
            _ => Err(anyhow!("Unknown bitrate: {}", b)),
        },
    }
}

pub fn parse_video_output_format(format: Option<&str>) -> Result<Option<CommonVideoOutputFormat>> {
    match format {
        None => Ok(None),
        Some(f) => match f.to_lowercase().as_str() {
            "mp4" => Ok(Some(CommonVideoOutputFormat::Mp4)),
            "mov" => Ok(Some(CommonVideoOutputFormat::Mov)),
            _ => Err(anyhow!("Unknown output_format: {}", f)),
        },
    }
}

pub fn parse_musical_key(key: Option<&str>) -> Result<Option<CommonMusicalKey>> {
    match key {
        None => Ok(None),
        Some(k) => match k.to_lowercase().as_str() {
            "c_major" => Ok(Some(CommonMusicalKey::CMajor)),
            "c_minor" => Ok(Some(CommonMusicalKey::CMinor)),
            "d_major" => Ok(Some(CommonMusicalKey::DMajor)),
            "d_minor" => Ok(Some(CommonMusicalKey::DMinor)),
            "f_major" => Ok(Some(CommonMusicalKey::FMajor)),
            "f_minor" => Ok(Some(CommonMusicalKey::FMinor)),
            "g_major" => Ok(Some(CommonMusicalKey::GMajor)),
            "g_minor" => Ok(Some(CommonMusicalKey::GMinor)),
            "a_major" => Ok(Some(CommonMusicalKey::AMajor)),
            "a_minor" => Ok(Some(CommonMusicalKey::AMinor)),
            "b_major" => Ok(Some(CommonMusicalKey::BMajor)),
            "b_minor" => Ok(Some(CommonMusicalKey::BMinor)),
            "auto" => Ok(Some(CommonMusicalKey::Auto)),
            _ => Err(anyhow!("Unknown musical_key: {}", k)),
        },
    }
}

pub fn parse_mesh_output_type(ot: Option<&str>) -> Result<Option<CommonMeshOutputType>> {
    match ot {
        None => Ok(None),
        Some(o) => match o.to_lowercase().as_str() {
            "normal" => Ok(Some(CommonMeshOutputType::Normal)),
            "low_poly" | "lowpoly" => Ok(Some(CommonMeshOutputType::LowPoly)),
            "geometry" => Ok(Some(CommonMeshOutputType::Geometry)),
            _ => Err(anyhow!("Unknown output_type: {}", o)),
        },
    }
}

pub fn parse_mesh_quality(q: Option<&str>) -> Result<Option<CommonMeshQuality>> {
    match q {
        None => Ok(None),
        Some(s) => match s.to_lowercase().as_str() {
            "standard" => Ok(Some(CommonMeshQuality::Standard)),
            "detailed" => Ok(Some(CommonMeshQuality::Detailed)),
            _ => Err(anyhow!("Unknown mesh quality: {}", s)),
        },
    }
}

fn parse_mesh_quality_named(args: &Value, name: &str) -> Result<Option<CommonMeshQuality>> {
    parse_mesh_quality(args.get(name).and_then(|v| v.as_str()))
        .map_err(|e| anyhow!("{}: {}", name, e))
}

pub fn parse_polygon_type(pt: Option<&str>) -> Result<Option<CommonPolygonType>> {
    match pt {
        None => Ok(None),
        Some(p) => match p.to_lowercase().as_str() {
            "triangle" => Ok(Some(CommonPolygonType::Triangle)),
            "quad" => Ok(Some(CommonPolygonType::Quad)),
            _ => Err(anyhow!("Unknown polygon_type: {}", p)),
        },
    }
}

pub fn parse_media_token(token: Option<&str>) -> Option<MediaFileToken> {
    token.map(|t| MediaFileToken::new_from_str(t))
}

pub fn parse_media_tokens(value: Option<&Vec<Value>>) -> Result<Option<Vec<MediaFileToken>>> {
    match value {
        None => Ok(None),
        Some(arr) => {
            let tokens = arr
                .iter()
                .map(|v| {
                    v.as_str()
                        .map(MediaFileToken::new_from_str)
                        .ok_or_else(|| anyhow!("media tokens must be strings"))
                })
                .collect::<Result<Vec<_>>>()?;
            Ok(Some(tokens))
        }
    }
}

pub fn parse_character_tokens(value: Option<&Vec<Value>>) -> Result<Option<Vec<CharacterToken>>> {
    match value {
        None => Ok(None),
        Some(arr) => {
            let tokens = arr
                .iter()
                .map(|v| {
                    v.as_str()
                        .map(CharacterToken::new_from_str)
                        .ok_or_else(|| anyhow!("character tokens must be strings"))
                })
                .collect::<Result<Vec<_>>>()?;
            Ok(Some(tokens))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    mod model_parsers {
        use super::*;

        #[test]
        fn parses_known_and_rejects_unknown() {
            assert!(matches!(parse_image_model("flux_1_dev"), Ok(CommonImageModel::Flux1Dev)));
            assert!(matches!(parse_image_model("FLUX-PRO-1.1"), Ok(CommonImageModel::FluxPro11)));
            assert!(parse_image_model("flux_3").is_err());
            assert!(parse_image_model("gpt_image_2p5_flare").is_err());
            assert!(matches!(parse_video_model("seedance_2p5"), Ok(CommonVideoModel::Seedance2p5)));
            assert!(parse_video_model("seedance_2p0_u").is_err());
            assert!(matches!(parse_mesh_model("tripo_3d_h3p1"), Ok(CommonMeshModel::Tripo3dH3p1)));
            assert!(matches!(parse_splat_model("marble_1p1_plus"), Ok(CommonSplatModel::Marble1p1Plus)));
            assert!(matches!(parse_audio_model("suno_music"), Ok(CommonAudioModel::SunoMusic)));
        }
    }

    mod option_parsers {
        use super::*;

        #[test]
        fn aspect_ratio_accepts_all_aliases() {
            for s in ["square", "wide_16_9", "16:9", "tall_9_16", "wide_21_9", "wide_4_3",
                      "tall_3_4", "wide_3_2", "tall_2_3", "wide_5_4", "tall_4_5", "auto",
                      "wide", "tall", "square_hd"] {
                assert!(parse_aspect_ratio(Some(s)).unwrap().is_some(), "{}", s);
            }
            assert_eq!(parse_aspect_ratio(None).unwrap(), None);
            assert!(parse_aspect_ratio(Some("wide_sixteen_by_nine")).is_err());
            assert!(parse_aspect_ratio(Some("bogus")).is_err());
        }

        #[test]
        fn resolution_maps_3k_and_4k_distinctly() {
            assert!(matches!(parse_resolution(Some("3k")).unwrap(), Some(CommonResolution::ThreeK)));
            assert!(matches!(parse_resolution(Some("4k")).unwrap(), Some(CommonResolution::FourK)));
            assert!(matches!(parse_resolution(Some("480p")).unwrap(), Some(CommonResolution::FourEightyP)));
            assert!(matches!(parse_resolution(Some("720p")).unwrap(), Some(CommonResolution::SevenTwentyP)));
            assert!(matches!(parse_resolution(Some("1080p")).unwrap(), Some(CommonResolution::TenEightyP)));
            assert!(parse_resolution(Some("auto_2k")).is_err());
        }

        #[test]
        fn quality_covers_full_enum() {
            assert!(matches!(parse_quality(Some("auto")).unwrap(), Some(CommonQuality::Auto)));
            assert!(matches!(parse_quality(Some("max")).unwrap(), Some(CommonQuality::Max)));
            assert!(matches!(parse_quality(Some("xhigh")).unwrap(), Some(CommonQuality::XHigh)));
            assert!(parse_quality(Some("standard")).is_err());
            assert!(parse_quality(Some("ultra")).is_err());
        }

        #[test]
        fn other_option_parsers_strict() {
            assert!(matches!(parse_bitrate(Some("normal")).unwrap(), Some(CommonBitrate::Normal)));
            assert!(parse_bitrate(Some("ludicrous")).is_err());
            assert!(matches!(parse_video_output_format(Some("mp4")).unwrap(), Some(CommonVideoOutputFormat::Mp4)));
            assert!(parse_video_output_format(Some("avi")).is_err());
            assert!(parse_musical_key(Some("h_sharp")).is_err());
            assert!(matches!(parse_mesh_output_type(Some("low_poly")).unwrap(), Some(CommonMeshOutputType::LowPoly)));
            assert!(parse_mesh_output_type(Some("blob")).is_err());
            assert!(parse_polygon_type(Some("ngon")).is_err());
        }
    }
}
