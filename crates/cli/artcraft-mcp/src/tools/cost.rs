use anyhow::{anyhow, Result};
use serde_json::{json, Value};

use artcraft_api_defs::generate::cost_estimate::estimate_image_cost::{EstimateImageCostRequest, GenerationMode as ImageGenerationMode};
use artcraft_api_defs::generate::cost_estimate::estimate_video_cost::{EstimateVideoCostRequest, GenerationMode as VideoGenerationMode};
use artcraft_api_defs::generate::cost_estimate::estimate_splat_cost::EstimateSplatCostRequest;
use artcraft_client::endpoints::generate::cost_estimate::image::estimate_image_cost;
use artcraft_client::endpoints::generate::cost_estimate::video::estimate_video_cost;
use artcraft_client::endpoints::generate::cost_estimate::splat::estimate_splat_cost::estimate_splat_cost as client_estimate_splat_cost;
use enums::common::generation_provider::GenerationProvider;

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_estimate_cost".to_string(),
            description: "Estimate the cost of an image, video, or splat generation before running it. Returns credits and USD cents required.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "media_type": {
                        "type": "string",
                        "enum": ["image", "video", "splat"],
                        "description": "Type of media to estimate cost for"
                    },
                    "model": {
                        "type": "string",
                        "description": "Model name"
                    },
                    "generation_mode": {
                        "type": "string",
                        "enum": ["text_to_image", "image_edit", "text_to_video", "start_frame_to_video", "reference_image_to_video"],
                        "description": "Generation mode"
                    },
                    "input_image_count": {
                        "type": "integer",
                        "description": "Number of input reference images"
                    },
                    "aspect_ratio": { "type": "string" },
                    "resolution": { "type": "string" },
                    "quality": { "type": "string" },
                    "duration_seconds": { "type": "integer" },
                    "batch_count": { "type": "integer" },
                    "generate_audio": { "type": "boolean" }
                },
                "required": ["media_type", "model"]
            })),
        },
        Tool {
            name: "artcraft_estimate_splat_cost".to_string(),
            description: "Estimate the credit cost of generating a Gaussian splat world before running it.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "Splat model: 'marble_1p1_plus', 'marble_1p0', 'marble_0p1_plus', 'triposplat', etc. (default: marble_1p1_plus)"
                    },
                    "has_reference_image": {
                        "type": "boolean",
                        "description": "Whether an image reference is supplied"
                    }
                },
                "required": ["model"]
            })),
        },
        Tool {
            name: "artcraft_list_image_models".to_string(),
            description: "List all available image generation models with their capabilities.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "provider": {
                        "type": "string",
                        "enum": ["artcraft", "all"],
                        "description": "Filter by provider (default: artcraft)"
                    }
                }
            })),
        },
        Tool {
            name: "artcraft_list_video_models".to_string(),
            description: "List all available video generation models with their capabilities.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "provider": {
                        "type": "string",
                        "enum": ["artcraft", "all"],
                        "description": "Filter by provider (default: artcraft)"
                    }
                }
            })),
        },
    ]
}

pub async fn estimate_cost(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let media_type = arguments["media_type"].as_str()
        .ok_or_else(|| anyhow!("media_type is required"))?;

    let model_str = arguments["model"].as_str()
        .ok_or_else(|| anyhow!("model is required"))?;

    match media_type {
        "image" => {
            let model = crate::tools::generate::parse_image_model(model_str)?;
            let generation_mode = arguments["generation_mode"].as_str().unwrap_or("text_to_image");

            let mode = match generation_mode {
                "text_to_image" => ImageGenerationMode::TextToImage,
                "image_edit" => {
                    let count = arguments["input_image_count"].as_u64().unwrap_or(1) as u32;
                    ImageGenerationMode::ImageEdit { count }
                }
                _ => ImageGenerationMode::TextToImage,
            };

            let request = EstimateImageCostRequest {
                model,
                provider: GenerationProvider::Artcraft,
                generation_mode: mode,
                aspect_ratio: crate::tools::generate::parse_aspect_ratio(arguments["aspect_ratio"].as_str()),
                resolution: crate::tools::generate::parse_resolution(arguments["resolution"].as_str()),
                quality: crate::tools::generate::parse_quality(arguments["quality"].as_str()),
                image_batch_count: arguments["batch_count"].as_u64().map(|v| v as u16),
            };

            let response = estimate_image_cost::estimate_image_cost(
                &client.api_host,
                client.creds_ref(),
                request,
            ).await?;

            let text = format!(
                "Image cost estimate:\n  Model: {}\n  Credits: {}\n  USD cents: {}\n  Free: {}\n  Unlimited: {}\n  Rate limited: {}\n  Watermark: {}",
                model_str,
                response.cost_in_credits.map(|v| v.to_string()).unwrap_or_else(|| "N/A".to_string()),
                response.cost_in_usd_cents.map(|v| v.to_string()).unwrap_or_else(|| "N/A".to_string()),
                response.is_free,
                response.is_unlimited,
                response.is_rate_limited,
                response.has_watermark
            );

            Ok(vec![ToolContent { content_type: "text".to_string(), text }])
        }
        "video" => {
            let model = crate::tools::generate::parse_video_model(model_str)?;
            let generation_mode = arguments["generation_mode"].as_str().unwrap_or("text_to_video");

            let mode = match generation_mode {
                "text_to_video" => VideoGenerationMode::TextToVideo,
                "start_frame_to_video" => VideoGenerationMode::StartFrameToVideo,
                "start_and_end_frame_to_video" => VideoGenerationMode::StartAndEndFrameToVideo,
                "reference_image_to_video" => {
                    let count = arguments["input_image_count"].as_u64().unwrap_or(1) as u32;
                    VideoGenerationMode::ReferenceImageToVideo { count }
                }
                _ => VideoGenerationMode::TextToVideo,
            };

            let request = EstimateVideoCostRequest {
                model,
                provider: GenerationProvider::Artcraft,
                generation_mode: mode,
                aspect_ratio: crate::tools::generate::parse_aspect_ratio(arguments["aspect_ratio"].as_str()),
                resolution: crate::tools::generate::parse_resolution(arguments["resolution"].as_str()),
                duration_seconds: arguments["duration_seconds"].as_u64().map(|v| v as u16),
                video_batch_count: arguments["batch_count"].as_u64().map(|v| v as u16),
                generate_audio: arguments["generate_audio"].as_bool(),
            };

            let response = estimate_video_cost::estimate_video_cost(
                &client.api_host,
                client.creds_ref(),
                request,
            ).await?;

            let text = format!(
                "Video cost estimate:\n  Model: {}\n  Credits: {}\n  USD cents: {}\n  Free: {}\n  Unlimited: {}\n  Rate limited: {}\n  Watermark: {}",
                model_str,
                response.cost_in_credits.map(|v| v.to_string()).unwrap_or_else(|| "N/A".to_string()),
                response.cost_in_usd_cents.map(|v| v.to_string()).unwrap_or_else(|| "N/A".to_string()),
                response.is_free,
                response.is_unlimited,
                response.is_rate_limited,
                response.has_watermark
            );

            Ok(vec![ToolContent { content_type: "text".to_string(), text }])
        }
        "splat" => {
            estimate_splat_cost(arguments, client).await
        }
        _ => Err(anyhow!("Unknown media_type: {}", media_type)),
    }
}

pub async fn estimate_splat_cost(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let model_str = arguments["model"].as_str().unwrap_or("marble_1p1_plus");
    let model = crate::tools::generate::parse_splat_model(model_str)?;
    let has_reference_image = arguments["has_reference_image"].as_bool();

    let request = EstimateSplatCostRequest {
        model,
        provider: GenerationProvider::Artcraft,
        has_reference_image,
    };

    let response = client_estimate_splat_cost(
        &client.api_host,
        client.creds_ref(),
        request,
    ).await?;

    let text = format!(
        "Splat cost estimate:\n  Model: {}\n  Credits: {}\n  USD cents: {}\n  Free: {}\n  Unlimited: {}\n  Rate limited: {}\n  Watermark: {}",
        model_str,
        response.cost_in_credits.map(|v| v.to_string()).unwrap_or_else(|| "N/A".to_string()),
        response.cost_in_usd_cents.map(|v| v.to_string()).unwrap_or_else(|| "N/A".to_string()),
        response.is_free,
        response.is_unlimited,
        response.is_rate_limited,
        response.has_watermark
    );

    Ok(vec![ToolContent { content_type: "text".to_string(), text }])
}

pub async fn list_image_models(_arguments: Value, _client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let models = vec![
        "flux_1_dev - Fast open-source Flux",
        "flux_1_schnell - Free fastest Flux",
        "flux_pro_1p1 - Premium photorealistic",
        "flux_pro_1p1_ultra - Highest quality Flux",
        "gpt_image_1 - OpenAI image generation",
        "gpt_image_1p5 - OpenAI 1.5",
        "gpt_image_2 - OpenAI latest",
        "grok_imagine_image - xAI Grok Imagine",
        "grok_imagine_image_q - xAI Grok Imagine (Quality tier)",
        "midjourney_7 - Midjourney v7 Router",
        "midjourney_7_niji - Midjourney v7 Niji",
        "midjourney_8 - Midjourney v8 Router",
        "nano_banana - Speed-optimized",
        "nano_banana_2 - Nano Banana v2",
        "nano_banana_pro - Professional grade",
        "seedream_4 - ByteDance image",
        "seedream_4p5 - ByteDance Seedream 4.5",
        "seedream_5_lite - Lightweight Seedream",
        "seedream_5p0_pro - Seedream 5.0 Pro",
        "seedream_5p0_pro_u - Seedream 5.0 Pro Ultra",
        "qwen_edit_2511_angles - Qwen angle manipulation",
        "flux_2_lora_angles - Flux 2 LoRA 360 camera orbits",
    ];

    let mut lines = vec!["Available image models:".to_string()];
    for m in models {
        lines.push(format!("  - {}", m));
    }

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: lines.join("\n"),
    }])
}

pub async fn list_video_models(_arguments: Value, _client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let models = vec![
        "minimax_h3 - MiniMax Hailuo H3 long video generation",
        "minimax_h3_turbo - MiniMax H3 Turbo fast mode",
        "minimax_h3_ultra - MiniMax H3 Ultra high fidelity",
        "seedance_2p5 - ByteDance Seedance 2.5",
        "seedance_2p5_u - ByteDance Seedance 2.5 Ultra",
        "seedance_2p0 - ByteDance Seedance 2.0",
        "seedance_2p0_fast - ByteDance Seedance 2.0 Fast",
        "seedance_2p0_bp - ByteDance Seedance 2.0 BytePlus",
        "seedance_1p5_pro - Seedance 1.5 Pro",
        "kling_3p0_pro - Kuaishou Kling 3.0 Pro",
        "kling_3p0_standard - Kling 3.0 Standard",
        "kling_2p6_pro - Kling 2.6 Pro",
        "kling_2p5_turbo_pro - Kling 2.5 Turbo Pro",
        "kling_2p1_master - Kling 2.1 Master Cinematic",
        "kling_2p1_pro - Kling 2.1 Pro",
        "sora_2 - OpenAI Sora 2",
        "sora_2_pro - OpenAI Sora 2 Pro",
        "veo_3p1 - Google DeepMind Veo 3.1",
        "veo_3p1_fast - Veo 3.1 Fast",
        "veo_3p1_lite - Veo 3.1 Lite",
        "veo_3 - Google Veo 3",
        "veo_3_fast - Google Veo 3 Fast",
        "veo_2 - Google Veo 2",
        "vidu_q3 - ShengShu Vidu Q3",
        "vidu_q3_turbo - ShengShu Vidu Q3 Turbo",
        "flux_3 - Black Forest Labs Flux 3 Video",
        "flux_3_draft - Flux 3 Draft preview",
        "grok_imagine_video - xAI Grok Imagine Video",
        "grok_imagine_video_1p5 - xAI Grok Imagine Video 1.5",
    ];

    let mut lines = vec!["Available video models:".to_string()];
    for m in models {
        lines.push(format!("  - {}", m));
    }

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: lines.join("\n"),
    }])
}
