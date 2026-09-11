use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::providers::worldlabs::draft_common::WorldLabsSplatDraft;
use crate::generate::generate_splat::providers::worldlabs::marble_1p0_draft::request::WorldLabsMarble1p0DraftModelRequestState;
use crate::generate::generate_splat::splat_generation_draft_context::SplatGenerationDraftContext;

#[derive(Clone, Debug)]
pub struct WorldLabsMarble1p0DraftModelDraftState {
  /// Shared World Labs draft; the model is baked in at build time.
  pub draft: WorldLabsSplatDraft,
}

impl WorldLabsMarble1p0DraftModelDraftState {
  pub async fn to_request(&self, draft_context: &SplatGenerationDraftContext<'_>) -> Result<WorldLabsMarble1p0DraftModelRequestState, ArtcraftRouterError> {
    let request = self.draft.to_request(draft_context).await?;
    Ok(WorldLabsMarble1p0DraftModelRequestState { request })
  }
}
