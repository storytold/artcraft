use fal_client::requests::webhook::video::image::enqueue_kling_3p0_standard_image_to_video_webhook::{
  EnqueueKling3p0StandardImageToVideoAspectRatio, EnqueueKling3p0StandardImageToVideoDuration,
  EnqueueKling3p0StandardImageToVideoRequest,
};
use fal_client::requests::webhook::video::text::enqueue_kling_3p0_standard_text_to_video_webhook::{
  EnqueueKling3p0StandardTextToVideoAspectRatio, EnqueueKling3p0StandardTextToVideoDuration,
  EnqueueKling3p0StandardTextToVideoRequest,
};

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::fal::kling_1_6_pro::build::optional_url;
use crate::generate::generate_video_v2::providers::fal::kling_3p0_pro::build::{
  plan_aspect_ratio, plan_duration, PlanAspectRatio, PlanDuration,
};
use crate::generate::generate_video_v2::providers::fal::kling_3p0_standard::request::{
  FalKling3p0StandardMode, FalKling3p0StandardRequestState,
};
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_fal_kling_3p0_standard(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();
  let negative_prompt = builder.negative_prompt.clone();
  let generate_audio = builder.generate_audio;

  let mode = match optional_url(builder.start_frame.clone())? {
    None => {
      if builder.end_frame.is_some() {
        return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "end_frame",
          value: "Kling 3.0 Standard requires a start_frame when end_frame is provided".to_string(),
        }));
      }
      FalKling3p0StandardMode::TextToVideo(EnqueueKling3p0StandardTextToVideoRequest {
        prompt,
        generate_audio,
        negative_prompt,
        duration: duration.map(to_t2v_duration),
        aspect_ratio: aspect_ratio.map(to_t2v_aspect_ratio),
        shot_type: None,
      })
    }
    Some(image_url) => FalKling3p0StandardMode::ImageToVideo(EnqueueKling3p0StandardImageToVideoRequest {
      prompt,
      image_url,
      end_image_url: optional_url(builder.end_frame.clone())?,
      generate_audio,
      negative_prompt,
      duration: duration.map(to_i2v_duration),
      aspect_ratio: aspect_ratio.map(to_i2v_aspect_ratio),
      shot_type: None,
    }),
  };

  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling3p0Standard(
    FalKling3p0StandardRequestState { mode },
  )))
}

fn to_t2v_duration(d: PlanDuration) -> EnqueueKling3p0StandardTextToVideoDuration {
  use EnqueueKling3p0StandardTextToVideoDuration as D;
  match d.0 {
    3 => D::ThreeSeconds,
    4 => D::FourSeconds,
    5 => D::FiveSeconds,
    6 => D::SixSeconds,
    7 => D::SevenSeconds,
    8 => D::EightSeconds,
    9 => D::NineSeconds,
    10 => D::TenSeconds,
    11 => D::ElevenSeconds,
    12 => D::TwelveSeconds,
    13 => D::ThirteenSeconds,
    14 => D::FourteenSeconds,
    _ => D::FifteenSeconds,
  }
}

fn to_i2v_duration(d: PlanDuration) -> EnqueueKling3p0StandardImageToVideoDuration {
  use EnqueueKling3p0StandardImageToVideoDuration as D;
  match d.0 {
    3 => D::ThreeSeconds,
    4 => D::FourSeconds,
    5 => D::FiveSeconds,
    6 => D::SixSeconds,
    7 => D::SevenSeconds,
    8 => D::EightSeconds,
    9 => D::NineSeconds,
    10 => D::TenSeconds,
    11 => D::ElevenSeconds,
    12 => D::TwelveSeconds,
    13 => D::ThirteenSeconds,
    14 => D::FourteenSeconds,
    _ => D::FifteenSeconds,
  }
}

fn to_t2v_aspect_ratio(a: PlanAspectRatio) -> EnqueueKling3p0StandardTextToVideoAspectRatio {
  match a {
    PlanAspectRatio::Square => EnqueueKling3p0StandardTextToVideoAspectRatio::Square,
    PlanAspectRatio::SixteenByNine => EnqueueKling3p0StandardTextToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => EnqueueKling3p0StandardTextToVideoAspectRatio::NineBySixteen,
  }
}

fn to_i2v_aspect_ratio(a: PlanAspectRatio) -> EnqueueKling3p0StandardImageToVideoAspectRatio {
  match a {
    PlanAspectRatio::Square => EnqueueKling3p0StandardImageToVideoAspectRatio::Square,
    PlanAspectRatio::SixteenByNine => EnqueueKling3p0StandardImageToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => EnqueueKling3p0StandardImageToVideoAspectRatio::NineBySixteen,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;

  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling3p0Standard,
      provider: Provider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }

  #[test]
  fn no_start_frame_picks_t2v() {
    let result = build_fal_kling_3p0_standard(base_builder()).expect("build");
    if let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling3p0Standard(s)) = result {
      assert!(matches!(s.mode, FalKling3p0StandardMode::TextToVideo(_)));
    } else { panic!("expected FalKling3p0Standard"); }
  }

  #[test]
  fn start_frame_picks_i2v() {
    let mut b = base_builder();
    b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    let result = build_fal_kling_3p0_standard(b).expect("build");
    if let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling3p0Standard(s)) = result {
      assert!(matches!(s.mode, FalKling3p0StandardMode::ImageToVideo(_)));
    } else { panic!("expected FalKling3p0Standard"); }
  }

  #[test]
  fn end_frame_without_start_frame_errors() {
    let mut b = base_builder();
    b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
    assert!(build_fal_kling_3p0_standard(b).is_err());
  }
}
