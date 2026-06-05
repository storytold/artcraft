use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::kling_2_1_master::request::ArtcraftKling21MasterRequestState;

#[derive(Clone, Debug)]
pub struct ArtcraftKling21MasterCostState {
  pub is_ten_seconds: bool,
}

impl ArtcraftKling21MasterCostState {
  pub fn from_request(request: &ArtcraftKling21MasterRequestState) -> Self {
    Self { is_ten_seconds: request.request.duration_seconds == Some(10) }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors fal_client kling_v2p1_master: 5s = $1.40, 10s = $2.80.
    let cost_in_usd_cents: u64 = if self.is_ten_seconds { 280 } else { 140 };

    VideoGenerationCostEstimate {
      cost_in_credits: Some(cost_in_usd_cents),
      cost_in_usd_cents: Some(cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use tokens::tokens::media_files::MediaFileToken;

  fn cost_cents(duration_seconds: Option<u16>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Kling21Master,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      start_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_x".to_string()))),
      duration_seconds,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn five_seconds_is_140() { assert_eq!(cost_cents(Some(5)), 140); }

  #[test]
  fn ten_seconds_is_280() { assert_eq!(cost_cents(Some(10)), 280); }

  #[test]
  fn default_duration_is_5s_priced_at_140() { assert_eq!(cost_cents(None), 140); }
}
