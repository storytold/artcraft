use crate::api::audio_list_ref::AudioListRef;
use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::video_list_ref::VideoListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::PlanArtcraftSeedance2p0;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
  Seedance2p0AspectRatio, Seedance2p0BatchCount,
};
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;

pub fn plan_generate_video_artcraft_seedance2p0_fast(
  request: &GenerateVideoRequestBuilder,
) -> Result<VideoGenerationPlan, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame = resolve_image_ref(request.start_frame.clone())?;
  let end_frame = resolve_image_ref(request.end_frame.clone())?;
  let reference_images = resolve_image_list_ref(request.reference_images.clone())?;
  let reference_videos = resolve_video_list_ref(request.reference_videos.clone())?;
  let reference_audio = resolve_audio_list_ref(request.reference_audio.clone())?;

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let resolution = plan_output_resolution(request.resolution, strategy)?;
  let batch_count = plan_batch_count(request.video_batch_count, strategy)?;
  let duration_seconds = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::ArtcraftSeedance2p0Fast(PlanArtcraftSeedance2p0 {
    prompt: request.prompt.clone(),
    start_frame,
    end_frame,
    reference_images,
    reference_videos,
    reference_audio,
    reference_characters: resolve_character_list_ref(request.reference_character_tokens.clone()),
    aspect_ratio,
    resolution,
    duration_seconds,
    batch_count,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

fn resolve_character_list_ref(
  character_list_ref: Option<crate::api::character_list_ref::CharacterListRef>,
) -> Option<Vec<CharacterToken>> {
  match character_list_ref {
    None => None,
    Some(crate::api::character_list_ref::CharacterListRef::CharacterTokens(tokens)) => Some(tokens),
  }
}

fn resolve_image_ref(
  image_ref: Option<ImageRef>,
) -> Result<Option<MediaFileToken>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::MediaFileToken(t)) => Ok(Some(t)),
    Some(ImageRef::Url(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

fn resolve_image_list_ref(
  image_list_ref: Option<ImageListRef>,
) -> Result<Option<Vec<MediaFileToken>>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(None),
    Some(ImageListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    Some(ImageListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

fn resolve_video_list_ref(
  video_list_ref: Option<VideoListRef>,
) -> Result<Option<Vec<MediaFileToken>>, ArtcraftRouterError> {
  match video_list_ref {
    None => Ok(None),
    Some(VideoListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    Some(VideoListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

fn resolve_audio_list_ref(
  audio_list_ref: Option<AudioListRef>,
) -> Result<Option<Vec<MediaFileToken>>, ArtcraftRouterError> {
  match audio_list_ref {
    None => Ok(None),
    Some(AudioListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    Some(AudioListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Seedance2p0AspectRatio>, ArtcraftRouterError> {
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(None),

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Ok(Some(Seedance2p0AspectRatio::Landscape16x9))
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Ok(Some(Seedance2p0AspectRatio::Portrait9x16))
    }
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => {
      Ok(Some(Seedance2p0AspectRatio::Square1x1))
    }
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(Seedance2p0AspectRatio::Standard4x3)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(Seedance2p0AspectRatio::Portrait3x4)),

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

fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> Seedance2p0AspectRatio {
  match aspect_ratio {
    CommonAspectRatio::WideFiveByFour => Seedance2p0AspectRatio::Standard4x3,
    CommonAspectRatio::WideThreeByTwo => Seedance2p0AspectRatio::Standard4x3,
    CommonAspectRatio::WideTwentyOneByNine => Seedance2p0AspectRatio::Landscape16x9,
    CommonAspectRatio::TallFourByFive => Seedance2p0AspectRatio::Portrait3x4,
    CommonAspectRatio::TallTwoByThree => Seedance2p0AspectRatio::Portrait3x4,
    CommonAspectRatio::TallNineByTwentyOne => Seedance2p0AspectRatio::Portrait9x16,
    _ => Seedance2p0AspectRatio::Square1x1,
  }
}

fn plan_batch_count(
  video_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Seedance2p0BatchCount, ArtcraftRouterError> {
  let count = video_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(Seedance2p0BatchCount::One),
    2 => Ok(Seedance2p0BatchCount::Two),
    4 => Ok(Seedance2p0BatchCount::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "video_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(if count < 4 { Seedance2p0BatchCount::Four } else { Seedance2p0BatchCount::Four })
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(if count < 4 { Seedance2p0BatchCount::Two } else { Seedance2p0BatchCount::Four })
      }
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u8>, ArtcraftRouterError> {
  const MIN: u16 = 4;
  const MAX: u16 = 15;
  match duration_seconds {
    None => Ok(None),
    Some(d) if d >= MIN && d <= MAX => Ok(Some(d as u8)),
    Some(d) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", d),
        }))
      }
      _ => Ok(Some(d.clamp(MIN, MAX) as u8)),
    },
  }
}

// Seedance 2.0 Fast supports output resolutions: 480p and 720p only.
fn plan_output_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<CommonResolution>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),

    // Direct mappings
    Some(CommonResolution::FourEightyP)
    | Some(CommonResolution::SevenTwentyP) => Ok(resolution),

    // Mismatches
    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        // HalfK → 480p (up); TenEightyP/OneK+ → 720p (max)
        Ok(Some(match unsupported {
          CommonResolution::HalfK => CommonResolution::FourEightyP,
          _ => CommonResolution::SevenTwentyP,
        }))
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        // HalfK → 480p (min); TenEightyP/OneK+ → 720p (closest below)
        Ok(Some(match unsupported {
          CommonResolution::HalfK => CommonResolution::FourEightyP,
          _ => CommonResolution::SevenTwentyP,
        }))
      }
    },
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
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
  use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
    Seedance2p0AspectRatio, Seedance2p0BatchCount,
  };

  fn base_request() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance2p0Fast,
      provider: Provider::Artcraft,
      prompt: Some("a cat in space".to_string()),
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
      assert_eq!(p.prompt, Some("a cat in space".to_string()));
    } else { panic!("wrong variant"); }
  }

  #[test]
  fn aspect_ratio_16x9() {
    let req = GenerateVideoRequestBuilder {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      ..base_request()
    };
    let plan = req.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert!(matches!(p.aspect_ratio, Some(Seedance2p0AspectRatio::Landscape16x9)));
  }

  #[test]
  fn aspect_ratio_9x16() {
    let req = GenerateVideoRequestBuilder {
      aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
      ..base_request()
    };
    let plan = req.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert!(matches!(p.aspect_ratio, Some(Seedance2p0AspectRatio::Portrait9x16)));
  }

  #[test]
  fn aspect_ratio_square() {
    let req = GenerateVideoRequestBuilder {
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
    let req = GenerateVideoRequestBuilder { video_batch_count: Some(2), ..base_request() };
    let plan = req.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert!(matches!(p.batch_count, Seedance2p0BatchCount::Two));
  }

  #[test]
  fn batch_count_4() {
    let req = GenerateVideoRequestBuilder { video_batch_count: Some(4), ..base_request() };
    let plan = req.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert!(matches!(p.batch_count, Seedance2p0BatchCount::Four));
  }

  #[test]
  fn duration_in_range() {
    let req = GenerateVideoRequestBuilder { duration_seconds: Some(10), ..base_request() };
    let plan = req.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert_eq!(p.duration_seconds, Some(10));
  }

  #[test]
  fn duration_clamped_to_max() {
    let req = GenerateVideoRequestBuilder { duration_seconds: Some(99), ..base_request() };
    let plan = req.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert_eq!(p.duration_seconds, Some(15));
  }

  #[test]
  fn url_image_ref_returns_error() {
    let req = GenerateVideoRequestBuilder {
      start_frame: Some(ImageRef::Url("https://example.com/image.jpg".to_string())),
      ..base_request()
    };
    assert!(matches!(
      req.build(),
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }
}
