use crate::api::router_provider::RouterProvider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::providers::worldlabs::marble_1p0::cost::WorldLabsMarble1p0CostState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p0::draft::WorldLabsMarble1p0DraftState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p0_draft::cost::WorldLabsMarble1p0DraftModelCostState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p0_draft::draft::WorldLabsMarble1p0DraftModelDraftState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p1::cost::WorldLabsMarble1p1CostState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p1::draft::WorldLabsMarble1p1DraftState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p1_plus::cost::WorldLabsMarble1p1PlusCostState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p1_plus::draft::WorldLabsMarble1p1PlusDraftState;
use crate::generate::generate_splat::splat_generation_cost_estimate::SplatGenerationCostEstimate;
use crate::generate::generate_splat::splat_generation_draft_context::SplatGenerationDraftContext;
use crate::generate::generate_splat::splat_generation_request::SplatGenerationRequest;

/**
 * Wrapper for all splat generation draft requests.
 *
 * Only the World Labs media inputs need a draft phase: reference images and
 * videos must be downloaded from our CDN and re-uploaded to World Labs media
 * assets before the request can be sent. Text-only prompts (and the Artcraft
 * provider, which takes media tokens directly) return a `Request` from
 * `build2()`.
 */
#[derive(Clone, Debug)]
pub enum SplatGenerationDraftRequest {
  WorldLabsMarble1p0(WorldLabsMarble1p0DraftState),
  WorldLabsMarble1p0Draft(WorldLabsMarble1p0DraftModelDraftState),
  WorldLabsMarble1p1(WorldLabsMarble1p1DraftState),
  WorldLabsMarble1p1Plus(WorldLabsMarble1p1PlusDraftState),
}

impl SplatGenerationDraftRequest {

  pub fn get_provider(&self) -> RouterProvider {
    match self {
      Self::WorldLabsMarble1p0(_) => RouterProvider::WorldLabs,
      Self::WorldLabsMarble1p0Draft(_) => RouterProvider::WorldLabs,
      Self::WorldLabsMarble1p1(_) => RouterProvider::WorldLabs,
      Self::WorldLabsMarble1p1Plus(_) => RouterProvider::WorldLabs,
    }
  }

  /// Return a cost estimate to fulfill the request.
  pub fn estimate_cost(&self) -> Result<SplatGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      SplatGenerationDraftRequest::WorldLabsMarble1p0(draft) => Ok(WorldLabsMarble1p0CostState::from_draft(draft).estimate_cost()),
      SplatGenerationDraftRequest::WorldLabsMarble1p0Draft(draft) => Ok(WorldLabsMarble1p0DraftModelCostState::from_draft(draft).estimate_cost()),
      SplatGenerationDraftRequest::WorldLabsMarble1p1(draft) => Ok(WorldLabsMarble1p1CostState::from_draft(draft).estimate_cost()),
      SplatGenerationDraftRequest::WorldLabsMarble1p1Plus(draft) => Ok(WorldLabsMarble1p1PlusCostState::from_draft(draft).estimate_cost()),
    }
  }

  /// Finalize the draft request before generation
  /// This may involve uploading media to the provider.
  pub async fn finalize(self, draft_context: SplatGenerationDraftContext<'_>) -> Result<SplatGenerationRequest, ArtcraftRouterError> {
    match self {
      SplatGenerationDraftRequest::WorldLabsMarble1p0(draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(SplatGenerationRequest::WorldLabsMarble1p0(result))
      },
      SplatGenerationDraftRequest::WorldLabsMarble1p0Draft(draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(SplatGenerationRequest::WorldLabsMarble1p0Draft(result))
      },
      SplatGenerationDraftRequest::WorldLabsMarble1p1(draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(SplatGenerationRequest::WorldLabsMarble1p1(result))
      },
      SplatGenerationDraftRequest::WorldLabsMarble1p1Plus(draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(SplatGenerationRequest::WorldLabsMarble1p1Plus(result))
      },
    }
  }
}
