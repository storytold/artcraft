use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video::providers::artcraft::seedance_2p5_preview::request::ArtcraftSeedance2p5PreviewRequestState;
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_seedance_2p5_preview(mut builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Parity with the Kinovi build: 2.5 Preview only operates in reference mode
  // (no keyframe start/end frames) and has no character support. Erroring
  // here keeps the billing estimate consistent with the execution build.
  if builder.start_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "start_frame",
      value: "Seedance 2.5 Preview has no keyframe mode; use reference_images".to_string(),
    }));
  }
  if builder.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Seedance 2.5 Preview has no keyframe mode; use reference_images".to_string(),
    }));
  }
  if builder.reference_character_tokens.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_character_tokens",
      value: "Seedance 2.5 Preview does not support character references".to_string(),
    }));
  }

  // 2.5 Preview allows 4-30 second durations (longer than the shared 4-15
  // range in build_common) and generates a single video per request. Plan
  // both here, leaving None for the shared builder, then set them after.
  let duration_seconds = plan_duration(builder.duration_seconds.take(), strategy)?;
  plan_batch_count(builder.video_batch_count.take(), strategy)?;

  let mut request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Seedance2p5Preview,
    SupportedResolutions::Fast,
    UltraWideSupport::Supported,
  )?;
  request.duration_seconds = duration_seconds;
  request.video_batch_count = Some(1);

  let state = ArtcraftSeedance2p5PreviewRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftSeedance2p5Preview(state)))
}

// Seedance 2.5 Preview supports durations of 4-30 seconds.
fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u16>, ArtcraftRouterError> {
  const MIN: u16 = 4;
  const MAX: u16 = 30;
  match duration_seconds {
    None => Ok(None),
    Some(d) if d >= MIN && d <= MAX => Ok(Some(d)),
    Some(d) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", d),
        }))
      }
      _ => Ok(Some(d.clamp(MIN, MAX))),
    },
  }
}

// Seedance 2.5 Preview generates a single video per request (no batching).
fn plan_batch_count(
  video_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<(), ArtcraftRouterError> {
  let count = video_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(()),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "video_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(()),
    },
  }
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
  use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;
  use tokens::tokens::characters::CharacterToken;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::character_list_ref::CharacterListRef;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

  use super::*;

  mod field_conversions {
    use super::*;

    #[test]
    fn model_is_correct() {
      let req = unwrap_request(builder_with(|_| {}));
      assert!(matches!(req.request.model, Some(CommonVideoModelEnum::Seedance2p5Preview)));
    }

    #[test]
    fn prompt_is_passed_through() {
      let req = unwrap_request(builder_with(|b| { b.prompt = Some("test".to_string()); }));
      assert_eq!(req.request.prompt, Some("test".to_string()));
    }

    #[test]
    fn duration_30_is_passed_through() {
      let req = unwrap_request(builder_with(|b| { b.duration_seconds = Some(30); }));
      assert_eq!(req.request.duration_seconds, Some(30));
    }

    #[test]
    fn duration_clamped_to_max_30() {
      let req = unwrap_request(builder_with(|b| { b.duration_seconds = Some(99); }));
      assert_eq!(req.request.duration_seconds, Some(30));
    }

    #[test]
    fn duration_clamped_to_min_4() {
      let req = unwrap_request(builder_with(|b| { b.duration_seconds = Some(2); }));
      assert_eq!(req.request.duration_seconds, Some(4));
    }

    #[test]
    fn batch_count_is_always_one() {
      let req = unwrap_request(builder_with(|b| { b.video_batch_count = Some(4); }));
      assert_eq!(req.request.video_batch_count, Some(1));
    }

    #[test]
    fn batch_over_one_error_out() {
      let result = build_artcraft_seedance_2p5_preview(builder_with(|b| {
        b.video_batch_count = Some(4);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      }));
      assert!(result.is_err());
    }
  }

  mod unsupported_option_errors {
    use super::*;

    #[test]
    fn start_frame_errors() {
      let result = build_artcraft_seedance_2p5_preview(builder_with(|b| {
        b.start_frame = Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_start".to_string())));
      }));
      assert!(result.is_err());
    }

    #[test]
    fn end_frame_errors() {
      let result = build_artcraft_seedance_2p5_preview(builder_with(|b| {
        b.end_frame = Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_end".to_string())));
      }));
      assert!(result.is_err());
    }

    #[test]
    fn character_references_error() {
      let result = build_artcraft_seedance_2p5_preview(builder_with(|b| {
        b.reference_character_tokens = Some(CharacterListRef::CharacterTokens(vec![
          CharacterToken::new("char_abc".to_string()),
        ]));
      }));
      assert!(result.is_err());
    }
  }

  mod resolution_tests {
    use super::*;

    #[test]
    fn res_480p() {
      let req = unwrap_request(builder_with(|b| { b.resolution = Some(RouterResolution::FourEightyP); }));
      assert_eq!(req.request.resolution, Some(CommonResolutionEnum::FourEightyP));
    }

    #[test]
    fn res_1080p_downgrades_to_720p() {
      let req = unwrap_request(builder_with(|b| { b.resolution = Some(RouterResolution::TenEightyP); }));
      assert_eq!(req.request.resolution, Some(CommonResolutionEnum::SevenTwentyP));
    }
  }

  mod media_token_tests {
    use super::*;

    #[test]
    fn reference_image_tokens_passed_through() {
      let tokens = vec![
        MediaFileToken::new("mf_a".to_string()),
        MediaFileToken::new("mf_b".to_string()),
      ];
      let req = unwrap_request(builder_with(|b| { b.reference_images = Some(ImageListRef::MediaFileTokens(tokens.clone())); }));
      assert_eq!(req.request.reference_image_media_tokens, Some(tokens));
    }
  }

  fn builder_with(f: impl FnOnce(&mut GenerateVideoRequestBuilder)) -> GenerateVideoRequestBuilder {
    let mut builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p5Preview,
      provider: RouterProvider::Artcraft,
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      ..Default::default()
    };
    f(&mut builder);
    builder
  }

  fn unwrap_request(builder: GenerateVideoRequestBuilder) -> ArtcraftSeedance2p5PreviewRequestState {
    let result = build_artcraft_seedance_2p5_preview(builder).expect("build should succeed");
    match result {
      VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftSeedance2p5Preview(state)) => state,
      _ => panic!("expected ArtcraftSeedance2p5Preview request"),
    }
  }
}
