use seedance2pro_client::generate::video::generate_seedance_2p0::{
  GenerateSeedance2p0Request, KinoviSeedance2p0AspectRatio,
  KinoviSeedance2p0BatchCount, KinoviSeedance2p0OutputResolution,
};

use crate::api::audio_list_ref::AudioListRef;
use crate::api::character_list_ref::CharacterListRef;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::video_list_ref::VideoListRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video_v2::providers::kinovi::resolve::{
  audio_list_ref_into_urls_or_tokens, image_list_ref_into_urls_or_tokens,
  resolve_and_upload_list, resolve_and_upload_single, resolve_character_tokens,
  video_list_ref_into_urls_or_tokens,
};
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::request::KinoviSeedance2p0RequestState;
use crate::generate::generate_video_v2::video_generation_draft_context::VideoGenerationDraftContext;

#[derive(Debug, Clone)]
pub struct KinoviSeedance2p0DraftState {
  // Materialized / finalized types

  pub prompt: String,
  pub aspect_ratio: KinoviSeedance2p0AspectRatio,
  pub resolution: Option<KinoviSeedance2p0OutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: KinoviSeedance2p0BatchCount,

  // Pending types that need to be queried.
  pub unhandled_request_state: Option<KinoviSeedance2p0RemainingItems>,
}

#[derive(Debug, Clone)]
pub struct KinoviSeedance2p0RemainingItems {
  pub start_frame: Option<ImageRef>,
  pub end_frame: Option<ImageRef>,
  pub reference_images: Option<ImageListRef>,
  pub reference_videos: Option<VideoListRef>,
  pub reference_audio: Option<AudioListRef>,
  pub reference_character_tokens: Option<CharacterListRef>,
}

impl KinoviSeedance2p0DraftState {
  pub async fn to_request(
    &mut self,
    draft_context: &VideoGenerationDraftContext<'_>,
  ) -> Result<KinoviSeedance2p0RequestState, ArtcraftRouterError> {
    let client = draft_context.get_seedance2pro_client_ref()?;
    let session = &client.session;

    let mut start_frame_url = None;
    let mut end_frame_url = None;
    let mut reference_image_urls = None;
    let mut reference_video_urls = None;
    let mut reference_audio_urls = None;
    let mut character_ids = None;

    if let Some(remaining) = self.unhandled_request_state.take() {
      let map = draft_context.media_file_to_artcraft_url_map;

      start_frame_url = resolve_and_upload_single(session, remaining.start_frame, map).await?;
      end_frame_url = resolve_and_upload_single(session, remaining.end_frame, map).await?;

      reference_image_urls = resolve_and_upload_list(
        session, remaining.reference_images.map(image_list_ref_into_urls_or_tokens), map,
      ).await?;

      reference_video_urls = resolve_and_upload_list(
        session, remaining.reference_videos.map(video_list_ref_into_urls_or_tokens), map,
      ).await?;

      reference_audio_urls = resolve_and_upload_list(
        session, remaining.reference_audio.map(audio_list_ref_into_urls_or_tokens), map,
      ).await?;

      character_ids = resolve_character_tokens(
        remaining.reference_character_tokens.as_ref(),
        draft_context,
      )?;
    }

    let request = GenerateSeedance2p0Request {
      prompt: self.prompt.clone(),
      aspect_ratio: Some(self.aspect_ratio),
      output_resolution: self.resolution,
      duration_seconds: self.duration_seconds,
      batch_count: Some(self.batch_count),
      start_frame_url,
      end_frame_url,
      reference_image_urls,
      reference_video_urls,
      reference_audio_urls,
      character_ids,
      use_face_blur_hack: None,
    };

    Ok(KinoviSeedance2p0RequestState { request })
  }
}
