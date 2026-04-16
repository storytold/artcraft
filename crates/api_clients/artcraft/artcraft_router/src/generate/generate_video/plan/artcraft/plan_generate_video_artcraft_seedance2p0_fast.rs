use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::{
  PlanArtcraftSeedance2p0, plan_generate_video_artcraft_seedance2p0,
};
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;

/// Plan for Seedance 2.0 Fast via Artcraft provider.
///
/// Uses the same plan structure as Seedance 2.0 Pro (same resolution, duration,
/// batch count, and media reference handling). The only difference is the
/// variant used at execution time.
pub fn plan_generate_video_artcraft_seedance2p0_fast<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  // Reuse the Pro plan builder — it produces a PlanArtcraftSeedance2p0.
  let pro_plan = plan_generate_video_artcraft_seedance2p0(request)?;

  // Extract the inner plan struct and re-wrap in the Fast variant.
  match pro_plan {
    VideoGenerationPlan::ArtcraftSeedance2p0(plan) => {
      Ok(VideoGenerationPlan::ArtcraftSeedance2p0Fast(plan))
    }
    _ => unreachable!("plan_generate_video_artcraft_seedance2p0 always returns ArtcraftSeedance2p0"),
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::errors::artcraft_router_error::ArtcraftRouterError;
  use crate::errors::client_error::ClientError;
  use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
  use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
  use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
    Seedance2p0AspectRatio, Seedance2p0BatchCount,
  };

  fn base_request() -> GenerateVideoRequest<'static> {
    GenerateVideoRequest {
      model: CommonVideoModel::Seedance2p0Fast,
      provider: Provider::Artcraft,
      prompt: Some("a cat in space"),
      negative_prompt: None,
      start_frame: None,
      end_frame: None,
      reference_images: None,
      reference_videos: None,
      reference_audio: None,
      reference_character_tokens: None,
      resolution: None,
      aspect_ratio: None,
      duration_seconds: None,
      video_batch_count: None,
      generate_audio: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      idempotency_token: None,
    }
  }

  #[test]
  fn produces_fast_variant() {
    let req = base_request();
    let plan = req.build().unwrap();
    assert!(matches!(plan, VideoGenerationPlan::ArtcraftSeedance2p0Fast(_)));
  }

  #[test]
  fn prompt_is_passed_through() {
    let req = base_request();
    let plan = req.build().unwrap();
    if let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan {
      assert_eq!(p.prompt, Some("a cat in space"));
    } else { panic!("wrong variant"); }
  }

  #[test]
  fn aspect_ratio_16x9() {
    let req = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      ..base_request()
    };
    let plan = req.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert!(matches!(p.aspect_ratio, Some(Seedance2p0AspectRatio::Landscape16x9)));
  }

  #[test]
  fn aspect_ratio_9x16() {
    let req = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
      ..base_request()
    };
    let plan = req.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert!(matches!(p.aspect_ratio, Some(Seedance2p0AspectRatio::Portrait9x16)));
  }

  #[test]
  fn aspect_ratio_square() {
    let req = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::Square),
      ..base_request()
    };
    let plan = req.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert!(matches!(p.aspect_ratio, Some(Seedance2p0AspectRatio::Square1x1)));
  }

  #[test]
  fn batch_count_defaults_to_one() {
    let req = base_request();
    let plan = req.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert!(matches!(p.batch_count, Seedance2p0BatchCount::One));
  }

  #[test]
  fn batch_count_2() {
    let req = GenerateVideoRequest { video_batch_count: Some(2), ..base_request() };
    let plan = req.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert!(matches!(p.batch_count, Seedance2p0BatchCount::Two));
  }

  #[test]
  fn batch_count_4() {
    let req = GenerateVideoRequest { video_batch_count: Some(4), ..base_request() };
    let plan = req.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert!(matches!(p.batch_count, Seedance2p0BatchCount::Four));
  }

  #[test]
  fn duration_in_range() {
    let req = GenerateVideoRequest { duration_seconds: Some(10), ..base_request() };
    let plan = req.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert_eq!(p.duration_seconds, Some(10));
  }

  #[test]
  fn duration_clamped_to_max() {
    let req = GenerateVideoRequest { duration_seconds: Some(99), ..base_request() };
    let plan = req.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert_eq!(p.duration_seconds, Some(15));
  }

  #[test]
  fn url_image_ref_returns_error() {
    let req = GenerateVideoRequest {
      start_frame: Some(ImageRef::Url("https://example.com/image.jpg")),
      ..base_request()
    };
    assert!(matches!(
      req.build(),
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }
}
