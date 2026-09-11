use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::part::hunyuan_3d_3p1_part::raw_request::{
  Hunyuan3d3p1PartInput, Hunyuan3d3p1PartOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Hunyuan 3D v3.1 Part: splits an existing 3D mesh into semantically
/// meaningful parts (returned as a list of FBX files).
///
/// Input constraints: FBX only, max 100MB, face count ≤ 30,000. Designed for
/// AIGC-generated models.
#[derive(Clone, Debug)]
pub struct Hunyuan3d3p1PartRequest {
  /// URL of the input mesh file (FBX).
  pub input_file_url: String,
}

impl FalEndpoint for Hunyuan3d3p1PartRequest {
  const ENDPOINT: &str = "fal-ai/hunyuan-3d/v3.1/part";

  type RawRequest = Hunyuan3d3p1PartInput;
  type RawResponse = Hunyuan3d3p1PartOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      input_file_url: self.input_file_url.clone(),
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

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost; needs a real FBX URL
  async fn test_part_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = Hunyuan3d3p1PartRequest {
      input_file_url: "https://example.com/model.fbx".to_string(),
    };
    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost; needs a real FBX URL
  async fn test_part_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = Hunyuan3d3p1PartRequest {
      input_file_url: "https://example.com/model.fbx".to_string(),
    };
    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_is_just_input_file_url() {
    let request = Hunyuan3d3p1PartRequest {
      input_file_url: "https://example.com/model.fbx".to_string(),
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({ "input_file_url": "https://example.com/model.fbx" }),
    );
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Hunyuan3d3p1PartRequest::ENDPOINT, "fal-ai/hunyuan-3d/v3.1/part");
  }

  // NB: Pricing tests are in cost.rs
}
