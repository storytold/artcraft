use anyhow::{anyhow, Result};
use serde_json::{json, Value};

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};
use crate::tools::http::raw_json_post;
use crate::tools::safety::{audit, idempotency_token, rate_limit, require_confirm};

pub fn tools() -> Vec<Tool> {
  vec![Tool {
    name: "artcraft_studio_gen2".to_string(),
    description: "Studio Gen2: apply an image style onto a driver video (image + video compositing). PAID action (queues a job); requires confirm: true.".to_string(),
    input_schema: Some(json!({
        "type": "object",
        "properties": {
            "image_media_token": { "type": "string", "description": "Media token of the style/starting image" },
            "video_media_token": { "type": "string", "description": "Media token of the driver video" },
            "idempotency_token": { "type": "string", "description": "Optional client idempotency token" },
            "confirm": { "type": "boolean", "description": "Must be true to confirm this paid generation." }
        },
        "required": ["image_media_token", "video_media_token", "confirm"]
    })),
  }]
}

pub async fn studio_gen2(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
  require_confirm(&arguments, "spend credits on Studio Gen2 generation")?;
  rate_limit("artcraft_studio_gen2")?;

  let image_token = arguments["image_media_token"].as_str().ok_or_else(|| anyhow!("image_media_token is required"))?;
  let video_token = arguments["video_media_token"].as_str().ok_or_else(|| anyhow!("video_media_token is required"))?;
  let idem = idempotency_token(&arguments)?;

  let api_hostname = client.api_host.to_api_hostname_and_scheme();
  let url = format!("{}/v1/studio_gen2/enqueue", api_hostname);
  let body = json!({
      "uuid_idempotency_token": idem,
      "image_file": image_token,
      "video_file": video_token,
  });
  let response = raw_json_post(&url, body, client.creds_ref()).await?;

  let job_token = response.get("inference_job_token").and_then(|v| v.as_str()).unwrap_or("?");
  audit("studio_gen2", image_token, "queued");

  Ok(vec![ToolContent { content_type: "text".to_string(), text: format!("Studio Gen2 generation queued.\nJob token: {}\n\nPoll for results using artcraft_get_job_status with job_token '{}'", job_token, job_token) }])
}
