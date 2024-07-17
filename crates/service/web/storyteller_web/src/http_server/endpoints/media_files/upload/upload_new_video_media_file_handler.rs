use std::collections::HashSet;
use std::io::{BufReader, Bytes, Cursor, Read};
use std::path::PathBuf;
use std::sync::Arc;

use actix_multipart::form::MultipartForm;
use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::text::Text;
use actix_multipart::Multipart;
use actix_web::{HttpRequest, HttpResponse, web};
use log::{debug, error, info, warn};
use once_cell::sync::Lazy;
use stripe::CreatePaymentLinkShippingAddressCollectionAllowedCountries::Mf;
use utoipa::ToSchema;

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_subtype::MediaFileSubtype;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use filesys::path_to_string::path_to_string;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use http_server_common::request::get_request_ip::get_request_ip;
use media::decode_basic_audio_info::decode_basic_audio_bytes_info;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mimetypes::mimetype_to_extension::mimetype_to_extension;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::create::insert_media_file_from_file_upload::{insert_media_file_from_file_upload, InsertMediaFileFromUploadArgs, UploadType};
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use tokens::tokens::media_files::MediaFileToken;
use videos::get_mp4_info::{get_mp4_info, get_mp4_info_for_bytes, get_mp4_info_for_bytes_and_len};
use thumbnail_generator::task_client::thumbnail_task::{ThumbnailTaskBuilder, ThumbnailTaskInputMimeType};

use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::state::server_state::ServerState;
use crate::util::check_creator_tokens::{check_creator_tokens, CheckCreatorTokenArgs, CheckCreatorTokenResult};
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;

/// Form-multipart request fields.
///
/// IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UploadNewVideoMediaFileForm` (Under "Schema") FOR DETAILS ON FIELDS AND NULLABILITY.
#[derive(MultipartForm, ToSchema)]
#[multipart(duplicate_field = "deny")]
pub struct UploadNewVideoMediaFileForm {
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

  /// Optional: Style transfer style used. See `StyleTransferName` for possible values.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<StyleTransferName>, format = Binary)]
  maybe_style_name: Option<Text<StyleTransferName>>,

  /// Optional: Visibility of the scene
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<Visibility>, format = Binary)]
  maybe_visibility: Option<Text<Visibility>>,

  /// Optional: If an engine scene was used to generate this video, provide it here to create a link.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<MediaFileToken>, format = Binary)]
  maybe_scene_source_media_file_token: Option<Text<MediaFileToken>>,

  /// Optional: Whether this is a system file (eg. cover files we should hide)
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<bool>, format = Binary)]
  is_intermediate_system_file: Option<Text<bool>>,
}

// Unlike the "upload" endpoints, which are pure inserts, these endpoints are *upserts*.
#[derive(Serialize, ToSchema)]
pub struct UploadNewVideoMediaFileSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}

static ALLOWED_MIME_TYPES : Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    // Video
    "video/mp4", // NB: Only mp4 for now.
  ])
});

/// This endpoint is for uploading video files.
#[utoipa::path(
  post,
  tag = "Media Files",
  path = "/v1/media_files/upload/new_video",
  responses(
    (status = 200, description = "Success Update", body = UploadNewVideoMediaFileSuccessResponse),
    (status = 400, description = "Bad input", body = MediaFileUploadError),
    (status = 401, description = "Not authorized", body = MediaFileUploadError),
    (status = 429, description = "Too many requests", body = MediaFileUploadError),
    (status = 500, description = "Server error", body = MediaFileUploadError),
  ),
  params(
    (
      "request" = UploadNewVideoMediaFileForm,
      description = "IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UploadNewVideoMediaFileForm` (Under 'Schema') FOR DETAILS ON FIELDS AND NULLABILITY."
    ),
  )
)]
pub async fn upload_new_video_media_file_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  MultipartForm(mut form): MultipartForm<UploadNewVideoMediaFileForm>,
) -> Result<HttpResponse, MediaFileUploadError> {

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

  if let Err(_err) = rate_limiter.rate_limit_request(&http_request) {
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

  let mp4_info = get_mp4_info_for_bytes(file_bytes.as_ref())
      .map_err(|err| {
        warn!("Error reading mp4 info: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

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

  const PREFIX : Option<&str> = Some("video_");

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

  let maybe_scene_source_media_file_token = form.maybe_scene_source_media_file_token
      .as_ref()
      .map(|token| &token.0);

  // NB: If we're uploading a video file that references an engine scene, then this is an engine
  // render video, and we should mark it as a system (hidden) file.
  let is_intermediate_system_file =
      maybe_scene_source_media_file_token.is_some() ||
      form.is_intermediate_system_file.map(|b| b.0).unwrap_or(false);

  let (token, record_id) = insert_media_file_from_file_upload(InsertMediaFileFromUploadArgs {
    maybe_media_class: Some(MediaFileClass::Video),
    media_file_type: MediaFileType::Video,
    maybe_creator_user_token: maybe_user_token.as_ref(),
    maybe_creator_anonymous_visitor_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility,
    upload_type: UploadType::Filesystem, // TODO(bt,2024-05-02): This should be a parameter and a well-known enum.
    maybe_engine_category: None,
    maybe_animation_type: None,
    maybe_mime_type: Some(&mimetype),
    file_size_bytes: file_size_bytes as u64,
    maybe_duration_millis:  Some(mp4_info.duration_millis as u64),
    sha256_checksum: &hash,
    maybe_title: maybe_title.as_deref(),
    maybe_scene_source_media_file_token: maybe_scene_source_media_file_token,
    is_intermediate_system_file,
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

  let thumbnail_task_result = ThumbnailTaskBuilder::new_for_source_mimetype(ThumbnailTaskInputMimeType::MP4)
    .with_bucket(server_state.public_bucket_client.bucket_name().as_str())
    .with_path(&*path_to_string(public_upload_path.to_full_object_pathbuf()))
    .with_output_suffix("thumb")
    .with_event_id(&token.to_string())
    .send_all()
    .await;

  match thumbnail_task_result {
    Ok(thumbnail_task) => {
      debug!("Thumbnail tasks sent: {:?}", thumbnail_task);
    },
    Err(e) => {
      error!("Failed to create some/all thumbnail tasks: {:?}", e);
    }
  }

  let response = UploadNewVideoMediaFileSuccessResponse {
    success: true,
    media_file_token: token,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| MediaFileUploadError::ServerError)?;

  return Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body));
}
