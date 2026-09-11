use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::splat::image::triposplat_image_to_splat::raw_request::{
  TripoSplatImageToSplatInput, TripoSplatImageToSplatOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// TripoSplat image-to-Gaussian-splat: reconstructs a 3D Gaussian splat from
/// a single input image.
#[derive(Clone, Debug)]
pub struct TripoSplatImageToSplatRequest {
  /// URL of the input image (required).
  pub image_url: String,

  /// Number of Gaussians to generate. Range 32768-262144;
  /// fal's default is 262144 when `None`.
  pub num_gaussians: Option<u32>,

  /// Number of inference steps. Range 1-50; fal's default is 20 when `None`.
  pub num_inference_steps: Option<u32>,

  /// Guidance scale. Range 0-10; fal's default is 3 when `None`.
  pub guidance_scale: Option<f32>,

  /// Output file format. fal's default is `Ply` when `None`.
  pub output_format: Option<TripoSplatOutputFormat>,

  /// Seed for reproducibility. fal picks a random seed when `None`.
  pub seed: Option<i64>,

  /// fal's default is true when `None`.
  pub enable_safety_checker: Option<bool>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum TripoSplatOutputFormat {
  Ply,
  Splat,
}

impl TripoSplatOutputFormat {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::Ply => "ply",
      Self::Splat => "splat",
    }
  }
}

impl FalEndpoint for TripoSplatImageToSplatRequest {
  const ENDPOINT: &str = "tripo3d/triposplat";

  type RawRequest = TripoSplatImageToSplatInput;
  type RawResponse = TripoSplatImageToSplatOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      image_url: self.image_url.clone(),
      num_gaussians: self.num_gaussians,
      num_inference_steps: self.num_inference_steps,
      guidance_scale: self.guidance_scale,
      output_format: self.output_format.map(|f| f.to_str().to_string()),
      seed: self.seed,
      enable_safety_checker: self.enable_safety_checker,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::traits::fal_endpoint_trait::FalEndpoint;
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::ERNEST_SCARED_STUPID_IMAGE_URL;

  mod serialization_tests {
    use super::*;

    #[test]
    fn minimal_request_serializes_image_url_only() {
      let raw = base_request().to_raw_request().expect("to_raw_request");
      let json = serde_json::to_value(&raw).unwrap();
      let obj = json.as_object().unwrap();
      assert_eq!(obj.len(), 1, "only image_url should serialize: {json}");
      assert_eq!(json["image_url"], "https://example.com/input.png");
    }

    #[test]
    fn output_format_wire_values() {
      assert_eq!(TripoSplatOutputFormat::Ply.to_str(), "ply");
      assert_eq!(TripoSplatOutputFormat::Splat.to_str(), "splat");
    }

    #[test]
    fn full_request_serializes_all_fields() {
      let request = TripoSplatImageToSplatRequest {
        num_gaussians: Some(131_072),
        num_inference_steps: Some(30),
        guidance_scale: Some(5.0),
        output_format: Some(TripoSplatOutputFormat::Ply),
        seed: Some(42),
        enable_safety_checker: Some(false),
        ..base_request()
      };
      let raw = request.to_raw_request().expect("to_raw_request");
      let json = serde_json::to_value(&raw).unwrap();
      assert_eq!(json["num_gaussians"], 131_072);
      assert_eq!(json["num_inference_steps"], 30);
      assert_eq!(json["guidance_scale"], 5.0);
      assert_eq!(json["output_format"], "ply");
      assert_eq!(json["seed"], 42);
      assert_eq!(json["enable_safety_checker"], false);
    }
  }

  // ── Helpers ──

  fn base_request() -> TripoSplatImageToSplatRequest {
    TripoSplatImageToSplatRequest {
      image_url: "https://example.com/input.png".to_string(),
      num_gaussians: None,
      num_inference_steps: None,
      guidance_scale: None,
      output_format: None,
      seed: None,
      enable_safety_checker: None,
    }
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_splat_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = TripoSplatImageToSplatRequest {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ..base_request()
    };
    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_splat_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = TripoSplatImageToSplatRequest {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ..base_request()
    };
    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }
}
