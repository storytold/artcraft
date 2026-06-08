use std::collections::HashSet;
use std::path::PathBuf;
use std::time::Duration;

use anyhow::{anyhow, Result};
use rmcp::handler::server::router::tool::ToolRouter;
use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::{
  CallToolResult, Content, Implementation, ProtocolVersion, ServerCapabilities, ServerInfo,
};
use rmcp::transport::stdio;
use rmcp::{schemars, tool, tool_handler, tool_router};
use rmcp::{ErrorData as McpError, ServerHandler, ServiceExt};
use serde::Deserialize;
use tokio::time::{sleep, Instant};

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;
use artcraft_client::endpoints::jobs::list_session_jobs::{list_session_jobs, States};
use artcraft_client::endpoints::omni_gen::generate::image::omni_gen_image::omni_gen_image_generate;
use artcraft_client::utils::api_host::ApiHost;
use enums::common::generation::common_image_model::CommonImageModel;
use enums::common::job_status_plus::JobStatusPlus;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

const POLL_INTERVAL: Duration = Duration::from_secs(3);
const POLL_TIMEOUT: Duration = Duration::from_secs(90);
const DEFAULT_MODEL: CommonImageModel = CommonImageModel::NanoBananaPro;

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct GenerateImageArgs {
  /// Text prompt describing the image to generate.
  prompt: String,
}

#[derive(Clone)]
struct ArtcraftServer {
  tool_router: ToolRouter<ArtcraftServer>,
}

#[tool_router]
impl ArtcraftServer {
  fn new() -> Self {
    Self {
      tool_router: Self::tool_router(),
    }
  }

  #[tool(
    description = "Generate an image with Artcraft from a text prompt. Blocks up to 90 seconds for completion. Returns the CDN URL of the generated image."
  )]
  async fn generate_image(
    &self,
    Parameters(GenerateImageArgs { prompt }): Parameters<GenerateImageArgs>,
  ) -> Result<CallToolResult, McpError> {
    match run_generate_image(&prompt).await {
      Ok(url) => Ok(CallToolResult::success(vec![Content::text(url)])),
      Err(err) => Ok(CallToolResult::error(vec![Content::text(format!(
        "{:#}",
        err
      ))])),
    }
  }
}

#[tool_handler]
impl ServerHandler for ArtcraftServer {
  fn get_info(&self) -> ServerInfo {
    ServerInfo::new(
      ServerCapabilities::builder().enable_tools().build(),
    )
    .with_server_info(Implementation::from_build_env())
    .with_protocol_version(ProtocolVersion::V_2024_11_05)
    .with_instructions(
      "Artcraft MCP server. Use generate_image with a text prompt to create an image.".to_string(),
    )
  }
}

async fn run_generate_image(prompt: &str) -> Result<String> {
  let trimmed = prompt.trim();
  if trimmed.is_empty() {
    return Err(anyhow!("prompt is empty"));
  }

  let api_host = ApiHost::Storyteller;
  let creds = load_storyteller_credentials()?;
  if creds.is_empty() {
    return Err(anyhow!(
      "No Storyteller credentials found at ~/Artcraft/credentials/. \
       Sign in to the Artcraft desktop app first."
    ));
  }

  let request = OmniGenImageCostAndGenerateRequest {
    idempotency_token: None,
    model: Some(DEFAULT_MODEL),
    prompt: Some(trimmed.to_string()),
    image_media_tokens: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: Some(1),
    adjust_horizontal_angle: None,
    adjust_vertical_angle: None,
    adjust_zoom: None,
  };

  tracing::info!("submitting omni_gen image request, model={:?}", DEFAULT_MODEL);

  let submit = omni_gen_image_generate(&api_host, Some(&creds), request)
    .await
    .map_err(|e| anyhow!("submit failed: {:?}", e))?;

  if !submit.success {
    return Err(anyhow!("submit returned success=false"));
  }

  tracing::info!("submitted; inference_job_token={:?}", submit.inference_job_token);

  poll_for_image_url(&api_host, &creds, &submit.inference_job_token).await
}

async fn poll_for_image_url(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  target: &InferenceJobToken,
) -> Result<String> {
  let deadline = Instant::now() + POLL_TIMEOUT;

  let mut include_states = HashSet::new();
  include_states.insert(JobStatusPlus::CompleteSuccess);
  include_states.insert(JobStatusPlus::CompleteFailure);
  include_states.insert(JobStatusPlus::Dead);

  loop {
    if Instant::now() >= deadline {
      return Err(anyhow!(
        "Generation did not complete within {}s. Job token: {:?}",
        POLL_TIMEOUT.as_secs(),
        target
      ));
    }

    let response = list_session_jobs(
      api_host,
      Some(creds),
      States::Include(include_states.clone()),
    )
    .await
    .map_err(|e| anyhow!("poll failed: {:?}", e))?;

    if let Some(job) = response.jobs.iter().find(|j| &j.job_token == target) {
      match job.status.status {
        JobStatusPlus::CompleteSuccess => {
          let result = job
            .maybe_result
            .as_ref()
            .ok_or_else(|| anyhow!("job marked complete but result missing"))?;
          return Ok(result.media_links.cdn_url.to_string());
        }
        JobStatusPlus::CompleteFailure | JobStatusPlus::Dead => {
          let msg = job
            .status
            .maybe_failure_message
            .clone()
            .unwrap_or_else(|| format!("{:?}", job.status.status));
          return Err(anyhow!("generation failed: {}", msg));
        }
        _ => {}
      }
    }

    sleep(POLL_INTERVAL).await;
  }
}

fn load_storyteller_credentials() -> Result<StorytellerCredentialSet> {
  let creds_dir = home_dir()?.join("Artcraft").join("credentials");
  let session = read_trimmed(&creds_dir.join("artcraft_session.txt"))?
    .map(StorytellerSessionCookie::new);
  let avt = read_trimmed(&creds_dir.join("artcraft_avt.txt"))?
    .map(StorytellerAvtCookie::new);
  Ok(StorytellerCredentialSet::initialize(avt, session))
}

fn read_trimmed(path: &PathBuf) -> Result<Option<String>> {
  if !path.exists() {
    return Ok(None);
  }
  let raw = std::fs::read_to_string(path)?;
  let trimmed = raw.trim();
  if trimmed.is_empty() {
    Ok(None)
  } else {
    Ok(Some(trimmed.to_string()))
  }
}

fn home_dir() -> Result<PathBuf> {
  directories::UserDirs::new()
    .map(|d| d.home_dir().to_path_buf())
    .ok_or_else(|| anyhow!("could not determine home directory"))
}

#[tokio::main]
async fn main() -> Result<()> {
  // Logs go to stderr; stdout belongs to the MCP transport.
  tracing_subscriber::fmt()
    .with_writer(std::io::stderr)
    .with_ansi(false)
    .with_env_filter(
      tracing_subscriber::EnvFilter::try_from_env("ARTCRAFT_MCP_LOG")
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
    )
    .init();

  let service = ArtcraftServer::new().serve(stdio()).await?;
  service.waiting().await?;
  Ok(())
}
