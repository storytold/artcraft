use crate::common::responses::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::common::responses::media_links::MediaLinks;
use crate::common::responses::user_details_light::UserDetailsLight;
use chrono::{DateTime, Utc};
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use utoipa::ToSchema;

pub const LIST_BATCH_GENERATED_REDUX_MEDIA_FILES_URL_PATH: &str = "/v1/media_files/batch_gen_redux";

/// For the URL PathInfo
#[derive(Serialize, Deserialize, ToSchema)]
pub struct ListBatchGeneratedReduxMediaFilesPathInfo {
  pub token: BatchGenerationToken,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ListBatchGeneratedReduxMediaFilesSuccessResponse {
  pub success: bool,
  pub media_files: Vec<BatchGeneratedReduxMediaFileInfo>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct BatchGeneratedReduxMediaFileInfo {
  /// Primary key identifier
  pub token: MediaFileToken,

  /// The coarse-grained class of media file: image, video, etc.
  pub media_class: MediaFileClass,

  /// Type of media will dictate which fields are populated and what
  /// the frontend should display (e.g. video player vs audio player).
  /// This is closer in meaning to a "mime type".
  pub media_type: MediaFileType,

  /// If the file was generated as part of a batch, this is the token for the batch.
  pub maybe_batch_token: Option<BatchGenerationToken>,

  /// Rich CDN links to the media, including thumbnails, previews, and more.
  pub media_links: MediaLinks,

  /// Information about the cover image. Many media files do not require a cover image,
  /// e.g. image files, video files with thumbnails, audio files, etc.
  /// 3D files require them.
  pub cover_image: MediaFileCoverImageDetails,

  /// User info.
  pub maybe_creator_user: Option<UserDetailsLight>,

  /// File visibility.
  pub creator_set_visibility: Visibility,

  /// The foreign key to the prompt used to generate the media, if applicable.
  pub maybe_prompt_token: Option<PromptToken>,

  /// The name or title of the media file (optional)
  pub maybe_title: Option<String>,

  /// The original filename for uploaded files, if they were provided.
  /// In the future we'll provide our own internal optional filenames.
  pub maybe_original_filename: Option<String>,

  /// Duration for audio and video files, if available.
  /// Measured in milliseconds.
  pub maybe_duration_millis: Option<u64>,

  /// Created timestamp
  pub created_at: DateTime<Utc>,

  /// Updated timestamp
  pub updated_at: DateTime<Utc>,
}
