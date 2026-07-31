use seedance2pro_web_client::generate::image::generate_seedream_5p0_pro::{
  GenerateSeedream5p0ProRequest, KinoviSeedream5p0ProAspectRatio, KinoviSeedream5p0ProBatchCount,
  KinoviSeedream5p0ProResolution,
};

use crate::api::image_list_ref::ImageListRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::image_generation_draft_context::ImageGenerationDraftContext;
use crate::generate::generate_image::providers::kinovi::resolve::resolve_and_upload_image_list;
use crate::generate::generate_image::providers::kinovi::seedream_5p0_pro::request::KinoviSeedream5p0ProRequestState;

#[derive(Debug, Clone)]
pub struct KinoviSeedream5p0ProDraftState {
  pub prompt: String,
  pub aspect_ratio: KinoviSeedream5p0ProAspectRatio,
  pub resolution: KinoviSeedream5p0ProResolution,
  pub batch_count: KinoviSeedream5p0ProBatchCount,

  pub unhandled_request_state: Option<KinoviSeedream5p0ProRemainingItems>,
}

#[derive(Debug, Clone)]
pub struct KinoviSeedream5p0ProRemainingItems {
  pub reference_images: Option<ImageListRef>,
}

impl KinoviSeedream5p0ProDraftState {
  pub async fn to_request(
    &mut self,
    draft_context: &ImageGenerationDraftContext<'_>,
  ) -> Result<KinoviSeedream5p0ProRequestState, ArtcraftRouterError> {
    let client = draft_context.get_seedance2pro_web_client_ref()?;
    let session = &client.session;

    let mut reference_image_urls = None;
    if let Some(remaining) = self.unhandled_request_state.take() {
      let map = draft_context.media_file_to_artcraft_url_map;
      reference_image_urls = resolve_and_upload_image_list(
        session, remaining.reference_images, map,
      ).await?;
    }

    let request = GenerateSeedream5p0ProRequest {
      prompt: self.prompt.clone(),
      aspect_ratio: self.aspect_ratio,
      resolution: self.resolution,
      batch_count: self.batch_count,
      reference_image_urls,
    };

    Ok(KinoviSeedream5p0ProRequestState { request })
  }
}
