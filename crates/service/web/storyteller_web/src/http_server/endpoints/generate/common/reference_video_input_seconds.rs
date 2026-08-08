//! Sum the combined runtime of reference videos for models that bill
//! reference-video input seconds (e.g. Seedance 2.5).
//!
//! Two phases so callers never hold a pooled DB connection across the slow
//! probing work:
//!
//! 1. [`fetch_reference_video_files`] — DB fetch (durations + CDN URLs) on
//!    the caller's connection.
//! 2. [`sum_reference_video_input_seconds`] — pure computation, except that
//!    files with no stored duration are downloaded and ffprobed. Callers
//!    should DROP their pooled connection before this phase and re-acquire
//!    after.
//!
//! Each file's duration is rounded UP to a whole second before summing.

use std::collections::HashMap;
use std::convert::TryFrom;

use actix_web::HttpRequest;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use ffmpeg_utils::ffprobe::ffprobe_get_info::ffprobe_get_info;
use log::{error, warn};
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::batch_get_media_files_by_tokens_with_connection;
use server_environment::ServerEnvironment;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tempfile::NamedTempFile;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::util::http_download_url_to_tempfile::http_download_url_to_tempfile;

/// One reference video: the stored duration (when the upload path recorded
/// it) plus a CDN URL to probe as a fallback.
#[derive(Clone)]
pub struct ReferenceVideoFile {
  pub media_token: MediaFileToken,
  pub maybe_duration_millis: Option<u64>,
  pub cdn_url: String,
}

/// Phase 1 (DB): fetch each reference video's stored duration and CDN URL.
pub async fn fetch_reference_video_files(
  video_tokens: &[MediaFileToken],
  http_request: &HttpRequest,
  server_environment: ServerEnvironment,
  mysql_connection: &mut PoolConnection<MySql>,
) -> Result<Vec<ReferenceVideoFile>, CommonWebError> {
  const CAN_SEE_DELETED: bool = false;

  if video_tokens.is_empty() {
    return Ok(Vec::new());
  }

  // The same video can be referenced more than once (@video1 and @video2
  // pointing at one file) — fetch each unique token once, but bill every
  // reference below by expanding the results back over `video_tokens`.
  let mut unique_tokens: Vec<MediaFileToken> = Vec::new();
  for token in video_tokens {
    if !unique_tokens.contains(token) {
      unique_tokens.push(token.clone());
    }
  }

  let media_files = batch_get_media_files_by_tokens_with_connection(
    mysql_connection,
    &unique_tokens,
    CAN_SEE_DELETED,
  ).await.map_err(|err| {
    error!("Error getting reference video media files by tokens: {:?}", err);
    CommonWebError::from_anyhow_error(err)
  })?;

  if media_files.len() != unique_tokens.len() {
    warn!("Only {} of {} unique reference video media files could be found",
      media_files.len(), unique_tokens.len());
    return Err(CommonWebError::BadInputWithSimpleMessage(
      "not all reference video media files could be found".to_string()));
  }

  let media_domain = get_media_domain(http_request);

  let files_by_token: HashMap<MediaFileToken, ReferenceVideoFile> = media_files
    .into_iter()
    .map(|file| {
      let bucket_path = MediaFileBucketPath::from_object_hash(
        &file.public_bucket_directory_hash,
        file.maybe_public_bucket_prefix.as_deref(),
        file.maybe_public_bucket_extension.as_deref());

      let media_links = MediaLinksBuilder::from_media_path_and_env(
        media_domain,
        server_environment,
        &bucket_path);

      // Videos should carry a stored duration from upload-time probing, but
      // don't trust it for other media classes.
      let maybe_duration_millis = if file.media_class == MediaFileClass::Video {
        file.maybe_duration_millis
      } else {
        None
      };

      let reference = ReferenceVideoFile {
        media_token: file.token.clone(),
        maybe_duration_millis,
        cdn_url: media_links.cdn_url.to_string(),
      };
      (file.token, reference)
    })
    .collect();

  Ok(video_tokens
    .iter()
    .filter_map(|token| files_by_token.get(token).cloned())
    .collect())
}

/// Phase 2 (no DB): sum the durations, rounding each file UP to a whole
/// second. Files with no stored duration are downloaded and ffprobed —
/// callers must not hold a pooled DB connection across this call.
pub async fn sum_reference_video_input_seconds(
  video_files: &[ReferenceVideoFile],
) -> Result<u16, CommonWebError> {
  let mut total_seconds: u64 = 0;

  for file in video_files {
    let duration_millis = match file.maybe_duration_millis {
      Some(millis) => millis,
      None => probe_video_duration_millis(file).await?,
    };

    // Round up to the next whole second.
    total_seconds += duration_millis.div_ceil(1_000);
  }

  Ok(u16::try_from(total_seconds).unwrap_or(u16::MAX))
}

/// Download the video and ffprobe its duration.
async fn probe_video_duration_millis(file: &ReferenceVideoFile) -> Result<u64, CommonWebError> {
  let mut temp_file = NamedTempFile::new().map_err(|err| {
    error!("Failed to create temp file for reference video probe: {:?}", err);
    CommonWebError::server_error_with_message("failed to probe reference video duration")
  })?;

  http_download_url_to_tempfile(&file.cdn_url, &mut temp_file)
    .await
    .map_err(|err| {
      error!("Failed to download reference video {} for probing: {:?}", file.media_token, err);
      CommonWebError::server_error_with_message("failed to probe reference video duration")
    })?;

  let video_info = ffprobe_get_info(&temp_file.path()).map_err(|err| {
    error!("ffprobe failed for reference video {}: {:?}", file.media_token, err);
    CommonWebError::server_error_with_message("failed to probe reference video duration")
  })?;

  video_info.duration
    .map(|duration| duration.millis as u64)
    .ok_or_else(|| {
      error!("ffprobe returned no duration for reference video {}", file.media_token);
      CommonWebError::server_error_with_message("failed to probe reference video duration")
    })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn durations_round_up_per_file_and_sum() {
    // 6.2s → 7, 7.0s → 7: total 14 (matches the two-seven-second-references
    // pricing example when each file is a hair over/at 7s).
    let files = vec![
      stored_duration_file("m_a", 6_200),
      stored_duration_file("m_b", 7_000),
    ];
    assert_eq!(sum_reference_video_input_seconds(&files).await.unwrap(), 14);
  }

  #[tokio::test]
  async fn single_file_rounds_up() {
    let files = vec![stored_duration_file("m_a", 9_001)];
    assert_eq!(sum_reference_video_input_seconds(&files).await.unwrap(), 10);
  }

  #[tokio::test]
  async fn empty_list_sums_to_zero() {
    assert_eq!(sum_reference_video_input_seconds(&[]).await.unwrap(), 0);
  }

  fn stored_duration_file(token: &str, duration_millis: u64) -> ReferenceVideoFile {
    ReferenceVideoFile {
      media_token: MediaFileToken::new(token.to_string()),
      maybe_duration_millis: Some(duration_millis),
      cdn_url: "https://example.com/video.mp4".to_string(),
    }
  }
}
