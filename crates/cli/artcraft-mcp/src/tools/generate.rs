use anyhow::{anyhow, Result};
use serde_json::{json, Value};
use uuid::Uuid;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_client::endpoints::generate::object::multi_function::hunyuan3d_v3_multi_function_object_gen::hunyuan3d_v3_multi_function_object_gen;
use artcraft_client::endpoints::generate::splat::generate_worldlabs_marble_0p1_plus_splat::generate_worldlabs_marble_0p1_plus_splat;
use artcraft_client::endpoints::omni_gen::generate::image::omni_gen_image::omni_gen_image_generate;
use artcraft_client::endpoints::omni_gen::generate::video::omni_gen_video::omni_gen_video_generate;
use artcraft_api_defs::generate::object::multi_function::hunyuan3d_v3_multi_function_object_gen::{Hunyuan3dV3MultiFunctionObjectGenRequest, Hunyuan3dV3GenerateType, Hunyuan3dV3PolygonType};
use artcraft_api_defs::generate::splat::generate_worldlabs_marble_0p1_plus_splat::GenerateWorldlabsMarble0p1PlusSplatRequest;

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_generate_image".to_string(),
            description: "Generate images using ArtCraft's unified OmniGen API. Supports 13+ models including Flux, GPT-Image, Nano Banana, and Seedream.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Model to use (e.g., 'flux_1_dev', 'flux_1_schnell', 'gpt_image_1', 'nano_banana_pro', 'seedream_4')"
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
                        "description": "Resolution preset"
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
            description: "Generate videos using ArtCraft's unified OmniGen API. Supports 20+ models including Kling, Sora, Veo, Seedance, and Hailuo.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Model to use (e.g., 'kling_2p1_pro', 'sora_2', 'veo_3', 'seedance_2p0')"
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
                    "aspect_ratio": {
                        "type": "string",
                        "description": "Aspect ratio"
                    },
                    "resolution": {
                        "type": "string",
                        "description": "Resolution preset"
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
                        "description": "Whether to generate audio"
                    }
                },
                "required": ["model", "prompt"]
            })),
        },
        Tool {
            name: "artcraft_generate_3d_object".to_string(),
            description: "Generate 3D objects from images, sketches, or text using Hunyuan 3D v3.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "prompt": { "type": "string" },
                    "image_media_token": { "type": "string", "description": "Input image for image-to-3D" },
                    "mode": { "type": "string", "enum": ["image_to_3d", "sketch_to_3d", "text_to_3d"] }
                },
                "required": ["prompt", "mode"]
            })),
        },
        Tool {
            name: "artcraft_generate_splat".to_string(),
            description: "Generate Gaussian splat worlds using WorldLabs Marble.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "prompt": { "type": "string" },
                    "image_media_token": { "type": "string", "description": "Optional input image" }
                },
                "required": ["prompt"]
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
        reference_character_tokens: None,
        resolution: parse_resolution(arguments["resolution"].as_str()),
        aspect_ratio: parse_aspect_ratio(arguments["aspect_ratio"].as_str()),
        quality: parse_quality(arguments["quality"].as_str()),
        duration_seconds: arguments["duration_seconds"].as_u64().map(|v| v as u16),
        video_batch_count: arguments["video_batch_count"].as_u64().map(|v| v as u16),
        generate_audio: arguments["generate_audio"].as_bool(),
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

pub async fn generate_3d_object(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let prompt = arguments["prompt"].as_str();
    let image_token = arguments["image_media_token"].as_str();
    let _mode = arguments["mode"].as_str().unwrap_or("text_to_3d");

    let idempotency_token = Uuid::new_v4().to_string();

    let image_media_token = image_token.map(|t| tokens::tokens::media_files::MediaFileToken::new_from_str(t));

    let request = Hunyuan3dV3MultiFunctionObjectGenRequest {
        uuid_idempotency_token: idempotency_token,
        prompt: prompt.map(|s| s.to_string()),
        image_media_token,
        back_image_media_token: None,
        left_image_media_token: None,
        right_image_media_token: None,
        face_count: None,
        generate_type: Some(Hunyuan3dV3GenerateType::Normal),
        polygon_type: Some(Hunyuan3dV3PolygonType::Triangle),
        enable_pbr: Some(false),
    };

    let response = hunyuan3d_v3_multi_function_object_gen(
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
    let prompt = arguments["prompt"].as_str();
    let image_token = arguments["image_media_token"].as_str();

    let idempotency_token = Uuid::new_v4().to_string();

    let image_media_file_token = image_token.map(|t| tokens::tokens::media_files::MediaFileToken::new_from_str(t));

    let request = GenerateWorldlabsMarble0p1PlusSplatRequest {
        uuid_idempotency_token: idempotency_token,
        image_media_file_token,
        prompt: prompt.map(|s| s.to_string()),
    };

    let response = generate_worldlabs_marble_0p1_plus_splat(
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

pub fn parse_image_model(model_str: &str) -> Result<enums::common::generation::common_image_model::CommonImageModel> {
    use enums::common::generation::common_image_model::CommonImageModel;

    let model = match model_str.to_lowercase().as_str() {
        "flux_1_dev" | "flux1dev" | "flux.1-dev" => CommonImageModel::Flux1Dev,
        "flux_1_schnell" | "flux1schnell" | "flux.1-schnell" => CommonImageModel::Flux1Schnell,
        "flux_pro_1p1" | "flux-pro-1.1" => CommonImageModel::FluxPro11,
        "flux_pro_1p1_ultra" | "flux-pro-1.1-ultra" => CommonImageModel::FluxPro11Ultra,
        "gpt_image_1" | "gpt-image-1" | "gpt_image1" => CommonImageModel::GptImage1,
        "gpt_image_1p5" | "gpt-image-1.5" => CommonImageModel::GptImage1p5,
        "gpt_image_2" | "gpt-image-2" => CommonImageModel::GptImage2,
        "nano_banana" | "nanobanana" => CommonImageModel::NanoBanana,
        "nano_banana_2" | "nanobanana2" => CommonImageModel::NanoBanana2,
        "nano_banana_pro" | "nanobananapro" => CommonImageModel::NanoBananaPro,
        "seedream_4" | "seedream4" => CommonImageModel::Seedream4,
        "seedream_4p5" | "seedream4p5" => CommonImageModel::Seedream4p5,
        "seedream_5_lite" | "seedream5lite" => CommonImageModel::Seedream5Lite,
        _ => return Err(anyhow!("Unknown image model: {}", model_str)),
    };

    Ok(model)
}

pub fn parse_video_model(model_str: &str) -> Result<enums::common::generation::common_video_model::CommonVideoModel> {
    use enums::common::generation::common_video_model::CommonVideoModel;

    let model = match model_str.to_lowercase().as_str() {
        "grok_video" | "grok-video" => CommonVideoModel::GrokVideo,
        "kling_1p6_pro" | "kling-1.6-pro" => CommonVideoModel::Kling16Pro,
        "kling_2p1_pro" | "kling-2.1-pro" => CommonVideoModel::Kling21Pro,
        "kling_2p1_master" | "kling-2.1-master" => CommonVideoModel::Kling21Master,
        "kling_2p5_turbo_pro" | "kling-2.5-turbo-pro" => CommonVideoModel::Kling2p5TurboPro,
        "kling_2p6_pro" | "kling-2.6-pro" => CommonVideoModel::Kling2p6Pro,
        "kling_3p0_standard" | "kling-3.0-standard" => CommonVideoModel::Kling3p0Standard,
        "kling_3p0_pro" | "kling-3.0-pro" => CommonVideoModel::Kling3p0Pro,
        "happy_horse_1p0" | "happy-horse-1.0" => CommonVideoModel::HappyHorse1p0,
        "seedance_1p0_lite" | "seedance-1.0-lite" => CommonVideoModel::Seedance10Lite,
        "seedance_1p5_pro" | "seedance-1.5-pro" => CommonVideoModel::Seedance1p5Pro,
        "seedance_2p0" | "seedance-2.0" => CommonVideoModel::Seedance2p0,
        "seedance_2p0_fast" | "seedance-2.0-fast" => CommonVideoModel::Seedance2p0Fast,
        "sora_2" | "sora-2" => CommonVideoModel::Sora2,
        "sora_2_pro" | "sora-2-pro" => CommonVideoModel::Sora2Pro,
        "veo_2" | "veo-2" => CommonVideoModel::Veo2,
        "veo_3" | "veo-3" => CommonVideoModel::Veo3,
        "veo_3_fast" | "veo-3-fast" => CommonVideoModel::Veo3Fast,
        "veo_3p1" | "veo-3.1" => CommonVideoModel::Veo3p1,
        "veo_3p1_fast" | "veo-3.1-fast" => CommonVideoModel::Veo3p1Fast,
        _ => return Err(anyhow!("Unknown video model: {}", model_str)),
    };

    Ok(model)
}

pub fn parse_aspect_ratio(ratio: Option<&str>) -> Option<enums::common::generation::common_aspect_ratio::CommonAspectRatio> {
    use enums::common::generation::common_aspect_ratio::CommonAspectRatio;

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

pub fn parse_resolution(res: Option<&str>) -> Option<enums::common::generation::common_resolution::CommonResolution> {
    use enums::common::generation::common_resolution::CommonResolution;

    res.and_then(|r| match r.to_lowercase().as_str() {
        "low" | "half_k" | "halfk" | "480p" => Some(CommonResolution::HalfK),
        "medium" | "one_k" | "1k" | "720p" => Some(CommonResolution::OneK),
        "high" | "two_k" | "2k" | "1080p" => Some(CommonResolution::TwoK),
        "ultra" | "three_k" | "3k" | "4k" | "four_k" => Some(CommonResolution::FourK),
        _ => None,
    })
}

pub fn parse_quality(quality: Option<&str>) -> Option<enums::common::generation::common_quality::CommonQuality> {
    use enums::common::generation::common_quality::CommonQuality;

    quality.and_then(|q| match q.to_lowercase().as_str() {
        "low" => Some(CommonQuality::Low),
        "medium" => Some(CommonQuality::Medium),
        "high" => Some(CommonQuality::High),
        _ => None,
    })
}

pub fn parse_media_token(token: Option<&str>) -> Option<tokens::tokens::media_files::MediaFileToken> {
    token.map(|t| tokens::tokens::media_files::MediaFileToken::new_from_str(t))
}

pub fn parse_media_tokens(value: &Value) -> Option<Vec<tokens::tokens::media_files::MediaFileToken>> {
    value.as_array().map(|arr| {
        arr.iter()
            .filter_map(|v| v.as_str().map(|s| tokens::tokens::media_files::MediaFileToken::new_from_str(s)))
            .collect()
    })
}
