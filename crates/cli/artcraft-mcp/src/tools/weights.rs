use anyhow::{anyhow, Result};
use serde_json::{json, Value};

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};
use crate::tools::http::{raw_json_get, raw_json_post};

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_list_weights".to_string(),
            description: "List available model weights (LoRAs).".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"cursor":{"type":"string"},"limit":{"type":"integer"}}})),
        },
        Tool {
            name: "artcraft_search_weights".to_string(),
            description: "Search model weights by keyword.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"query":{"type":"string"}},"required":["query"]})),
        },
        Tool {
            name: "artcraft_get_weight".to_string(),
            description: "Get details of a specific weight.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"weight_token":{"type":"string"}},"required":["weight_token"]})),
        },
        Tool {
            name: "artcraft_delete_weight".to_string(),
            description: "Delete a model weight.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"weight_token":{"type":"string"}},"required":["weight_token"]})),
        },
    ]
}

pub async fn list_weights(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let cursor = arguments["cursor"].as_str();
    let limit = arguments["limit"].as_u64().unwrap_or(25);

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let mut url = format!("{}/v1/weights/list?limit={}", api_hostname, limit);
    if let Some(c) = cursor {
        url.push_str(&format!("&cursor={}", c));
    }
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let weights = response.get("weights").and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(|item| {
            let token = item.get("token").and_then(|v| v.as_str()).unwrap_or("?");
            let title = item.get("title").and_then(|v| v.as_str()).unwrap_or("(untitled)");
            format!("  - {} | {}", token, title)
        }).collect::<Vec<_>>())
        .unwrap_or_default();

    let text = if weights.is_empty() {
        "No weights found.".to_string()
    } else {
        format!("Found {} weights:\n{}", weights.len(), weights.join("\n"))
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn search_weights(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let query = arguments["query"].as_str()
        .ok_or_else(|| anyhow!("query is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/weights/search?query={}", api_hostname, urlencoding::encode(query));
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let weights = response.get("weights").and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(|item| {
            let token = item.get("token").and_then(|v| v.as_str()).unwrap_or("?");
            let title = item.get("title").and_then(|v| v.as_str()).unwrap_or("(untitled)");
            format!("  - {} | {}", token, title)
        }).collect::<Vec<_>>())
        .unwrap_or_default();

    let text = if weights.is_empty() {
        "No weights found matching your search.".to_string()
    } else {
        format!("Found {} results for '{}':\n{}", weights.len(), query, weights.join("\n"))
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn get_weight(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let token_str = arguments["weight_token"].as_str()
        .ok_or_else(|| anyhow!("weight_token is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/weights/get/{}", api_hostname, token_str);
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let title = response.get("title").and_then(|v| v.as_str()).unwrap_or("?");
    let token = response.get("token").and_then(|v| v.as_str()).unwrap_or("?");

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Weight:\n  Token: {}\n  Title: {}", token, title),
    }])
}

pub async fn delete_weight(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let token_str = arguments["weight_token"].as_str()
        .ok_or_else(|| anyhow!("weight_token is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/weights/delete/{}", api_hostname, token_str);
    let _response = raw_json_post(&url, json!({}), client.creds_ref()).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Weight {} deleted successfully.", token_str),
    }])
}
