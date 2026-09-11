use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::providers::worldlabs::draft_common::WorldLabsSplatDraft;
use crate::generate::generate_splat::providers::worldlabs::marble_1p1_plus::request::WorldLabsMarble1p1PlusRequestState;
use crate::generate::generate_splat::splat_generation_draft_context::SplatGenerationDraftContext;

#[derive(Clone, Debug)]
pub struct WorldLabsMarble1p1PlusDraftState {
  /// Shared World Labs draft; the model is baked in at build time.
  pub draft: WorldLabsSplatDraft,
}

impl WorldLabsMarble1p1PlusDraftState {
  pub async fn to_request(&self, draft_context: &SplatGenerationDraftContext<'_>) -> Result<WorldLabsMarble1p1PlusRequestState, ArtcraftRouterError> {
    let request = self.draft.to_request(draft_context).await?;
    Ok(WorldLabsMarble1p1PlusRequestState { request })
  }
}
