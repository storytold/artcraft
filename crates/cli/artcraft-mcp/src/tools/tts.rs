use anyhow::{anyhow, Result};
use serde_json::{json, Value};

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};
use crate::tools::http::{raw_json_get, raw_json_post};

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_tts_generate".to_string(),
            description: "Generate speech from text using available TTS models.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"text":{"type":"string"},"voice_model":{"type":"string"}},"required":["text","voice_model"]})),
        },
        Tool {
            name: "artcraft_tts_search_models".to_string(),
            description: "Discover available TTS voices and models.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{}})),
        },
    ]
}

pub async fn tts_generate(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let text = arguments["text"].as_str()
        .ok_or_else(|| anyhow!("text is required"))?;
    let voice_model = arguments["voice_model"].as_str()
        .ok_or_else(|| anyhow!("voice_model is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/tts/generate", api_hostname);
    let body = json!({ "text": text, "voice_model": voice_model });
    let response = raw_json_post(&url, body, client.creds_ref()).await?;

    let job_token = response.get("inference_job_token").and_then(|v| v.as_str()).unwrap_or("?");
    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("TTS generation queued.\nJob token: {}", job_token),
    }])
}

pub async fn tts_search_models(_arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/tts/models", api_hostname);
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let models = response.get("models").and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(|item| {
            let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("?");
            format!("  - {}", name)
        }).collect::<Vec<_>>())
        .unwrap_or_default();

    let text = if models.is_empty() {
        "No TTS models found.".to_string()
    } else {
        format!("Found {} TTS models:\n{}", models.len(), models.join("\n"))
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}
