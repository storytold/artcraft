use kinovi_web_client::generate::video::generate_seedance_2p5_preview::{
  GenerateSeedance2p5PreviewRequest, KinoviSeedance2p5PreviewAspectRatio,
  KinoviSeedance2p5PreviewOutputResolution,
};

use crate::api::audio_list_ref::AudioListRef;
use crate::api::image_list_ref::ImageListRef;
use crate::api::video_list_ref::VideoListRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::providers::kinovi::resolve::{
  audio_list_ref_into_urls_or_tokens, image_list_ref_into_urls_or_tokens,
  resolve_and_upload_list, video_list_ref_into_urls_or_tokens,
};
use crate::generate::generate_video::providers::kinovi::seedance_2p5_preview::request::KinoviSeedance2p5PreviewRequestState;
use crate::generate::generate_video::video_generation_draft_context::VideoGenerationDraftContext;

#[derive(Debug, Clone)]
pub struct KinoviSeedance2p5PreviewDraftState {
  pub prompt: String,
  pub aspect_ratio: KinoviSeedance2p5PreviewAspectRatio,
  pub resolution: Option<KinoviSeedance2p5PreviewOutputResolution>,
  pub duration_seconds: u8,

  pub unhandled_request_state: Option<KinoviSeedance2p5PreviewRemainingItems>,
}

/// 2.5 Preview only supports reference media — no start/end frames and no
/// character references (the builder errors on those).
#[derive(Debug, Clone)]
pub struct KinoviSeedance2p5PreviewRemainingItems {
  pub reference_images: Option<ImageListRef>,
  pub reference_videos: Option<VideoListRef>,
  pub reference_audio: Option<AudioListRef>,
}

impl KinoviSeedance2p5PreviewDraftState {
  pub async fn to_request(
    &mut self,
    draft_context: &VideoGenerationDraftContext<'_>,
  ) -> Result<KinoviSeedance2p5PreviewRequestState, ArtcraftRouterError> {
    let client = draft_context.get_kinovi_web_client_ref()?;
    let session = &client.session;

    let mut reference_image_urls = None;
    let mut reference_video_urls = None;
    let mut reference_audio_urls = None;

    if let Some(remaining) = self.unhandled_request_state.take() {
      let map = draft_context.media_file_to_artcraft_url_map;
      let predownloaded = draft_context.predownloaded_media_paths;

      reference_image_urls = resolve_and_upload_list(
        session, remaining.reference_images.map(image_list_ref_into_urls_or_tokens), map, predownloaded,
      ).await?;

      reference_video_urls = resolve_and_upload_list(
        session, remaining.reference_videos.map(video_list_ref_into_urls_or_tokens), map, predownloaded,
      ).await?;

      reference_audio_urls = resolve_and_upload_list(
        session, remaining.reference_audio.map(audio_list_ref_into_urls_or_tokens), map, predownloaded,
      ).await?;
    }

    let request = GenerateSeedance2p5PreviewRequest {
      prompt: self.prompt.clone(),
      aspect_ratio: Some(self.aspect_ratio),
      output_resolution: self.resolution,
      duration_seconds: self.duration_seconds,
      reference_image_urls,
      reference_video_urls,
      reference_audio_urls,
      use_face_blur_hack: None,
    };

    Ok(KinoviSeedance2p5PreviewRequestState { request })
  }
}
