use chrono::{DateTime, Utc};

use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

/// The common media-file row shape shared by list queries (folder
/// listings, tag listings, etc.): the file's own metadata plus the
/// joined cover-image bucket fields the endpoints need to materialize
/// MediaLinks, MediaFileCoverImageDetails, and the rest of the typed
/// response shape.
///
/// Queries can `sqlx::query_as!` directly into this struct when they
/// select exactly these columns (alias `media_files.id` to
/// `media_file_id`, and the cover LEFT JOIN fields to the
/// `maybe_cover_*` names).
#[derive(Debug, Clone)]
pub struct MediaFileListRow {
  /// `media_files.id` — used as the pagination cursor.
  pub media_file_id: u64,

  pub media_file_token: MediaFileToken,
  pub media_class: MediaFileClass,
  pub media_type: MediaFileType,

  pub maybe_batch_token: Option<BatchGenerationToken>,

  // The media file's own bucket fields (caller uses these to build MediaLinks).
  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  // Cover image's bucket fields, from a LEFT JOIN on
  // mf.maybe_cover_image_media_file_token. All three are Some-or-None
  // together (matched / unmatched join row).
  pub maybe_cover_public_bucket_directory_hash: Option<String>,
  pub maybe_cover_public_bucket_prefix: Option<String>,
  pub maybe_cover_public_bucket_extension: Option<String>,

  pub creator_set_visibility: Visibility,
  pub is_user_upload: bool,

  pub maybe_title: Option<String>,
  pub maybe_prompt_token: Option<PromptToken>,
  pub maybe_origin_filename: Option<String>,

  pub maybe_duration_millis: Option<i32>,
  pub maybe_frame_width: Option<i32>,
  pub maybe_frame_height: Option<i32>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
