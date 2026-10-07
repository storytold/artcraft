use anyhow::{anyhow, Result};
use serde_json::{json, Value};

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};
use crate::tools::http::{raw_json_get, raw_json_post};

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_voice_convert".to_string(),
            description: "Convert voice using a trained voice conversion model.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"audio_media_token":{"type":"string"},"model_token":{"type":"string"}},"required":["audio_media_token","model_token"]})),
        },
        Tool {
            name: "artcraft_list_voice_conversion_models".to_string(),
            description: "List available voice conversion models.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{}})),
        },
        Tool {
            name: "artcraft_create_voice".to_string(),
            description: "Create a custom voice.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"name":{"type":"string"}},"required":["name"]})),
        },
        Tool {
            name: "artcraft_list_voices".to_string(),
            description: "List available voices.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{}})),
        },
        Tool {
            name: "artcraft_create_voice_dataset".to_string(),
            description: "Create a voice training dataset.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"name":{"type":"string"}},"required":["name"]})),
        },
        Tool {
            name: "artcraft_upload_voice_sample".to_string(),
            description: "Add an audio sample to a voice dataset.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"dataset_token":{"type":"string"},"file_path":{"type":"string"}},"required":["dataset_token","file_path"]})),
        },
    ]
}

pub async fn voice_convert(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let audio_token = arguments["audio_media_token"].as_str()
        .ok_or_else(|| anyhow!("audio_media_token is required"))?;
    let model_token = arguments["model_token"].as_str()
        .ok_or_else(|| anyhow!("model_token is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/voice_conversion/convert", api_hostname);
    let body = json!({ "audio_media_token": audio_token, "model_token": model_token });
    let response = raw_json_post(&url, body, client.creds_ref()).await?;

    let job_token = response.get("inference_job_token").and_then(|v| v.as_str()).unwrap_or("?");
    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Voice conversion queued.\nJob token: {}", job_token),
    }])
}

pub async fn list_voice_conversion_models(_arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/voice_conversion/models", api_hostname);
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let models = response.get("models").and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(|item| {
            let token = item.get("token").and_then(|v| v.as_str()).unwrap_or("?");
            let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("(unnamed)");
            format!("  - {} | {}", token, name)
        }).collect::<Vec<_>>())
        .unwrap_or_default();

    let text = if models.is_empty() {
        "No voice conversion models found.".to_string()
    } else {
        format!("Found {} models:\n{}", models.len(), models.join("\n"))
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn create_voice(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let name = arguments["name"].as_str()
        .ok_or_else(|| anyhow!("name is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/voice_designer/voices/create", api_hostname);
    let body = json!({ "name": name });
    let response = raw_json_post(&url, body, client.creds_ref()).await?;

    let token = response.get("voice_token").and_then(|v| v.as_str()).unwrap_or("?");
    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Voice created successfully.\nToken: {}", token),
    }])
}

pub async fn list_voices(_arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/voice_designer/voices/list", api_hostname);
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let voices = response.get("voices").and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(|item| {
            let token = item.get("token").and_then(|v| v.as_str()).unwrap_or("?");
            let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("(unnamed)");
            format!("  - {} | {}", token, name)
        }).collect::<Vec<_>>())
        .unwrap_or_default();

    let text = if voices.is_empty() {
        "No voices found.".to_string()
    } else {
        format!("Found {} voices:\n{}", voices.len(), voices.join("\n"))
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn create_voice_dataset(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let name = arguments["name"].as_str()
        .ok_or_else(|| anyhow!("name is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/voice_designer/voice_datasets/create", api_hostname);
    let body = json!({ "name": name });
    let response = raw_json_post(&url, body, client.creds_ref()).await?;

    let token = response.get("dataset_token").and_then(|v| v.as_str()).unwrap_or("?");
    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Voice dataset created successfully.\nToken: {}", token),
    }])
}

pub async fn upload_voice_sample(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let dataset_token = arguments["dataset_token"].as_str()
        .ok_or_else(|| anyhow!("dataset_token is required"))?;
    let file_path = arguments["file_path"].as_str()
        .ok_or_else(|| anyhow!("file_path is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/voice_designer/voice_dataset_samples/upload", api_hostname);
    let body = json!({ "dataset_token": dataset_token, "file_path": file_path });
    let _response = raw_json_post(&url, body, client.creds_ref()).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Voice sample uploaded to dataset {}.", dataset_token),
    }])
}
