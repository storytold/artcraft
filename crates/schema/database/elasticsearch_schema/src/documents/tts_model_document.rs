use std::path::PathBuf;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use enums_db::common::visibility::Visibility;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::users::UserToken;

use crate::traits::document::Document;

/// The current name for the TTS model index.
/// We may need to perform migrations in the future, so this may grow to keeping
/// tabs of multiple indices in the future.
pub const TTS_MODEL_INDEX : &str = "tts_model_v1";

#[derive(Serialize, Deserialize, Debug)]
pub struct TtsModelDocument {
  pub token: TtsModelToken,
  pub title: String,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_user_token: UserToken,
  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

impl Document for TtsModelDocument {
  fn get_document_id(&self) -> String {
    self.token.to_string()
  }

  fn get_document_path(&self) -> PathBuf {
    let document_id = self.get_document_id();
    PathBuf::from(format!("/{TTS_MODEL_INDEX}/_doc/{document_id}"))
  }
}
