//! Download + ffprobe reference videos for input-seconds billing.
//!
//! Models that bill reference-video input seconds (e.g. Seedance 2.5) need
//! ACCURATE durations. The `media_files` row's stored duration isn't always
//! set and isn't always correct, so every reference video is downloaded and
//! ffprobed — the database is never trusted for billing.
//!
//! The downloaded files are kept on disk inside [`ProbedReferenceVideos`]
//! and handed to the router (via `predownloaded_media_paths` on the draft
//! context) so the subsequent provider upload reuses the bytes instead of
//! downloading them a second time. Dropping the struct deletes the files, so
//! callers must keep it alive until the provider upload completes.
//!
//! Two phases so callers never hold a pooled DB connection across the slow
//! download/probe work:
//!
//! 1. [`fetch_reference_video_sources`] — DB fetch (CDN URLs) on the
//!    caller's connection.
//! 2. [`download_and_probe_reference_videos`] — downloads each unique file
//!    once and ffprobes it. Callers should DROP their pooled connection
//!    before this phase and re-acquire after.
//!
//! Billing math: each file's duration is rounded UP to a whole second, and
//! counted once per reference (the same file referenced twice bills twice).
//!
//! Probing NEVER fails a generation: a file whose download or ffprobe fails
//! is billed at the worst-case [`MAX_BILLED_INPUT_SECONDS`] instead (and is
//! not kept on disk — the provider upload re-downloads it itself).

use std::collections::HashMap;
use std::convert::TryFrom;
use std::path::PathBuf;

use actix_web::HttpRequest;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use ffmpeg_utils::ffprobe::ffprobe_get_info::ffprobe_get_info;
use kinovi_web_client::generate::video::generate_seedance_2p5::MAX_BILLED_INPUT_SECONDS;
use log::{error, info, warn};
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

/// Downloaded + ffprobed reference videos.
///
/// Keep this alive until the provider upload completes — dropping it deletes
/// the downloaded temp files.
pub struct ProbedReferenceVideos {
  /// Sum of per-file ffprobed durations, each rounded UP to a whole second,
  /// counted once per reference (duplicates bill per reference).
  pub total_input_seconds: u16,

  /// Source CDN URL → local temp file path, one entry per unique file.
  /// Pass to the router as `predownloaded_media_paths` so uploads reuse the
  /// already-downloaded bytes.
  local_paths_by_url: HashMap<String, PathBuf>,

  /// Owns the downloaded files; they are deleted when this struct drops.
  _temp_files: Vec<NamedTempFile>,
}

impl ProbedReferenceVideos {
  pub fn local_paths_by_url(&self) -> &HashMap<String, PathBuf> {
    &self.local_paths_by_url
  }
}

/// One requested reference video (duplicates preserved, in request order).
pub struct ReferenceVideoSource {
  pub media_token: MediaFileToken,
  pub cdn_url: String,
}

/// Phase 1 (DB): resolve each reference video token to its CDN URL.
///
/// Returns one entry per requested token, in order, with duplicates
/// preserved (the same file referenced twice bills twice). Unknown tokens
/// are a 400.
pub async fn fetch_reference_video_sources(
  video_tokens: &[MediaFileToken],
  http_request: &HttpRequest,
  server_environment: ServerEnvironment,
  mysql_connection: &mut PoolConnection<MySql>,
) -> Result<Vec<ReferenceVideoSource>, CommonWebError> {
  const CAN_SEE_DELETED: bool = false;

  if video_tokens.is_empty() {
    return Ok(Vec::new());
  }

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

  let cdn_urls_by_token: HashMap<MediaFileToken, String> = media_files
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

      (file.token, media_links.cdn_url.to_string())
    })
    .collect();

  Ok(video_tokens
    .iter()
    .filter_map(|token| {
      cdn_urls_by_token.get(token).map(|cdn_url| ReferenceVideoSource {
        media_token: token.clone(),
        cdn_url: cdn_url.clone(),
      })
    })
    .collect())
}

/// Phase 2 (no DB): download each unique file once, ffprobe it, and sum the
/// billed input seconds. Callers must not hold a pooled DB connection across
/// this call.
///
/// Infallible by design: a file that can't be downloaded or probed is billed
/// at the worst-case [`MAX_BILLED_INPUT_SECONDS`] rather than failing the
/// generation, and its temp file isn't kept (the provider upload re-downloads
/// files that aren't in the predownloaded map).
pub async fn download_and_probe_reference_videos(
  sources: &[ReferenceVideoSource],
) -> ProbedReferenceVideos {
  let mut temp_files: Vec<NamedTempFile> = Vec::new();
  let mut local_paths_by_url: HashMap<String, PathBuf> = HashMap::new();
  let mut seconds_by_url: HashMap<String, u64> = HashMap::new();

  for source in sources {
    if seconds_by_url.contains_key(&source.cdn_url) {
      continue; // Already downloaded and probed this file.
    }

    let billed_seconds = match download_and_probe_one(source).await {
      Ok((temp_file, duration_millis)) => {
        info!("Probed reference video {} at {}ms", source.media_token, duration_millis);
        local_paths_by_url.insert(source.cdn_url.clone(), temp_file.path().to_path_buf());
        temp_files.push(temp_file);
        duration_millis.div_ceil(1_000)
      }
      Err(err) => {
        warn!(
          "Failed to download/probe reference video {}; billing the {}s worst case: {:?}",
          source.media_token, MAX_BILLED_INPUT_SECONDS, err,
        );
        u64::from(MAX_BILLED_INPUT_SECONDS)
      }
    };

    seconds_by_url.insert(source.cdn_url.clone(), billed_seconds);
  }

  let total_input_seconds = total_billed_seconds(sources, &seconds_by_url);

  ProbedReferenceVideos {
    total_input_seconds,
    local_paths_by_url,
    _temp_files: temp_files,
  }
}

/// Sum per-reference (so duplicates bill per reference), saturating at
/// `u16::MAX`.
fn total_billed_seconds(
  sources: &[ReferenceVideoSource],
  seconds_by_url: &HashMap<String, u64>,
) -> u16 {
  let total: u64 = sources
    .iter()
    .filter_map(|source| seconds_by_url.get(&source.cdn_url))
    .sum();
  u16::try_from(total).unwrap_or(u16::MAX)
}

async fn download_and_probe_one(
  source: &ReferenceVideoSource,
) -> Result<(NamedTempFile, u64), CommonWebError> {
  let temp_file = download_reference_video(source).await?;
  let duration_millis = probe_video_duration_millis(source, &temp_file)?;
  Ok((temp_file, duration_millis))
}

async fn download_reference_video(source: &ReferenceVideoSource) -> Result<NamedTempFile, CommonWebError> {
  let mut temp_file = NamedTempFile::new().map_err(|err| {
    error!("Failed to create temp file for reference video {}: {:?}", source.media_token, err);
    CommonWebError::server_error_with_message("failed to probe reference video duration")
  })?;

  http_download_url_to_tempfile(&source.cdn_url, &mut temp_file)
    .await
    .map_err(|err| {
      error!("Failed to download reference video {} for probing: {:?}", source.media_token, err);
      CommonWebError::server_error_with_message("failed to probe reference video duration")
    })?;

  Ok(temp_file)
}

fn probe_video_duration_millis(
  source: &ReferenceVideoSource,
  temp_file: &NamedTempFile,
) -> Result<u64, CommonWebError> {
  let video_info = ffprobe_get_info(&temp_file.path()).map_err(|err| {
    error!("ffprobe failed for reference video {}: {:?}", source.media_token, err);
    CommonWebError::server_error_with_message("failed to probe reference video duration")
  })?;

  video_info.duration
    .map(|duration| duration.millis as u64)
    .ok_or_else(|| {
      error!("ffprobe returned no duration for reference video {}", source.media_token);
      CommonWebError::server_error_with_message("failed to probe reference video duration")
    })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn durations_round_up_per_file_and_sum() {
    // 6.2s → 7, 7.0s → 7: total 14.
    let sources = [source("m_a", "https://cdn/a.mp4"), source("m_b", "https://cdn/b.mp4")];
    let seconds = seconds_map(&[("https://cdn/a.mp4", 6_200), ("https://cdn/b.mp4", 7_000)]);
    assert_eq!(total_billed_seconds(&sources, &seconds), 14);
  }

  #[test]
  fn duplicate_references_bill_per_reference() {
    // The same 9.001s file referenced twice bills 10 + 10 = 20.
    let sources = [source("m_a", "https://cdn/a.mp4"), source("m_a", "https://cdn/a.mp4")];
    let seconds = seconds_map(&[("https://cdn/a.mp4", 9_001)]);
    assert_eq!(total_billed_seconds(&sources, &seconds), 20);
  }

  #[test]
  fn empty_sources_sum_to_zero() {
    assert_eq!(total_billed_seconds(&[], &HashMap::new()), 0);
  }

  #[test]
  fn total_saturates_at_u16_max() {
    let sources = [source("m_a", "https://cdn/a.mp4")];
    let seconds = seconds_map(&[("https://cdn/a.mp4", u64::from(u32::MAX) * 1_000)]);
    assert_eq!(total_billed_seconds(&sources, &seconds), u16::MAX);
  }

  fn source(token: &str, url: &str) -> ReferenceVideoSource {
    ReferenceVideoSource {
      media_token: MediaFileToken::new(token.to_string()),
      cdn_url: url.to_string(),
    }
  }

  fn seconds_map(entries: &[(&str, u64)]) -> HashMap<String, u64> {
    entries
      .iter()
      .map(|(url, millis)| (url.to_string(), millis.div_ceil(1_000)))
      .collect()
  }
}
