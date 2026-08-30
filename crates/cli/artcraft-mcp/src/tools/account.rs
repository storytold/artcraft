use anyhow::Result;
use serde_json::{json, Value};

use artcraft_client::endpoints::credits::get_session_credits::get_session_credits;
use artcraft_client::endpoints::subscriptions::get_session_subscription::get_session_subscription;
use enums::common::payments_namespace::PaymentsNamespace;

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};
use crate::tools::http::raw_json_get;

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_get_session_info".to_string(),
            description: "Get the currently authenticated user's info.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {}
            })),
        },
        Tool {
            name: "artcraft_get_credits".to_string(),
            description: "Get wallet credits and usage info.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "namespace": { "type": "string", "enum": ["artcraft", "fakeyou"], "description": "Payment namespace to query credits for" }
                }
            })),
        },
        Tool {
            name: "artcraft_get_subscription".to_string(),
            description: "Get subscription tier and limits.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {}
            })),
        },
    ]
}

pub async fn get_session_info(_arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/users/session_info", api_hostname);
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let username = response.get("username").and_then(|v| v.as_str()).unwrap_or("?");
    let email = response.get("email").and_then(|v| v.as_str()).unwrap_or("?");
    let user_token = response.get("user_token").and_then(|v| v.as_str()).unwrap_or("?");

    let text = format!(
        "Session info:\n  User: {}\n  Email: {}\n  Token: {}",
        username, email, user_token
    );

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn get_credits(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let namespace_str = arguments["namespace"].as_str().unwrap_or("artcraft");
    let namespace = match namespace_str {
        "fakeyou" => PaymentsNamespace::FakeYou,
        _ => PaymentsNamespace::Artcraft,
    };

    let response = get_session_credits(
        &client.api_host,
        client.creds_ref(),
        namespace,
    ).await?;

    let text = format!(
        "Credits info:\n  Free credits: {}\n  Monthly credits: {}\n  Banked credits: {}\n  Total: {}",
        response.free_credits,
        response.monthly_credits,
        response.banked_credits,
        response.sum_total_credits,
    );

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn get_subscription(_arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let response = get_session_subscription(
        &client.api_host,
        client.creds_ref(),
        PaymentsNamespace::Artcraft,
    ).await?;

    let text = if let Some(sub) = response.active_subscription {
        format!(
            "Subscription info:\n  Plan: {}\n  Namespace: {:?}\n  Next bill: {:?}\n  Ends at: {:?}",
            sub.product_slug,
            sub.namespace,
            sub.next_bill_at,
            sub.subscription_end_at
        )
    } else {
        "No active subscription found.".to_string()
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}
