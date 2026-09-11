use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video::providers::artcraft::kling_1_6_pro::request::ArtcraftKling16ProRequestState;
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_kling_1_6_pro(mut builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  // Kling 1.6 Pro serves only {5, 10} seconds. Pre-plan the duration with the
  // SAME normalization the dispatching provider uses, so the billed duration
  // always matches the generated one.
  let strategy = builder.request_mismatch_mitigation_strategy;
  builder.duration_seconds = plan_kling_1_6_pro_duration(builder.duration_seconds, strategy)?;

  let request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Kling16Pro,
    SupportedResolutions::Full,
    UltraWideSupport::Unsupported,
  )?;
  let state = ArtcraftKling16ProRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftKling16Pro(state)))
}

/// Mirrors the Fal-side `plan_duration` for Kling 1.6 Pro: unsupported
/// durations upgrade to 10s (PayMoreUpgrade) or downgrade to 5s
/// (PayLessDowngrade).
fn plan_kling_1_6_pro_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u16>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(5) | Some(10) => Ok(duration_seconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(10)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(5)),
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  mod duration_planning {
    use super::*;

    #[test]
    fn supported_durations_pass_through() {
      let s = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      assert_eq!(plan_kling_1_6_pro_duration(None, s).unwrap(), None);
      assert_eq!(plan_kling_1_6_pro_duration(Some(5), s).unwrap(), Some(5));
      assert_eq!(plan_kling_1_6_pro_duration(Some(10), s).unwrap(), Some(10));
    }

    #[test]
    fn unsupported_duration_upgrades_to_ten() {
      let s = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      assert_eq!(plan_kling_1_6_pro_duration(Some(4), s).unwrap(), Some(10));
      assert_eq!(plan_kling_1_6_pro_duration(Some(7), s).unwrap(), Some(10));
    }

    #[test]
    fn unsupported_duration_downgrades_to_five() {
      let s = RequestMismatchMitigationStrategy::PayLessDowngrade;
      assert_eq!(plan_kling_1_6_pro_duration(Some(4), s).unwrap(), Some(5));
    }

    #[test]
    fn unsupported_duration_errors_in_strict_mode() {
      let s = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(plan_kling_1_6_pro_duration(Some(4), s).is_err());
    }
  }
}
