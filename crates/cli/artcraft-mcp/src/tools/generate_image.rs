use std::collections::HashSet;
use std::time::Duration;

use rmcp::schemars;
use serde::Deserialize;
use tokio::time::{sleep, Instant};

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::jobs::list_session_jobs::{list_session_jobs, States};
use artcraft_client::endpoints::media_files::upload_image_media_file_from_bytes::{
  upload_image_media_file_from_bytes, ImageType, UploadImageBytesArgs,
};
use artcraft_client::endpoints::omni_gen::generate::image::omni_gen_image::omni_gen_image_generate;
use artcraft_client::utils::api_host::ApiHost;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_image_model::CommonImageModel;
use enums::common::generation::common_quality::CommonQuality;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::job_status_plus::JobStatusPlus;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::creds::load_session;
use crate::errors::ToolError;

const POLL_INTERVAL: Duration = Duration::from_secs(3);
const POLL_TIMEOUT: Duration = Duration::from_secs(90);
const DEFAULT_MODEL: CommonImageModel = CommonImageModel::NanoBananaPro;
const MAX_REFERENCE_IMAGE_BYTES: usize = 20 * 1024 * 1024;
const REFERENCE_FETCH_TIMEOUT: Duration = Duration::from_secs(30);

pub struct GeneratedImage {
  pub cdn_url: String,
  pub maybe_thumbnail_template: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct Args {
  /// Text prompt describing the image to generate.
  pub prompt: String,

  /// Optional model id (snake_case). Call list_image_models for valid
  /// ids and per-model constraints. Defaults to nano_banana_pro.
  #[serde(default)]
  pub model: Option<String>,

  /// Optional aspect ratio (snake_case). Must appear in the chosen
  /// model's aspect_ratio_options. See list_image_models.
  #[serde(default)]
  pub aspect_ratio: Option<String>,

  /// Optional resolution (snake_case). Must appear in the chosen
  /// model's resolution_options. See list_image_models.
  #[serde(default)]
  pub resolution: Option<String>,

  /// Optional quality preset (snake_case). Must appear in the model's
  /// quality_options. See list_image_models.
  #[serde(default)]
  pub quality: Option<String>,

  /// Number of images to generate in this batch. Defaults to 1.
  /// Hard cap is per-model (batch_size_max from list_image_models).
  #[serde(default)]
  pub num_images: Option<u16>,

  /// Optional https:// URLs of reference images for image-edit (img2img)
  /// generation. Each is fetched, validated as image/*, uploaded as a
  /// media file, and passed to the model. Only valid when the chosen
  /// model has image_refs_supported=true. Max 20 MB per image.
  #[serde(default)]
  pub reference_image_urls: Option<Vec<String>>,
}

pub async fn run(args: Args) -> Result<GeneratedImage, ToolError> {
  let prompt = args.prompt.trim();
  if prompt.is_empty() {
    return Err(ToolError::invalid_params("prompt is empty"));
  }

  let model = resolve_model(args.model.as_deref())?;
  let aspect_ratio =
    parse_optional_enum::<CommonAspectRatio>("aspect_ratio", args.aspect_ratio.as_deref())?;
  let resolution =
    parse_optional_enum::<CommonResolution>("resolution", args.resolution.as_deref())?;
  let quality = parse_optional_enum::<CommonQuality>("quality", args.quality.as_deref())?;

  let (api_host, creds) = load_session()?;

  let image_media_tokens = match args.reference_image_urls.as_deref() {
    None => None,
    Some(urls) if urls.is_empty() => None,
    Some(urls) => Some(upload_reference_images(urls, &api_host, &creds).await?),
  };

  let request = OmniGenImageCostAndGenerateRequest {
    idempotency_token: Some(uuid::Uuid::new_v4().hyphenated().to_string()),
    model: Some(model),
    prompt: Some(prompt.to_string()),
    image_media_tokens,
    resolution,
    aspect_ratio,
    quality,
    image_batch_count: args.num_images.or(Some(1)),
    adjust_horizontal_angle: None,
    adjust_vertical_angle: None,
    adjust_zoom: None,
  };

  tracing::info!("submitting omni_gen image request, model={:?}", model);

  let submit = omni_gen_image_generate(&api_host, Some(&creds), request)
    .await
    .map_err(|e| ToolError::backend(format!("submit failed: {:?}", e)))?;

  if !submit.success {
    return Err(ToolError::backend("submit returned success=false"));
  }

  tracing::info!("submitted; inference_job_token={:?}", submit.inference_job_token);

  poll_for_image_url(&api_host, &creds, &submit.inference_job_token).await
}

async fn poll_for_image_url(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  target: &InferenceJobToken,
) -> Result<GeneratedImage, ToolError> {
  let deadline = Instant::now() + POLL_TIMEOUT;

  let mut include_states = HashSet::new();
  include_states.insert(JobStatusPlus::CompleteSuccess);
  include_states.insert(JobStatusPlus::CompleteFailure);
  include_states.insert(JobStatusPlus::Dead);

  loop {
    if Instant::now() >= deadline {
      return Err(ToolError::generation_timeout(format!("{:?}", target)));
    }

    let response = list_session_jobs(
      api_host,
      Some(creds),
      States::Include(include_states.clone()),
    )
    .await
    .map_err(|e| ToolError::backend(format!("poll failed: {:?}", e)))?;

    if let Some(job) = response.jobs.iter().find(|j| &j.job_token == target) {
      match job.status.status {
        JobStatusPlus::CompleteSuccess => {
          let result = job.maybe_result.as_ref().ok_or_else(|| {
            ToolError::backend("job marked complete but result missing")
          })?;
          return Ok(GeneratedImage {
            cdn_url: result.media_links.cdn_url.to_string(),
            maybe_thumbnail_template: result.media_links.maybe_thumbnail_template.clone(),
          });
        }
        JobStatusPlus::CompleteFailure | JobStatusPlus::Dead => {
          let msg = job
            .status
            .maybe_failure_message
            .clone()
            .unwrap_or_else(|| format!("{:?}", job.status.status));
          return Err(ToolError::generation_failed(msg));
        }
        _ => {}
      }
    }

    sleep(POLL_INTERVAL).await;
  }
}

async fn upload_reference_images(
  urls: &[String],
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
) -> Result<Vec<MediaFileToken>, ToolError> {
  let client = reqwest::Client::builder()
    .timeout(REFERENCE_FETCH_TIMEOUT)
    .gzip(true)
    .build()
    .map_err(|e| ToolError::internal(format!("client build failed: {:?}", e)))?;

  let mut tokens = Vec::with_capacity(urls.len());
  for url in urls {
    let token = upload_one_reference(url, &client, api_host, creds).await?;
    tokens.push(token);
  }
  Ok(tokens)
}

async fn upload_one_reference(
  url: &str,
  client: &reqwest::Client,
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
) -> Result<MediaFileToken, ToolError> {
  if !url.starts_with("https://") {
    return Err(ToolError::reference_image(format!(
      "URL must use https://: {}",
      url
    )));
  }

  let response = client
    .get(url)
    .send()
    .await
    .map_err(|e| ToolError::reference_image(format!("fetch failed for {}: {:?}", url, e)))?
    .error_for_status()
    .map_err(|e| ToolError::reference_image(format!("HTTP error for {}: {:?}", url, e)))?;

  let mime_raw = response
    .headers()
    .get(reqwest::header::CONTENT_TYPE)
    .and_then(|v| v.to_str().ok())
    .map(|s| s.split(';').next().unwrap_or(s).trim().to_ascii_lowercase())
    .unwrap_or_default();

  let image_type = match mime_raw.as_str() {
    "image/png" => ImageType::Png,
    "image/jpeg" | "image/jpg" => ImageType::Jpeg,
    "image/gif" => ImageType::Gif,
    other => {
      return Err(ToolError::reference_image(format!(
        "unsupported content-type {:?} for {}",
        other, url
      )))
    }
  };

  let bytes = response
    .bytes()
    .await
    .map_err(|e| ToolError::reference_image(format!("read body failed for {}: {:?}", url, e)))?;
  if bytes.len() > MAX_REFERENCE_IMAGE_BYTES {
    return Err(ToolError::reference_image(format!(
      "reference image is {} bytes (cap {}): {}",
      bytes.len(),
      MAX_REFERENCE_IMAGE_BYTES,
      url
    )));
  }

  tracing::info!("uploading reference image: {} bytes from {}", bytes.len(), url);

  let upload = upload_image_media_file_from_bytes(UploadImageBytesArgs {
    api_host,
    maybe_creds: Some(creds),
    image_bytes: bytes.to_vec(),
    image_type,
    is_intermediate_system_file: true,
    maybe_generation_provider: None,
  })
  .await
  .map_err(|e| ToolError::backend(format!("media upload failed: {:?}", e)))?;

  if !upload.success {
    return Err(ToolError::backend("media upload returned success=false"));
  }
  Ok(upload.media_file_token)
}

fn resolve_model(raw: Option<&str>) -> Result<CommonImageModel, ToolError> {
  match raw.map(str::trim).filter(|s| !s.is_empty()) {
    None => Ok(DEFAULT_MODEL),
    Some(s) => parse_enum::<CommonImageModel>("model", s),
  }
}

fn parse_optional_enum<T: serde::de::DeserializeOwned>(
  field: &str,
  raw: Option<&str>,
) -> Result<Option<T>, ToolError> {
  match raw.map(str::trim).filter(|s| !s.is_empty()) {
    None => Ok(None),
    Some(s) => parse_enum::<T>(field, s).map(Some),
  }
}

fn parse_enum<T: serde::de::DeserializeOwned>(field: &str, raw: &str) -> Result<T, ToolError> {
  serde_json::from_value::<T>(serde_json::Value::String(raw.to_string())).map_err(|_| {
    ToolError::invalid_params(format!(
      "invalid {}: {}. Call list_image_models for valid values.",
      field, raw
    ))
  })
}
