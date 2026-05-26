use fal_client::requests::webhook::video::image::enqueue_seedance_1_lite_image_to_video_webhook::{
  Seedance1LiteAspectRatio, Seedance1LiteDuration, Seedance1LiteRequest, Seedance1LiteResolution,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::fal::seedance_1p0_lite::request::FalSeedance10LiteRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_fal_seedance_1p0_lite(
  mut builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let image_url = require_url(
    builder.start_frame.take(),
    "start_frame",
    "Seedance 1.0 Lite requires a starting frame",
  )?;
  let end_frame_image_url = optional_url(builder.end_frame.take())?;
  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let resolution = plan_resolution(builder.resolution.take(), strategy)?;
  let duration = plan_duration(builder.duration_seconds.take(), strategy)?;
  let prompt = builder.prompt.take().unwrap_or_default();

  let request = Seedance1LiteRequest {
    image_url,
    end_frame_image_url,
    prompt,
    duration,
    resolution,
    aspect_ratio,
    camera_fixed: false,
    seed: None,
  };

  let state = FalSeedance10LiteRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalSeedance10Lite(state)))
}

// ── Plan helpers (copies of v1 logic; kept in sync intentionally) ──

fn require_url(
  start_frame: Option<ImageRef>,
  field: &'static str,
  msg: &'static str,
) -> Result<String, ArtcraftRouterError> {
  match start_frame {
    Some(ImageRef::Url(url)) => Ok(url),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field,
        value: "Fal only supports image URLs, not media file tokens".to_string(),
      }))
    }
    None => Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field,
      value: msg.to_string(),
    })),
  }
}

fn optional_url(image_ref: Option<ImageRef>) -> Result<Option<String>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::Url(url)) => Ok(Some(url)),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "end_frame",
        value: "Fal only supports image URLs, not media file tokens".to_string(),
      }))
    }
  }
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Seedance1LiteAspectRatio>, ArtcraftRouterError> {
  use Seedance1LiteAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(Ar::Auto)),

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(Ar::Square)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(Ar::FourByThree)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(Ar::TwentyOneByNine)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(Ar::ThreeByFour)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Some(Ar::Auto)),
    },
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Seedance1LiteResolution, ArtcraftRouterError> {
  use Seedance1LiteResolution as R;
  match resolution {
    None => Ok(R::SevenTwentyP),
    Some(CommonResolution::FourEightyP) => Ok(R::FourEightyP),
    Some(CommonResolution::SevenTwentyP) => Ok(R::SevenTwentyP),
    Some(CommonResolution::TenEightyP) => Ok(R::TenEightyP),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(R::TenEightyP),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(R::FourEightyP),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Seedance1LiteDuration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(Seedance1LiteDuration::FiveSeconds),
    Some(5) => Ok(Seedance1LiteDuration::FiveSeconds),
    Some(10) => Ok(Seedance1LiteDuration::TenSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Seedance1LiteDuration::TenSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Seedance1LiteDuration::FiveSeconds),
    },
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

  use super::*;

  // ── Helpers ──

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance10Lite,
      provider: Provider::Fal,
      prompt: Some("a corgi running".to_string()),
      start_frame: Some(ImageRef::Url("https://example.com/start.png".to_string())),
      ..Default::default()
    }
  }

  fn make_builder(f: impl FnOnce(&mut GenerateVideoRequestBuilder)) -> GenerateVideoRequestBuilder {
    let mut b = base_builder();
    f(&mut b);
    b
  }

  fn unwrap_request(result: Result<VideoGenerationDraftOrRequest, ArtcraftRouterError>) -> Seedance1LiteRequest {
    match result.expect("build should succeed") {
      VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalSeedance10Lite(state)) => state.request,
      _ => panic!("expected FalSeedance10Lite request"),
    }
  }

  // ── Materialized field conversions ──

  mod materialized_field_conversions {
    use super::*;

    #[test]
    fn prompt_passed_through() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.prompt = Some("hi".to_string());
      })));
      assert_eq!(req.prompt, "hi");
    }

    #[test]
    fn prompt_defaults_to_empty() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| { b.prompt = None; })));
      assert_eq!(req.prompt, "");
    }

    #[test]
    fn start_frame_passed_through() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
      })));
      assert_eq!(req.image_url, "https://example.com/a.png");
    }

    #[test]
    fn end_frame_passed_through() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
      })));
      assert_eq!(req.end_frame_image_url.as_deref(), Some("https://example.com/end.png"));
    }

    #[test]
    fn end_frame_absent_is_none() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(base_builder()));
      assert!(req.end_frame_image_url.is_none());
    }

    #[test]
    fn camera_fixed_defaults_to_false() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(base_builder()));
      assert!(!req.camera_fixed);
    }

    #[test]
    fn seed_defaults_to_none() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(base_builder()));
      assert!(req.seed.is_none());
    }
  }

  // ── start_frame is required for 1.0 lite ──

  mod start_frame_required {
    use super::*;

    #[test]
    fn missing_start_frame_errors() {
      let result = build_fal_seedance_1p0_lite(make_builder(|b| { b.start_frame = None; }));
      assert!(result.is_err());
    }

    #[test]
    fn end_frame_alone_errors() {
      let result = build_fal_seedance_1p0_lite(make_builder(|b| {
        b.start_frame = None;
        b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
      }));
      assert!(result.is_err());
    }

    #[test]
    fn media_file_token_for_start_frame_errors() {
      let result = build_fal_seedance_1p0_lite(make_builder(|b| {
        b.start_frame = Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_x".to_string())));
      }));
      assert!(result.is_err());
    }

    #[test]
    fn media_file_token_for_end_frame_errors() {
      let result = build_fal_seedance_1p0_lite(make_builder(|b| {
        b.end_frame = Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_x".to_string())));
      }));
      assert!(result.is_err());
    }
  }

  // ── Resolution conversions ──

  mod resolution_conversions {
    use super::*;

    #[test]
    fn resolution_480p() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.resolution = Some(CommonResolution::FourEightyP);
      })));
      assert_eq!(req.resolution, Seedance1LiteResolution::FourEightyP);
    }

    #[test]
    fn resolution_720p() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.resolution = Some(CommonResolution::SevenTwentyP);
      })));
      assert_eq!(req.resolution, Seedance1LiteResolution::SevenTwentyP);
    }

    #[test]
    fn resolution_1080p() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.resolution = Some(CommonResolution::TenEightyP);
      })));
      assert_eq!(req.resolution, Seedance1LiteResolution::TenEightyP);
    }

    #[test]
    fn resolution_none_defaults_to_720p() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| { b.resolution = None; })));
      assert_eq!(req.resolution, Seedance1LiteResolution::SevenTwentyP);
    }

    #[test]
    fn unsupported_resolution_errors_with_error_out() {
      let result = build_fal_seedance_1p0_lite(make_builder(|b| {
        b.resolution = Some(CommonResolution::FourK);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      }));
      assert!(result.is_err());
    }

    #[test]
    fn unsupported_resolution_upgrades_with_pay_more() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.resolution = Some(CommonResolution::FourK);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      })));
      assert_eq!(req.resolution, Seedance1LiteResolution::TenEightyP);
    }

    #[test]
    fn unsupported_resolution_downgrades_with_pay_less() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.resolution = Some(CommonResolution::FourK);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayLessDowngrade;
      })));
      assert_eq!(req.resolution, Seedance1LiteResolution::FourEightyP);
    }
  }

  // ── Duration conversions ──

  mod duration_conversions {
    use super::*;

    #[test]
    fn duration_5s() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| { b.duration_seconds = Some(5); })));
      assert_eq!(req.duration, Seedance1LiteDuration::FiveSeconds);
    }

    #[test]
    fn duration_10s() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| { b.duration_seconds = Some(10); })));
      assert_eq!(req.duration, Seedance1LiteDuration::TenSeconds);
    }

    #[test]
    fn duration_none_defaults_to_5s() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| { b.duration_seconds = None; })));
      assert_eq!(req.duration, Seedance1LiteDuration::FiveSeconds);
    }

    #[test]
    fn unsupported_duration_errors_with_error_out() {
      let result = build_fal_seedance_1p0_lite(make_builder(|b| {
        b.duration_seconds = Some(7);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      }));
      assert!(result.is_err());
    }

    #[test]
    fn unsupported_duration_upgrades_with_pay_more() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.duration_seconds = Some(8);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      })));
      assert_eq!(req.duration, Seedance1LiteDuration::TenSeconds);
    }

    #[test]
    fn unsupported_duration_downgrades_with_pay_less() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.duration_seconds = Some(8);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayLessDowngrade;
      })));
      assert_eq!(req.duration, Seedance1LiteDuration::FiveSeconds);
    }
  }

  // ── Aspect ratio conversions ──

  mod aspect_ratio_conversions {
    use super::*;

    #[test]
    fn auto() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.aspect_ratio = Some(CommonAspectRatio::Auto);
      })));
      assert!(matches!(req.aspect_ratio, Some(Seedance1LiteAspectRatio::Auto)));
    }

    #[test]
    fn square() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.aspect_ratio = Some(CommonAspectRatio::Square);
      })));
      assert!(matches!(req.aspect_ratio, Some(Seedance1LiteAspectRatio::Square)));
    }

    #[test]
    fn sixteen_by_nine() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.aspect_ratio = Some(CommonAspectRatio::WideSixteenByNine);
      })));
      assert!(matches!(req.aspect_ratio, Some(Seedance1LiteAspectRatio::SixteenByNine)));
    }

    #[test]
    fn nine_by_sixteen() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.aspect_ratio = Some(CommonAspectRatio::TallNineBySixteen);
      })));
      assert!(matches!(req.aspect_ratio, Some(Seedance1LiteAspectRatio::NineBySixteen)));
    }

    #[test]
    fn twenty_one_by_nine() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.aspect_ratio = Some(CommonAspectRatio::WideTwentyOneByNine);
      })));
      assert!(matches!(req.aspect_ratio, Some(Seedance1LiteAspectRatio::TwentyOneByNine)));
    }

    #[test]
    fn four_by_three() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.aspect_ratio = Some(CommonAspectRatio::WideFourByThree);
      })));
      assert!(matches!(req.aspect_ratio, Some(Seedance1LiteAspectRatio::FourByThree)));
    }

    #[test]
    fn three_by_four() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.aspect_ratio = Some(CommonAspectRatio::TallThreeByFour);
      })));
      assert!(matches!(req.aspect_ratio, Some(Seedance1LiteAspectRatio::ThreeByFour)));
    }

    #[test]
    fn none() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| { b.aspect_ratio = None; })));
      assert!(req.aspect_ratio.is_none());
    }

    #[test]
    fn unsupported_aspect_ratio_errors_with_error_out() {
      let result = build_fal_seedance_1p0_lite(make_builder(|b| {
        b.aspect_ratio = Some(CommonAspectRatio::WideFiveByFour);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      }));
      assert!(result.is_err());
    }

    #[test]
    fn unsupported_aspect_ratio_falls_back_to_auto_with_pay_more() {
      let req = unwrap_request(build_fal_seedance_1p0_lite(make_builder(|b| {
        b.aspect_ratio = Some(CommonAspectRatio::WideFiveByFour);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      })));
      assert!(matches!(req.aspect_ratio, Some(Seedance1LiteAspectRatio::Auto)));
    }
  }

  // ── Full combinatorial pass ──

  #[test]
  fn full_combinatorial_pass() {
    let resolutions = [
      None,
      Some(CommonResolution::FourEightyP),
      Some(CommonResolution::SevenTwentyP),
      Some(CommonResolution::TenEightyP),
    ];
    let durations = [None, Some(5u16), Some(10u16)];
    let aspect_ratios = [
      None,
      Some(CommonAspectRatio::Auto),
      Some(CommonAspectRatio::Square),
      Some(CommonAspectRatio::WideFourByThree),
      Some(CommonAspectRatio::WideSixteenByNine),
      Some(CommonAspectRatio::WideTwentyOneByNine),
      Some(CommonAspectRatio::TallThreeByFour),
      Some(CommonAspectRatio::TallNineBySixteen),
    ];

    let mut combos = 0;
    for &res in &resolutions {
      for &dur in &durations {
        for &ar in &aspect_ratios {
          for has_end in [false, true] {
            let mut b = base_builder();
            b.resolution = res;
            b.duration_seconds = dur;
            b.aspect_ratio = ar;
            if has_end {
              b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
            }
            let result = build_fal_seedance_1p0_lite(b);
            assert!(result.is_ok(), "expected ok for res={:?} dur={:?} ar={:?} end={}", res, dur, ar, has_end);
            combos += 1;
          }
        }
      }
    }
    assert!(combos >= 192, "expected ≥192 combos, got {}", combos);
  }
}
