use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::image::hunyuan_3d_3p1_pro_image_to_mesh::raw_request::{
  Hunyuan3d3p1ProImageToMeshInput, Hunyuan3d3p1ProImageToMeshOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Hunyuan 3D v3.1 Pro image-to-3D.
///
/// v3.1 expands multi-view input to seven optional extra views (back, left,
/// right, top, bottom, left-front 45°, right-front 45°) and drops the v3
/// `LowPoly` generation type and `polygon_type` parameter.
#[derive(Clone, Debug)]
pub struct Hunyuan3d3p1ProImageToMeshRequest {
  /// URL of the front-view input image (required).
  pub image_url: String,

  /// Optional back-view image URL for multi-view generation.
  pub back_image_url: Option<String>,

  /// Optional left-view image URL for multi-view generation.
  pub left_image_url: Option<String>,

  /// Optional right-view image URL for multi-view generation.
  pub right_image_url: Option<String>,

  /// Optional top-view image URL (v3.1 exclusive).
  pub top_image_url: Option<String>,

  /// Optional bottom-view image URL (v3.1 exclusive).
  pub bottom_image_url: Option<String>,

  /// Optional left-front 45° image URL (v3.1 exclusive).
  pub left_front_image_url: Option<String>,

  /// Optional right-front 45° image URL (v3.1 exclusive).
  pub right_front_image_url: Option<String>,

  /// Generation type. fal's default is `Normal` when `None`.
  pub generate_type: Option<Hunyuan3d3p1ProImageToMeshGenerateType>,

  /// Target face count for the output mesh. Range 40000-1500000;
  /// fal's default is 500000 when `None`. Setting a custom value adds cost.
  pub face_count: Option<u32>,

  /// Whether to enable PBR (physically-based rendering) materials.
  /// fal's default is false when `None`. Enabling adds cost.
  pub enable_pbr: Option<bool>,
}

#[derive(Copy, Clone, Debug)]
pub enum Hunyuan3d3p1ProImageToMeshGenerateType {
  Normal,
  Geometry,
}

impl Hunyuan3d3p1ProImageToMeshRequest {
  /// True when any of the optional extra views is provided (billed as the
  /// multi-view add-on).
  pub fn uses_multi_view(&self) -> bool {
    self.back_image_url.is_some()
      || self.left_image_url.is_some()
      || self.right_image_url.is_some()
      || self.top_image_url.is_some()
      || self.bottom_image_url.is_some()
      || self.left_front_image_url.is_some()
      || self.right_front_image_url.is_some()
  }
}

impl FalEndpoint for Hunyuan3d3p1ProImageToMeshRequest {
  const ENDPOINT: &str = "fal-ai/hunyuan-3d/v3.1/pro/image-to-3d";

  type RawRequest = Hunyuan3d3p1ProImageToMeshInput;
  type RawResponse = Hunyuan3d3p1ProImageToMeshOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let generate_type = self.generate_type.map(|t| match t {
      Hunyuan3d3p1ProImageToMeshGenerateType::Normal => "Normal",
      Hunyuan3d3p1ProImageToMeshGenerateType::Geometry => "Geometry",
    }.to_string());

    Ok(Self::RawRequest {
      input_image_url: self.image_url.clone(),
      back_image_url: self.back_image_url.clone(),
      left_image_url: self.left_image_url.clone(),
      right_image_url: self.right_image_url.clone(),
      top_image_url: self.top_image_url.clone(),
      bottom_image_url: self.bottom_image_url.clone(),
      left_front_image_url: self.left_front_image_url.clone(),
      right_front_image_url: self.right_front_image_url.clone(),
      generate_type,
      face_count: self.face_count,
      enable_pbr: self.enable_pbr,
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

  fn base_request() -> Hunyuan3d3p1ProImageToMeshRequest {
    Hunyuan3d3p1ProImageToMeshRequest {
      image_url: "https://example.com/front.jpg".to_string(),
      back_image_url: None,
      left_image_url: None,
      right_image_url: None,
      top_image_url: None,
      bottom_image_url: None,
      left_front_image_url: None,
      right_front_image_url: None,
      generate_type: None,
      face_count: None,
      enable_pbr: None,
    }
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_mesh_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = Hunyuan3d3p1ProImageToMeshRequest {
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
  async fn test_image_to_mesh_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = Hunyuan3d3p1ProImageToMeshRequest {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ..base_request()
    };
    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = Hunyuan3d3p1ProImageToMeshRequest {
      image_url: "https://example.com/front.jpg".to_string(),
      back_image_url: Some("https://example.com/back.jpg".to_string()),
      left_image_url: Some("https://example.com/left.jpg".to_string()),
      right_image_url: Some("https://example.com/right.jpg".to_string()),
      top_image_url: Some("https://example.com/top.jpg".to_string()),
      bottom_image_url: Some("https://example.com/bottom.jpg".to_string()),
      left_front_image_url: Some("https://example.com/lf.jpg".to_string()),
      right_front_image_url: Some("https://example.com/rf.jpg".to_string()),
      generate_type: Some(Hunyuan3d3p1ProImageToMeshGenerateType::Geometry),
      face_count: Some(100_000),
      enable_pbr: Some(true),
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({
        "input_image_url": "https://example.com/front.jpg",
        "back_image_url": "https://example.com/back.jpg",
        "left_image_url": "https://example.com/left.jpg",
        "right_image_url": "https://example.com/right.jpg",
        "top_image_url": "https://example.com/top.jpg",
        "bottom_image_url": "https://example.com/bottom.jpg",
        "left_front_image_url": "https://example.com/lf.jpg",
        "right_front_image_url": "https://example.com/rf.jpg",
        "generate_type": "Geometry",
        "face_count": 100_000,
        "enable_pbr": true,
      }),
    );
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let json = serde_json::to_value(base_request().to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({ "input_image_url": "https://example.com/front.jpg" }),
    );
  }

  #[test]
  fn uses_multi_view_detects_every_extra_view() {
    assert!(!base_request().uses_multi_view());
    let setters: Vec<fn(&mut Hunyuan3d3p1ProImageToMeshRequest)> = vec![
      |r| r.back_image_url = Some("u".to_string()),
      |r| r.left_image_url = Some("u".to_string()),
      |r| r.right_image_url = Some("u".to_string()),
      |r| r.top_image_url = Some("u".to_string()),
      |r| r.bottom_image_url = Some("u".to_string()),
      |r| r.left_front_image_url = Some("u".to_string()),
      |r| r.right_front_image_url = Some("u".to_string()),
    ];
    for set in setters {
      let mut req = base_request();
      set(&mut req);
      assert!(req.uses_multi_view());
    }
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Hunyuan3d3p1ProImageToMeshRequest::ENDPOINT,
      "fal-ai/hunyuan-3d/v3.1/pro/image-to-3d",
    );
  }

  // NB: Pricing tests are in cost.rs
}
