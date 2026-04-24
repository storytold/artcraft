use seedance2pro_client::generate::video::generate_happy_horse_1p0::{
  GenerateHappyHorse1p0Request, KinoviHappyHorse1p0AspectRatio,
  KinoviHappyHorse1p0BatchCount, KinoviHappyHorse1p0OutputResolution,
};

use crate::api::image_ref::ImageRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video_v2::providers::kinovi::resolve::resolve_and_upload_single;
use crate::generate::generate_video_v2::providers::kinovi::happy_horse_1p0::request::KinoviHappyHorse1p0RequestState;
use crate::generate::generate_video_v2::video_generation_draft_context::VideoGenerationDraftContext;

#[derive(Debug, Clone)]
pub struct KinoviHappyHorse1p0DraftState {
  pub prompt: String,
  pub aspect_ratio: Option<KinoviHappyHorse1p0AspectRatio>,
  pub resolution: Option<KinoviHappyHorse1p0OutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: Option<KinoviHappyHorse1p0BatchCount>,

  pub unhandled_request_state: Option<KinoviHappyHorse1p0RemainingItems>,
}

#[derive(Debug, Clone)]
pub struct KinoviHappyHorse1p0RemainingItems {
  pub start_frame: Option<ImageRef>,
}

impl KinoviHappyHorse1p0DraftState {
  pub async fn to_request(
    &mut self,
    draft_context: &VideoGenerationDraftContext<'_>,
  ) -> Result<KinoviHappyHorse1p0RequestState, ArtcraftRouterError> {
    let client = draft_context.get_seedance2pro_client_ref()?;
    let session = &client.session;

    let mut start_frame_url = None;

    if let Some(remaining) = self.unhandled_request_state.take() {
      let map = draft_context.media_file_to_artcraft_url_map;
      start_frame_url = resolve_and_upload_single(session, remaining.start_frame, map).await?;
    }

    let request = GenerateHappyHorse1p0Request {
      prompt: self.prompt.clone(),
      aspect_ratio: self.aspect_ratio,
      output_resolution: self.resolution,
      batch_count: self.batch_count,
      duration_seconds: self.duration_seconds,
      start_frame_url,
    };

    Ok(KinoviHappyHorse1p0RequestState { request })
  }
}
