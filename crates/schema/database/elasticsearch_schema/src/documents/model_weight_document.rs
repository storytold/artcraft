use std::path::PathBuf;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use enums_db::by_table::model_weights::weights_category::WeightsCategory;
use enums_db::by_table::model_weights::weights_types::WeightsType;
use enums_db::common::visibility::Visibility;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

use crate::traits::document::Document;

/// The current name for the index.
/// We may need to perform migrations in the future
pub const MODEL_WEIGHT_INDEX: &str = "model_weights_v1";

#[derive(Serialize, Deserialize, Debug)]
pub struct ModelWeightDocument {

  // *** NB: Never put the bucket path to the model in Elasticsearch ! ***

  pub token: ModelWeightToken,

  pub creator_set_visibility: Visibility,

  pub weights_type: WeightsType,
  pub weights_category: WeightsCategory,

  pub title: String,

  // NB: Not all datatypes are supported in the SQL DSL, so we have a copy of the title:
  // https://opensearch.org/docs/latest/search-plugins/sql/datatypes/
  pub title_as_keyword: String,

  // *** NB: Never put the bucket path to the model in Elasticsearch ! ***

  pub maybe_cover_image_media_file_token: Option<MediaFileToken>,
  pub maybe_cover_image_public_bucket_hash: Option<String>,
  pub maybe_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_cover_image_public_bucket_extension: Option<String>,

  //pub description_markdown: String,
  //pub description_markdown_html: String,

  pub creator_user_token: UserToken,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  // TODO(bt, 2024-08-08): This should be migrated to non-nullable soon. Turn this into a strict `bool` and drop the Option<T>
  pub is_featured: Option<bool>,

  // Statistics
  pub ratings_positive_count: u32,
  pub ratings_negative_count: u32,
  pub bookmark_count: u32,

  // Stored as ES "integer" type - the documents seem to imply this is better for searching than unsigned_long, but I'm not sure.
  // TODO(bt, 2024-09-07): This should be migrated to non-nullable soon. Turn this into a strict `i32` and drop the Option<T>
  pub cached_usage_count: Option<i32>,

  // Fields only used for TTS models and voice conversion models.
  pub maybe_ietf_language_tag: Option<String>,
  pub maybe_ietf_primary_language_subtag: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,

  /// When we read the record from the database
  pub database_read_time: DateTime<Utc>,

  /// Calculated as "either user or mod deleted"
  pub is_deleted: bool,
}

impl Document for ModelWeightDocument {
  fn get_document_id(&self) -> String {
    self.token.to_string()
  }

  fn get_document_path(&self) -> PathBuf {
    let document_id = self.get_document_id();
    PathBuf::from(format!("/{MODEL_WEIGHT_INDEX}/_doc/{document_id}"))
  }
}
