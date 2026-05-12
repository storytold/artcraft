use std::collections::HashSet;
use std::io::Read;
use std::path::PathBuf;
use std::sync::Arc;

use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::text::Text;
use actix_multipart::form::MultipartForm;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use once_cell::sync::Lazy;
use utoipa::ToSchema;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use http_server_common::request::get_request_ip::get_request_ip;
use media::decode_basic_audio_info::decode_basic_audio_bytes_info;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mimetypes::mimetype_to_extension::mimetype_to_extension;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_file_upload::{insert_media_file_from_file_upload, InsertMediaFileFromUploadArgs, UploadType};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::endpoints::media_files::upload::common_utils::try_parse_generation_provider::try_parse_generation_provider;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;

/// Form-multipart request fields.
///
/// IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UploadAudioMediaFileForm` (Under "Schema") FOR DETAILS ON FIELDS AND NULLABILITY.
#[derive(MultipartForm, ToSchema)]
#[multipart(duplicate_field = "deny")]
pub struct UploadAudioMediaFileForm {
  /// UUID for request idempotency
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = String, format = Binary)]
  uuid_idempotency_token: Text<String>,

  // TODO: is MultipartBytes better than TempFile ?
  /// The uploaded file
  #[multipart(limit = "512 MiB")]
  #[schema(value_type = Vec<u8>, format = Binary)]
  file: TempFile,

  /// Optional: Title (name) of the scene
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_title: Option<Text<String>>,

  /// Optional: Visibility of the scene
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<Visibility>, format = Binary)]
  maybe_visibility: Option<Text<Visibility>>,

  /// Optional: The third-party generation provider (e.g. "fal", "replicate").
  /// If set, `is_user_upload` will be false and `is_intermediate_system_file` will be forced false.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_generation_provider: Option<Text<String>>,
}

// Unlike the "upload" endpoints, which are pure inserts, these endpoints are *upserts*.
#[derive(Serialize, ToSchema)]
pub struct UploadAudioMediaFileSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}

static ALLOWED_MIME_TYPES : Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    // Audio
    "audio/aac",
    "audio/m4a",
    "audio/mpeg",
    "audio/ogg",
    "audio/opus",
    "audio/x-flac",
    "audio/x-wav",
    // Mixed
    "audio/mp4", // iPhone seems to upload these as audio
    // Video
    "video/mp4", // TODO(bt,2024-05-01): Do we want to allow these as audio?
    "video/webm", // TODO(bt,2024-05-01): Do we want to allow these as audio?
  ])
});

/// This endpoint is for uploading audio files.
#[utoipa::path(
  post,
  tag = "Media Files (Upload)",
  path = "/v1/media_files/upload/audio",
  responses(
    (status = 200, description = "Success Update", body = UploadAudioMediaFileSuccessResponse),
    (status = 400, description = "Bad input", body = MediaFileUploadError),
    (status = 401, description = "Not authorized", body = MediaFileUploadError),
    (status = 429, description = "Too many requests", body = MediaFileUploadError),
    (status = 500, description = "Server error", body = MediaFileUploadError),
  ),
  params(
    (
      "request" = UploadAudioMediaFileForm,
      description = "IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UploadAudioMediaFileForm` (Under 'Schema') FOR DETAILS ON FIELDS AND NULLABILITY."
    ),
  )
)]
pub async fn upload_audio_media_file_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  MultipartForm(mut form): MultipartForm<UploadAudioMediaFileForm>,
) -> Result<Json<UploadAudioMediaFileSuccessResponse>, MediaFileUploadError> {

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("MySql pool error: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  // ==================== READ SESSION ==================== //

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        error!("Session checker error: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  let maybe_user_token = maybe_user_session
      .as_ref()
      .map(|session| session.get_strongly_typed_user_token());

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(&http_request);

  // ==================== BANNED USERS ==================== //

  if let Some(ref user) = maybe_user_session {
    if user.is_banned {
      return Err(MediaFileUploadError::NotAuthorizedVerbose("user is banned".to_string()));
    }
  }

  // ==================== RATE LIMIT ==================== //

  let rate_limiter = match maybe_user_session {
    None => &server_state.redis_rate_limiters.file_upload_logged_out,
    Some(ref _session) => &server_state.redis_rate_limiters.file_upload_logged_in,
  };

  if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
    return Err(MediaFileUploadError::RateLimited);
  }

  // ==================== HANDLE IDEMPOTENCY ==================== //

  // TODO(bt, 2024-02-26): This should be a transaction.
  let uuid_idempotency_token = form.uuid_idempotency_token.as_ref();

  if let Err(reason) = validate_idempotency_token_format(uuid_idempotency_token) {
    return Err(MediaFileUploadError::BadInput(reason));
  }

  insert_idempotency_token(uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        MediaFileUploadError::BadInput("invalid idempotency token".to_string())
      })?;

  // ==================== UPLOAD METADATA ==================== //

  let maybe_title = form.maybe_title
      .map(|title| title.trim().to_string())
      .filter(|title| !title.is_empty());

  let creator_set_visibility = form.maybe_visibility
      .map(|visibility| visibility.0)
      .or_else(|| {
        maybe_user_session
            .as_ref()
            .map(|user_session| user_session.preferred_tts_result_visibility)
      })
      .unwrap_or(Visibility::default());

  // ==================== USER DATA ==================== //

  let ip_address = get_request_ip(&http_request);

  // ==================== FILE VALIDATION ==================== //

  let mut file_bytes = Vec::new();
  form.file.file.read_to_end(&mut file_bytes)
      .map_err(|e| {
        error!("Problem reading file: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  let mimetype = get_mimetype_for_bytes(file_bytes.as_ref())
      .map(|mimetype| mimetype.to_string())
      .ok_or_else(|| {
        warn!("Could not determine mimetype for file");
        MediaFileUploadError::BadInput("Could not determine mimetype for file".to_string())
      })?;

  if !ALLOWED_MIME_TYPES.contains(mimetype.as_str()) {
    // NB: Don't let our error message inject malicious strings
    let filtered_mimetype = mimetype
        .chars()
        .filter(|c| c.is_ascii())
        .filter(|c| c.is_alphanumeric() || *c == '/')
        .collect::<String>();
    return Err(MediaFileUploadError::BadInput(format!("unpermitted mime type: {}", &filtered_mimetype)));
  }

  // ==================== DURATION DETECTION ==================== //

  let do_audio_decode = match mimetype.as_ref() {
    // TODO: Revisit when Safari can send us this metadata consistently
    "audio/mp4" | "video/mp4" => false,
    "audio/opus" => {
      // TODO/FIXME(bt, 2023-05-19): Symphonia is currently broken for Firefox's opus.
      //  We're on an off-master branch that may resolve the problem in the future, but for now
      //  it panics as follows:
      //
      //   [2023-05-19T10:25:34Z INFO  symphonia_core::probe] found a possible format marker within [4f, 67, 67, 53, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, d4, c5] @ 0+2 bytes.
      //   [2023-05-19T10:25:34Z INFO  symphonia_core::probe] found the format marker [4f, 67, 67, 53] @ 0+2 bytes.
      //   [2023-05-19T10:25:34Z DEBUG symphonia_format_ogg::page] grow page buffer to 8192 bytes
      //   [2023-05-19T10:25:34Z INFO  symphonia_format_ogg::demuxer] starting new physical stream
      //   [2023-05-19T10:25:34Z INFO  symphonia_format_ogg::demuxer] selected opus mapper for stream with serial=0x19aac5d4
      //   [2023-05-19T10:25:34Z INFO  media::decode_basic_audio_info] Probed!
      //   [2023-05-19T10:25:34Z INFO  media::decode_basic_audio_info] Find audio track...
      //   [2023-05-19T10:25:34Z INFO  media::decode_basic_audio_info] Found audio track (maybe)
      //   [2023-05-19T10:25:34Z INFO  media::decode_basic_audio_info] Maybe track duration: None
      //   [2023-05-19T10:25:34Z INFO  media::decode_basic_audio_info] Maybe codec short name: Some("opus")
      //   [2023-05-19T10:25:34Z INFO  media::decode_basic_audio_info] Opus handler
      //   [2023-05-19T10:25:34Z INFO  media::decode_basic_audio_info] Media source stream
      //   [2023-05-19T10:25:34Z INFO  media::decode_webm_opus_info] decode_mkv : options...
      //   [2023-05-19T10:25:34Z INFO  media::decode_webm_opus_info] decode_mkv : try_read...
      //   [2023-05-19T10:25:34Z DEBUG symphonia_format_mkv::ebml] element with tag: 4F67
      //   thread 'actix-rt|system:0|arbiter:1' panicked at 'assertion failed: `(left == right)`
      //     left: `Unknown`,
      //    right: `Ebml`: EBML element type must be checked before calling this function', /Users/bt/.cargo/git/checkouts/symphonia-8fbe6c90fc095688/e1a7009/symphonia-format-mkv/src/ebml.rs:335:9
      false
    }
    // Also, don't decode images
    "image/jpeg" => false,
    "image/png" => false,
    "image/webp" => false,
    _ => true,
  };

  let mut maybe_duration_millis = None;
  let mut maybe_codec_name = None;

  if do_audio_decode {
    let basic_info = decode_basic_audio_bytes_info(
      file_bytes.as_ref(),
      Some(&mimetype),
      None
    ).map_err(|e| {
      warn!("file decoding error: {:?}", e);
      MediaFileUploadError::BadInput("could not decode file".to_string())
    })?;

    maybe_duration_millis = basic_info.duration_millis;
    maybe_codec_name = basic_info.codec_name;
  }

  // ==================== OTHER FILE METADATA ==================== //

  let maybe_filename = form.file.file_name.as_deref()
      .as_deref()
      .map(|filename| PathBuf::from(filename));

  let extension = mimetype_to_extension(&mimetype)
      .or_else(|| {
        maybe_filename
            .as_ref()
            .and_then(|filename| filename.extension()) // TODO needs dot prefix
            .and_then(|ext| ext.to_str())
      })
      .ok_or_else(|| {
        warn!("Could not determine file extension for mimetype: {}", &mimetype);
        MediaFileUploadError::ServerError
      })?;

  let extension = format!(".{extension}"); // NB: needs dot prefix

  let file_size_bytes = file_bytes.len();

  let hash = sha256_hash_bytes(&file_bytes)
      .map_err(|io_error| {
        error!("Problem hashing bytes: {:?}", io_error);
        MediaFileUploadError::ServerError
      })?;

  // ==================== UPLOAD AND SAVE ==================== //

  const PREFIX : Option<&str> = Some("aud_");

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(&extension));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    &mimetype)
      .await
      .map_err(|e| {
        warn!("Upload media bytes to bucket error: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  let maybe_generation_provider = form.maybe_generation_provider
      .as_ref()
      .and_then(|text| try_parse_generation_provider(text.as_ref()));

  let upload_type = if maybe_generation_provider.is_some() {
    UploadType::ThirdPartyInference
  } else {
    UploadType::Filesystem
  };

  let (token, record_id) = insert_media_file_from_file_upload(InsertMediaFileFromUploadArgs {
    maybe_media_class: Some(MediaFileClass::Audio),
    media_file_type: MediaFileType::Audio,
    maybe_creator_user_token: maybe_user_token.as_ref(),
    maybe_creator_anonymous_visitor_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility,
    upload_type,
    maybe_engine_category: None,
    maybe_animation_type: None,
    maybe_prompt_token: None,
    maybe_batch_token: None,
    maybe_mime_type: Some(&mimetype),
    file_size_bytes: file_size_bytes as u64,
    maybe_duration_millis,
    sha256_checksum: &hash,
    maybe_title: maybe_title.as_deref(),
    maybe_scene_source_media_file_token: None,
    is_intermediate_system_file: false, // NB: is_user_upload = true
    maybe_generation_provider,
    public_bucket_directory_hash: public_upload_path.get_object_hash(),
    maybe_public_bucket_prefix: PREFIX,
    maybe_public_bucket_extension: Some(&extension),
    pool: &server_state.mysql_pool,
  })
      .await
      .map_err(|err| {
        warn!("New file creation DB error: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  info!("new media file id: {} token: {:?}", record_id, &token);

  Ok(Json(UploadAudioMediaFileSuccessResponse {
    success: true,
    media_file_token: token,
  }))
}
