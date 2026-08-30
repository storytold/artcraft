//! Types for `GET /v1/media_files/by_job/{job_token}` — list the media files
//! produced by an inference job.

use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

use crate::common::responses::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::common::responses::media_links::MediaLinks;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ListMediaFilesByJobSuccessResponse {
  pub success: bool,

  /// The job's output files, oldest first.
  pub media_files: Vec<JobMediaFileInfo>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct JobMediaFileInfo {
  pub token: MediaFileToken,

  /// The coarse-grained class of media file: image, video, etc.
  pub media_class: MediaFileClass,

  /// Type of media will dictate which fields are populated and what
  /// the frontend should display (eg. video player vs audio player).
  /// This is closer in meaning to a "mime type".
  pub media_type: MediaFileType,

  /// If the file was generated as part of a batch, this is the token for the batch.
  pub maybe_batch_token: Option<BatchGenerationToken>,

  /// The foreign key to the prompt used to generate the media, if applicable.
  pub maybe_prompt_token: Option<PromptToken>,

  /// Rich CDN links to the media, including thumbnails, previews, and more.
  pub media_links: MediaLinks,

  /// Information about the cover image. Many media files do not require a cover image,
  /// e.g. image files, video files with thumbnails, audio files, etc.
  /// 3D files require them.
  pub cover_image: MediaFileCoverImageDetails,

  /// The original filename for uploaded files, if they were provided.
  /// In the future we'll provide our own internal optional filenames.
  pub maybe_original_filename: Option<String>,

  /// Duration for audio and video files, if available.
  /// Measured in milliseconds.
  pub maybe_duration_millis: Option<u64>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
