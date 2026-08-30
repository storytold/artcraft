mod credentials;
mod mcp_protocol;
mod handlers;

use std::io::Write;
use anyhow::{anyhow, Result};
use log::{error, info, warn};
use serde_json::{json, Value};
use tokio::io::{self, AsyncBufReadExt, BufReader};

use artcraft_client::utils::api_host::ApiHost;
use crate::mcp_protocol::{
  JsonRpcRequest, JsonRpcResponse, InitializeResult, ServerCapabilities, ServerInfo,
  ToolsCapability, ListToolsResult, McpTool, CallToolParams
};

#[tokio::main]
async fn main() -> Result<()> {
  // Initialize logger to output to stderr.
  // This is CRITICAL because stdout is reserved for JSON-RPC messages.
  env_logger::Builder::from_default_env()
    .target(env_logger::Target::Stderr)
    .filter_level(log::LevelFilter::Info)
    .init();

  info!("Starting ArtCraft MCP Server...");

  // Load configuration/credentials
  let env_host = std::env::var("ARTCRAFT_ENVIRONMENT").unwrap_or_else(|_| "prod".to_string());
  let api_host = match env_host.as_str() {
    "dev" | "development" | "local" => {
      info!("Using API Host: development (localhost:12345)");
      ApiHost::Localhost { port: 12345 }
    }
    _ => {
      info!("Using API Host: production (api.storyteller.ai)");
      ApiHost::Storyteller
    }
  };

  let creds = match credentials::resolve_credentials() {
    Ok(c) => c,
    Err(e) => {
      warn!("Warning: Credentials could not be resolved on startup: {:?}. Server starting in unauthenticated mode.", e);
      artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet::empty()
    }
  };

  // Main JSON-RPC loop over stdio
  let stdin = io::stdin();
  let mut reader = BufReader::new(stdin).lines();

  while let Some(line) = reader.next_line().await? {
    let request: JsonRpcRequest = match serde_json::from_str(&line) {
      Ok(req) => req,
      Err(err) => {
        warn!("Received malformed JSON-RPC request: {}. Error: {:?}", line, err);
        let err_response = JsonRpcResponse::error(Value::Null, -32700, "Parse error");
        send_response(&err_response)?;
        continue;
      }
    };

    // Skip notifications (requests without IDs)
    let id = match &request.id {
      Some(val) => val.clone(),
      None => {
        info!("Received notification: method={}", request.method);
        continue;
      }
    };

    let result = process_request(&api_host, &creds, &request).await;
    match result {
      Ok(res_val) => {
        let response = JsonRpcResponse::success(id, res_val);
        send_response(&response)?;
      }
      Err(err) => {
        error!("Error processing request {}: {:?}", request.method, err);
        let response = JsonRpcResponse::error(id, -32603, &format!("{}", err));
        send_response(&response)?;
      }
    }
  }

  info!("ArtCraft MCP Server shutting down.");
  Ok(())
}

async fn process_request(
  api_host: &ApiHost,
  creds: &artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet,
  request: &JsonRpcRequest
) -> Result<Value> {
  match request.method.as_str() {
    "initialize" => {
      info!("Processing initialize request");
      let result = InitializeResult {
        protocol_version: "2024-11-05".to_string(),
        capabilities: ServerCapabilities {
          tools: Some(ToolsCapability { list_changed: Some(true) })
        },
        server_info: ServerInfo {
          name: "artcraft-mcp-server".to_string(),
          version: "0.1.0".to_string(),
        }
      };
      Ok(serde_json::to_value(result)?)
    }

    "tools/list" => {
      info!("Processing tools/list request");
      let tools = vec![
        McpTool {
          name: "list_jobs".to_string(),
          description: "List recent ArtCraft generation jobs, including status, progress, and result links.".to_string(),
          input_schema: json!({
            "type": "object",
            "properties": {
              "include_states": {
                "type": "string",
                "description": "Optional comma-separated list of states to filter (e.g. pending,started,complete_success)"
              },
              "exclude_states": {
                "type": "string",
                "description": "Optional comma-separated list of states to exclude"
              }
            }
          })
        },
        McpTool {
          name: "get_job_status".to_string(),
          description: "Check the status of a specific ArtCraft generation job using its job token.".to_string(),
          input_schema: json!({
            "type": "object",
            "properties": {
              "job_token": {
                "type": "string",
                "description": "The unique job token (e.g. job_xxx)"
              }
            },
            "required": ["job_token"]
          })
        },
        McpTool {
          name: "upload_media".to_string(),
          description: "Upload a local image or video file to ArtCraft. Returns a MediaFileToken that can be used for start/end frames or references.".to_string(),
          input_schema: json!({
            "type": "object",
            "properties": {
              "file_path": {
                "type": "string",
                "description": "Absolute path to the local media file on the filesystem (e.g., PNG, JPG, WEBP, MP4)"
              }
            },
            "required": ["file_path"]
          })
        },
        McpTool {
          name: "generate_image".to_string(),
          description: "Enqueue an image generation request via ArtCraft's omni-gen image endpoint.".to_string(),
          input_schema: json!({
            "type": "object",
            "properties": {
              "prompt": {
                "type": "string",
                "description": "The text prompt describing the image you want to generate."
              },
              "model": {
                "type": "string",
                "description": "The model to use. Accepts: flux_1_dev, flux_1_schnell, flux_pro_1p1, flux_pro_1p1_ultra, gpt_image_1, gpt_image_1p5, gpt_image_2, grok_imagine_image, grok_imagine_image_q, midjourney_7, midjourney_7_niji, midjourney_8, nano_banana, nano_banana_2, nano_banana_pro, seedream_4, seedream_4p5, seedream_5_lite. [default: flux_1_dev]"
              },
              "aspect_ratio": {
                "type": "string",
                "description": "Optional aspect ratio. Accepts: auto, square, wide_three_by_two, wide_four_by_three, wide_five_by_four, wide_sixteen_by_nine, wide_twenty_one_by_nine, tall_two_by_three, tall_three_by_four, tall_four_by_five, tall_nine_by_sixteen, tall_nine_by_twenty_one, wide, tall"
              },
              "quality": {
                "type": "string",
                "description": "Optional quality: standard, high"
              },
              "image_batch_count": {
                "type": "integer",
                "description": "How many images to generate (default: 1)"
              }
            },
            "required": ["prompt"]
          })
        },
        McpTool {
          name: "generate_video".to_string(),
          description: "Enqueue a video generation request via ArtCraft's omni-gen video endpoint.".to_string(),
          input_schema: json!({
            "type": "object",
            "properties": {
              "prompt": {
                "type": "string",
                "description": "The text prompt describing the video action or scene."
              },
              "model": {
                "type": "string",
                "description": "The model to use. Accepts: grok_imagine_video, grok_imagine_video_1p5, kling_1p6_pro, kling_2p1_pro, kling_2p1_master, kling_2p5_turbo_pro, kling_2p6_pro, kling_3p0_standard, kling_3p0_pro, happy_horse_1p0, seedance_1p0_lite, seedance_1p5_pro, seedance_2p0, seedance_2p0_fast, seedance_2p0_bp, seedance_2p0_bp_fast, seedance_2p0_u, seedance_2p0_u_fast, seedance_2p0_bpu, seedance_2p0_bpu_fast, sora_2, sora_2_pro, veo_2, veo_3, veo_3_fast, veo_3p1, veo_3p1_fast. [default: seedance_2p0]"
              },
              "duration": {
                "type": "integer",
                "description": "Duration in seconds (default: 5)"
              },
              "start_frame_media_token": {
                "type": "string",
                "description": "Optional MediaFileToken for the start frame image (useful for image-to-video)"
              },
              "end_frame_media_token": {
                "type": "string",
                "description": "Optional MediaFileToken for the end frame image"
              },
              "image_reference_tokens": {
                "type": "string",
                "description": "Optional comma-separated list of reference image MediaFileTokens"
              },
              "video_reference_tokens": {
                "type": "string",
                "description": "Optional comma-separated list of reference video MediaFileTokens"
              },
              "audio_reference_tokens": {
                "type": "string",
                "description": "Optional comma-separated list of reference audio MediaFileTokens"
              }
            },
            "required": ["prompt"]
          })
        },
        McpTool {
          name: "get_credits".to_string(),
          description: "Retrieve the user's current credit balance (free, monthly, banked, and sum total).".to_string(),
          input_schema: json!({ "type": "object", "properties": {} })
        },
        McpTool {
          name: "get_subscription".to_string(),
          description: "Retrieve the user's active subscription details and billing dates.".to_string(),
          input_schema: json!({ "type": "object", "properties": {} })
        },
        McpTool {
          name: "create_checkout_session".to_string(),
          description: "Generates a Stripe checkout URL for the user to buy credits or subscribe. Use this if the user runs out of credits.".to_string(),
          input_schema: json!({
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "description": "Either 'credits' or 'subscription'."
              },
              "quantity": {
                "type": "integer",
                "description": "If type is 'credits', the amount to buy."
              },
              "plan_id": {
                "type": "string",
                "description": "If type is 'subscription', the plan identifier."
              }
            },
            "required": ["type"]
          })
        },
        McpTool {
          name: "get_billing_portal_url".to_string(),
          description: "Generates a Stripe portal URL for the user to manage their subscription.".to_string(),
          input_schema: json!({ "type": "object", "properties": {} })
        },
        McpTool {
          name: "estimate_image_cost".to_string(),
          description: "Estimates the cost in credits for an image generation.".to_string(),
          input_schema: json!({
            "type": "object",
            "properties": {
              "model": { "type": "string" },
              "provider": { "type": "string", "description": "e.g., artcraft, fal, grok, midjourney" },
              "generation_mode": { "type": "string", "description": "text_to_image or image_edit" },
              "aspect_ratio": { "type": "string" },
              "image_batch_count": { "type": "integer" }
            },
            "required": ["model", "provider", "generation_mode"]
          })
        },
        McpTool {
          name: "estimate_video_cost".to_string(),
          description: "Estimates the cost in credits for a video generation.".to_string(),
          input_schema: json!({
            "type": "object",
            "properties": {
              "model": { "type": "string" },
              "provider": { "type": "string" },
              "generation_mode": { "type": "string", "description": "text_to_video or reference_image_to_video" },
              "aspect_ratio": { "type": "string" },
              "duration_seconds": { "type": "integer" }
            },
            "required": ["model", "provider", "generation_mode"]
          })
        },
        McpTool {
          name: "get_media_file".to_string(),
          description: "Retrieves rich metadata for a given MediaFileToken.".to_string(),
          input_schema: json!({
            "type": "object",
            "properties": {
              "media_token": { "type": "string" }
            },
            "required": ["media_token"]
          })
        },
        McpTool {
          name: "download_media_file".to_string(),
          description: "Downloads a media file to the local disk.".to_string(),
          input_schema: json!({
            "type": "object",
            "properties": {
              "media_token": { "type": "string" },
              "download_directory": { "type": "string", "description": "Absolute path to a directory where the file should be saved." }
            },
            "required": ["media_token", "download_directory"]
          })
        },
        McpTool {
          name: "delete_media_file".to_string(),
          description: "Deletes a media file from the account.".to_string(),
          input_schema: json!({
            "type": "object",
            "properties": {
              "media_token": { "type": "string" }
            },
            "required": ["media_token"]
          })
        },
        McpTool {
          name: "create_prompt".to_string(),
          description: "Saves a text prompt to the backend, returning a PromptToken.".to_string(),
          input_schema: json!({
            "type": "object",
            "properties": {
              "prompt": { "type": "string" },
              "is_negative": { "type": "boolean" }
            },
            "required": ["prompt"]
          })
        },
        McpTool {
          name: "list_models".to_string(),
          description: "Returns all supported image and video models with their capabilities and required provider credentials.".to_string(),
          input_schema: json!({ "type": "object", "properties": {} })
        },
        McpTool {
          name: "check_provider_credentials".to_string(),
          description: "Lists provider slots and whether a key exists. Returns redacted secrets (safe for agents).".to_string(),
          input_schema: json!({ "type": "object", "properties": {} })
        }
      ];
      let result = ListToolsResult { tools };
      Ok(serde_json::to_value(result)?)
    }

    "tools/call" => {
      let params: CallToolParams = serde_json::from_value(request.params.clone().unwrap_or(Value::Null))
        .map_err(|e| anyhow!("Invalid call parameters: {:?}", e))?;
 
      info!("Calling tool: {}", params.name);

      if creds.is_empty() {
        let requires_auth = match params.name.as_str() {
          "list_models" | "check_provider_credentials" | "get_media_file" | "download_media_file" => false,
          _ => true,
        };
        if requires_auth {
          return Err(anyhow!(
            "Authentication credentials could not be resolved. Please log in via the ArtCraft Desktop App or set ARTCRAFT_SESSION and ARTCRAFT_AVT environment variables."
          ));
        }
      }

      let call_result = match params.name.as_str() {
        "list_jobs" => handlers::handle_list_jobs(api_host, creds, params.arguments).await?,
        "get_job_status" => handlers::handle_get_job_status(api_host, creds, params.arguments).await?,
        "upload_media" => handlers::handle_upload_media(api_host, creds, params.arguments).await?,
        "generate_image" => handlers::handle_generate_image(api_host, creds, params.arguments).await?,
        "generate_video" => handlers::handle_generate_video(api_host, creds, params.arguments).await?,
        "get_credits" => handlers::handle_get_credits(api_host, creds, params.arguments).await?,
        "get_subscription" => handlers::handle_get_subscription(api_host, creds, params.arguments).await?,
        "create_checkout_session" => handlers::handle_create_checkout_session(api_host, creds, params.arguments).await?,
        "get_billing_portal_url" => handlers::handle_get_billing_portal_url(api_host, creds, params.arguments).await?,
        "estimate_image_cost" => handlers::handle_estimate_image_cost(api_host, creds, params.arguments).await?,
        "estimate_video_cost" => handlers::handle_estimate_video_cost(api_host, creds, params.arguments).await?,
        "get_media_file" => handlers::handle_get_media_file(api_host, creds, params.arguments).await?,
        "download_media_file" => handlers::handle_download_media_file(api_host, creds, params.arguments).await?,
        "delete_media_file" => handlers::handle_delete_media_file(api_host, creds, params.arguments).await?,
        "create_prompt" => handlers::handle_create_prompt(api_host, creds, params.arguments).await?,
        "list_models" => handlers::handle_list_models(api_host, creds, params.arguments).await?,
        "check_provider_credentials" => handlers::handle_check_provider_credentials(api_host, creds, params.arguments).await?,
        _ => return Err(anyhow!("Unknown tool name: {}", params.name)),
      };
      Ok(serde_json::to_value(call_result)?)
    }

    other => Err(anyhow!("Unsupported method: {}", other)),
  }
}

fn send_response(response: &JsonRpcResponse) -> Result<()> {
  let serialized = serde_json::to_string(response)?;
  let mut stdout = std::io::stdout();
  writeln!(stdout, "{}", serialized)?;
  stdout.flush()?;
  Ok(())
}
