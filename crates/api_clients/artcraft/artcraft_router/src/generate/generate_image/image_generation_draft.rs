use crate::api::router_provider::RouterProvider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::image_generation_draft_context::ImageGenerationDraftContext;
use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image::providers::kinovi::midjourney_7::cost::KinoviMidjourney7CostState;
use crate::generate::generate_image::providers::kinovi::midjourney_7::draft::KinoviMidjourney7DraftState;
use crate::generate::generate_image::providers::kinovi::midjourney_7_niji::cost::KinoviMidjourney7NijiCostState;
use crate::generate::generate_image::providers::kinovi::midjourney_7_niji::draft::KinoviMidjourney7NijiDraftState;
use crate::generate::generate_image::providers::kinovi::midjourney_8::cost::KinoviMidjourney8CostState;
use crate::generate::generate_image::providers::kinovi::midjourney_8::draft::KinoviMidjourney8DraftState;

/// Wrapper for all image generation draft requests.
///
/// Drafts hold validated/planned parameters but may still need media
/// resolution (e.g. uploading local files to a provider) before they can
/// be sent. Today only Kinovi/Midjourney needs this — when the caller
/// supplies reference images, we must upload them to the Seedance2Pro
/// CDN before sending the request.
#[derive(Clone, Debug)]
pub enum ImageGenerationDraftRequest {
  KinoviMidjourney7(KinoviMidjourney7DraftState),
  KinoviMidjourney7Niji(KinoviMidjourney7NijiDraftState),
  KinoviMidjourney8(KinoviMidjourney8DraftState),
}

impl ImageGenerationDraftRequest {
  pub fn get_provider(&self) -> RouterProvider {
    match self {
      Self::KinoviMidjourney7(_) => RouterProvider::Seedance2Pro,
      Self::KinoviMidjourney7Niji(_) => RouterProvider::Seedance2Pro,
      Self::KinoviMidjourney8(_) => RouterProvider::Seedance2Pro,
    }
  }

  pub fn estimate_cost(&self) -> Result<ImageGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      Self::KinoviMidjourney7(draft) => Ok(KinoviMidjourney7CostState::from_draft(draft).estimate_cost()),
      Self::KinoviMidjourney7Niji(draft) => Ok(KinoviMidjourney7NijiCostState::from_draft(draft).estimate_cost()),
      Self::KinoviMidjourney8(draft) => Ok(KinoviMidjourney8CostState::from_draft(draft).estimate_cost()),
    }
  }

  pub async fn finalize(self, draft_context: ImageGenerationDraftContext<'_>) -> Result<ImageGenerationRequest, ArtcraftRouterError> {
    match self {
      Self::KinoviMidjourney7(mut draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(ImageGenerationRequest::KinoviMidjourney7(result))
      }
      Self::KinoviMidjourney7Niji(mut draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(ImageGenerationRequest::KinoviMidjourney7Niji(result))
      }
      Self::KinoviMidjourney8(mut draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(ImageGenerationRequest::KinoviMidjourney8(result))
      }
    }
  }
}
