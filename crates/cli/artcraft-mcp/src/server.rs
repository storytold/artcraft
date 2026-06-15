use rmcp::handler::server::router::tool::ToolRouter;
use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::{
  CallToolResult, Content, Implementation, ProtocolVersion, ServerCapabilities, ServerInfo,
};
use rmcp::{tool, tool_handler, tool_router};
use rmcp::{ErrorData as McpError, ServerHandler};

use crate::inline_image::fetch_image_for_inline;
use crate::tools::{estimate_image_cost, generate_image, get_user_status, list_image_models};

/// Width for the inline preview thumbnail. Claude Desktop caps tool
/// results at ~1 MB; base64 adds ~33% overhead, so we target raw bytes
/// under ~700 KB. 768 px is a safe ceiling for typical PNG output.
const INLINE_THUMBNAIL_WIDTH: u32 = 768;

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
    description = "List all image models available through Artcraft along with per-model constraints (aspect_ratio_options, resolution_options, quality_options, batch_size_max, image_refs_supported, image_refs_max, text_prompt_max_length, etc.). Call this BEFORE generate_image so you can pick valid parameters. `provider` is optional; defaults to \"artcraft\". Pass \"all\" to see every known model."
  )]
  async fn list_image_models(
    &self,
    Parameters(args): Parameters<list_image_models::Args>,
  ) -> Result<CallToolResult, McpError> {
    json_result(list_image_models::run(args).await)
  }

  #[tool(
    description = "Get the signed-in user's current credit balance and active subscription plan. No arguments. Returns { credits: { free, monthly, banked, total }, subscription: { product_slug, next_bill_at, subscription_end_at, ... } | null }."
  )]
  async fn get_user_status(&self) -> Result<CallToolResult, McpError> {
    json_result(get_user_status::run().await)
  }

  #[tool(
    description = "Pre-flight cost estimate for an image generation. Takes the same model/aspect_ratio/resolution/num_images you'd pass to generate_image, plus num_reference_images (0 for text-to-image, >0 for image-edit). Returns cost_in_credits, cost_in_usd_cents, is_free, is_unlimited, is_rate_limited, has_watermark. Use this to confirm cost with the user before generating."
  )]
  async fn estimate_image_cost(
    &self,
    Parameters(args): Parameters<estimate_image_cost::Args>,
  ) -> Result<CallToolResult, McpError> {
    json_result(estimate_image_cost::run(args).await)
  }

  #[tool(
    description = "Generate an image with Artcraft. Required: `prompt`. Optional: `model` (snake_case id — call list_image_models for valid values; defaults to nano_banana_pro), `aspect_ratio`, `resolution`, `quality`, `num_images`, `reference_image_urls` (https URLs of input images for image-edit / img2img — only valid on models with image_refs_supported=true). Each parameter must satisfy the constraints reported by list_image_models for the chosen model. Blocks up to 90 seconds for completion. Returns the generated image inline plus its full-resolution CDN URL."
  )]
  async fn generate_image(
    &self,
    Parameters(args): Parameters<generate_image::Args>,
  ) -> Result<CallToolResult, McpError> {
    match generate_image::run(args).await {
      Ok(image) => Ok(success_image_result(image).await),
      Err(err) => Ok(error_result(err)),
    }
  }
}

#[tool_handler]
impl ServerHandler for ArtcraftServer {
  fn get_info(&self) -> ServerInfo {
    ServerInfo::new(ServerCapabilities::builder().enable_tools().build())
      .with_server_info(Implementation::from_build_env())
      .with_protocol_version(ProtocolVersion::V_2024_11_05)
      .with_instructions(
        "Artcraft MCP server. \
         Suggested workflow: \
         (1) list_image_models to see available models + per-model constraints; \
         (2) get_user_status if the user asks about credits or plan; \
         (3) estimate_image_cost to preview the cost before charging; \
         (4) generate_image to create the image."
          .to_string(),
      )
  }
}

async fn success_image_result(image: generate_image::GeneratedImage) -> CallToolResult {
  let inline_url = image
    .maybe_thumbnail_template
    .as_ref()
    .map(|t| t.replace("{WIDTH}", &INLINE_THUMBNAIL_WIDTH.to_string()))
    .unwrap_or_else(|| image.cdn_url.clone());

  match fetch_image_for_inline(&inline_url).await {
    Ok((data_b64, mime)) => CallToolResult::success(vec![
      Content::image(data_b64, mime),
      Content::text(image.cdn_url),
    ]),
    Err(err) => {
      tracing::warn!("inline image fetch failed, returning URL only: {:#}", err);
      CallToolResult::success(vec![Content::text(image.cdn_url)])
    }
  }
}

fn json_result(result: anyhow::Result<serde_json::Value>) -> Result<CallToolResult, McpError> {
  match result {
    Ok(value) => {
      let body = serde_json::to_string_pretty(&value).unwrap_or_else(|_| value.to_string());
      Ok(CallToolResult::success(vec![Content::text(body)]))
    }
    Err(err) => Ok(error_result(err)),
  }
}

fn error_result(err: anyhow::Error) -> CallToolResult {
  CallToolResult::error(vec![Content::text(format!("{:#}", err))])
}
