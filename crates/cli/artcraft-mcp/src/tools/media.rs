use anyhow::{anyhow, Result};
use serde_json::{json, Value};

use artcraft_client::endpoints::media_files::delete_media_file::delete_media_file as client_delete_media_file;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file as client_get_media_file;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file, UploadImageFromFileArgs};
use tokens::tokens::media_files::MediaFileToken;

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};
use crate::tools::http::{raw_json_get, raw_json_post};

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_upload_image".to_string(),
            description: "Upload an image for use as reference or keyframe in generation.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "file_path": { "type": "string", "description": "Local file path to image" }
                },
                "required": ["file_path"]
            })),
        },
        Tool {
            name: "artcraft_upload_video".to_string(),
            description: "Upload a video for use as reference in generation.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "file_path": { "type": "string" }
                },
                "required": ["file_path"]
            })),
        },
        Tool {
            name: "artcraft_upload_audio".to_string(),
            description: "Upload an audio file.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "file_path": { "type": "string" }
                },
                "required": ["file_path"]
            })),
        },
        Tool {
            name: "artcraft_get_media_file".to_string(),
            description: "Get details about a media file by token.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "media_token": { "type": "string" }
                },
                "required": ["media_token"]
            })),
        },
        Tool {
            name: "artcraft_list_media_files".to_string(),
            description: "List all session media files with pagination.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "cursor": { "type": "string" },
                    "limit": { "type": "integer" }
                }
            })),
        },
        Tool {
            name: "artcraft_search_media".to_string(),
            description: "Search session or featured media.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "query": { "type": "string" }
                },
                "required": ["query"]
            })),
        },
        Tool {
            name: "artcraft_delete_media_file".to_string(),
            description: "Delete a media file by token.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "media_token": { "type": "string" }
                },
                "required": ["media_token"]
            })),
        },
        Tool {
            name: "artcraft_rename_media_file".to_string(),
            description: "Rename a media file.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "media_token": { "type": "string" },
                    "title": { "type": "string" }
                },
                "required": ["media_token", "title"]
            })),
        },
        Tool {
            name: "artcraft_set_media_visibility".to_string(),
            description: "Set media visibility to public or private.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "media_token": { "type": "string" },
                    "is_public": { "type": "boolean" }
                },
                "required": ["media_token", "is_public"]
            })),
        },
    ]
}

pub async fn upload_image(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let file_path = arguments["file_path"].as_str()
        .ok_or_else(|| anyhow!("file_path is required"))?;

    let args = UploadImageFromFileArgs {
        api_host: &client.api_host,
        maybe_creds: client.creds_ref(),
        path: file_path,
        is_intermediate_system_file: false,
        maybe_prompt_token: None,
        maybe_generation_provider: None,
        maybe_batch_token: None,
    };

    let response = upload_image_media_file_from_file(args).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Image uploaded successfully.\nMedia token: {}",
            response.media_file_token.as_str()
        ),
    }])
}

pub async fn upload_video(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let file_path = arguments["file_path"].as_str()
        .ok_or_else(|| anyhow!("file_path is required"))?;

    let args = artcraft_client::endpoints::media_files::upload_video_media_file_from_file::UploadVideoFromFileArgs {
        api_host: &client.api_host,
        maybe_creds: client.creds_ref(),
        path: file_path,
        maybe_prompt_token: None,
        maybe_generation_provider: None,
    };

    let response = artcraft_client::endpoints::media_files::upload_video_media_file_from_file::upload_video_media_file_from_file(args).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Video uploaded successfully.\nMedia token: {}",
            response.media_file_token.as_str()
        ),
    }])
}

pub async fn upload_audio(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let file_path = arguments["file_path"].as_str()
        .ok_or_else(|| anyhow!("file_path is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/media_files/upload/audio", api_hostname);
    let body = json!({ "file_path": file_path });
    let response = raw_json_post(&url, body, client.creds_ref()).await?;

    let media_token = response.get("media_file_token").and_then(|v| v.as_str()).unwrap_or("?");
    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Audio uploaded successfully.\nMedia token: {}", media_token),
    }])
}

pub async fn get_media_file(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let token_str = arguments["media_token"].as_str()
        .ok_or_else(|| anyhow!("media_token is required"))?;

    let token = MediaFileToken::new_from_str(token_str);
    let response = client_get_media_file(&client.api_host, &token).await?;

    let info = response.media_file;
    let text = format!(
        "Media file details:\n  Token: {}\n  Title: {}\n  Type: {:?}\n  Class: {:?}\n  Created: {}\n  Links: {:?}",
        info.token.as_str(),
        info.maybe_title.as_deref().unwrap_or("(untitled)"),
        info.media_type,
        info.media_class,
        info.created_at,
        info.media_links
    );

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn list_media_files(_arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/media_files/list", api_hostname);
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let results = response.get("results").and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(|item| {
            let token = item.get("token").and_then(|v| v.as_str()).unwrap_or("?");
            let title = item.get("maybe_title").and_then(|v| v.as_str()).unwrap_or("(untitled)");
            let class = item.get("media_class").and_then(|v| v.as_str()).unwrap_or("?");
            let visibility = item.get("creator_set_visibility").and_then(|v| v.as_str()).unwrap_or("?");
            format!("  - {} | {} | {} | {}", token, title, class, visibility)
        }).collect::<Vec<_>>())
        .unwrap_or_default();

    let text = if results.is_empty() {
        "No media files found.".to_string()
    } else {
        format!("Found {} media files:\n{}", results.len(), results.join("\n"))
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn search_media(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let query = arguments["query"].as_str()
        .ok_or_else(|| anyhow!("query is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/media_files/search_session?search_term={}", api_hostname, urlencoding::encode(query));
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let results = response.get("results").and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(|item| {
            let token = item.get("token").and_then(|v| v.as_str()).unwrap_or("?");
            let title = item.get("maybe_title").and_then(|v| v.as_str()).unwrap_or("(untitled)");
            let class = item.get("media_class").and_then(|v| v.as_str()).unwrap_or("?");
            format!("  - {} | {} | {}", token, title, class)
        }).collect::<Vec<_>>())
        .unwrap_or_default();

    let text = if results.is_empty() {
        "No media files found matching your search.".to_string()
    } else {
        format!("Found {} results for '{}':\n{}", results.len(), query, results.join("\n"))
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn rename_media_file(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let token_str = arguments["media_token"].as_str()
        .ok_or_else(|| anyhow!("media_token is required"))?;
    let title = arguments["title"].as_str()
        .ok_or_else(|| anyhow!("title is required"))?;

    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/media_files/rename/{}", api_hostname, token_str);
    let body = json!({ "title": title });
    raw_json_post(&url, body, client.creds_ref()).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Media file {} renamed to '{}'.", token_str, title),
    }])
}

pub async fn set_media_visibility(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let token_str = arguments["media_token"].as_str()
        .ok_or_else(|| anyhow!("media_token is required"))?;
    let is_public = arguments["is_public"].as_bool()
        .ok_or_else(|| anyhow!("is_public boolean is required"))?;

    let visibility = if is_public { "public" } else { "private" };
    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/media_files/visibility/{}", api_hostname, token_str);
    let body = json!({ "visibility": visibility });
    raw_json_post(&url, body, client.creds_ref()).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Media file {} visibility set to {}.", token_str, visibility),
    }])
}

pub async fn delete_media_file(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let token_str = arguments["media_token"].as_str()
        .ok_or_else(|| anyhow!("media_token is required"))?;

    let token = MediaFileToken::new_from_str(token_str);
    let _response = client_delete_media_file(&client.api_host, client.creds_ref(), &token).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!("Media file {} deleted successfully.", token_str),
    }])
}

