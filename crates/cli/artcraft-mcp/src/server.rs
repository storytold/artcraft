use rmcp::handler::server::router::tool::ToolRouter;
use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::{
  CallToolResult, Content, Implementation, ProtocolVersion, ServerCapabilities, ServerInfo,
};
use rmcp::{tool, tool_handler, tool_router};
use rmcp::{ErrorData as McpError, ServerHandler};

use crate::errors::ToolError;
use crate::inline_image::fetch_image_for_inline;
use crate::tools::{
  check_artcraft_connection, estimate_image_cost, generate_image, get_user_status,
  list_image_models,
};

/// Inline preview thumbnail width. Claude Desktop caps tool results at
/// ~1 MB; base64 adds ~33% overhead, so the total raw payload needs to
/// stay under ~700 KB. We scale the per-image width down for batches
/// so all images fit in the same response.
const INLINE_THUMBNAIL_WIDTH_SINGLE: u32 = 768;
const INLINE_THUMBNAIL_WIDTH_BATCH: u32 = 512;

const SERVER_INSTRUCTIONS: &str = "Artcraft MCP server.

Suggested workflow:
(1) list_image_models — see available models and per-model constraints.
(2) get_user_status — check credits / plan when the user asks.
(3) estimate_image_cost — preview cost before charging the user.
(4) generate_image — create the image.

Error handling: every failed tool call returns a JSON body with
`error_code`, `message`, and `remediation`. Surface the remediation to
the user. Common codes:

- not_logged_in / artcraft_not_installed: tell the user to open
  /Applications/ArtCraft.app and sign in (or download from
  https://getartcraft.com if not installed).
- session_expired: tell the user to open the desktop app and sign in
  again.
- backend_unavailable: usually transient; suggest retrying in a minute.
- invalid_params: re-check list_image_models and retry with corrected
  parameters.
- generation_timeout: the job may still be running; check the desktop
  app's task queue.

If you suspect the MCP connection itself is misbehaving (no tools
returning, weird transport errors), call check_artcraft_connection.
It always succeeds and reports desktop_app_installed, signed_in,
session_valid, plus any remediation.";

#[derive(Clone)]
pub struct ArtcraftServer {
  tool_router: ToolRouter<ArtcraftServer>,
}

#[tool_router]
impl ArtcraftServer {
  pub fn new() -> Self {
    Self {
      tool_router: Self::tool_router(),
    }
  }

  #[tool(
    description = "Diagnostic health check for the Artcraft MCP connection. Always succeeds. Returns { status: \"ok\" | \"not_installed\" | \"not_logged_in\" | \"session_invalid\" | \"error\", desktop_app_installed, signed_in, session_valid, error_code, remediation }. Call this when troubleshooting or when the user asks if the integration is working."
  )]
  async fn check_artcraft_connection(&self) -> Result<CallToolResult, McpError> {
    match check_artcraft_connection::run().await {
      Ok(value) => Ok(json_success(&value)),
      Err(err) => Ok(error_result(&err)),
    }
  }

  #[tool(
    description = "List all image models available through Artcraft along with per-model constraints (aspect_ratio_options, resolution_options, quality_options, batch_size_max, image_refs_supported, image_refs_max, text_prompt_max_length, etc.). Call this BEFORE generate_image so you can pick valid parameters. `provider` is optional; defaults to \"artcraft\". Pass \"all\" to see every known model."
  )]
  async fn list_image_models(
    &self,
    Parameters(args): Parameters<list_image_models::Args>,
  ) -> Result<CallToolResult, McpError> {
    Ok(json_or_error(list_image_models::run(args).await))
  }

  #[tool(
    description = "Get the signed-in user's current credit balance and active subscription plan. No arguments. Returns { credits: { free, monthly, banked, total }, subscription: { product_slug, next_bill_at, subscription_end_at, ... } | null }."
  )]
  async fn get_user_status(&self) -> Result<CallToolResult, McpError> {
    Ok(json_or_error(get_user_status::run().await))
  }

  #[tool(
    description = "Pre-flight cost estimate for an image generation. Takes the same model/aspect_ratio/resolution/quality/num_images you'd pass to generate_image, plus num_reference_images (0 for text-to-image, >0 for image-edit). Returns cost_in_credits, cost_in_usd_cents, is_free, is_unlimited, is_rate_limited, has_watermark. Use this to confirm cost with the user before generating."
  )]
  async fn estimate_image_cost(
    &self,
    Parameters(args): Parameters<estimate_image_cost::Args>,
  ) -> Result<CallToolResult, McpError> {
    Ok(json_or_error(estimate_image_cost::run(args).await))
  }

  #[tool(
    description = "Generate an image with Artcraft. Required: `prompt`. Optional: `model` (snake_case id — call list_image_models for valid values; defaults to nano_banana_pro), `aspect_ratio`, `resolution`, `quality`, `num_images`, `reference_image_urls` (https URLs for image-edit / img2img — only valid on models with image_refs_supported=true). Each parameter must satisfy the constraints reported by list_image_models for the chosen model. Blocks up to 90 seconds for completion. Returns the generated image inline plus its full-resolution CDN URL."
  )]
  async fn generate_image(
    &self,
    Parameters(args): Parameters<generate_image::Args>,
  ) -> Result<CallToolResult, McpError> {
    match generate_image::run(args).await {
      Ok(images) => Ok(success_images_result(images).await),
      Err(err) => Ok(error_result(&err)),
    }
  }
}

#[tool_handler]
impl ServerHandler for ArtcraftServer {
  fn get_info(&self) -> ServerInfo {
    ServerInfo::new(ServerCapabilities::builder().enable_tools().build())
      .with_server_info(Implementation::from_build_env())
      .with_protocol_version(ProtocolVersion::V_2024_11_05)
      .with_instructions(SERVER_INSTRUCTIONS.to_string())
  }
}

async fn success_images_result(images: generate_image::GeneratedImages) -> CallToolResult {
  let width = if images.images.len() > 1 {
    INLINE_THUMBNAIL_WIDTH_BATCH
  } else {
    INLINE_THUMBNAIL_WIDTH_SINGLE
  };
  let width_str = width.to_string();

  let mut content: Vec<Content> = Vec::with_capacity(images.images.len() * 2 + 1);
  for image in &images.images {
    let inline_url = image
      .maybe_thumbnail_template
      .as_ref()
      .map(|t| t.replace("{WIDTH}", &width_str))
      .unwrap_or_else(|| image.cdn_url.clone());

    match fetch_image_for_inline(&inline_url).await {
      Ok((data_b64, mime)) => content.push(Content::image(data_b64, mime)),
      Err(err) => {
        tracing::warn!("inline fetch failed for {}: {:#}", image.cdn_url, err);
      }
    }
  }

  let urls_text = if images.images.len() == 1 {
    images.images[0].cdn_url.clone()
  } else {
    images
      .images
      .iter()
      .enumerate()
      .map(|(i, img)| format!("Image {}: {}", i + 1, img.cdn_url))
      .collect::<Vec<_>>()
      .join("\n")
  };
  content.push(Content::text(urls_text));

  CallToolResult::success(content)
}

fn json_or_error(result: Result<serde_json::Value, ToolError>) -> CallToolResult {
  match result {
    Ok(value) => json_success(&value),
    Err(err) => error_result(&err),
  }
}

fn json_success(value: &serde_json::Value) -> CallToolResult {
  let body = serde_json::to_string_pretty(value).unwrap_or_else(|_| value.to_string());
  CallToolResult::success(vec![Content::text(body)])
}

fn error_result(err: &ToolError) -> CallToolResult {
  let body = serde_json::to_string_pretty(err)
    .unwrap_or_else(|_| format!("{{\"message\": \"{}\"}}", err.message.replace('"', "\\\"")));
  CallToolResult::error(vec![Content::text(body)])
}
