use anyhow::{anyhow, Result};
use serde_json::{json, Value};

use artcraft_api_defs::generate::cost_estimate::estimate_image_cost::{EstimateImageCostRequest, GenerationMode as ImageGenerationMode};
use artcraft_api_defs::generate::cost_estimate::estimate_video_cost::{EstimateVideoCostRequest, GenerationMode as VideoGenerationMode};
use artcraft_client::endpoints::generate::cost_estimate::image::estimate_image_cost;
use artcraft_client::endpoints::generate::cost_estimate::video::estimate_video_cost;
use enums::common::generation_provider::GenerationProvider;

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_estimate_cost".to_string(),
            description: "Estimate the cost of a generation before running it. Returns credits and USD cents required.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "media_type": {
                        "type": "string",
                        "enum": ["image", "video"],
                        "description": "Type of media to estimate cost for"
                    },
                    "model": {
                        "type": "string",
                        "description": "Model name"
                    },
                    "generation_mode": {
                        "type": "string",
                        "enum": ["text_to_image", "image_edit"],
                        "description": "For images: text_to_image or image_edit"
                    },
                    "input_image_count": {
                        "type": "integer",
                        "description": "Number of input images (for image_edit mode)"
                    },
                    "aspect_ratio": { "type": "string" },
                    "resolution": { "type": "string" },
                    "quality": { "type": "string" },
                    "batch_count": { "type": "integer" }
                },
                "required": ["media_type", "model"]
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
                "Cost estimate:\n  Credits: {}\n  USD cents: {}\n  Free: {}\n  Unlimited: {}\n  Rate limited: {}\n  Watermark: {}",
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
                "Cost estimate:\n  Credits: {}\n  USD cents: {}\n  Free: {}\n  Unlimited: {}\n  Rate limited: {}\n  Watermark: {}",
                response.cost_in_credits.map(|v| v.to_string()).unwrap_or_else(|| "N/A".to_string()),
                response.cost_in_usd_cents.map(|v| v.to_string()).unwrap_or_else(|| "N/A".to_string()),
                response.is_free,
                response.is_unlimited,
                response.is_rate_limited,
                response.has_watermark
            );

            Ok(vec![ToolContent { content_type: "text".to_string(), text }])
        }
        _ => Err(anyhow!("Unknown media_type: {}", media_type)),
    }
}

pub async fn list_image_models(_arguments: Value, _client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let models = vec![
        "flux_1_dev - Fast open-source Flux",
        "flux_1_schnell - Free fastest Flux",
        "flux_pro_1p1 - Premium photorealistic",
        "flux_pro_1p1_ultra - Highest quality",
        "gpt_image_1 - OpenAI image gen",
        "gpt_image_1p5 - OpenAI 1.5",
        "gpt_image_2 - OpenAI latest",
        "nano_banana - Speed-optimized",
        "nano_banana_2 - Nano Banana v2",
        "nano_banana_pro - Professional grade",
        "seedream_4 - ByteDance image",
        "seedream_4p5 - Seedream 4.5",
        "seedream_5_lite - Lightweight",
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
        "grok_video - xAI video",
        "kling_1p6_pro - Kling 1.6 Pro",
        "kling_2p1_pro - Kling 2.1 Pro",
        "kling_2p1_master - Kling 2.1 Master",
        "kling_2p5_turbo_pro - Kling 2.5 Turbo Pro",
        "kling_2p5_turbo_standard - Kling 2.5 Turbo Standard",
        "kling_2p6_pro - Kling 2.6 Pro",
        "kling_3p0_standard - Kling 3.0 Standard",
        "kling_3p0_pro - Kling 3.0 Pro",
        "happy_horse_1p0 - Happy Horse",
        "seedance_1p0_lite - Seedance Lite",
        "seedance_1p5_pro - Seedance Pro",
        "seedance_2p0 - Seedance 2.0",
        "seedance_2p0_fast - Seedance 2.0 Fast",
        "sora_2 - OpenAI Sora 2",
        "sora_2_pro - OpenAI Sora 2 Pro",
        "veo_2 - Google Veo 2",
        "veo_3 - Google Veo 3",
        "veo_3_fast - Google Veo 3 Fast",
        "veo_3p1 - Google Veo 3.1",
        "veo_3p1_fast - Google Veo 3.1 Fast",
        "hailuo_v2p3_pro - Hailuo 2.3 Pro",
        "hailuo_v2p3_fast_pro - Hailuo 2.3 Fast Pro",
        "pixverse_v5 - Pixverse V5",
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
