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
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_file_upload::{insert_media_file_from_file_upload, InsertMediaFileFromUploadArgs, UploadType};
use mysql_queries::queries::users::user_sessions::get_user_session_by_token::SessionUserRecord;
use tokens::tokens::media_files::MediaFileToken;
use crate::http_server::endpoints::media_files::upload::common_utils::try_parse_generation_provider::try_parse_generation_provider;
use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;

/// Form-multipart request fields.
///
/// IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UploadNewEngineAssetFileForm` (Under "Schema") FOR DETAILS ON FIELDS AND NULLABILITY.
#[derive(MultipartForm, ToSchema)]
#[multipart(duplicate_field = "deny")]
pub struct UploadNewEngineAssetFileForm {
  /// UUID for request idempotency
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = String, format = Binary)]
  uuid_idempotency_token: Text<String>,

  // TODO: is MultipartBytes better than TempFile ?
  /// The uploaded file
  #[multipart(limit = "5 GiB")]
  #[schema(value_type = Vec<u8>, format = Binary)]
  file: TempFile,

  /// The category of engine asset: character, animation, etc.
  /// See the documentation on `MediaFileEngineCategory`.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = String, format = Binary)]
  engine_category: Text<MediaFileEngineCategory>,

  /// Optional: Title (name) of the scene
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_title: Option<Text<String>>,

  /// Optional: Visibility of the scene
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_visibility: Option<Text<Visibility>>,

  /// Optional: the type of animation (if this is a character or animation)
  /// See the documentation on `MediaFileAnimationType`.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_animation_type: Option<Text<MediaFileAnimationType>>,

  /// Optional: The duration, for files that are animations.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<u64>, format = Binary)]
  maybe_duration_millis: Option<Text<u64>>,

  /// Optional: The third-party generation provider (e.g. "fal", "replicate").
  /// If set, `is_user_upload` will be false and `is_intermediate_system_file` will be forced false.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_generation_provider: Option<Text<String>>,
}

#[derive(Serialize, ToSchema)]
pub struct UploadNewEngineAssetSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}

/// Upload an engine asset: character, animation, etc. Just don't use this for scenes.
/// 
/// This is for new assets. You can't update existing assets with this endpoint.
///
/// Be careful to set the correct `engine_category` and `maybe_animation_type` (if needed) fields!
#[utoipa::path(
  post,
  tag = "Media Files (Upload)",
  path = "/v1/media_files/upload/new_engine_asset",
  responses(
    (status = 200, description = "Success Update", body = UploadNewEngineAssetSuccessResponse),
    (status = 400, description = "Bad input", body = MediaFileUploadError),
    (status = 401, description = "Not authorized", body = MediaFileUploadError),
    (status = 429, description = "Too many requests", body = MediaFileUploadError),
    (status = 500, description = "Server error", body = MediaFileUploadError),
  ),
  params(
    (
      "request" = UploadNewEngineAssetFileForm,
      description = "IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UploadNewEngineAssetFileForm` (Under 'Schema') FOR DETAILS ON FIELDS AND NULLABILITY."
    ),
  )
)]
pub async fn upload_new_engine_asset_media_file_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  MultipartForm(mut form): MultipartForm<UploadNewEngineAssetFileForm>,
) -> Result<Json<UploadNewEngineAssetSuccessResponse>, MediaFileUploadError> {

  validate_request(&form)?;

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

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(&http_request);

  // ==================== BANNED USERS ==================== //

  if let Some(ref user) = maybe_user_session {
    if user.is_banned {
      return Err(MediaFileUploadError::NotAuthorized);
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

  // ==================== USER DATA ==================== //

  let ip_address = get_request_ip(&http_request);

  let maybe_user_token = maybe_user_session
      .as_ref()
      .map(|session| session.get_strongly_typed_user_token());

  // ==================== FILE DATA ==================== //

  let maybe_generation_provider = form.maybe_generation_provider
      .as_ref()
      .and_then(|text| try_parse_generation_provider(text.as_ref()));

  let file_info = validate_and_process_form(maybe_user_session.as_ref(), form)?;

  // ==================== UPLOAD AND SAVE ==================== //

  const PREFIX : Option<&str> = Some("asset_");

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(file_info.file_name_suffix));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    file_info.file_bytes.as_ref(),
    file_info.mimetype)
      .await
      .map_err(|e| {
        warn!("Upload media bytes to bucket error: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  // TODO(bt, 2024-02-22): This should be a transaction.
  let (token, record_id) = insert_media_file_from_file_upload(InsertMediaFileFromUploadArgs {
    maybe_media_class: Some(file_info.media_class),
    media_file_type: file_info.media_type,
    maybe_creator_user_token: maybe_user_token.as_ref(),
    maybe_creator_anonymous_visitor_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: file_info.creator_set_visibility,
    upload_type: UploadType::Filesystem,
    maybe_prompt_token: None,
    maybe_batch_token: None,
    maybe_engine_category: Some(file_info.engine_category),
    maybe_animation_type: file_info.maybe_animation_type,
    maybe_mime_type: Some(file_info.mimetype),
    file_size_bytes: file_info.file_size_bytes as u64,
    maybe_duration_millis: file_info.maybe_duration_millis,
    sha256_checksum: &file_info.sha256_checksum,
    maybe_scene_source_media_file_token: None,
    is_intermediate_system_file: false, // NB: is_user_upload = TRUE
    maybe_generation_provider,
    maybe_title: file_info.maybe_title.as_deref(),
    public_bucket_directory_hash: public_upload_path.get_object_hash(),
    maybe_public_bucket_prefix: PREFIX,
    maybe_public_bucket_extension: Some(file_info.file_name_suffix),
    pool: &server_state.mysql_pool,
  })
      .await
      .map_err(|err| {
        warn!("New file creation DB error: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  info!("new media file id: {} token: {:?}", record_id, &token);

  Ok(Json(UploadNewEngineAssetSuccessResponse {
    success: true,
    media_file_token: token,
  }))
}

fn validate_request(form: &UploadNewEngineAssetFileForm) -> Result<(), MediaFileUploadError> {
  let duration_is_zeroish = form.maybe_duration_millis.is_none() ||
      form.maybe_duration_millis
          .as_ref()
          .map(|duration| duration.0 == 0)
          .unwrap_or(false);

  if duration_is_zeroish && form.engine_category.0 == MediaFileEngineCategory::Animation {
    return Err(MediaFileUploadError::BadInput(
      "duration_millis must be supplied for animations".to_string()));
  }

  Ok(())
}

struct FileInfo {
  // System metadata
  media_class: MediaFileClass,
  media_type: MediaFileType,
  engine_category: MediaFileEngineCategory,
  maybe_title: Option<String>,
  creator_set_visibility: Visibility,
  maybe_animation_type: Option<MediaFileAnimationType>,

  // File data
  file_bytes: Vec<u8>,
  file_size_bytes: usize,
  mimetype: &'static str,
  file_name_suffix: &'static str,
  sha256_checksum: String,
  maybe_duration_millis: Option<u64>,
}

fn validate_and_process_form(
  maybe_user_session: Option<&SessionUserRecord>,
  mut form: UploadNewEngineAssetFileForm,
) -> Result<FileInfo, MediaFileUploadError> {
  let engine_category = form.engine_category.0;

  let maybe_duration_millis = form.maybe_duration_millis
      .map(|duration| duration.0);

  let mut maybe_animation_type = form.maybe_animation_type
      .map(|t| t.0);

  if engine_category == MediaFileEngineCategory::Expression {
    // NB: Expressions are exclusively ArKit for now (and probably well into the future).
    maybe_animation_type = Some(MediaFileAnimationType::ArKit);
  }

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

  let maybe_filename = form.file.file_name.as_deref()
      .as_deref()
      .map(|filename| PathBuf::from(filename));

  let maybe_file_extension = maybe_filename
      .as_ref()
      .and_then(|filename| filename.extension())
      .and_then(|ext| ext.to_str());

  let mut file_bytes = Vec::new();
  form.file.file.read_to_end(&mut file_bytes)
      .map_err(|e| {
        error!("Problem reading file: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  let file_size_bytes = file_bytes.len();

  let sha256_checksum = sha256_hash_bytes(&file_bytes)
      .map_err(|io_error| {
        error!("Problem hashing bytes: {:?}", io_error);
        MediaFileUploadError::ServerError
      })?;

  match maybe_file_extension {
    Some("csv") => {
      let category = form.engine_category.0;
      if category != MediaFileEngineCategory::Expression {
        return Err(MediaFileUploadError::BadInput("CSV files are only allowed for expressions.".to_string()));
      }
    }
    Some("jpg") | Some("jpeg") | Some("png") | Some("gif") => {
      if maybe_animation_type.is_some() {
        return Err(MediaFileUploadError::BadInput("Image files cannot have an animation type.".to_string()));
      }
      if maybe_duration_millis.is_some() {
        return Err(MediaFileUploadError::BadInput("Image files cannot have a duration".to_string()));
      }
      let category = form.engine_category.0;
      if category != MediaFileEngineCategory::ImagePlane {
        return Err(MediaFileUploadError::BadInput("Image files are only allowed for image_plane.".to_string()));
      }
    }
    Some("mp4") => {
      if maybe_animation_type.is_some() {
        return Err(MediaFileUploadError::BadInput("Video files cannot have an animation type.".to_string()));
      }
      let category = form.engine_category.0;
      if category != MediaFileEngineCategory::VideoPlane {
        return Err(MediaFileUploadError::BadInput("Video files are only allowed for video_plane.".to_string()));
      }
    }
    _ => {} // Allowed
  }

  let (file_name_suffix, media_type, mimetype) = match maybe_file_extension {
    None => {
      return Err(MediaFileUploadError::BadInput("no file extension".to_string()));
    }
    Some("bvh") => (".bvh", MediaFileType::Bvh, "application/octet-stream"),
    Some("fbx") => (".fbx", MediaFileType::Fbx, "application/octet-stream"),
    Some("glb") => (".glb", MediaFileType::Glb, "application/octet-stream"),
    Some("gltf") => (".gltf", MediaFileType::Gltf, "application/octet-stream"),
    Some("pmd") => (".pmd", MediaFileType::Pmd, "application/octet-stream"),
    Some("vmd") => (".vmd", MediaFileType::Vmd, "application/octet-stream"),
    Some("csv") => (".csv", MediaFileType::Vmd, "application/octet-stream"),
    // Images
    Some("jpg") => (".jpg", MediaFileType::Jpg, "image/jpeg"),
    Some("png") => (".png", MediaFileType::Png, "image/png"),
    Some("gif") => (".gif", MediaFileType::Gif, "image/gif"),
    // Video
    Some("mp4") => (".mp4", MediaFileType::Mp4, "video/mp4"),
    _ => {
      return Err(MediaFileUploadError::BadInput(
        "unsupported file extension. Must be bvh, glb, gltf, fbx, csv (for expressions), \
        or jpg, png, gif (for image_plane), or mp4 (for video_plane).".to_string()));
    }
  };

  let media_class = match media_type {
    MediaFileType::Jpg | MediaFileType::Png | MediaFileType::Gif => MediaFileClass::Image,
    MediaFileType::Mp4 => MediaFileClass::Video,
    _ => MediaFileClass::Dimensional,
  };

  Ok(FileInfo {
    media_class,
    media_type,
    engine_category,
    maybe_title,
    creator_set_visibility,
    maybe_animation_type,
    file_bytes,
    file_size_bytes,
    mimetype,
    file_name_suffix,
    sha256_checksum,
    maybe_duration_millis,
  })
}
