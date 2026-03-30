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
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use filesys::file_size::file_size;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::create::insert_media_file_from_studio_scene_render::{insert_media_file_from_studio_scene_render, InsertStudioSceneRenderArgs};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::endpoints::media_files::upload::upload_studio_shot::extract_frames_from_zip::{extract_frames_from_zip, ExtractFramesError};
use crate::http_server::endpoints::media_files::upload::upload_studio_shot::ffmpeg_frames_to_mp4::ffmpeg_frames_to_mp4;
use crate::http_server::requests::request_headers::has_debug_header::has_debug_header;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::http_server::web_utils::user_session::require_user_session_extended_using_connection::require_user_session_extended_using_connection;
use crate::state::server_state::ServerState;

const DEFAULT_FPS : u8 = 12;

/// Form-multipart request fields.
///
/// IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UploadStudioShotFileForm` (Under "Schema") FOR DETAILS ON FIELDS AND NULLABILITY.
#[derive(MultipartForm, ToSchema)]
#[multipart(duplicate_field = "deny")]
pub struct UploadStudioShotFileForm {
  /// UUID for request idempotency
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = String, format = Binary)]
  uuid_idempotency_token: Text<String>,

  // TODO: is MultipartBytes better than TempFile ?
  /// The uploaded file
  #[multipart(limit = "512 MiB")]
  #[schema(value_type = Vec<u8>, format = Binary)]
  file: TempFile,

  /// Optional: The frame rate in fps.
  /// If not provided, it will default to 12 fps.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<u64>, format = Binary)]
  maybe_frame_rate_fps: Option<Text<u8>>,

  /// Optional: If an engine scene was used to generate this video, provide it here to create a link.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<MediaFileToken>, format = Binary)]
  maybe_scene_source_media_file_token: Option<Text<MediaFileToken>>,

  /// Optional: Title (name) of the scene
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_title: Option<Text<String>>,

  /// Optional: Visibility of the scene
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_visibility: Option<Text<Visibility>>,
}

#[derive(Serialize, ToSchema)]
pub struct UploadStudioShotSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}

/// Upload a studio render in a zip file.
#[utoipa::path(
  post,
  tag = "Media Files (Upload)",
  path = "/v1/media_files/upload/studio_shot",
  responses(
    (status = 200, description = "Success Update", body = UploadStudioShotSuccessResponse),
    (status = 400, description = "Bad input", body = MediaFileUploadError),
    (status = 401, description = "Not authorized", body = MediaFileUploadError),
    (status = 429, description = "Too many requests", body = MediaFileUploadError),
    (status = 500, description = "Server error", body = MediaFileUploadError),
  ),
  params(
    (
      "request" = UploadStudioShotFileForm,
      description = "IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UploadStudioShotFileForm` (Under 'Schema') FOR DETAILS ON FIELDS AND NULLABILITY."
    ),
  )
)]
pub async fn upload_studio_shot_media_file_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  MultipartForm(mut form): MultipartForm<UploadStudioShotFileForm>,
) -> Result<Json<UploadStudioShotSuccessResponse>, MediaFileUploadError> {

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("MySql pool error: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  // ==================== READ SESSION ==================== //

  // NB: We require a moderator to upload PMX files.
  let user_session = require_user_session_extended_using_connection(&http_request, &server_state.session_checker, &mut mysql_connection)
      .await
      .map_err(|e| {
        error!("User session error: {:?}", e);
        MediaFileUploadError::NotAuthorized
      })?;

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(&http_request);

//  // ==================== BANNED USERS ==================== //
//
//  if let Some(ref user) = maybe_user_session {
//    if user.is_banned {
//      return Err(MediaFileUploadError::NotAuthorized);
//    }
//  }

//  // ==================== RATE LIMIT ==================== //
//
//  let rate_limiter = match maybe_user_session {
//    None => &server_state.redis_rate_limiters.file_upload_logged_out,
//    Some(ref _session) => &server_state.redis_rate_limiters.file_upload_logged_in,
//  };
//
//  if let Err(_err) = rate_limiter.rate_limit_request(&http_request) {
//    return Err(MediaFileUploadError::RateLimited);
//  }

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
      //.or_else(|| {
      //  Some(user_session.preferred_tts_result_visibility)
      //})
      .unwrap_or(Visibility::default());

  // ==================== USER DATA ==================== //

  let ip_address = get_request_ip(&http_request);

  //let maybe_user_token = maybe_user_session
  //    .map(|session| session.get_strongly_typed_user_token());

  // ==================== FILE DATA ==================== //

  let maybe_filename = form.file.file_name.as_deref()
      .as_deref()
      .map(|filename| PathBuf::from(filename));

  let maybe_file_extension = maybe_filename
      .as_ref()
      .and_then(|filename| filename.extension())
      .and_then(|ext| ext.to_str());

  match maybe_file_extension {
    Some("zip") => {},
    _ => {
      return Err(MediaFileUploadError::BadInput(
        "unsupported file extension. Must be zip or pmx.".to_string()));
    }
  }

  let mut file_bytes = Vec::new();
  form.file.file.read_to_end(&mut file_bytes)
      .map_err(|e| {
        error!("Problem reading file: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  // ==================== EXTRACT ==================== //

  // TODO(bt,2024-08-25): Should include entropy so concurrent requests don't overwrite
  let frame_temp_dir = server_state.temp_dir_creator.new_tempdir("frames")
      .map_err(|err| {
        error!("Problem creating temp dir: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  let frame_type = extract_frames_from_zip(&file_bytes, frame_temp_dir.path())
      .map_err(|err| {
        warn!("Extract frames error: {:?}", err);
        match err {
          ExtractFramesError::InvalidArchive => MediaFileUploadError::ServerErrorVerbose("invalid archive file".to_string()),
          ExtractFramesError::NoImageFiles => MediaFileUploadError::ServerErrorVerbose("no image files".to_string()),
          ExtractFramesError::TooFewImageFiles => MediaFileUploadError::ServerErrorVerbose("too few image files".to_string()),
          ExtractFramesError::TooManyFiles => MediaFileUploadError::ServerErrorVerbose("too many files".to_string()),
          ExtractFramesError::ExtractionError => MediaFileUploadError::ServerErrorVerbose("zip extraction error".to_string()),
          ExtractFramesError::UploadError => MediaFileUploadError::ServerErrorVerbose("upload error".to_string()),
          ExtractFramesError::FileError => MediaFileUploadError::ServerErrorVerbose("file error".to_string()),
        }
      })?;

  // ==================== FFMPEG ==================== //

  let frame_rate = form.maybe_frame_rate_fps
      .map(|fps| *fps)
      .unwrap_or(DEFAULT_FPS);

  let video_file_details = ffmpeg_frames_to_mp4(frame_temp_dir.path(), frame_type, frame_rate)
      .map_err(|err| {
        warn!("FFMPEG error: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  let file_size_bytes = file_size(&video_file_details.path)
      .map_err(|err| {
        error!("Problem getting file size: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  let hash = sha256_hash_file(&video_file_details.path)
      .map_err(|io_error| {
        error!("Problem hashing bytes: {:?}", io_error);
        MediaFileUploadError::ServerError
      })?;

  // ==================== UPLOAD ==================== //

  const PREFIX : Option<&str> = Some("upload_");
  const SUFFIX : Option<&str> = Some(".mp4");

  let bucket_path = MediaFileBucketPath::generate_new(PREFIX, SUFFIX);

  server_state.public_bucket_client.upload_filename_with_content_type(
    bucket_path.get_full_object_path_str(),
    &video_file_details.path,
    "video/mp4")
      .await
      .map_err(|e| {
        error!("Upload video to bucket error: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  if has_debug_header(&http_request) {
    warn!("Debug header detected. Uploading original zip file for analysis.");

    let zip_bucket_path_hash = bucket_path.get_object_hash();

    let zip_bucket_path = MediaFileBucketPath::from_object_hash(zip_bucket_path_hash, PREFIX, Some(".zip"));

    let result = server_state.public_bucket_client.upload_filename_with_content_type(
      zip_bucket_path.get_full_object_path_str(),
      form.file.file.path(),
      "application/zip"
    ).await;

    // NB: Fail open
    if let Err(err) = result {
      error!("Upload zip to bucket error: {:?}", err);
    }
  }

  // ==================== SAVE RECORD ==================== //

  // TODO(bt, 2024-02-22): This should be a transaction.
  let token= insert_media_file_from_studio_scene_render(InsertStudioSceneRenderArgs {
    media_type: MediaFileType::Mp4,
    maybe_creator_user_token: Some(&user_session.user_token_typed),
    maybe_creator_anonymous_visitor_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility,
    maybe_mime_type: Some("video/mp4"),
    file_size_bytes,
    maybe_audio_encoding: None, // TODO
    maybe_video_encoding: None, // TODO
    // TODO: Frame rate.
    maybe_scene_source_media_file_token: form.maybe_scene_source_media_file_token
        .as_ref()
        .map(|token| &token.0),
    maybe_frame_width: video_file_details
        .dimensions
        .as_ref()
        .map(|dim| dim.width as u32),
    maybe_frame_height: video_file_details
        .dimensions
        .as_ref()
        .map(|dim| dim.height as u32),
    maybe_duration_millis: video_file_details.duration.map(|duration| duration.millis as u64),
    sha256_checksum: &hash,
    maybe_title: maybe_title.as_deref(),
    public_bucket_directory_hash: bucket_path.get_object_hash(),
    maybe_public_bucket_prefix: PREFIX,
    maybe_public_bucket_extension: SUFFIX,
    pool: &server_state.mysql_pool,
  })
      .await
      .map_err(|err| {
        warn!("New file creation DB error: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  info!("new media file token: {:?}", &token);

  Ok(Json(UploadStudioShotSuccessResponse {
    success: true,
    media_file_token: token,
  }))
}
