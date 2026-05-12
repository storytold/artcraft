use std::io::Read;
use std::path::PathBuf;
use std::sync::Arc;

use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::text::Text;
use actix_multipart::form::MultipartForm;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use utoipa::ToSchema;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use http_server_common::request::get_request_ip::get_request_ip;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_file_upload::{insert_media_file_from_file_upload, InsertMediaFileFromUploadArgs, UploadType};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::endpoints::media_files::upload::common_utils::try_parse_generation_provider::try_parse_generation_provider;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;

const GZIP_MIME_TYPE: &str = "application/gzip";
const SPZ_EXTENSION: &str = ".spz";
const CERAMIC_SPZ_EXTENSION: &str = ".ceramic.spz";

/// Form-multipart request fields for SPZ (Gaussian Splat) upload.
///
/// IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UploadSpzMediaFileForm` (Under "Schema") FOR DETAILS ON FIELDS AND NULLABILITY.
#[derive(MultipartForm, ToSchema)]
#[multipart(duplicate_field = "deny")]
pub struct UploadSpzMediaFileForm {
  /// UUID for request idempotency
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = String, format = Binary)]
  uuid_idempotency_token: Text<String>,

  /// The uploaded SPZ file
  #[multipart(limit = "512 MiB")]
  #[schema(value_type = Vec<u8>, format = Binary)]
  file: TempFile,

  /// Optional: Title (name) of the Gaussian splat
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_title: Option<Text<String>>,

  /// Optional: Visibility of the Gaussian splat
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_visibility: Option<Text<Visibility>>,

  /// Optional: The third-party generation provider (e.g. "fal", "replicate").
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_generation_provider: Option<Text<String>>,
}

#[derive(Serialize, ToSchema)]
pub struct UploadSpzMediaFileSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}

/// This endpoint is for uploading SPZ (Gaussian Splat) files.
///
/// SPZ files are compressed Gaussian splat files used for 3D scene representation.
/// The file must have a `.spz` extension and be gzip-compressed.
#[utoipa::path(
  post,
  tag = "Media Files (Upload)",
  path = "/v1/media_files/upload/spz",
  responses(
    (status = 200, description = "Success", body = UploadSpzMediaFileSuccessResponse),
    (status = 400, description = "Bad input", body = MediaFileUploadError),
    (status = 401, description = "Not authorized", body = MediaFileUploadError),
    (status = 429, description = "Too many requests", body = MediaFileUploadError),
    (status = 500, description = "Server error", body = MediaFileUploadError),
  ),
  params(
    (
      "request" = UploadSpzMediaFileForm,
      description = "IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UploadSpzMediaFileForm` (Under 'Schema') FOR DETAILS ON FIELDS AND NULLABILITY."
    ),
  )
)]
pub async fn upload_spz_media_file_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  MultipartForm(mut form): MultipartForm<UploadSpzMediaFileForm>,
) -> Result<Json<UploadSpzMediaFileSuccessResponse>, MediaFileUploadError> {

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

  let maybe_filename = form.file.file_name.as_deref()
      .as_deref()
      .map(|filename| PathBuf::from(filename));

  let filename_lowercase = maybe_filename
      .as_ref()
      .and_then(|f| f.to_str())
      .map(|s| s.to_ascii_lowercase())
      .unwrap_or_default();

  // Validate file extension
  if !filename_lowercase.ends_with(".spz") {
    return Err(MediaFileUploadError::BadInput(
      "File must have .spz extension".to_string()
    ));
  }

  let mut file_bytes = Vec::new();
  form.file.file.read_to_end(&mut file_bytes)
      .map_err(|e| {
        error!("Problem reading file: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  // Validate mimetype (SPZ files are gzip-compressed)
  let detected_mimetype = get_mimetype_for_bytes(file_bytes.as_ref());

  if detected_mimetype != Some(GZIP_MIME_TYPE) {
    return Err(MediaFileUploadError::BadInput(
      "SPZ file must be gzip-compressed".to_string()
    ));
  }

  let file_size_bytes = file_bytes.len();

  let hash = sha256_hash_bytes(&file_bytes)
      .map_err(|io_error| {
        error!("Problem hashing bytes: {:?}", io_error);
        MediaFileUploadError::ServerError
      })?;

  // ==================== UPLOAD AND SAVE ==================== //

  // Check for WorldLabs ceramic SPZ files
  let is_world_labs_spz = filename_lowercase.contains("ceramic") && filename_lowercase.ends_with(".spz");

  let extension = if is_world_labs_spz {
    CERAMIC_SPZ_EXTENSION
  } else {
    SPZ_EXTENSION
  };

  const PREFIX: Option<&str> = Some("artcraft_");

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(extension));

  info!("Uploading SPZ media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    GZIP_MIME_TYPE)
      .await
      .map_err(|e| {
        warn!("Upload SPZ bytes to bucket error: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  let maybe_generation_provider = form.maybe_generation_provider
      .as_ref()
      .and_then(|text| try_parse_generation_provider(text.as_ref()));

  let media_token = MediaFileInsertBuilder::new()
      .media_file_class(MediaFileClass::Dimensional)
      .media_file_type(MediaFileType::Spz)
      .maybe_creator_user(maybe_user_token.as_ref())
      .maybe_creator_anonymous_visitor(maybe_avt_token.as_ref())
      .creator_ip_address(&ip_address)
      .creator_set_visibility(creator_set_visibility)
      .media_file_origin_category(MediaFileOriginCategory::Upload)
      .mime_type(GZIP_MIME_TYPE)
      .file_size_bytes(file_size_bytes as u64)
      .checksum_sha2(&hash)
      .maybe_title(maybe_title.as_deref())
      .is_intermediate_system_file(false)
      .public_bucket_directory_hash(&public_upload_path)
      .maybe_origin_filename(form.file.file_name.as_deref())
      .maybe_generation_provider(maybe_generation_provider)
      .insert_pool(&server_state.mysql_pool)
      .await
      .map_err(|err| {
        warn!("New SPZ file creation DB error: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  info!("new SPZ media file token: {:?}", &media_token);

  Ok(Json(UploadSpzMediaFileSuccessResponse {
    success: true,
    media_file_token: media_token,
  }))
}
