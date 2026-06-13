use anyhow::{anyhow, Result};
use serde_json::{json, Value};

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};
use crate::tools::http::raw_json_post;

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_studio_gen2".to_string(),
            description: "Video style transfer / image+video compositing (Studio Gen2).".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"image_media_token":{"type":"string"},"video_media_token":{"type":"string"},"prompt":{"type":"string"}},"required":["image_media_token","video_media_token","prompt"]})),
        },
    ]
}

pub async fn studio_gen2(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let image_token = arguments["image_media_token"].as_str()
        .ok_or_else(|| anyhow!("image_media_token is required"))?;
    let video_token = arguments["video_media_token"].as_str()
        .ok_or_else(|| anyhow!("video_media_token is required"))?;
    let prompt = arguments["prompt"].as_str()
        .ok_or_else(|| anyhow!("prompt is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/studio_gen2/generate", api_hostname);
    let body = json!({
        "image_media_token": image_token,
        "video_media_token": video_token,
        "prompt": prompt
    });
    let response = raw_json_post(&url, body, client.creds_ref()).await?;

    let job_token = response.get("inference_job_token").and_then(|v| v.as_str()).unwrap_or("?");
    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Studio Gen2 generation queued.\nJob token: {}", job_token),
    }])
}
