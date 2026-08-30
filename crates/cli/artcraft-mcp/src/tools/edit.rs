use anyhow::{anyhow, Result};
use serde_json::{json, Value};
use uuid::Uuid;

use artcraft_api_defs::generate::image::edit::flux_pro_kontext_max_edit_image::{FluxProKontextMaxEditImageRequest, FluxProKontextMaxEditImageNumImages};
use artcraft_api_defs::generate::image::edit::gpt_image_1_edit_image::{GptImage1EditImageRequest, GptImage1EditImageImageSize, GptImage1EditImageNumImages, GptImage1EditImageImageQuality};
use artcraft_api_defs::generate::image::edit::gemini_25_flash_edit_image::{Gemini25FlashEditImageRequest, Gemini25FlashEditImageNumImages, Gemini25FlashEditImageImageQuality};
use artcraft_api_defs::generate::image::angle::flux_2_lora_edit_image_angle::{Flux2LoraEditImageAngleRequest, Flux2LoraEditImageAngleImageSize, Flux2LoraEditImageAngleNumImages};
use artcraft_api_defs::generate::video::edit::beeble_switchx_edit_video::{BeebleSwitchXEditVideoRequest};
use artcraft_api_defs::generate::image::bg_removal::remove_image_background::{RemoveImageBackgroundRequest};
use artcraft_client::endpoints::generate::image::edit::flux_pro_kontext_max_edit_image::flux_pro_kontext_max_edit_image;
use artcraft_client::endpoints::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use artcraft_client::endpoints::generate::image::edit::gemini_25_flash_edit_image::gemini_25_flash_edit_image;
use artcraft_client::endpoints::generate::image::angle::flux_2_lora_edit_image_angle::flux_2_lora_edit_image_angle;
use artcraft_client::endpoints::generate::video::edit::beeble_switchx_edit_video::beeble_switchx_edit_video;
use artcraft_client::endpoints::generate::image::bg_removal::remove_image_background::remove_image_background;
use artcraft_client::endpoints::generate::image::inpaint::flux_dev_juggernaut_inpaint_image::flux_dev_juggernaut_inpaint_image;
use artcraft_api_defs::generate::image::inpaint::flux_dev_juggernaut_inpaint_image::{FluxDevJuggernautInpaintImageRequest, FluxDevJuggernautInpaintImageNumImages};
use tokens::tokens::media_files::MediaFileToken;

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_edit_image".to_string(),
            description: "Re-edit an image using Flux Pro Kontext Max, Gemini 2.5 Flash, GPT-Image 1, Qwen, or SeedEdit 3.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": { "type": "string" },
                    "prompt": { "type": "string" },
                    "image_media_token": { "type": "string" }
                },
                "required": ["model", "prompt", "image_media_token"]
            })),
        },
        Tool {
            name: "artcraft_remove_background".to_string(),
            description: "Remove the background from an image.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "image_media_token": { "type": "string" }
                },
                "required": ["image_media_token"]
            })),
        },
        Tool {
            name: "artcraft_inpaint_image".to_string(),
            description: "Inpaint an image using a mask and prompt.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "model": { "type": "string" },
                    "prompt": { "type": "string" },
                    "image_media_token": { "type": "string" },
                    "mask_media_token": { "type": "string" }
                },
                "required": ["prompt", "image_media_token"]
            })),
        },
        Tool {
            name: "artcraft_edit_image_angle".to_string(),
            description: "Manipulate camera angle of an image using Flux 2 LoRA or Qwen.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "image_media_token": { "type": "string" },
                    "horizontal_angle": { "type": "number" },
                    "vertical_angle": { "type": "number" },
                    "zoom": { "type": "number" }
                },
                "required": ["image_media_token"]
            })),
        },
        Tool {
            name: "artcraft_edit_video".to_string(),
            description: "Edit a video using Beeble SwitchX.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "video_media_token": { "type": "string" },
                    "prompt": { "type": "string" }
                },
                "required": ["video_media_token", "prompt"]
            })),
        },
    ]
}

pub async fn edit_image(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let model_str = arguments["model"].as_str()
        .ok_or_else(|| anyhow!("model is required"))?;
    let prompt = arguments["prompt"].as_str()
        .ok_or_else(|| anyhow!("prompt is required"))?;
    let image_token = arguments["image_media_token"].as_str()
        .ok_or_else(|| anyhow!("image_media_token is required"))?;

    let image_media_token = MediaFileToken::new_from_str(image_token);
    let idempotency_token = Uuid::new_v4().to_string();

    let (job_token, success) = match model_str.to_lowercase().as_str() {
        "flux_pro_kontext_max" | "flux_pro_kontext" | "kontext" | "flux" => {
            let request = FluxProKontextMaxEditImageRequest {
                uuid_idempotency_token: idempotency_token,
                prompt: Some(prompt.to_string()),
                image_media_token,
                num_images: Some(FluxProKontextMaxEditImageNumImages::One),
            };
            let response = flux_pro_kontext_max_edit_image(&client.api_host, client.creds_ref(), request).await?;
            (response.inference_job_token.as_str().to_string(), response.success)
        }
        "gpt_image_1" | "gpt_image" | "gpt" | "openai" => {
            let request = GptImage1EditImageRequest {
                uuid_idempotency_token: idempotency_token,
                prompt: Some(prompt.to_string()),
                image_media_tokens: Some(vec![image_media_token]),
                image_size: Some(GptImage1EditImageImageSize::Square),
                num_images: Some(GptImage1EditImageNumImages::One),
                image_quality: Some(GptImage1EditImageImageQuality::High),
            };
            let response = gpt_image_1_edit_image(&client.api_host, client.creds_ref(), request).await?;
            (response.inference_job_token.as_str().to_string(), response.success)
        }
        "gemini_25_flash" | "gemini" | "google" => {
            let request = Gemini25FlashEditImageRequest {
                uuid_idempotency_token: idempotency_token,
                prompt: Some(prompt.to_string()),
                image_media_tokens: Some(vec![image_media_token]),
                num_images: Some(Gemini25FlashEditImageNumImages::One),
                image_quality: Some(Gemini25FlashEditImageImageQuality::High),
            };
            let response = gemini_25_flash_edit_image(&client.api_host, client.creds_ref(), request).await?;
            (response.inference_job_token.as_str().to_string(), response.success)
        }
        _ => return Err(anyhow!("Unknown edit model: {}. Use flux_pro_kontext_max, gpt_image_1, or gemini_25_flash", model_str)),
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Image edit queued successfully.\nJob token: {}\nStatus: {}\n\nPoll for results using artcraft_get_job_status with job_token '{}'",
            job_token,
            if success { "success" } else { "failed" },
            job_token
        ),
    }])
}

pub async fn remove_background(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let image_token = arguments["image_media_token"].as_str()
        .ok_or_else(|| anyhow!("image_media_token is required"))?;

    let media_file_token = Some(MediaFileToken::new_from_str(image_token));
    let idempotency_token = Uuid::new_v4().to_string();

    let request = RemoveImageBackgroundRequest {
        uuid_idempotency_token: idempotency_token,
        media_file_token,
    };

    let response = remove_image_background(&client.api_host, client.creds_ref(), request).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Background removal queued successfully.\nJob token: {}\nStatus: {}\n\nPoll for results using artcraft_get_job_status with job_token '{}'",
            response.inference_job_token.as_str(),
            if response.success { "success" } else { "failed" },
            response.inference_job_token.as_str()
        ),
    }])
}

pub async fn inpaint_image(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let prompt = arguments["prompt"].as_str()
        .ok_or_else(|| anyhow!("prompt is required"))?;
    let image_token = arguments["image_media_token"].as_str()
        .ok_or_else(|| anyhow!("image_media_token is required"))?;
    let mask_token = arguments["mask_media_token"].as_str()
        .ok_or_else(|| anyhow!("mask_media_token is required"))?;

    let image_media_token = MediaFileToken::new_from_str(image_token);
    let mask_media_token = MediaFileToken::new_from_str(mask_token);
    let idempotency_token = Uuid::new_v4().to_string();

    let request = FluxDevJuggernautInpaintImageRequest {
        uuid_idempotency_token: idempotency_token,
        prompt: Some(prompt.to_string()),
        image_media_token,
        mask_media_token,
        num_images: Some(FluxDevJuggernautInpaintImageNumImages::One),
    };

    let response = flux_dev_juggernaut_inpaint_image(&client.api_host, client.creds_ref(), request).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Inpainting queued successfully.\nJob token: {}\nStatus: {}\n\nPoll for results using artcraft_get_job_status with job_token '{}'",
            response.inference_job_token.as_str(),
            if response.success { "success" } else { "failed" },
            response.inference_job_token.as_str()
        ),
    }])
}

pub async fn edit_image_angle(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let image_token = arguments["image_media_token"].as_str()
        .ok_or_else(|| anyhow!("image_media_token is required"))?;

    let image_media_token = MediaFileToken::new_from_str(image_token);
    let idempotency_token = Uuid::new_v4().to_string();

    let request = Flux2LoraEditImageAngleRequest {
        uuid_idempotency_token: idempotency_token,
        image_media_token,
        horizontal_angle: arguments["horizontal_angle"].as_f64(),
        vertical_angle: arguments["vertical_angle"].as_f64(),
        zoom: arguments["zoom"].as_f64(),
        num_images: Some(Flux2LoraEditImageAngleNumImages::One),
        image_size: Some(Flux2LoraEditImageAngleImageSize::Square),
    };

    let response = flux_2_lora_edit_image_angle(&client.api_host, client.creds_ref(), request).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Angle edit queued successfully.\nJob token: {}\nStatus: {}\n\nPoll for results using artcraft_get_job_status with job_token '{}'",
            response.inference_job_token.as_str(),
            if response.success { "success" } else { "failed" },
            response.inference_job_token.as_str()
        ),
    }])
}

pub async fn edit_video(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let video_token = arguments["video_media_token"].as_str()
        .ok_or_else(|| anyhow!("video_media_token is required"))?;
    let prompt = arguments["prompt"].as_str()
        .ok_or_else(|| anyhow!("prompt is required"))?;

    let source_video_media_token = Some(MediaFileToken::new_from_str(video_token));
    let idempotency_token = Uuid::new_v4().to_string();

    let request = BeebleSwitchXEditVideoRequest {
        uuid_idempotency_token: idempotency_token,
        source_video_media_token,
        reference_image_media_token: None,
        prompt: Some(prompt.to_string()),
    };

    let response = beeble_switchx_edit_video(&client.api_host, client.creds_ref(), request).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Video edit queued successfully.\nJob token: {}\nStatus: {}\n\nPoll for results using artcraft_get_job_status with job_token '{}'",
            response.inference_job_token.as_str(),
            if response.success { "success" } else { "failed" },
            response.inference_job_token.as_str()
        ),
    }])
}
