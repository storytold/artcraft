use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::object::http_hunyuan3d_v3_sketch_to_3d::{hunyuan3d_v3_sketch_to_3d, Hunyuan3dV3SketchTo3dInput};

use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueHunyuan3dV3SketchTo3dArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub face_count: Option<u32>,
  pub generate_type: Option<EnqueueHunyuan3dV3SketchTo3dGenerateType>,
  pub polygon_type: Option<EnqueueHunyuan3dV3SketchTo3dPolygonType>,
  pub enable_pbr: Option<bool>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueHunyuan3dV3SketchTo3dGenerateType {
  Normal,
  LowPoly,
  Geometry,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueHunyuan3dV3SketchTo3dPolygonType {
  Triangle,
  Quadrilateral,
}

impl <R: IntoUrl> FalRequestCostCalculator for EnqueueHunyuan3dV3SketchTo3dArgs<'_, R> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Generation types: Normal costs $0.375,
    // LowPoly costs $0.45,
    // Geometry costs $0.225.
    // Enabling PBR materials adds $0.15.
    // Custom face count adds $0.15.
    let mut cost = match self.generate_type {
      None => 38, // Round up from $0.375
      Some(EnqueueHunyuan3dV3SketchTo3dGenerateType::Normal) => 38, // Round up
      Some(EnqueueHunyuan3dV3SketchTo3dGenerateType::Geometry) => 23, // Round up
      Some(EnqueueHunyuan3dV3SketchTo3dGenerateType::LowPoly) => 45,
    };
    if self.enable_pbr.unwrap_or(false) {
      cost += 15;
    }
    if self.face_count.is_some() {
      cost += 15;
    }
    cost
  }
}


/// Hunyuan3D V3 Sketch-to-3D
/// https://fal.ai/models/fal-ai/hunyuan3d-v3/sketch-to-3d
pub async fn enqueue_hunyuan3d_v3_sketch_to_3d_webhook<R: IntoUrl>(
  args: EnqueueHunyuan3dV3SketchTo3dArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let generate_type = args.generate_type
      .map(|t| match t {
        EnqueueHunyuan3dV3SketchTo3dGenerateType::Normal => "Normal",
        EnqueueHunyuan3dV3SketchTo3dGenerateType::LowPoly => "LowPoly",
        EnqueueHunyuan3dV3SketchTo3dGenerateType::Geometry => "Geometry",
      })
      .map(|s| s.to_string());

  let polygon_type = args.polygon_type
      .map(|t| match t {
        EnqueueHunyuan3dV3SketchTo3dPolygonType::Triangle => "triangle",
        EnqueueHunyuan3dV3SketchTo3dPolygonType::Quadrilateral => "quadrilateral",
      })
      .map(|s| s.to_string());

  let request = Hunyuan3dV3SketchTo3dInput {
    prompt: args.prompt,
    input_image_url: args.image_url,
    // Optionals
    face_count: args.face_count,
    generate_type,
    polygon_type,
    enable_pbr: args.enable_pbr,
  };

  let result = hunyuan3d_v3_sketch_to_3d(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::object::enqueue_hunyuan3d_v3_sketch_to_3d_webhook::{enqueue_hunyuan3d_v3_sketch_to_3d_webhook, EnqueueHunyuan3dV3SketchTo3dArgs};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::ERNEST_SCARED_STUPID_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueHunyuan3dV3SketchTo3dArgs {
      prompt: "A cute robot".to_string(),
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      face_count: None,
      generate_type: None,
      polygon_type: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
      enable_pbr: None,
    };

    let result = enqueue_hunyuan3d_v3_sketch_to_3d_webhook(args).await?;

    Ok(())
  }
}
