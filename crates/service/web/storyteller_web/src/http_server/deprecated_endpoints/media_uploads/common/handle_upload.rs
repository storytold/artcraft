use std::collections::HashSet;
use std::sync::Arc;

use actix_multipart::Multipart;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};

use bucket_paths::legacy::typified_paths::public::media_uploads::bucket_file_path::MediaUploadOriginalFilePath;
use enums::by_table::media_uploads::media_upload_source::MediaUploadSource;
use enums::by_table::media_uploads::media_upload_type::MediaUploadType;
use enums::common::visibility::Visibility;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use http_server_common::request::get_request_ip::get_request_ip;
use media::decode_basic_audio_info::decode_basic_audio_bytes_info;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mysql_queries::queries::media_uploads::get_media_upload_by_uuid::get_media_upload_by_uuid_with_connection;
use mysql_queries::queries::media_uploads::insert_media_upload::{insert_media_upload, Args};
use tokens::tokens::media_uploads::MediaUploadToken;

use crate::http_server::deprecated_endpoints::media_uploads::common::drain_multipart_request::{drain_multipart_request, MediaSource};
use crate::http_server::deprecated_endpoints::media_uploads::common::upload_error::UploadError;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;

pub enum SuccessCase {
  MediaAlreadyUploaded {
    existing_upload_token: MediaUploadToken,
  },
  MediaSuccessfullyUploaded {
    upload_token: MediaUploadToken,
  }
}

impl SuccessCase {
  pub fn to_media_token(self) -> MediaUploadToken {
    match self {
      SuccessCase::MediaAlreadyUploaded { existing_upload_token } => existing_upload_token,
      SuccessCase::MediaSuccessfullyUploaded { upload_token } => upload_token,
    }
  }
}

pub async fn handle_upload(
  http_request: &HttpRequest,
  server_state: &web::Data<Arc<ServerState>>,
  mut multipart_payload: Multipart,
  allowed_mimetypes: &HashSet<&'static str>,
) -> Result<SuccessCase, UploadError> {

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("MySql pool error: {:?}", err);
        UploadError::ServerError
      })?;

  // ==================== READ SESSION ==================== //

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        error!("Session checker error: {:?}", e);
        UploadError::ServerError
      })?;

  // ==================== BANNED USERS ==================== //

  if let Some(ref user) = maybe_user_session {
    if user.is_banned {
      return Err(UploadError::NotAuthorized);
    }
  }

  // ==================== RATE LIMIT ==================== //

  let rate_limiter = match maybe_user_session {
    None => &server_state.redis_rate_limiters.file_upload_logged_out,
    Some(ref _session) => &server_state.redis_rate_limiters.file_upload_logged_in,
  };

  if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
    return Err(UploadError::RateLimited);
  }

  // ==================== READ MULTIPART REQUEST ==================== //

  let upload_media_request = drain_multipart_request(multipart_payload)
      .await
      .map_err(|e| {
        // TODO: Error handling could be nicer.
        UploadError::BadInput("bad request".to_string())
      })?;

  let uuid_idempotency_token = upload_media_request.uuid_idempotency_token
      .ok_or(UploadError::BadInput("no uuid".to_string()))?;

  let maybe_existing_upload =
      get_media_upload_by_uuid_with_connection(&uuid_idempotency_token, &mut mysql_connection)
          .await;

  match maybe_existing_upload {
    Err(err) => {
      error!("Error checking for previous upload: {:?}", err);
      return Err(UploadError::ServerError);
    }
    Ok(Some(upload)) => {
      // File already uploaded and frontend didn't protect us.
      return Ok(SuccessCase::MediaAlreadyUploaded {
        existing_upload_token: upload.token,
      });
    }
    Ok(None) => {
      // Proceed.
    }
  }

  if let Err(reason) = validate_idempotency_token_format(&uuid_idempotency_token) {
    return Err(UploadError::BadInput(reason));
  }

  let creator_set_visibility = maybe_user_session
      .as_ref()
      .map(|user_session| user_session.preferred_tts_result_visibility) // TODO: We need a new type of visibility control.
      .unwrap_or(Visibility::default());

  let ip_address = get_request_ip(&http_request);

  let maybe_user_token = maybe_user_session
      .as_ref()
      .map(|session| session.get_user_token());

  let maybe_file_size_bytes = upload_media_request.file_bytes
      .as_ref()
      .map(|bytes| bytes.len());

  info!("Upload maybe filesize: {:?}", maybe_file_size_bytes);

  let maybe_mimetype = upload_media_request.file_bytes
      .as_ref()
      .map(|bytes| get_mimetype_for_bytes(bytes.as_ref()))
      .flatten();

  let bytes = match upload_media_request.file_bytes {
    None => return Err(UploadError::BadInput("missing file contents".to_string())),
    Some(bytes) => bytes,
  };

  let hash = sha256_hash_bytes(&bytes)
      .map_err(|io_error| {
        error!("Problem hashing bytes: {:?}", io_error);
        UploadError::ServerError
      })?;

  let file_size_bytes = bytes.len();

  let mut maybe_duration_millis = None;
  let mut maybe_codec_name = None;
  let mut media_upload_type = None;

  if let Some(mimetype) = maybe_mimetype.as_deref() {

    if !allowed_mimetypes.contains(mimetype) {
      // NB: Don't let our error message inject malicious strings
      let filtered_mimetype = mimetype
          .chars()
          .filter(|c| c.is_ascii())
          .filter(|c| c.is_alphanumeric() || *c == '/')
          .collect::<String>();
      return Err(UploadError::BadInput(format!("unpermitted mime type: {}", &filtered_mimetype)));
    }

    // NB: .aiff (audio/aiff) isn't supported by Symphonia:
    //  It contains uncompressed PCM-encoded audio similar to wav.
    //  See: https://github.com/pdeljanov/Symphonia/issues/75
    // NB: The following formats are not supported by Symphonia and
    //  do not have any open issues filed. They may simply be too old:
    //  - .wma (audio/x-ms-wma)
    //  - .avi (video/x-msvideo)
    media_upload_type = match mimetype {
      // Audio
      "audio/aac" /* .aac */ => Some(MediaUploadType::Audio),
      "audio/m4a" /* .m4a */ => Some(MediaUploadType::Audio),
      "audio/mpeg" /* .mp3 */ => Some(MediaUploadType::Audio),
      "audio/ogg" /* .ogg */ => Some(MediaUploadType::Audio),
      "audio/opus" /* .opus */ => Some(MediaUploadType::Audio),
      "audio/x-flac" /* .flac */ => Some(MediaUploadType::Audio),
      "audio/x-wav" /* .wav */ => Some(MediaUploadType::Audio),
      // Image
      "image/jpeg" /* .jpg */ => Some(MediaUploadType::Image),
      "image/png" /* .png */ => Some(MediaUploadType::Image),
      "image/webp" /* .webp */ => Some(MediaUploadType::Image),
      // Video
      "video/mp4" /* .mp4 */ => Some(MediaUploadType::Video),
      "video/quicktime" /* .mov */ => Some(MediaUploadType::Video),
      "video/webm" /* .webm */ => Some(MediaUploadType::Video),
      _ => None,
    };

    let do_audio_decode = match mimetype {
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

    if do_audio_decode && media_upload_type.is_some() {
      let basic_info = decode_basic_audio_bytes_info(
        bytes.as_ref(),
        Some(mimetype),
        None
      ).map_err(|e| {
        warn!("file decoding error: {:?}", e);
        UploadError::BadInput("could not decode file".to_string())
      })?;

      maybe_duration_millis = basic_info.duration_millis;
      maybe_codec_name = basic_info.codec_name;
    }
  }

  let media_upload_type = match media_upload_type {
    Some(m) => m,
    None => {
      warn!("Invalid mimetype: {:?}", maybe_mimetype);
      return Err(UploadError::BadInput(format!("unknown mimetype: {:?}", maybe_mimetype)))
    },
  };

  let media_upload_source = match upload_media_request.media_source {
    MediaSource::Unknown => MediaUploadSource::Unknown,
    MediaSource::UserFile => MediaUploadSource::File,
    MediaSource::UserDeviceApi => MediaUploadSource::DeviceApi,
  };

  // TODO: Clean up code
  let mime_type = match maybe_mimetype {
    Some(m) => m,
    None => {
      warn!("Missing mimetype!");
      return Err(UploadError::BadInput("Missing mimetype".to_string()));
    },
  };

  let public_upload_path = MediaUploadOriginalFilePath::generate_new();

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    bytes.as_ref(),
    mime_type)
      .await
      .map_err(|e| {
        warn!("Upload media bytes to bucket error: {:?}", e);
        UploadError::ServerError
      })?;

  let (token, record_id) = insert_media_upload(Args{
    uuid_idempotency_token: &uuid_idempotency_token,
    media_type: media_upload_type,
    media_source: media_upload_source,
    maybe_original_filename: upload_media_request.file_name.as_deref(),
    original_file_size_bytes: file_size_bytes as u64,
    maybe_original_duration_millis: maybe_duration_millis,
    maybe_original_mime_type: maybe_mimetype,
    maybe_original_audio_encoding: maybe_codec_name.as_deref(),
    maybe_original_video_encoding: None,
    maybe_original_frame_width: None, // TODO
    maybe_original_frame_height: None, // TODO
    checksum_sha2: &hash,
    public_upload_path: &public_upload_path,
    maybe_extra_file_modification_info: None,
    maybe_creator_user_token: maybe_user_token,
    maybe_creator_anonymous_visitor_token: None,
    creator_ip_address: &ip_address,
    creator_set_visibility,
    mysql_pool: &server_state.mysql_pool,
  })
      .await
      .map_err(|err| {
        warn!("New generic download creation DB error: {:?}", err);
        UploadError::ServerError
      })?;

  info!("new media upload id: {} token: {:?}", record_id, &token);

  let firehose_result = match media_upload_source {
    MediaUploadSource::DeviceApi => {
      server_state.firehose_publisher.publish_device_media_recorded(
        maybe_user_token,
        &token).await
    }
    _ => {
      server_state.firehose_publisher.publish_media_uploaded(
        maybe_user_token,
        &token).await
    }
  };

  let _r = firehose_result.map_err(|e| {
    warn!("error publishing event: {:?}", e);
    UploadError::ServerError
  })?;

  Ok(SuccessCase::MediaSuccessfullyUploaded {
    upload_token: token,
  })
}
