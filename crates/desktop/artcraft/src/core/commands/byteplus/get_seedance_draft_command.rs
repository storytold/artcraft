use log::info;
use serde_derive::{Deserialize, Serialize};
use tauri::State;
use tokens::tokens::media_files::MediaFileToken;

use crate::core::commands::byteplus::seedance_draft::find_seedance_draft;
use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::task_database::TaskDatabase;

#[derive(Deserialize)]
pub struct GetSeedanceDraftRequest {
  pub media_file_token: MediaFileToken,
}

#[derive(Serialize)]
pub struct GetSeedanceDraftResponse {
  /// Set when the video is a Seedance 2.5 draft made with BytePlus on this computer.
  pub maybe_draft: Option<SeedanceDraftInfo>,
}

#[derive(Serialize)]
pub struct SeedanceDraftInfo {
  /// Unix seconds after which the final video can no longer be rendered.
  pub expires_at: i64,
  pub is_expired: bool,
}

impl SerializeMarker for GetSeedanceDraftResponse {}

/// Tells the lightbox whether a video can be rendered at 1080p from its Seedance 2.5 draft.
#[tauri::command]
pub async fn get_seedance_draft_command(
  request: GetSeedanceDraftRequest,
  task_database: State<'_, TaskDatabase>,
) -> ResponseOrErrorMessage<GetSeedanceDraftResponse> {
  info!("get_seedance_draft_command called for {}", request.media_file_token.as_str());

  let maybe_draft = find_seedance_draft(&task_database, &request.media_file_token).await?;
  let now = chrono::Utc::now().timestamp();

  Ok(GetSeedanceDraftResponse {
    maybe_draft: maybe_draft.map(|draft| SeedanceDraftInfo {
      expires_at: draft.expires_at,
      is_expired: draft.is_expired(now),
    }),
  }.into())
}
