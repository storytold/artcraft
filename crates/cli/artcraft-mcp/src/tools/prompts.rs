use anyhow::{anyhow, Result};
use serde_json::{json, Value};

use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use artcraft_client::endpoints::prompts::create_prompt::create_prompt as client_create_prompt;

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};
use crate::tools::http::raw_json_get;

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_create_prompt".to_string(),
            description: "Create a prompt object to associate with future generations.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "text": { "type": "string" }
                },
                "required": ["text"]
            })),
        },
        Tool {
            name: "artcraft_get_prompt".to_string(),
            description: "Retrieve a prompt object by token.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "prompt_token": { "type": "string" }
                },
                "required": ["prompt_token"]
            })),
        },
    ]
}

pub async fn create_prompt(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let text = arguments["text"].as_str()
        .ok_or_else(|| anyhow!("text is required"))?;

    let request = CreatePromptRequest {
        uuid_idempotency_token: uuid::Uuid::new_v4().to_string(),
        positive_prompt: Some(text.to_string()),
        negative_prompt: None,
        model_type: None,
        generation_provider: None,
        maybe_generation_mode: None,
        maybe_aspect_ratio: None,
        maybe_resolution: None,
        maybe_batch_count: None,
        maybe_generate_audio: None,
        maybe_duration_seconds: None,
    };

    let response = client_create_prompt(
        &client.api_host,
        client.creds_ref(),
        request,
    ).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Prompt created successfully.\nToken: {}\nText: {}",
            response.prompt_token.as_str(),
            text
        ),
    }])
}

pub async fn get_prompt(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let prompt_token = arguments["prompt_token"].as_str()
        .ok_or_else(|| anyhow!("prompt_token is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/prompts/get/{}", api_hostname, prompt_token);
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let text = response.get("positive_prompt").and_then(|v| v.as_str()).unwrap_or("?");
    let token = response.get("prompt_token").and_then(|v| v.as_str()).unwrap_or("?");

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Prompt:\n  Token: {}\n  Text: {}", token, text),
    }])
}
