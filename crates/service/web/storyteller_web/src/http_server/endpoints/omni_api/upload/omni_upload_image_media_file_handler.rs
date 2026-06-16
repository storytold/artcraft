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

use artcraft_api_defs::omni_api::omni_upload_image::OmniUploadImageMediaFileSuccessResponse;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use http_server_common::request::get_request_ip::get_request_ip;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mimetypes::mimetype_to_extension::mimetype_to_extension;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_file_upload::{insert_media_file_from_file_upload, InsertMediaFileFromUploadArgs, UploadType};
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::prompts::PromptToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::endpoints::media_files::upload::common_utils::try_parse_generation_provider::try_parse_generation_provider;
use crate::http_server::user_lookup::api_keys::require_api_key_user::require_api_key_user;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;

/// Form-multipart request fields.
///
/// IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `OmniUploadImageMediaFileForm` (Under "Schema") FOR DETAILS ON FIELDS AND NULLABILITY.
#[derive(MultipartForm, ToSchema)]
#[multipart(duplicate_field = "deny")]
pub struct OmniUploadImageMediaFileForm {
  /// UUID for request idempotency
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = String, format = Binary)]
  uuid_idempotency_token: Text<String>,

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

  /// Optional: Prompt associated with this image
  /// NOTE: Cannot set `is_intermediate_system_file = true` if this is set.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_prompt_token: Option<Text<PromptToken>>,

  /// Optional: Batch associated with this image
  /// NOTE: Cannot set `is_intermediate_system_file = true` if this is set.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_batch_token: Option<Text<BatchGenerationToken>>,

  /// Optional: Whether this is a system file (e.g. cover files we should hide)
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<bool>, format = Binary)]
  is_intermediate_system_file: Option<Text<bool>>,

  /// Optional: The third-party generation provider (e.g. "fal", "replicate").
  /// If set, `is_user_upload` will be false and `is_intermediate_system_file` will be forced false.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_generation_provider: Option<Text<String>>,
}

static ALLOWED_MIME_TYPES : Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ])
});

/// API-key authenticated image upload (Omni API). Identity is read from the `Authorization` header
/// API key rather than a session cookie.
#[utoipa::path(
  post,
  tag = "Omni API",
  path = "/v1/omni_api/upload/image",
  responses(
    (status = 200, description = "Success Update", body = OmniUploadImageMediaFileSuccessResponse),
    (status = 400, description = "Bad input", body = MediaFileUploadError),
    (status = 401, description = "Not authorized", body = MediaFileUploadError),
    (status = 429, description = "Too many requests", body = MediaFileUploadError),
    (status = 500, description = "Server error", body = MediaFileUploadError),
  ),
  params(
    (
      "request" = OmniUploadImageMediaFileForm,
      description = "IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `OmniUploadImageMediaFileForm` (Under 'Schema') FOR DETAILS ON FIELDS AND NULLABILITY."
    ),
  )
)]
pub async fn omni_upload_image_media_file_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  MultipartForm(mut form): MultipartForm<OmniUploadImageMediaFileForm>,
) -> Result<Json<OmniUploadImageMediaFileSuccessResponse>, MediaFileUploadError> {

  validate_form(&form)?;

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("MySql pool error: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  // ==================== API KEY USER ==================== //

  // API-key authentication (Authorization header) instead of a session cookie. Never cached, and a
  // banned owner is rejected inside `require_api_key_user`.
  let api_session = require_api_key_user(&http_request, &mut *mysql_connection)
      .await
      .map_err(map_api_key_auth_error)?;

  let maybe_user_token = Some(&api_session.user_token);

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

  let maybe_title = form.maybe_title.map(|title| title.to_string());

  let creator_set_visibility = form.maybe_visibility
      .map(|visibility| visibility.0)
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

  // ==================== OTHER FILE METADATA ==================== //

  let maybe_filename = form.file.file_name.as_deref()
      .as_deref()
      .map(|filename| PathBuf::from(filename));

  let extension = mimetype_to_extension(&mimetype)
      .or_else(|| {
        maybe_filename
            .as_ref()
            .and_then(|filename| filename.extension())
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

  const PREFIX : Option<&str> = Some("image_");

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

  let is_intermediate_system_file = form.is_intermediate_system_file
      .map(|b| b.0)
      .unwrap_or(false);

  let maybe_prompt_token = form.maybe_prompt_token
      .as_ref()
      .map(|token| token.0.clone());

  let maybe_batch_token = form.maybe_batch_token
      .as_ref()
      .map(|token| token.0.clone());

  let maybe_generation_provider = form.maybe_generation_provider
      .as_ref()
      .and_then(|text| try_parse_generation_provider(text.as_ref()));

  let upload_type = if maybe_generation_provider.is_some() {
    UploadType::ThirdPartyInference
  } else {
    UploadType::Filesystem
  };

  let media_file_type = match mimetype.as_str() {
    "image/jpeg" => MediaFileType::Jpg,
    "image/png"  => MediaFileType::Png,
    "image/gif"  => MediaFileType::Gif,
    "image/webp" => MediaFileType::Image, // Fallback
    _            => MediaFileType::Image, // fallback
  };

  let (token, record_id) = insert_media_file_from_file_upload(InsertMediaFileFromUploadArgs {
    maybe_media_class: Some(MediaFileClass::Image),
    media_file_type,
    maybe_creator_user_token: maybe_user_token,
    // NB: AVT (anonymous visitor) tokens are a web-session concept; API-key callers have none.
    maybe_creator_anonymous_visitor_token: None,
    creator_ip_address: &ip_address,
    creator_set_visibility,
    upload_type,
    maybe_engine_category: None,
    maybe_animation_type: None,
    maybe_mime_type: Some(&mimetype),
    maybe_prompt_token: maybe_prompt_token.as_ref(),
    maybe_batch_token: maybe_batch_token.as_ref(),
    file_size_bytes: file_size_bytes as u64,
    maybe_duration_millis: None,
    sha256_checksum: &hash,
    maybe_title: maybe_title.as_deref(),
    maybe_scene_source_media_file_token: None,
    is_intermediate_system_file,
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

  Ok(Json(OmniUploadImageMediaFileSuccessResponse {
    success: true,
    media_file_token: token,
  }))
}

fn validate_form(form: &OmniUploadImageMediaFileForm) -> Result<(), MediaFileUploadError> {
  if form.uuid_idempotency_token.is_empty() {
    return Err(MediaFileUploadError::BadInput("Idempotency token is required".to_string()));
  }

  let is_intermediate_system_file = form.is_intermediate_system_file
      .as_ref()
      .map(|b| b.0)
      .unwrap_or(false);

  if is_intermediate_system_file && form.maybe_prompt_token.is_some() {
    return Err(MediaFileUploadError::BadInput(
      "Cannot set `is_intermediate_system_file` to true if `maybe_prompt_token` is provided."
          .to_string()));
  }

  Ok(())
}

/// Map an API-key authentication failure onto this endpoint's error type. A genuine 401 stays a
/// 401; anything else (e.g. a DB error during lookup) becomes a 500.
fn map_api_key_auth_error(err: CommonWebError) -> MediaFileUploadError {
  match err {
    CommonWebError::NotAuthorized => {
      MediaFileUploadError::NotAuthorizedVerbose("invalid or missing API key".to_string())
    }
    _ => MediaFileUploadError::ServerError,
  }
}
