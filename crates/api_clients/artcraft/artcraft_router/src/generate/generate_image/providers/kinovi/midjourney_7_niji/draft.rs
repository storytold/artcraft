use seedance2pro_client::generate::image::generate_midjourney_v7_niji::{
  GenerateMidjourneyV7NijiAspectRatio, GenerateMidjourneyV7NijiQuality,
  GenerateMidjourneyV7NijiRequest, KinoviMidjourneyBatchCount,
};

use crate::api::image_list_ref::ImageListRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::image_generation_draft_context::ImageGenerationDraftContext;
use crate::generate::generate_image::providers::kinovi::midjourney_7_niji::request::KinoviMidjourney7NijiRequestState;
use crate::generate::generate_image::providers::kinovi::resolve::resolve_and_upload_image_list;

#[derive(Debug, Clone)]
pub struct KinoviMidjourney7NijiDraftState {
  pub prompt: String,
  pub aspect_ratio: GenerateMidjourneyV7NijiAspectRatio,
  pub quality: Option<GenerateMidjourneyV7NijiQuality>,
  pub batch_count: KinoviMidjourneyBatchCount,

  pub unhandled_request_state: Option<KinoviMidjourney7NijiRemainingItems>,
}

#[derive(Debug, Clone)]
pub struct KinoviMidjourney7NijiRemainingItems {
  pub reference_images: Option<ImageListRef>,
}

impl KinoviMidjourney7NijiDraftState {
  pub async fn to_request(
    &mut self,
    draft_context: &ImageGenerationDraftContext<'_>,
  ) -> Result<KinoviMidjourney7NijiRequestState, ArtcraftRouterError> {
    let client = draft_context.get_seedance2pro_client_ref()?;
    let session = &client.session;

    let mut reference_image_urls = None;
    if let Some(remaining) = self.unhandled_request_state.take() {
      let map = draft_context.media_file_to_artcraft_url_map;
      reference_image_urls = resolve_and_upload_image_list(
        session, remaining.reference_images, map,
      ).await?;
    }

    let request = GenerateMidjourneyV7NijiRequest {
      prompt: self.prompt.clone(),
      aspect_ratio: self.aspect_ratio,
      negative_prompt: None,
      stylize: None,
      weird: None,
      chaos: None,
      quality: self.quality,
      raw_mode: false,
      batch_count: self.batch_count,
      reference_image_urls,
    };

    Ok(KinoviMidjourney7NijiRequestState { request })
  }
}
