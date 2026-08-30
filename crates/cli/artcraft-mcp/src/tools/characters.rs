use anyhow::{anyhow, Result};
use serde_json::{json, Value};

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};
use crate::tools::http::{raw_json_get, raw_json_post};

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_create_character".to_string(),
            description: "Create a character from a reference image for consistent identity.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"name":{"type":"string"},"image_media_token":{"type":"string"}},"required":["name","image_media_token"]})),
        },
        Tool {
            name: "artcraft_list_characters".to_string(),
            description: "List all user characters.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{}})),
        },
        Tool {
            name: "artcraft_get_character".to_string(),
            description: "Get a character by token.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"character_token":{"type":"string"}},"required":["character_token"]})),
        },
        Tool {
            name: "artcraft_delete_character".to_string(),
            description: "Delete a character.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"character_token":{"type":"string"}},"required":["character_token"]})),
        },
    ]
}

pub async fn create_character(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let name = arguments["name"].as_str()
        .ok_or_else(|| anyhow!("name is required"))?;
    let image_token = arguments["image_media_token"].as_str()
        .ok_or_else(|| anyhow!("image_media_token is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/characters/create", api_hostname);
    let body = json!({ "name": name, "image_media_token": image_token });
    let response = raw_json_post(&url, body, client.creds_ref()).await?;

    let token = response.get("character_token").and_then(|v| v.as_str()).unwrap_or("?");
    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Character created successfully.\nToken: {}", token),
    }])
}

pub async fn list_characters(_arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/characters/list", api_hostname);
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let results = response.get("characters").and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(|item| {
            let token = item.get("token").and_then(|v| v.as_str()).unwrap_or("?");
            let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("(unnamed)");
            format!("  - {} | {}", token, name)
        }).collect::<Vec<_>>())
        .unwrap_or_default();

    let text = if results.is_empty() {
        "No characters found.".to_string()
    } else {
        format!("Found {} characters:\n{}", results.len(), results.join("\n"))
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn get_character(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let token_str = arguments["character_token"].as_str()
        .ok_or_else(|| anyhow!("character_token is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/characters/get/{}", api_hostname, token_str);
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let name = response.get("name").and_then(|v| v.as_str()).unwrap_or("?");
    let token = response.get("token").and_then(|v| v.as_str()).unwrap_or("?");

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Character:\n  Token: {}\n  Name: {}", token, name),
    }])
}

pub async fn delete_character(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let token_str = arguments["character_token"].as_str()
        .ok_or_else(|| anyhow!("character_token is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/characters/delete/{}", api_hostname, token_str);
    let _response = raw_json_post(&url, json!({}), client.creds_ref()).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Character {} deleted successfully.", token_str),
    }])
}
