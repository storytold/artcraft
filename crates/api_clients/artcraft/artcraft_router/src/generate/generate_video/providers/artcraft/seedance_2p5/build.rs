use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video::providers::artcraft::seedance_2p5::request::ArtcraftSeedance2p5RequestState;
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_seedance_2p5(mut builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Parity with the Kinovi build: keyframes and reference media are mutually
  // exclusive, an end frame requires a start frame, and there is no
  // character support. Erroring here keeps the billing estimate consistent
  // with the execution build.
  let has_keyframes = builder.start_frame.is_some() || builder.end_frame.is_some();
  let has_references = builder.reference_images.is_some()
    || builder.reference_videos.is_some()
    || builder.reference_audio.is_some();

  if has_keyframes && has_references {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_images",
      value: "Seedance 2.5 cannot combine keyframes with reference media; send one or the other".to_string(),
    }));
  }
  if builder.end_frame.is_some() && builder.start_frame.is_none() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Seedance 2.5 requires a start frame when an end frame is set".to_string(),
    }));
  }
  if builder.reference_character_tokens.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_character_tokens",
      value: "Seedance 2.5 does not support character references".to_string(),
    }));
  }

  // 2.5 allows 4-30 second durations (longer than the shared 4-15 range in
  // build_common) and generates a single video per request. Plan both here,
  // leaving None for the shared builder, then set them after.
  let duration_seconds = plan_duration(builder.duration_seconds.take(), strategy)?;
  plan_batch_count(builder.video_batch_count.take(), strategy)?;

  let total_input_seconds = builder.total_reference_video_input_seconds.take();

  let mut request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Seedance2p5,
    SupportedResolutions::Fast,
    UltraWideSupport::Supported,
  )?;
  request.duration_seconds = duration_seconds;
  request.video_batch_count = Some(1);

  let state = ArtcraftSeedance2p5RequestState { request, total_input_seconds };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftSeedance2p5(state)))
}

// Seedance 2.5 supports durations of 4-30 seconds.
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

// Seedance 2.5 generates a single video per request (no batching).
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
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

  use super::*;

  mod field_conversions {
    use super::*;

    #[test]
    fn model_is_correct() {
      let req = unwrap_request(builder_with(|_| {}));
      assert!(matches!(req.request.model, Some(CommonVideoModelEnum::Seedance2p5)));
    }

    #[test]
    fn duration_30_is_passed_through() {
      let req = unwrap_request(builder_with(|b| { b.duration_seconds = Some(30); }));
      assert_eq!(req.request.duration_seconds, Some(30));
    }

    #[test]
    fn duration_clamped_to_range() {
      let req = unwrap_request(builder_with(|b| { b.duration_seconds = Some(99); }));
      assert_eq!(req.request.duration_seconds, Some(30));

      let req = unwrap_request(builder_with(|b| { b.duration_seconds = Some(2); }));
      assert_eq!(req.request.duration_seconds, Some(4));
    }

    #[test]
    fn batch_count_is_always_one() {
      let req = unwrap_request(builder_with(|b| { b.video_batch_count = Some(4); }));
      assert_eq!(req.request.video_batch_count, Some(1));
    }

    #[test]
    fn total_input_seconds_is_carried_through() {
      let req = unwrap_request(builder_with(|b| { b.total_reference_video_input_seconds = Some(14); }));
      assert_eq!(req.total_input_seconds, Some(14));
    }
  }

  mod modality_rules {
    use super::*;

    #[test]
    fn keyframes_are_accepted() {
      let req = unwrap_request(builder_with(|b| {
        b.start_frame = Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_start".to_string())));
        b.end_frame = Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_end".to_string())));
      }));
      assert!(req.request.start_frame_image_media_token.is_some());
      assert!(req.request.end_frame_image_media_token.is_some());
    }

    #[test]
    fn end_frame_without_start_frame_errors() {
      let result = build_artcraft_seedance_2p5(builder_with(|b| {
        b.end_frame = Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_end".to_string())));
      }));
      assert!(result.is_err());
    }

    #[test]
    fn keyframes_plus_references_error() {
      let result = build_artcraft_seedance_2p5(builder_with(|b| {
        b.start_frame = Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_start".to_string())));
        b.reference_images = Some(ImageListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_ref".to_string()),
        ]));
      }));
      assert!(result.is_err());
    }

    #[test]
    fn character_references_error() {
      let result = build_artcraft_seedance_2p5(builder_with(|b| {
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

  fn builder_with(f: impl FnOnce(&mut GenerateVideoRequestBuilder)) -> GenerateVideoRequestBuilder {
    let mut builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p5,
      provider: RouterProvider::Artcraft,
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      ..Default::default()
    };
    f(&mut builder);
    builder
  }

  fn unwrap_request(builder: GenerateVideoRequestBuilder) -> ArtcraftSeedance2p5RequestState {
    let result = build_artcraft_seedance_2p5(builder).expect("build should succeed");
    match result {
      VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftSeedance2p5(state)) => state,
      _ => panic!("expected ArtcraftSeedance2p5 request"),
    }
  }
}
