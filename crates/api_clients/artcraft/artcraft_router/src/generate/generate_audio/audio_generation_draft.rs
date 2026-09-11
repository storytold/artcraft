use crate::api::router_provider::RouterProvider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_audio::audio_generation_cost_estimate::AudioGenerationCostEstimate;
use crate::generate::generate_audio::audio_generation_draft_context::AudioGenerationDraftContext;
use crate::generate::generate_audio::audio_generation_request::AudioGenerationRequest;
use crate::generate::generate_audio::providers::kinovi::suno_remix::cost::KinoviSunoRemixCostState;
use crate::generate::generate_audio::providers::kinovi::suno_remix::draft::KinoviSunoRemixDraftState;
use crate::generate::generate_audio::providers::kinovi::suno_sample::cost::KinoviSunoSampleCostState;
use crate::generate::generate_audio::providers::kinovi::suno_sample::draft::KinoviSunoSampleDraftState;

/**
 * Wrapper for all audio generation draft requests.
 *
 * Only the Kinovi remix/sample models need a draft phase: they take a user
 * audio reference that must be downloaded from our CDN and re-uploaded to the
 * Kinovi CDN before the request can be sent. All other audio providers return
 * a `Request` directly from `build2()`.
 */
#[derive(Clone, Debug)]
pub enum AudioGenerationDraftRequest {
  KinoviSunoRemix(KinoviSunoRemixDraftState),
  KinoviSunoSample(KinoviSunoSampleDraftState),
}

impl AudioGenerationDraftRequest {

  pub fn get_provider(&self) -> RouterProvider {
    match self {
      Self::KinoviSunoRemix(_) => RouterProvider::KinoviWeb,
      Self::KinoviSunoSample(_) => RouterProvider::KinoviWeb,
    }
  }

  /// Return a cost estimate to fulfill the request.
  pub fn estimate_cost(&self) -> Result<AudioGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      AudioGenerationDraftRequest::KinoviSunoRemix(draft) => Ok(KinoviSunoRemixCostState::from_draft(draft).estimate_cost()),
      AudioGenerationDraftRequest::KinoviSunoSample(draft) => Ok(KinoviSunoSampleCostState::from_draft(draft).estimate_cost()),
    }
  }

  /// Finalize the draft request before generation
  /// This may involve uploading media to the provider.
  pub async fn finalize(self, draft_context: AudioGenerationDraftContext<'_>) -> Result<AudioGenerationRequest, ArtcraftRouterError> {
    match self {
      AudioGenerationDraftRequest::KinoviSunoRemix(mut draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(AudioGenerationRequest::KinoviSunoRemix(result))
      },
      AudioGenerationDraftRequest::KinoviSunoSample(mut draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(AudioGenerationRequest::KinoviSunoSample(result))
      },
    }
  }
}
