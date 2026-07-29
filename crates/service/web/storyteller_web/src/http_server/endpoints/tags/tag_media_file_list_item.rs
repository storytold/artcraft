use chrono::{DateTime, Utc};
use serde_derive::Serialize;
use utoipa::ToSchema;

use artcraft_api_defs::common::responses::media_links::MediaLinks;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use mysql_queries::queries::media_files::list::media_file_list_row::MediaFileListRow;
use server_environment::ServerEnvironment;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

use crate::http_server::common_responses::media::media_domain::MediaDomain;
use crate::http_server::common_responses::media::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::http_server::common_responses::media::media_file_list_conversion::build_media_links_and_cover;

/// One media file as it appears in the tag-scoped media file lists
/// (untagged / tagged / with-tag). Same lean shape as the folder list
/// item. Intermediate system files are filtered out by the queries, so
/// the flag isn't part of the wire shape.
#[derive(Serialize, ToSchema)]
pub struct TagMediaFileListItem {
  pub token: MediaFileToken,

  /// Coarse-grained class (image / video / audio / dimensional).
  pub media_class: MediaFileClass,

  /// Specific format (jpg, png, mp4, etc.) — closer to a MIME type.
  pub media_type: MediaFileType,

  /// Link to the prompt
  pub maybe_prompt_token: Option<PromptToken>,

  /// If this file was generated as part of a batch, the batch token —
  /// useful for showing "siblings" in the UI.
  pub maybe_batch_token: Option<BatchGenerationToken>,

  /// Rich CDN links to the media itself (full URL, thumbnail template,
  /// video previews when applicable).
  pub media_links: MediaLinks,

  /// Cover image details. For files that don't carry their own cover
  /// image, this still gives the deterministic default-cover spec
  /// (image_index + color_index) the frontend uses for placeholders.
  pub cover_image: MediaFileCoverImageDetails,

  pub maybe_title: Option<String>,
  pub maybe_original_filename: Option<String>,

  /// Original pixel width / height for image and video files when known.
  pub maybe_frame_width: Option<i32>,
  pub maybe_frame_height: Option<i32>,

  /// Duration for audio and video files, if available. Milliseconds.
  pub maybe_duration_millis: Option<u64>,

  pub creator_set_visibility: Visibility,
  pub is_user_upload: bool,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub fn tag_media_file_row_to_list_item(
  row: MediaFileListRow,
  media_domain: MediaDomain,
  server_environment: ServerEnvironment,
) -> TagMediaFileListItem {
  let (media_links, cover_image) = build_media_links_and_cover(&row, media_domain, server_environment);

  TagMediaFileListItem {
    token: row.media_file_token,
    media_class: row.media_class,
    media_type: row.media_type,
    maybe_batch_token: row.maybe_batch_token,
    media_links,
    cover_image,
    creator_set_visibility: row.creator_set_visibility,
    is_user_upload: row.is_user_upload,
    maybe_title: row.maybe_title,
    maybe_prompt_token: row.maybe_prompt_token,
    maybe_original_filename: row.maybe_origin_filename,
    // Schema stores `INT(10)`; widen to u64 for the wire shape.
    maybe_duration_millis: row.maybe_duration_millis.map(|n| n as u64),
    maybe_frame_width: row.maybe_frame_width,
    maybe_frame_height: row.maybe_frame_height,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
