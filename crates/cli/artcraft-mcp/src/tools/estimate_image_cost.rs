use anyhow::{anyhow, Result};
use serde::Deserialize;
use serde_json::{json, Value};

use artcraft_api_defs::generate::cost_estimate::estimate_image_cost::{
  EstimateImageCostRequest, GenerationMode,
};
use artcraft_client::endpoints::generate::cost_estimate::image::estimate_image_cost::estimate_image_cost;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_image_model::CommonImageModel;
use enums::common::generation::common_quality::CommonQuality;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation_provider::GenerationProvider;

use crate::creds::load_session;

#[derive(Debug, Deserialize, rmcp::schemars::JsonSchema)]
pub struct Args {
  /// Model id (snake_case). Call list_image_models for valid ids.
  pub model: String,

  /// Number of reference images. 0 (default) → text_to_image; >0 →
  /// image_edit with that many input images.
  #[serde(default)]
  pub num_reference_images: Option<u32>,

  /// Optional aspect ratio (snake_case). See model's aspect_ratio_options.
  #[serde(default)]
  pub aspect_ratio: Option<String>,

  /// Optional resolution (snake_case). See model's resolution_options.
  #[serde(default)]
  pub resolution: Option<String>,

  /// Optional quality preset (snake_case). See model's quality_options.
  #[serde(default)]
  pub quality: Option<String>,

  /// Number of images per generation. Defaults to 1.
  #[serde(default)]
  pub num_images: Option<u16>,
}

pub async fn run(args: Args) -> Result<Value> {
  let (api_host, creds) = load_session()?;

  let model = parse_enum::<CommonImageModel>("model", &args.model)?;
  let aspect_ratio = parse_optional_enum::<CommonAspectRatio>("aspect_ratio", args.aspect_ratio.as_deref())?;
  let resolution = parse_optional_enum::<CommonResolution>("resolution", args.resolution.as_deref())?;
  let quality = parse_optional_enum::<CommonQuality>("quality", args.quality.as_deref())?;

  let generation_mode = match args.num_reference_images.unwrap_or(0) {
    0 => GenerationMode::TextToImage,
    n => GenerationMode::ImageEdit { count: n },
  };

  let request = EstimateImageCostRequest {
    model,
    provider: GenerationProvider::Artcraft,
    generation_mode,
    aspect_ratio,
    resolution,
    quality,
    image_batch_count: args.num_images,
  };

  let response = estimate_image_cost(&api_host, Some(&creds), request)
    .await
    .map_err(|e| anyhow!("cost estimate failed: {:?}", e))?;

  Ok(json!({
    "cost_in_credits": response.cost_in_credits,
    "cost_in_usd_cents": response.cost_in_usd_cents,
    "is_free": response.is_free,
    "is_unlimited": response.is_unlimited,
    "is_rate_limited": response.is_rate_limited,
    "has_watermark": response.has_watermark,
  }))
}

fn parse_enum<T: serde::de::DeserializeOwned>(field: &str, raw: &str) -> Result<T> {
  serde_json::from_value::<T>(serde_json::Value::String(raw.to_string()))
    .map_err(|_| anyhow!("invalid {}: {}. Call list_image_models for valid values.", field, raw))
}

fn parse_optional_enum<T: serde::de::DeserializeOwned>(
  field: &str,
  raw: Option<&str>,
) -> Result<Option<T>> {
  match raw.map(str::trim).filter(|s| !s.is_empty()) {
    None => Ok(None),
    Some(s) => parse_enum::<T>(field, s).map(Some),
  }
}
