use std::collections::HashSet;
use std::io::Read;
use std::path::PathBuf;
use std::sync::Arc;

use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::text::Text;
use actix_multipart::form::MultipartForm;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{debug, error, info, warn};
use once_cell::sync::Lazy;
use std::time::Duration;
use utoipa::ToSchema;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use ffmpeg_utils::ffmpeg::ffmpeg_transcode_to_mp4::{ffmpeg_transcode_to_mp4, FfmpegTranscodeToMp4Args};
use ffmpeg_utils::ffmpeg::ffmpeg_trim_and_resample::{ffmpeg_trim_and_resample, Args};
use ffmpeg_utils::ffprobe::ffprobe_get_info::ffprobe_get_info;
use filesys::file_read_bytes::file_read_bytes;
use filesys::path_to_string::path_to_string;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use http_server_common::request::get_request_ip::get_request_ip;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mimetypes::mimetype_to_extension::mimetype_to_extension;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_file_upload::{insert_media_file_from_file_upload, InsertMediaFileFromUploadArgs, UploadType};
use thumbnail_generator::task_client::thumbnail_task::{ThumbnailTaskBuilder, ThumbnailTaskInputMimeType};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::endpoints::media_files::upload::common_utils::try_parse_generation_provider::try_parse_generation_provider;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;

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

  // /// Optional: Style transfer style used. See `StyleTransferName` for possible values.
  // #[multipart(limit = "2 KiB")]
  // #[schema(value_type = Option<StyleTransferName>, format = Binary)]
  // maybe_style_name: Option<Text<StyleTransferName>>,

  /// Optional: Visibility of the scene
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<Visibility>, format = Binary)]
  maybe_visibility: Option<Text<Visibility>>,

  /// Optional: Prompt associated with this image
  /// NOTE: Cannot set `is_intermediate_system_file = true` if this is set.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_prompt_token: Option<Text<PromptToken>>,

  /// Optional: If an engine scene was used to generate this video, provide it here to create a link.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<MediaFileToken>, format = Binary)]
  maybe_scene_source_media_file_token: Option<Text<MediaFileToken>>,

  /// Optional: Whether this is a system file (eg. cover files we should hide)
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<bool>, format = Binary)]
  is_intermediate_system_file: Option<Text<bool>>,

  /// Optional: Trim start offset in milliseconds.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<u64>, format = Binary)]
  maybe_trim_start_millis: Option<Text<u64>>,

  /// Optional: Trim end offset in milliseconds.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<u64>, format = Binary)]
  maybe_trim_end_millis: Option<Text<u64>>,

  /// Optional: Resample the video to this FPS.
  /// Only certain values equal or under 24fps are allowed.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<u64>, format = Binary)]
  maybe_resample_fps: Option<Text<u8>>,

  /// Optional: The third-party generation provider (e.g. "fal", "replicate").
  /// If set, `is_user_upload` will be false and `is_intermediate_system_file` will be forced false.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  maybe_generation_provider: Option<Text<String>>,
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

static TRANSCODE_MIME_TYPES : Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    // Video
    "video/quicktime", // .qt quicktime files
  ])
});

/// This endpoint is for uploading video files.
#[utoipa::path(
  post,
  tag = "Media Files (Upload)",
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
) -> Result<Json<UploadNewVideoMediaFileSuccessResponse>, MediaFileUploadError> {

  fast_form_validations(&form)?;

  // ==================== READ SESSION ==================== //

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("MySql pool error: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

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

  let mut mimetype = get_mimetype_for_bytes(file_bytes.as_ref())
      .map(|mimetype| mimetype.to_string())
      .ok_or_else(|| {
        warn!("Could not determine mimetype for file");
        MediaFileUploadError::BadInput("Could not determine mimetype for file".to_string())
      })?;

  let needs_transcode = TRANSCODE_MIME_TYPES.contains(mimetype.as_str());

  if !ALLOWED_MIME_TYPES.contains(mimetype.as_str()) && !needs_transcode {
    // NB: Don't let our error message inject malicious strings
    let filtered_mimetype = mimetype
        .chars()
        .filter(|c| c.is_ascii())
        .filter(|c| c.is_alphanumeric() || *c == '/')
        .collect::<String>();
    return Err(MediaFileUploadError::BadInput(format!("unpermitted mime type: {}", &filtered_mimetype)));
  }

  // ==================== ORIGINAL FILE BOOKKEEPING ==================== //
  // Hold on to the user's original file (path + mimetype + extension) so we
  // can upload it as a `_original.{ext}` sibling later if we end up
  // transcoding and/or resampling it.

  let original_file_path: PathBuf = form.file.file.path().to_path_buf();
  let original_mimetype: String = mimetype.clone();
  let original_filename_extension: Option<String> = form.file.file_name.as_deref()
      .and_then(|filename| std::path::Path::new(filename).extension())
      .and_then(|ext| ext.to_str())
      .map(|ext| ext.to_string());
  let original_extension: String = mimetype_to_extension(&original_mimetype)
      .map(|ext| ext.to_string())
      .or(original_filename_extension)
      .ok_or_else(|| {
        warn!("Could not determine file extension for original mimetype: {}", &original_mimetype);
        MediaFileUploadError::ServerError
      })?;

  // ==================== OPTIONAL TRANSCODE TO MP4 ==================== //
  // Some accepted source mime types (e.g. QuickTime .mov) are not the canonical
  // distribution format we want for the media file record. Transcode them to
  // mp4 in a tempdir so we can resample / upload mp4 instead.

  // Tempdirs we need to keep alive across the upload step. They get dropped at
  // function exit which cleans up the on-disk files.
  let mut transcode_tempdir_ref = None;
  let mut resample_tempdir_ref = None;

  let mut final_upload_file_path = form.file.file.path().to_path_buf();

  if needs_transcode {
    let transcode_tempdir = server_state.temp_dir_creator.new_tempdir("ffmpeg_transcode")
        .map_err(|err| {
          error!("Problem creating transcode temp dir: {:?}", err);
          MediaFileUploadError::ServerError
        })?;

    let transcoded_path = transcode_tempdir.path().join("transcoded.mp4");

    info!("Transcoding {} → mp4", &original_mimetype);
    ffmpeg_transcode_to_mp4(FfmpegTranscodeToMp4Args {
      video_input_path: form.file.file.path(),
      video_output_path: &transcoded_path,
    }).map_err(|err| {
      error!("Problem transcoding video to mp4: {:?}", err);
      MediaFileUploadError::ServerError
    })?;

    // The canonical file is now the transcoded mp4. Read its bytes and pin
    // its mimetype to mp4 so all the downstream metadata reflects the
    // transcoded file rather than the user's original upload.
    file_bytes = file_read_bytes(&transcoded_path)
        .map_err(|e| {
          error!("Problem reading transcoded mp4: {:?}", e);
          MediaFileUploadError::ServerError
        })?;
    mimetype = "video/mp4".to_string();
    final_upload_file_path = transcoded_path;
    transcode_tempdir_ref = Some(transcode_tempdir);
  }

  // ==================== OPTIONAL VIDEO RESAMPLE ==================== //

  let should_resample = form.maybe_resample_fps.is_some()
      || form.maybe_trim_start_millis.is_some()
      || form.maybe_trim_end_millis.is_some();

  if should_resample {
    // TODO(bt,2024-09-11): Should include entropy so concurrent requests don't overwrite
    let frame_temp_dir = server_state.temp_dir_creator.new_tempdir("ffmpeg")
        .map_err(|err| {
          error!("Problem creating temp dir: {:?}", err);
          MediaFileUploadError::ServerError
        })?;

    let video_output_path = frame_temp_dir.path().join("output.mp4");

    let maybe_new_frame_rate = form.maybe_resample_fps.map(|fps| fps.0);
    let maybe_start_offset = form.maybe_trim_start_millis.map(|millis| Duration::from_millis(millis.0));
    let maybe_end_offset = form.maybe_trim_end_millis.map(|millis| Duration::from_millis(millis.0));

    // NB: Resample reads from `final_upload_file_path` (which is the transcoded
    // mp4 if we transcoded above, or the user's original upload otherwise).
    ffmpeg_trim_and_resample(Args {
      video_input_path: &final_upload_file_path,
      video_output_path: &video_output_path,
      maybe_new_frame_rate,
      maybe_start_offset,
      maybe_end_offset,
    }).map_err(|err| {
      error!("Problem resampling video: {:?}", err);
      MediaFileUploadError::ServerError
    })?;

    file_bytes = file_read_bytes(&video_output_path)
        .map_err(|e| {
          error!("Problem reading file: {:?}", e);
          MediaFileUploadError::ServerError
        })?;

    mimetype = get_mimetype_for_bytes(file_bytes.as_ref())
        .map(|mimetype| mimetype.to_string())
        .ok_or_else(|| {
          warn!("Could not determine mimetype for file");
          MediaFileUploadError::BadInput("Could not determine mimetype for file".to_string())
        })?;

    final_upload_file_path = video_output_path;
    resample_tempdir_ref = Some(frame_temp_dir); // NB: Keep from going out of scope
  }

  // True if we touched the user's file in any way (transcoded, resampled, or both).
  // We'll upload their unmodified original alongside the canonical file when so.
  let should_upload_original = needs_transcode || should_resample;

  // ==================== OTHER FILE METADATA ==================== //

  let mut maybe_duration_millis = None;

  match ffprobe_get_info(&final_upload_file_path) {
    Ok(video_info) => {
      maybe_duration_millis = video_info.duration
          .map(|duration| duration.millis as u64);
    }
    Err(error) => {
      warn!("Error reading video dimensions with ffprobe: {:?}", error);
    }
  }

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

  // ==================== UPLOAD ORIGINAL SIBLING ==================== //
  // If we transcoded and/or resampled the user's upload, also upload the
  // unmodified original alongside the canonical file as `_original.{ext}`
  // (sharing the same object hash / directory). The media file record points
  // at the canonical file, not this sibling.

  if should_upload_original {
    // Build a sibling path that lives in the same directory as the canonical
    // file (same hash) but with `_original.{ext}` baked into the suffix.
    let original_suffix = format!("_original.{}", original_extension);
    let original_bucket_path = MediaFileBucketPath::from_object_hash(
      public_upload_path.get_object_hash(),
      PREFIX,
      Some(&original_suffix),
    );

    info!(
      "Uploading original sibling to bucket path: {}",
      original_bucket_path.get_full_object_path_str(),
    );

    let original_bytes = file_read_bytes(&original_file_path)
        .map_err(|e| {
          error!("Problem reading original file for sibling upload: {:?}", e);
          MediaFileUploadError::ServerError
        })?;

    server_state.public_bucket_client.upload_file_with_content_type(
      original_bucket_path.get_full_object_path_str(),
      original_bytes.as_ref(),
      &original_mimetype,
    )
        .await
        .map_err(|e| {
          // NB: Sibling failure is non-fatal — the canonical upload already
          // succeeded and the user can still use the media. Log loudly.
          warn!("Upload original sibling to bucket error: {:?}", e);
        })
        .ok();
  }

  let maybe_scene_source_media_file_token = form.maybe_scene_source_media_file_token
      .as_ref()
      .map(|token| &token.0);

  let maybe_prompt_token = form.maybe_prompt_token
      .as_ref()
      .map(|token| token.0.clone());

  // NB: If we're uploading a video file that references an engine scene, then this is an engine
  // render video, and we should mark it as a system (hidden) file.
  let is_intermediate_system_file =
      maybe_scene_source_media_file_token.is_some() ||
      form.is_intermediate_system_file.map(|b| b.0).unwrap_or(false);

  let maybe_generation_provider = form.maybe_generation_provider
      .as_ref()
      .and_then(|text| try_parse_generation_provider(text.as_ref()));

  let upload_type = if maybe_generation_provider.is_some() {
    UploadType::ThirdPartyInference
  } else {
    UploadType::Filesystem
  };

  let (token, record_id) = insert_media_file_from_file_upload(InsertMediaFileFromUploadArgs {
    maybe_media_class: Some(MediaFileClass::Video),
    media_file_type: MediaFileType::Video,
    maybe_creator_user_token: maybe_user_token.as_ref(),
    maybe_creator_anonymous_visitor_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility,
    upload_type,
    maybe_engine_category: None,
    maybe_animation_type: None,
    maybe_prompt_token: maybe_prompt_token.as_ref(),
    maybe_batch_token: None,
    maybe_mime_type: Some(&mimetype),
    file_size_bytes: file_size_bytes as u64,
    maybe_duration_millis,
    sha256_checksum: &hash,
    maybe_title: maybe_title.as_deref(),
    maybe_scene_source_media_file_token,
    is_intermediate_system_file, // NB: is_user_upload = TRUE
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

  Ok(Json(UploadNewVideoMediaFileSuccessResponse {
    success: true,
    media_file_token: token,
  }))
}

fn fast_form_validations(form: &UploadNewVideoMediaFileForm) -> Result<(), MediaFileUploadError> {
  if let Some(resample_fps) = form.maybe_resample_fps.as_ref() {
    if **resample_fps > 24 {
      return Err(MediaFileUploadError::BadInput("Resample FPS must be 24 or lower".to_string()));
    } else if **resample_fps == 0 {
      return Err(MediaFileUploadError::BadInput("Resample FPS must be greater than 0".to_string()));
    }
  }

  form.maybe_trim_start_millis.as_ref().zip(form.maybe_trim_end_millis.as_ref())
      .map(|(start, end)| {
        if **start >= **end {
          return Err(MediaFileUploadError::BadInput("Trim start must be less than trim end".to_string()));
        }
        Ok(())
      })
      .transpose()?;

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
