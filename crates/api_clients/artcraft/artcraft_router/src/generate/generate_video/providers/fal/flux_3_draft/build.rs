use fal_client::requests::api::video::image::flux_3_draft::api::Flux3DraftImageToVideoRequest;
use fal_client::requests::api::video::images::flux_3_draft::api::Flux3DraftFirstLastFrameToVideoRequest;
use fal_client::requests::api::video::text::flux_3_draft::api::Flux3DraftTextToVideoRequest;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::fal::flux_3::build::{
  optional_url, plan_aspect_ratio, plan_fixed_duration, plan_flexible_duration,
  reject_references, to_flux_3_aspect_ratio, unsupported,
};
use crate::generate::generate_video::providers::fal::flux_3_draft::request::{
  FalFlux3DraftMode, FalFlux3DraftRequestState,
};
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

pub fn build_fal_flux_3_draft(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_flux_3_draft_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalFlux3Draft(state)))
}

/// Same modality dispatch as full-quality Flux 3 (see that build module) —
/// text, starting keyframe, and start/end keyframes; no references — but
/// against the draft endpoints, which always render 720p and take no
/// resolution input, so any requested resolution is silently dropped.
pub(crate) fn build_fal_flux_3_draft_state(
  builder: GenerateVideoRequestBuilder,
) -> Result<FalFlux3DraftRequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  reject_references(&builder)?;

  let start = optional_url(builder.start_frame.clone())?;
  let end = optional_url(builder.end_frame.clone())?;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let flexible_duration = plan_flexible_duration(builder.duration_seconds, strategy)?;
  let fixed_duration = plan_fixed_duration(builder.duration_seconds, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();
  let generate_audio = builder.generate_audio;

  let mode = match (start, end) {
    (None, None) => FalFlux3DraftMode::TextToVideo(Flux3DraftTextToVideoRequest {
      prompt,
      duration: flexible_duration,
      aspect_ratio: aspect_ratio.map(to_flux_3_aspect_ratio),
      generate_audio,
      safety_tolerance: Some(4), // NB: 4 is the most permissive.
    }),
    (Some(image_url), None) => FalFlux3DraftMode::ImageToVideo(Flux3DraftImageToVideoRequest {
      prompt,
      image_url,
      duration: flexible_duration,
      aspect_ratio: aspect_ratio.map(to_flux_3_aspect_ratio),
      generate_audio,
      safety_tolerance: Some(4), // NB: 4 is the most permissive.
    }),
    (Some(start_image_url), Some(end_image_url)) => FalFlux3DraftMode::FirstLastFrameToVideo(
      Flux3DraftFirstLastFrameToVideoRequest {
        prompt,
        start_image_url,
        end_image_url,
        duration: fixed_duration,
        aspect_ratio: aspect_ratio.map(to_flux_3_aspect_ratio),
        generate_audio,
        safety_tolerance: Some(4), // NB: 4 is the most permissive.
      },
    ),
    (None, Some(_)) => {
      return Err(unsupported(
        "end_frame",
        "Flux 3 Draft requires a start_frame when end_frame is provided",
      ));
    }
  };

  Ok(FalFlux3DraftRequestState { mode })
}

#[cfg(test)]
mod tests {
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::video_list_ref::VideoListRef;

  use super::*;

  const START_URL: &str = "https://example.com/start.png";
  const END_URL: &str = "https://example.com/end.png";

  mod dispatch_tests {
    use super::*;

    #[test]
    fn no_inputs_picks_t2v() {
      let state = build_fal_flux_3_draft_state(base_builder()).expect("build");
      assert!(matches!(state.mode, FalFlux3DraftMode::TextToVideo(_)));
    }

    #[test]
    fn start_frame_picks_i2v() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      let state = build_fal_flux_3_draft_state(b).expect("build");
      assert!(matches!(state.mode, FalFlux3DraftMode::ImageToVideo(_)));
    }

    #[test]
    fn start_and_end_frames_pick_first_last_frame() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      b.end_frame = Some(ImageRef::Url(END_URL.to_string()));
      let state = build_fal_flux_3_draft_state(b).expect("build");
      assert!(matches!(state.mode, FalFlux3DraftMode::FirstLastFrameToVideo(_)));
    }

    #[test]
    fn end_frame_without_start_frame_errors() {
      let mut b = base_builder();
      b.end_frame = Some(ImageRef::Url(END_URL.to_string()));
      assert!(build_fal_flux_3_draft_state(b).is_err());
    }

    #[test]
    fn reference_images_error() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec!["https://example.com/ref.png".to_string()]));
      assert!(build_fal_flux_3_draft_state(b).is_err());
    }

    #[test]
    fn reference_videos_error() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(vec!["https://example.com/v.mp4".to_string()]));
      assert!(build_fal_flux_3_draft_state(b).is_err());
    }
  }

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Flux3Draft,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }
}
