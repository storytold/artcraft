use std::path::PathBuf;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::traits::document::Document;

/// The current name for the index.
/// We may need to perform migrations in the future
pub const MEDIA_FILE_INDEX: &str = "media_files_v1";

#[derive(Serialize, Deserialize, Debug)]
pub struct MediaFileDocument {

  pub token: MediaFileToken,

  pub media_class: MediaFileClass,
  pub media_type: MediaFileType,
  pub maybe_engine_category: Option<MediaFileEngineCategory>,

  pub maybe_mime_type: Option<String>,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub maybe_animation_type: Option<MediaFileAnimationType>,

  pub creator_set_visibility: Visibility,

  pub maybe_title: Option<String>,

  // NB: Not all datatypes are supported in the SQL DSL, so we have a copy of the title:
  // https://opensearch.org/docs/latest/search-plugins/sql/datatypes/
  pub maybe_title_as_keyword: Option<String>,

  // *** NB: Never put the bucket path to the model in Elasticsearch ! ***

  pub maybe_cover_image_media_file_token: Option<MediaFileToken>,
  pub maybe_cover_image_public_bucket_hash: Option<String>,
  pub maybe_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_cover_image_public_bucket_extension: Option<String>,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,

  /// Whether the file is featured.
  pub is_featured: bool,

  /// NB: Optional as of 2024-08-27, but will become mandatory.
  pub is_user_upload: Option<bool>,

  /// NB: Optional as of 2024-08-27, but will become mandatory.
  pub is_intermediate_system_file: Option<bool>,

  /// When we read the record from the database
  pub database_read_time: DateTime<Utc>,

  /// Calculated as "either user or mod deleted"
  pub is_deleted: bool,
}

impl Document for MediaFileDocument {
  fn get_document_id(&self) -> String {
    self.token.to_string()
  }

  fn get_document_path(&self) -> PathBuf {
    let document_id = self.get_document_id();
    PathBuf::from(format!("/{MEDIA_FILE_INDEX}/_doc/{document_id}"))
  }
}
