use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_video::providers::fal::veo_3p1_fast::request::{
  FalVeo3p1FastMode, FalVeo3p1FastRequestState,
};
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

#[derive(Clone, Debug)]
pub struct FalVeo3p1FastCostState {
  pub cost_in_usd_cents: u64,
}

impl FalVeo3p1FastCostState {
  pub fn from_request(request: &FalVeo3p1FastRequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint
    // `FalRequestCostCalculator` implementations. The router state just
    // forwards the result so router cost ≡ fal_client cost by construction.
    let cost_in_usd_cents = match &request.mode {
      FalVeo3p1FastMode::TextToVideo(req) => req.calculate_cost_in_cents(),
      FalVeo3p1FastMode::ImageToVideo(req) => req.calculate_cost_in_cents(),
      FalVeo3p1FastMode::FirstLastFrameToVideo(req) => req.calculate_cost_in_cents(),
      FalVeo3p1FastMode::ReferenceToVideo(req) => req.calculate_cost_in_cents(),
      FalVeo3p1FastMode::ExtendVideo(req) => req.calculate_cost_in_cents(),
    };
    Self { cost_in_usd_cents }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    VideoGenerationCostEstimate {
      cost_in_credits: Some(self.cost_in_usd_cents),
      cost_in_usd_cents: Some(self.cost_in_usd_cents),
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
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::video_list_ref::VideoListRef;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::fal::veo_3p1_fast::build::build_fal_veo_3p1_fast_state;

  use super::*;

  // Veo 3.1 Fast pricing:
  //   720p / 1080p: $0.10/sec (audio off), $0.15/sec (audio on)
  //   4k:           $0.30/sec (audio off), $0.35/sec (audio on)
  // Extend-video has no 4k tier and defaults to 7s.

  #[derive(Clone, Copy)]
  enum Modality {
    TextToVideo,
    ImageToVideo,
    FirstLastFrame,
    Reference,
    Extend,
  }

  mod text_to_video {
    use super::*;

    #[test]
    fn t2v_4s_audio_on_is_60() {
      assert_eq!(cost_cents(Modality::TextToVideo, Some(4), None, Some(true)), 60);
    }

    #[test]
    fn t2v_6s_audio_on_is_90() {
      assert_eq!(cost_cents(Modality::TextToVideo, Some(6), None, Some(true)), 90);
    }

    #[test]
    fn t2v_8s_audio_on_is_120() {
      assert_eq!(cost_cents(Modality::TextToVideo, Some(8), None, Some(true)), 120);
    }

    #[test]
    fn t2v_4s_audio_off_is_40() {
      assert_eq!(cost_cents(Modality::TextToVideo, Some(4), None, Some(false)), 40);
    }

    #[test]
    fn t2v_8s_audio_off_is_80() {
      assert_eq!(cost_cents(Modality::TextToVideo, Some(8), None, Some(false)), 80);
    }

    #[test]
    fn t2v_8s_audio_on_4k_is_280() {
      assert_eq!(cost_cents(Modality::TextToVideo, Some(8), Some(RouterResolution::FourK), Some(true)), 280);
    }

    #[test]
    fn t2v_8s_audio_off_4k_is_240() {
      assert_eq!(cost_cents(Modality::TextToVideo, Some(8), Some(RouterResolution::FourK), Some(false)), 240);
    }

    #[test]
    fn t2v_defaults_are_8s_720p_audio_on_120() {
      // duration=None→8s, resolution=None→720p, audio=None→on.
      assert_eq!(cost_cents(Modality::TextToVideo, None, None, None), 120);
    }

    #[test]
    fn t2v_1080p_bills_same_as_720p() {
      assert_eq!(
        cost_cents(Modality::TextToVideo, Some(8), Some(RouterResolution::TenEightyP), Some(true)),
        cost_cents(Modality::TextToVideo, Some(8), Some(RouterResolution::SevenTwentyP), Some(true)),
      );
    }
  }

  mod image_to_video {
    use super::*;

    #[test]
    fn i2v_6s_audio_on_is_90() {
      assert_eq!(cost_cents(Modality::ImageToVideo, Some(6), None, Some(true)), 90);
    }

    #[test]
    fn i2v_8s_audio_off_1080p_is_80() {
      assert_eq!(cost_cents(Modality::ImageToVideo, Some(8), Some(RouterResolution::TenEightyP), Some(false)), 80);
    }
  }

  mod first_last_frame_to_video {
    use super::*;

    #[test]
    fn flf_6s_audio_on_is_90() {
      assert_eq!(cost_cents(Modality::FirstLastFrame, Some(6), None, Some(true)), 90);
    }

    #[test]
    fn flf_8s_audio_on_4k_is_280() {
      assert_eq!(cost_cents(Modality::FirstLastFrame, Some(8), Some(RouterResolution::FourK), Some(true)), 280);
    }
  }

  mod reference_to_video {
    use super::*;

    #[test]
    fn reference_8s_audio_on_1080p_is_120() {
      assert_eq!(cost_cents(Modality::Reference, Some(8), Some(RouterResolution::TenEightyP), Some(true)), 120);
    }

    #[test]
    fn reference_4s_audio_off_720p_is_40() {
      assert_eq!(cost_cents(Modality::Reference, Some(4), Some(RouterResolution::SevenTwentyP), Some(false)), 40);
    }
  }

  mod extend_video {
    use super::*;

    #[test]
    fn extend_7s_audio_on_is_105() {
      assert_eq!(cost_cents(Modality::Extend, Some(7), None, Some(true)), 105);
    }

    #[test]
    fn extend_7s_audio_off_is_70() {
      assert_eq!(cost_cents(Modality::Extend, Some(7), None, Some(false)), 70);
    }

    #[test]
    fn extend_8s_audio_on_is_120() {
      assert_eq!(cost_cents(Modality::Extend, Some(8), None, Some(true)), 120);
    }

    #[test]
    fn extend_defaults_are_7s_audio_on_105() {
      // duration=None→7s (fal's extend default), audio=None→on.
      assert_eq!(cost_cents(Modality::Extend, None, None, None), 105);
    }
  }

  #[test]
  fn t2v_i2v_flf_and_reference_price_identically() {
    let expected = cost_cents(Modality::TextToVideo, Some(6), Some(RouterResolution::TenEightyP), Some(true));
    for modality in [Modality::ImageToVideo, Modality::FirstLastFrame, Modality::Reference] {
      assert_eq!(cost_cents(modality, Some(6), Some(RouterResolution::TenEightyP), Some(true)), expected);
    }
  }

  #[test]
  fn audio_costs_more_than_no_audio() {
    assert!(
      cost_cents(Modality::TextToVideo, Some(8), None, Some(false))
        < cost_cents(Modality::TextToVideo, Some(8), None, Some(true))
    );
  }

  fn cost_cents(
    modality: Modality,
    duration_seconds: Option<u16>,
    resolution: Option<RouterResolution>,
    generate_audio: Option<bool>,
  ) -> u64 {
    let mut b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3p1Fast,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      generate_audio,
      ..Default::default()
    };
    match modality {
      Modality::TextToVideo => {}
      Modality::ImageToVideo => {
        b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
      }
      Modality::FirstLastFrame => {
        b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
        b.end_frame = Some(ImageRef::Url("https://example.com/b.png".to_string()));
      }
      Modality::Reference => {
        b.reference_images = Some(ImageListRef::Urls(vec!["https://example.com/ref.png".to_string()]));
      }
      Modality::Extend => {
        b.reference_videos = Some(VideoListRef::Urls(vec!["https://example.com/in.mp4".to_string()]));
      }
    }
    let state = build_fal_veo_3p1_fast_state(b).expect("build state");
    FalVeo3p1FastCostState::from_request(&state)
      .estimate_cost()
      .cost_in_usd_cents
      .expect("cost")
  }
}
