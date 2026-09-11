use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;
use tokens::tokens::media_files::MediaFileToken;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct DeleteMediaFileRequest {
  pub set_delete: bool,
  
  /// NB: this is only to disambiguate when a user is both a mod and an author.
  pub as_mod: Option<bool>,
}

/// For the URL PathInfo
#[derive(Serialize, Deserialize, ToSchema)]
pub struct DeleteMediaFilePathInfo {
  pub token: MediaFileToken,
}


