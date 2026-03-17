use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::multi_function::kling_3p0_standard_multi_function_video_gen::{
  Kling3p0StandardMultiFunctionVideoGenAspectRatio,
  Kling3p0StandardMultiFunctionVideoGenDuration,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftKling3p0Standard<'a> {
  pub prompt: Option<&'a str>,
  pub negative_prompt: Option<&'a str>,
  pub start_frame: Option<&'a MediaFileToken>,
  pub end_frame: Option<&'a MediaFileToken>,
  pub aspect_ratio: Option<Kling3p0StandardMultiFunctionVideoGenAspectRatio>,
  pub duration: Option<Kling3p0StandardMultiFunctionVideoGenDuration>,
  pub generate_audio: Option<bool>,
  pub idempotency_token: String,
}

pub fn plan_generate_video_artcraft_kling3p0_standard<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame = resolve_image_ref(request.start_frame)?;
  let end_frame = resolve_image_ref(request.end_frame)?;

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::ArtcraftKling3p0Standard(PlanArtcraftKling3p0Standard {
    prompt: request.prompt,
    negative_prompt: request.negative_prompt,
    start_frame,
    end_frame,
    aspect_ratio,
    duration,
    generate_audio: request.generate_audio,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

fn resolve_image_ref<'a>(
  image_ref: Option<ImageRef<'a>>,
) -> Result<Option<&'a MediaFileToken>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::MediaFileToken(t)) => Ok(Some(t)),
    Some(ImageRef::Url(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

// Kling 3.0 Standard supports: Square (1:1), SixteenByNine (16:9), NineBySixteen (9:16)
fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Kling3p0StandardMultiFunctionVideoGenAspectRatio>, ArtcraftRouterError> {
  match aspect_ratio {
    None => Ok(None),

    // Direct mappings
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Ok(Some(Kling3p0StandardMultiFunctionVideoGenAspectRatio::SixteenByNine))
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Ok(Some(Kling3p0StandardMultiFunctionVideoGenAspectRatio::NineBySixteen))
    }
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => {
      Ok(Some(Kling3p0StandardMultiFunctionVideoGenAspectRatio::Square))
    }

    // Auto defaults to 16:9
    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => {
      Ok(Some(Kling3p0StandardMultiFunctionVideoGenAspectRatio::SixteenByNine))
    }

    // Mismatches
    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(nearest_aspect_ratio(unsupported)))
      }
    },
  }
}

fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> Kling3p0StandardMultiFunctionVideoGenAspectRatio {
  match aspect_ratio {
    // Wide-ish → 16:9
    CommonAspectRatio::WideFourByThree
    | CommonAspectRatio::WideFiveByFour
    | CommonAspectRatio::WideThreeByTwo
    | CommonAspectRatio::WideTwentyOneByNine => Kling3p0StandardMultiFunctionVideoGenAspectRatio::SixteenByNine,
    // Tall-ish → 9:16
    CommonAspectRatio::TallThreeByFour
    | CommonAspectRatio::TallFourByFive
    | CommonAspectRatio::TallTwoByThree
    | CommonAspectRatio::TallNineByTwentyOne => Kling3p0StandardMultiFunctionVideoGenAspectRatio::NineBySixteen,
    // Fallback
    _ => Kling3p0StandardMultiFunctionVideoGenAspectRatio::Square,
  }
}

// Kling 3.0 Standard supports durations of 3–15 seconds.
fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Kling3p0StandardMultiFunctionVideoGenDuration>, ArtcraftRouterError> {
  const MIN: u16 = 3;
  const MAX: u16 = 15;
  match duration_seconds {
    None => Ok(None),
    Some(d) if d >= MIN && d <= MAX => Ok(Some(seconds_to_duration(d))),
    Some(d) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", d),
        }))
      }
      _ => Ok(Some(seconds_to_duration(d.clamp(MIN, MAX)))),
    },
  }
}

fn seconds_to_duration(seconds: u16) -> Kling3p0StandardMultiFunctionVideoGenDuration {
  match seconds {
    3 => Kling3p0StandardMultiFunctionVideoGenDuration::ThreeSeconds,
    4 => Kling3p0StandardMultiFunctionVideoGenDuration::FourSeconds,
    5 => Kling3p0StandardMultiFunctionVideoGenDuration::FiveSeconds,
    6 => Kling3p0StandardMultiFunctionVideoGenDuration::SixSeconds,
    7 => Kling3p0StandardMultiFunctionVideoGenDuration::SevenSeconds,
    8 => Kling3p0StandardMultiFunctionVideoGenDuration::EightSeconds,
    9 => Kling3p0StandardMultiFunctionVideoGenDuration::NineSeconds,
    10 => Kling3p0StandardMultiFunctionVideoGenDuration::TenSeconds,
    11 => Kling3p0StandardMultiFunctionVideoGenDuration::ElevenSeconds,
    12 => Kling3p0StandardMultiFunctionVideoGenDuration::TwelveSeconds,
    13 => Kling3p0StandardMultiFunctionVideoGenDuration::ThirteenSeconds,
    14 => Kling3p0StandardMultiFunctionVideoGenDuration::FourteenSeconds,
    _ => Kling3p0StandardMultiFunctionVideoGenDuration::FifteenSeconds,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::errors::artcraft_router_error::ArtcraftRouterError;
  use crate::errors::client_error::ClientError;
  use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
  use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;

  fn base_request() -> GenerateVideoRequest<'static> {
    GenerateVideoRequest {
      model: CommonVideoModel::Kling3p0Standard,
      provider: Provider::Artcraft,
      prompt: Some("a cat in space"),
      negative_prompt: None,
      start_frame: None,
      end_frame: None,
      reference_images: None,
      reference_videos: None,
      reference_audio: None,
      resolution: None,
      aspect_ratio: None,
      duration_seconds: None,
      video_batch_count: None,
      generate_audio: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      idempotency_token: None,
    }
  }

  #[test]
  fn aspect_ratio_direct_16x9() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      ..base_request()
    };
    let VideoGenerationPlan::ArtcraftKling3p0Standard(plan) = request.build().unwrap() else { panic!("wrong variant") };
    assert!(matches!(plan.aspect_ratio, Some(Kling3p0StandardMultiFunctionVideoGenAspectRatio::SixteenByNine)));
  }

  #[test]
  fn aspect_ratio_direct_9x16() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
      ..base_request()
    };
    let VideoGenerationPlan::ArtcraftKling3p0Standard(plan) = request.build().unwrap() else { panic!("wrong variant") };
    assert!(matches!(plan.aspect_ratio, Some(Kling3p0StandardMultiFunctionVideoGenAspectRatio::NineBySixteen)));
  }

  #[test]
  fn aspect_ratio_direct_square() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::Square),
      ..base_request()
    };
    let VideoGenerationPlan::ArtcraftKling3p0Standard(plan) = request.build().unwrap() else { panic!("wrong variant") };
    assert!(matches!(plan.aspect_ratio, Some(Kling3p0StandardMultiFunctionVideoGenAspectRatio::Square)));
  }

  #[test]
  fn aspect_ratio_error_out_on_unsupported() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::WideThreeByTwo),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      ..base_request()
    };
    let result = request.build();
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));
  }

  #[test]
  fn duration_valid_range() {
    for d in 3..=15 {
      let request = GenerateVideoRequest {
        duration_seconds: Some(d),
        ..base_request()
      };
      let result = request.build();
      assert!(result.is_ok(), "duration {} should be valid", d);
    }
  }

  #[test]
  fn duration_out_of_range_error_out() {
    let request = GenerateVideoRequest {
      duration_seconds: Some(16),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      ..base_request()
    };
    let result = request.build();
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));
  }

  #[test]
  fn url_image_ref_returns_error() {
    let request = GenerateVideoRequest {
      start_frame: Some(ImageRef::Url("https://example.com/image.jpg")),
      ..base_request()
    };
    let result = request.build();
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }
}
