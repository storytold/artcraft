use kinovi_web_client::generate::video::generate_seedance_2p5::{
  GenerateSeedance2p5Request, KinoviSeedance2p5AspectRatio, KinoviSeedance2p5Modality,
  KinoviSeedance2p5OutputResolution,
};

use crate::api::audio_list_ref::AudioListRef;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::video_list_ref::VideoListRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::providers::kinovi::resolve::{
  audio_list_ref_into_urls_or_tokens, image_list_ref_into_urls_or_tokens,
  resolve_and_upload_list, resolve_and_upload_single, video_list_ref_into_urls_or_tokens,
};
use crate::generate::generate_video::providers::kinovi::seedance_2p5::request::KinoviSeedance2p5RequestState;
use crate::generate::generate_video::video_generation_draft_context::VideoGenerationDraftContext;

#[derive(Debug, Clone)]
pub struct KinoviSeedance2p5DraftState {
  pub prompt: String,

  /// Aspect ratio for the reference (text/reference-to-video) modality.
  /// Keyframe mode is always "Adaptive" and ignores this.
  pub aspect_ratio: KinoviSeedance2p5AspectRatio,

  pub resolution: Option<KinoviSeedance2p5OutputResolution>,

  pub duration_seconds: u8,

  /// Calculation-only: total seconds of reference video input, summed across
  /// all reference videos (each rounded up to a whole second).
  pub total_input_seconds: Option<u8>,

  pub unhandled_request_state: Option<KinoviSeedance2p5RemainingItems>,
}

/// Media inputs not yet resolved/uploaded. The build step guarantees that
/// keyframes and reference media are mutually exclusive.
#[derive(Debug, Clone)]
pub struct KinoviSeedance2p5RemainingItems {
  pub start_frame: Option<ImageRef>,
  pub end_frame: Option<ImageRef>,
  pub reference_images: Option<ImageListRef>,
  pub reference_videos: Option<VideoListRef>,
  pub reference_audio: Option<AudioListRef>,
}

impl KinoviSeedance2p5DraftState {
  pub async fn to_request(
    &mut self,
    draft_context: &VideoGenerationDraftContext<'_>,
  ) -> Result<KinoviSeedance2p5RequestState, ArtcraftRouterError> {
    let client = draft_context.get_kinovi_web_client_ref()?;
    let session = &client.session;

    let mut start_frame_url = None;
    let mut end_frame_url = None;
    let mut reference_image_urls = None;
    let mut reference_video_urls = None;
    let mut reference_audio_urls = None;

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
    }

    let modality = match start_frame_url {
      Some(start_frame_url) => KinoviSeedance2p5Modality::Keyframe {
        start_frame_url,
        end_frame_url,
      },
      None => {
        // The build step rejects an end frame without a start frame, but a
        // failed resolution could recreate the situation — never send an
        // orphaned end frame as a reference request.
        if end_frame_url.is_some() {
          return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
            field: "end_frame",
            value: "Seedance 2.5 requires a start frame when an end frame is set".to_string(),
          }));
        }
        KinoviSeedance2p5Modality::Reference {
          aspect_ratio: Some(self.aspect_ratio),
          reference_image_urls,
          reference_video_urls,
          reference_audio_urls,
        }
      }
    };

    let request = GenerateSeedance2p5Request {
      prompt: self.prompt.clone(),
      modality,
      output_resolution: self.resolution,
      duration_seconds: self.duration_seconds,
      total_input_seconds: self.total_input_seconds,
      use_face_blur_hack: None,
    };

    Ok(KinoviSeedance2p5RequestState { request })
  }
}
