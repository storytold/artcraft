use std::collections::HashSet;

use log::{info, warn};
use once_cell::sync::Lazy;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mimetypes::mimetype_to_extension::mimetype_to_extension;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_file_upload::{insert_media_file_from_file_upload, InsertMediaFileFromUploadArgs, UploadType};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;

/// The kind of media we expect at a given URL. Determines the permitted mime
/// types, the bucket path prefix, and how the `media_files` row is classified.
#[derive(Clone, Copy, Debug)]
pub enum MediaUploadKind {
  Image,
  Video,
  Audio,
}

/// Download a user-supplied URL, store its bytes in the public R2 bucket, and
/// insert a `media_files` record owned by the API user. Returns the new
/// `MediaFileToken` so the caller can treat the URL input as a media token from
/// here on.
///
/// NB: this performs a network download followed by an R2 upload — do NOT call
/// it while holding a pooled MySQL connection (the insert acquires its own).
pub async fn upload_url_to_media_file(
  server_state: &ServerState,
  user_token: &UserToken,
  ip_address: &str,
  url: &str,
  kind: MediaUploadKind,
) -> Result<MediaFileToken, CommonWebError> {
  // ==================== DOWNLOAD ==================== //

  let file_bytes = http_download_url_to_bytes(url)
    .await
    .map_err(|err| {
      warn!("Failed to download media URL {}: {:?}", url, err);
      CommonWebError::BadInputWithSimpleMessage(format!("Failed to download URL: {}", url))
    })?;

  // ==================== MIME VALIDATION ==================== //

  let mimetype = get_mimetype_for_bytes(file_bytes.as_ref())
    .map(|mimetype| mimetype.to_string())
    .ok_or_else(|| {
      warn!("Could not determine mimetype for URL: {}", url);
      CommonWebError::BadInputWithSimpleMessage(
        format!("Could not determine file type for URL: {}", url))
    })?;

  if !kind.allowed_mime_types().contains(mimetype.as_str()) {
    // NB: Don't let our error message echo back malicious strings.
    let filtered_mimetype = mimetype
      .chars()
      .filter(|c| c.is_ascii())
      .filter(|c| c.is_alphanumeric() || *c == '/')
      .collect::<String>();
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("Unpermitted mime type for URL {}: {}", url, filtered_mimetype)));
  }

  // ==================== OTHER FILE METADATA ==================== //

  let extension = mimetype_to_extension(&mimetype)
    .ok_or_else(|| {
      warn!("Could not determine file extension for mimetype: {}", &mimetype);
      CommonWebError::server_error_with_message("Could not determine file extension")
    })?;
  let extension = format!(".{extension}"); // NB: needs dot prefix

  let file_size_bytes = file_bytes.len() as u64;

  let hash = sha256_hash_bytes(file_bytes.as_ref())
    .map_err(|err| {
      warn!("Problem hashing bytes for URL {}: {:?}", url, err);
      CommonWebError::server_error_with_message("Could not hash downloaded file")
    })?;

  // ==================== UPLOAD TO R2 ==================== //

  let prefix = kind.bucket_prefix();
  let public_upload_path = MediaFileBucketPath::generate_new(Some(prefix), Some(&extension));

  info!("Uploading URL media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    &mimetype,
  )
    .await
    .map_err(|err| {
      warn!("Upload URL media bytes to bucket error: {:?}", err);
      CommonWebError::server_error_with_message("Could not store downloaded file")
    })?;

  // ==================== INSERT MEDIA FILE ==================== //

  let (token, record_id) = insert_media_file_from_file_upload(InsertMediaFileFromUploadArgs {
    maybe_media_class: Some(kind.media_file_class()),
    media_file_type: kind.media_file_type(&mimetype),
    maybe_creator_user_token: Some(user_token),
    // NB: AVT (anonymous visitor) tokens are a web-session concept; API-key callers have none.
    maybe_creator_anonymous_visitor_token: None,
    creator_ip_address: ip_address,
    creator_set_visibility: Visibility::default(),
    upload_type: UploadType::Filesystem,
    maybe_engine_category: None,
    maybe_animation_type: None,
    maybe_mime_type: Some(&mimetype),
    maybe_prompt_token: None,
    maybe_batch_token: None,
    file_size_bytes,
    // NB: Duration would require probing the file on disk; URL inputs skip it.
    maybe_duration_millis: None,
    sha256_checksum: &hash,
    maybe_title: None,
    maybe_scene_source_media_file_token: None,
    is_intermediate_system_file: false,
    maybe_generation_provider: None,
    public_bucket_directory_hash: public_upload_path.get_object_hash(),
    maybe_public_bucket_prefix: Some(prefix),
    maybe_public_bucket_extension: Some(&extension),
    pool: &server_state.mysql_pool,
  })
    .await
    .map_err(|err| {
      warn!("Failed to insert media file from URL {}: {:?}", url, err);
      CommonWebError::server_error_with_message("Could not save downloaded file")
    })?;

  info!("New media file from URL id: {} token: {:?}", record_id, &token);

  Ok(token)
}

static IMAGE_MIME_TYPES: Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ])
});

static VIDEO_MIME_TYPES: Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    "video/mp4",
  ])
});

static AUDIO_MIME_TYPES: Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    "audio/aac",
    "audio/m4a",
    "audio/mpeg",
    "audio/ogg",
    "audio/opus",
    "audio/x-flac",
    "audio/x-wav",
    "audio/mp4",
    "video/mp4",
    "video/webm",
  ])
});

impl MediaUploadKind {
  fn allowed_mime_types(&self) -> &'static HashSet<&'static str> {
    match self {
      MediaUploadKind::Image => &IMAGE_MIME_TYPES,
      MediaUploadKind::Video => &VIDEO_MIME_TYPES,
      MediaUploadKind::Audio => &AUDIO_MIME_TYPES,
    }
  }

  fn bucket_prefix(&self) -> &'static str {
    match self {
      MediaUploadKind::Image => "image_",
      MediaUploadKind::Video => "video_",
      MediaUploadKind::Audio => "aud_",
    }
  }

  fn media_file_class(&self) -> MediaFileClass {
    match self {
      MediaUploadKind::Image => MediaFileClass::Image,
      MediaUploadKind::Video => MediaFileClass::Video,
      MediaUploadKind::Audio => MediaFileClass::Audio,
    }
  }

  fn media_file_type(&self, mimetype: &str) -> MediaFileType {
    match self {
      MediaUploadKind::Image => match mimetype {
        "image/jpeg" => MediaFileType::Jpg,
        "image/png" => MediaFileType::Png,
        "image/gif" => MediaFileType::Gif,
        _ => MediaFileType::Image,
      },
      MediaUploadKind::Video => MediaFileType::Video,
      MediaUploadKind::Audio => MediaFileType::Audio,
    }
  }
}
