use anyhow::{anyhow, Result};
use serde_json::{json, Value};

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};
use crate::tools::http::{raw_json_get, raw_json_post};

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_create_bookmark".to_string(),
            description: "Bookmark a media file.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"media_token":{"type":"string"}},"required":["media_token"]})),
        },
        Tool {
            name: "artcraft_list_bookmarks".to_string(),
            description: "List your bookmarks.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{}})),
        },
        Tool {
            name: "artcraft_rate_media".to_string(),
            description: "Rate a media file (thumbs up/down).".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"media_token":{"type":"string"},"rating":{"type":"string","enum":["up","down"]}},"required":["media_token","rating"]})),
        },
        Tool {
            name: "artcraft_create_comment".to_string(),
            description: "Comment on a media file.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"media_token":{"type":"string"},"text":{"type":"string"}},"required":["media_token","text"]})),
        },
        Tool {
            name: "artcraft_list_comments".to_string(),
            description: "List comments on a media file.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"media_token":{"type":"string"}},"required":["media_token"]})),
        },
        Tool {
            name: "artcraft_list_tags".to_string(),
            description: "List tags on a media file.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"media_token":{"type":"string"}},"required":["media_token"]})),
        },
        Tool {
            name: "artcraft_set_tags".to_string(),
            description: "Add or remove tags on a media file.".to_string(),
            input_schema: Some(json!({"type":"object","properties":{"media_token":{"type":"string"},"tags":{"type":"array","items":{"type":"string"}},"add":{"type":"boolean"}},"required":["media_token","tags","add"]})),
        },
    ]
}

pub async fn create_bookmark(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let media_token = arguments["media_token"].as_str()
        .ok_or_else(|| anyhow!("media_token is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/user_bookmarks/create", api_hostname);
    let body = json!({ "media_token": media_token });
    let _response = raw_json_post(&url, body, client.creds_ref()).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Bookmarked media {}.", media_token),
    }])
}

pub async fn list_bookmarks(_arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/user_bookmarks/list", api_hostname);
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let bookmarks = response.get("bookmarks").and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(|item| {
            let token = item.get("media_token").and_then(|v| v.as_str()).unwrap_or("?");
            format!("  - {}", token)
        }).collect::<Vec<_>>())
        .unwrap_or_default();

    let text = if bookmarks.is_empty() {
        "No bookmarks found.".to_string()
    } else {
        format!("Found {} bookmarks:\n{}", bookmarks.len(), bookmarks.join("\n"))
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn rate_media(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let media_token = arguments["media_token"].as_str()
        .ok_or_else(|| anyhow!("media_token is required"))?;
    let rating = arguments["rating"].as_str()
        .ok_or_else(|| anyhow!("rating is required"))?;

    let is_positive = rating == "up";
    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/user_ratings/rate", api_hostname);
    let body = json!({ "media_token": media_token, "is_positive": is_positive });
    let _response = raw_json_post(&url, body, client.creds_ref()).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Rated media {} {}.", media_token, if is_positive { "up" } else { "down" }),
    }])
}

pub async fn create_comment(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let media_token = arguments["media_token"].as_str()
        .ok_or_else(|| anyhow!("media_token is required"))?;
    let text = arguments["text"].as_str()
        .ok_or_else(|| anyhow!("text is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/comments/create", api_hostname);
    let body = json!({ "media_token": media_token, "text": text });
    let _response = raw_json_post(&url, body, client.creds_ref()).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Comment posted on media {}.", media_token),
    }])
}

pub async fn list_comments(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let media_token = arguments["media_token"].as_str()
        .ok_or_else(|| anyhow!("media_token is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/comments/list?media_token={}", api_hostname, media_token);
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let comments = response.get("comments").and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(|item| {
            let text = item.get("text").and_then(|v| v.as_str()).unwrap_or("?");
            let author = item.get("author").and_then(|v| v.as_str()).unwrap_or("anonymous");
            format!("  - {}: {}", author, text)
        }).collect::<Vec<_>>())
        .unwrap_or_default();

    let text = if comments.is_empty() {
        "No comments found.".to_string()
    } else {
        format!("Found {} comments:\n{}", comments.len(), comments.join("\n"))
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn list_tags(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let media_token = arguments["media_token"].as_str()
        .ok_or_else(|| anyhow!("media_token is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/tags/list?media_token={}", api_hostname, media_token);
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let tags = response.get("tags").and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(|item| {
            item.as_str().unwrap_or("?").to_string()
        }).collect::<Vec<_>>())
        .unwrap_or_default();

    let text = if tags.is_empty() {
        "No tags found.".to_string()
    } else {
        format!("Tags: {}", tags.join(", "))
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn set_tags(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let media_token = arguments["media_token"].as_str()
        .ok_or_else(|| anyhow!("media_token is required"))?;
    let tags = arguments["tags"].as_array()
        .ok_or_else(|| anyhow!("tags array is required"))?
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect::<Vec<_>>();
    let add = arguments["add"].as_bool().unwrap_or(true);

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/tags/set", api_hostname);
    let body = json!({ "media_token": media_token, "tags": tags, "add": add });
    let _response = raw_json_post(&url, body, client.creds_ref()).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Tags {} media {}.", if add { "added to" } else { "removed from" }, media_token),
    }])
}
