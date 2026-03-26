use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::multi_function::seedance_1p5_pro_multi_function_video_gen::{
  Seedance1p5ProMultiFunctionVideoGenAspectRatio,
  Seedance1p5ProMultiFunctionVideoGenDuration,
  Seedance1p5ProMultiFunctionVideoGenResolution,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftSeedance1p5Pro<'a> {
  pub prompt: Option<&'a str>,
  pub start_frame: Option<&'a MediaFileToken>,
  pub end_frame: Option<&'a MediaFileToken>,
  pub aspect_ratio: Option<Seedance1p5ProMultiFunctionVideoGenAspectRatio>,
  pub duration: Option<Seedance1p5ProMultiFunctionVideoGenDuration>,
  pub resolution: Option<Seedance1p5ProMultiFunctionVideoGenResolution>,
  pub generate_audio: Option<bool>,
  pub idempotency_token: String,
}

pub fn plan_generate_video_artcraft_seedance1p5_pro<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame = resolve_image_ref(request.start_frame)?;
  let end_frame = resolve_image_ref(request.end_frame)?;

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;
  let resolution = plan_resolution(request.resolution, strategy)?;

  Ok(VideoGenerationPlan::ArtcraftSeedance1p5Pro(PlanArtcraftSeedance1p5Pro {
    prompt: request.prompt,
    start_frame,
    end_frame,
    aspect_ratio,
    duration,
    resolution,
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

// Supported aspect ratios and their AR values (width / height):
//   NineBySixteen = 0.5625, ThreeByFour = 0.75, Square = 1.0, FourByThree = 1.33,
//   SixteenByNine = 1.78, TwentyOneByNine = 2.33, Auto = auto
fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Seedance1p5ProMultiFunctionVideoGenAspectRatio>, ArtcraftRouterError> {
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::Auto)),

    // Direct mappings
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Ok(Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::SixteenByNine))
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Ok(Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::NineBySixteen))
    }
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => {
      Ok(Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::Square))
    }
    Some(CommonAspectRatio::WideFourByThree) => {
      Ok(Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::FourByThree))
    }
    Some(CommonAspectRatio::TallThreeByFour) => {
      Ok(Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::ThreeByFour))
    }
    Some(CommonAspectRatio::WideTwentyOneByNine) => {
      Ok(Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::TwentyOneByNine))
    }

    // Mismatches — apply strategy
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

fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> Seedance1p5ProMultiFunctionVideoGenAspectRatio {
  match aspect_ratio {
    CommonAspectRatio::WideFiveByFour => Seedance1p5ProMultiFunctionVideoGenAspectRatio::FourByThree, // 1.25, nearest 1.33
    CommonAspectRatio::WideThreeByTwo => Seedance1p5ProMultiFunctionVideoGenAspectRatio::FourByThree, // 1.50, nearest 1.33
    CommonAspectRatio::TallFourByFive => Seedance1p5ProMultiFunctionVideoGenAspectRatio::ThreeByFour, // 0.80, nearest 0.75
    CommonAspectRatio::TallTwoByThree => Seedance1p5ProMultiFunctionVideoGenAspectRatio::ThreeByFour, // 0.67, nearest 0.75
    CommonAspectRatio::TallNineByTwentyOne => Seedance1p5ProMultiFunctionVideoGenAspectRatio::NineBySixteen, // 0.43, nearest 0.56
    _ => Seedance1p5ProMultiFunctionVideoGenAspectRatio::Square,
  }
}

// Seedance 1.5 Pro supports durations of 4–12 seconds.
fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Seedance1p5ProMultiFunctionVideoGenDuration>, ArtcraftRouterError> {
  const MIN: u16 = 4;
  const MAX: u16 = 12;
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

fn seconds_to_duration(seconds: u16) -> Seedance1p5ProMultiFunctionVideoGenDuration {
  match seconds {
    4 => Seedance1p5ProMultiFunctionVideoGenDuration::FourSeconds,
    5 => Seedance1p5ProMultiFunctionVideoGenDuration::FiveSeconds,
    6 => Seedance1p5ProMultiFunctionVideoGenDuration::SixSeconds,
    7 => Seedance1p5ProMultiFunctionVideoGenDuration::SevenSeconds,
    8 => Seedance1p5ProMultiFunctionVideoGenDuration::EightSeconds,
    9 => Seedance1p5ProMultiFunctionVideoGenDuration::NineSeconds,
    10 => Seedance1p5ProMultiFunctionVideoGenDuration::TenSeconds,
    11 => Seedance1p5ProMultiFunctionVideoGenDuration::ElevenSeconds,
    _ => Seedance1p5ProMultiFunctionVideoGenDuration::TwelveSeconds,
  }
}

fn plan_resolution(
  resolution: Option<crate::api::common_resolution::CommonResolution>,
  _strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Seedance1p5ProMultiFunctionVideoGenResolution>, ArtcraftRouterError> {
  use crate::api::common_resolution::CommonResolution;
  match resolution {
    None => Ok(None),
    Some(CommonResolution::OneK) => Ok(Some(Seedance1p5ProMultiFunctionVideoGenResolution::SevenTwentyP)),
    Some(CommonResolution::TwoK) => Ok(Some(Seedance1p5ProMultiFunctionVideoGenResolution::TenEightyP)),
    Some(CommonResolution::ThreeK) => Ok(Some(Seedance1p5ProMultiFunctionVideoGenResolution::TenEightyP)),
    Some(CommonResolution::FourK) => Ok(Some(Seedance1p5ProMultiFunctionVideoGenResolution::TenEightyP)),
    // HalfK and FourEightyP map to the lowest supported resolution
    Some(CommonResolution::HalfK | CommonResolution::FourEightyP) => Ok(Some(Seedance1p5ProMultiFunctionVideoGenResolution::FourEightyP)),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(Seedance1p5ProMultiFunctionVideoGenResolution::SevenTwentyP)),
    Some(CommonResolution::TenEightyP) => Ok(Some(Seedance1p5ProMultiFunctionVideoGenResolution::TenEightyP)),
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

  fn base_seedance_1p5_pro_request() -> GenerateVideoRequest<'static> {
    GenerateVideoRequest {
      model: CommonVideoModel::Seedance1p5Pro,
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
      ..base_seedance_1p5_pro_request()
    };
    let VideoGenerationPlan::ArtcraftSeedance1p5Pro(plan) = request.build().unwrap() else { panic!("wrong variant") };
    assert!(matches!(plan.aspect_ratio, Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::SixteenByNine)));
  }

  #[test]
  fn aspect_ratio_direct_9x16() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
      ..base_seedance_1p5_pro_request()
    };
    let VideoGenerationPlan::ArtcraftSeedance1p5Pro(plan) = request.build().unwrap() else { panic!("wrong variant") };
    assert!(matches!(plan.aspect_ratio, Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::NineBySixteen)));
  }

  #[test]
  fn aspect_ratio_direct_21x9() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::WideTwentyOneByNine),
      ..base_seedance_1p5_pro_request()
    };
    let VideoGenerationPlan::ArtcraftSeedance1p5Pro(plan) = request.build().unwrap() else { panic!("wrong variant") };
    assert!(matches!(plan.aspect_ratio, Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::TwentyOneByNine)));
  }

  #[test]
  fn aspect_ratio_error_out_on_unsupported() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::WideThreeByTwo),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      ..base_seedance_1p5_pro_request()
    };
    let result = request.build();
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));
  }

  #[test]
  fn duration_valid_range() {
    for d in 4..=12 {
      let request = GenerateVideoRequest {
        duration_seconds: Some(d),
        ..base_seedance_1p5_pro_request()
      };
      let result = request.build();
      assert!(result.is_ok(), "duration {} should be valid", d);
    }
  }

  #[test]
  fn duration_out_of_range_error_out() {
    let request = GenerateVideoRequest {
      duration_seconds: Some(13),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      ..base_seedance_1p5_pro_request()
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
      ..base_seedance_1p5_pro_request()
    };
    let result = request.build();
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }
}
