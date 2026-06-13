use anyhow::{anyhow, Result};
use serde_json::{json, Value};

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};
use crate::tools::http::{raw_json_get, raw_json_post};

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_create_referral_code".to_string(),
            description: "Create a referral code.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"code":{"type":"string"}},"required":["code"]})),
        },
        Tool {
            name: "artcraft_list_referral_codes".to_string(),
            description: "View your referral codes.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{}})),
        },
    ]
}

pub async fn create_referral_code(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let code = arguments["code"].as_str()
        .ok_or_else(|| anyhow!("code is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/user_referral_codes/create", api_hostname);
    let body = json!({ "code": code });
    let response = raw_json_post(&url, body, client.creds_ref()).await?;

    let token = response.get("referral_code_token").and_then(|v| v.as_str()).unwrap_or("?");
    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Referral code created successfully.\nToken: {}", token),
    }])
}

pub async fn list_referral_codes(_arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/user_referral_codes/list", api_hostname);
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let codes = response.get("referral_codes").and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(|item| {
            let code = item.get("code").and_then(|v| v.as_str()).unwrap_or("?");
            format!("  - {}", code)
        }).collect::<Vec<_>>())
        .unwrap_or_default();

    let text = if codes.is_empty() {
        "No referral codes found.".to_string()
    } else {
        format!("Found {} referral codes:\n{}", codes.len(), codes.join("\n"))
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}
