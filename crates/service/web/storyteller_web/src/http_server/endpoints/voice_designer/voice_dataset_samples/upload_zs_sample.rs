use std::collections::HashSet;
use std::sync::Arc;

use actix_multipart::Multipart;
use actix_web::{http::StatusCode, web, HttpRequest, HttpResponse, ResponseError};
use log::{error, info, warn};
use once_cell::sync::Lazy;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_uploads::media_upload_type::MediaUploadType;
use enums::common::visibility::Visibility;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use media::decode_basic_audio_info::decode_basic_audio_bytes_info;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mimetypes::mimetype_to_extension::mimetype_to_extension;
use mysql_queries::queries::voice_designer::voice_samples::get_dataset_sample_by_uuid::get_dataset_sample_by_uuid_with_connection;
use mysql_queries::queries::voice_designer::voice_samples::insert_dataset_sample_and_media_file::{insert_dataset_sample_and_media_file, InsertDatasetSampleAndMediaFileArgs};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::zs_voice_dataset_samples::ZsVoiceDatasetSampleToken;
use tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken;

use crate::http_server::deprecated_endpoints::media_uploads::common::drain_multipart_request::{drain_multipart_request, MediaSource};
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;

#[derive(Serialize)]
pub struct UploadSampleResponse {
  pub success: bool,
  pub sample_token: ZsVoiceDatasetSampleToken,
  pub media_file_token: MediaFileToken,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
static ALLOWED_AUDIO_MIME_TYPES : Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    "audio/aac",
    "audio/m4a",
    "audio/mpeg",
    "audio/ogg",
    "audio/opus",
    "audio/x-flac",
    "audio/x-wav",

    // NB(bt,2023-10-13): This is the only way to allow browser recording.
    // https://air.ghost.io/recording-to-an-audio-file-using-html5-and-js/
    // Chrome: "audio/webm;codecs=opus"
    // Firefox: "audio/ogg;codecs=opus"
    "audio/webm",
    "video/webm",
  ])
});
pub async fn upload_zs_sample_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  mut multipart_payload: Multipart,
) -> Result<HttpResponse, CommonWebError> {

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("MySql pool error: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  // ==================== READ SESSION ==================== //

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        error!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  // ==================== BANNED USERS ==================== //

  if let Some(ref user) = maybe_user_session {
    if user.is_banned {
      return Err(CommonWebError::NotAuthorized);
    }
  }

  // ==================== RATE LIMIT ==================== //

  let rate_limiter = match maybe_user_session {
    None => &server_state.redis_rate_limiters.file_upload_logged_out,
    Some(ref _user) => &server_state.redis_rate_limiters.file_upload_logged_in,
  };

  if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
    return Err(CommonWebError::TooManyRequests);
  }

  if let Err(_err) = server_state.redis_rate_limiters.model_upload.rate_limit_request(&http_request).await {
    return Err(CommonWebError::TooManyRequests);
  }

  // ==================== READ MULTIPART REQUEST ==================== //

  let upload_sample_request = drain_multipart_request(multipart_payload)
      .await
      .map_err(|e| {
        // TODO: Error handling could be nicer.
        CommonWebError::BadInputWithSimpleMessage("bad request".to_string())
      })?;

  let uuid_idempotency_token = upload_sample_request.uuid_idempotency_token
      .ok_or(CommonWebError::BadInputWithSimpleMessage("no uuid".to_string()))?;

  let maybe_existing_upload =
      get_dataset_sample_by_uuid_with_connection(&uuid_idempotency_token, &mut mysql_connection)
          .await;

  match maybe_existing_upload {
    Err(err) => {
      error!("Error checking for previous upload: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
    Ok(Some(previous_record)) => {
      return success_response(
        previous_record.token,
        previous_record.media_file_token,
      );
    }
    Ok(None) => {
      // Proceed.
    }
  }

  if let Err(reason) = validate_idempotency_token_format(&uuid_idempotency_token) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
  }

  let creator_set_visibility = maybe_user_session
      .as_ref()
      .map(|user_session| user_session.preferred_tts_result_visibility)
      .unwrap_or(Visibility::default());

  let ip_address = get_request_ip(&http_request);

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(&http_request);

  let maybe_user_token = maybe_user_session
      .as_ref()
      .map(|session| session.get_user_token());

  let maybe_file_size_bytes = upload_sample_request.file_bytes
      .as_ref()
      .map(|bytes| bytes.len());

  let maybe_mimetype = upload_sample_request.file_bytes
      .as_ref()
      .map(|bytes| get_mimetype_for_bytes(bytes.as_ref()))
      .flatten();

  let dataset_token = match upload_sample_request.dataset_token {
    None => return Err(CommonWebError::BadInputWithSimpleMessage("missing dataset token".to_string())),
    Some(token) => ZsVoiceDatasetToken::new_from_str(&token),
  };

  let bytes = match upload_sample_request.file_bytes {
    None => return Err(CommonWebError::BadInputWithSimpleMessage("missing file contents".to_string())),
    Some(bytes) => bytes,
  };

  let hash = sha256_hash_bytes(&bytes)
      .map_err(|io_error| {
        error!("Problem hashing bytes: {:?}", io_error);
        CommonWebError::from_anyhow_error(io_error)
      })?;

  let file_size_bytes = bytes.len();

  let mut maybe_duration_millis = None;
  let mut maybe_codec_name = None;
  let mut media_upload_type = None;

  if let Some(mimetype) = maybe_mimetype.as_deref() {

    if !ALLOWED_AUDIO_MIME_TYPES.contains(mimetype) {
      // NB: Don't let our error message inject malicious strings
      let filtered_mimetype = mimetype
          .chars()
          .filter(|c| c.is_ascii())
          .filter(|c| c.is_alphanumeric() || *c == '/')
          .collect::<String>();
      return Err(CommonWebError::BadInputWithSimpleMessage(format!("unpermitted mime type: {}", &filtered_mimetype)));
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
      // Video
      "video/webm" /* .webm */ => Some(MediaUploadType::Video), // TODO: Do browsers send this for audio (?)
      _ => None,
    };

    let do_audio_decode = match mimetype {
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
        CommonWebError::BadInputWithSimpleMessage("could not decode file".to_string())
      })?;

      maybe_duration_millis = basic_info.duration_millis;
      maybe_codec_name = basic_info.codec_name;
    }
  }

  let media_upload_type = match media_upload_type {
    Some(m) => m,
    None => {
      warn!("Invalid mimetype: {:?}", maybe_mimetype);
      return Err(CommonWebError::BadInputWithSimpleMessage(format!("unknown mimetype: {:?}", maybe_mimetype)))
    },
  };

  let media_file_origin = match upload_sample_request.media_source {
    MediaSource::Unknown => MediaFileOriginCategory::Upload, // NB: Just treat as a regular upload.
    MediaSource::UserFile => MediaFileOriginCategory::Upload,
    MediaSource::UserDeviceApi => MediaFileOriginCategory::DeviceApi,
  };

  // TODO: Clean up code
  let mime_type = match maybe_mimetype {
    Some(m) => m,
    None => {
      warn!("Missing mimetype!");
      return Err(CommonWebError::BadInputWithSimpleMessage("Missing mimetype".to_string()));
    },
  };

  let file_prefix = "sample_";

  let file_extension = mimetype_to_extension(mime_type).unwrap_or("bin");
  let file_extension = format!(".{file_extension}");

  let public_upload_path = MediaFileBucketPath::generate_new(
    Some(&file_prefix),
    Some(&file_extension)
  );

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    bytes.as_ref(),
    mime_type)
      .await
      .map_err(|e| {
        warn!("Upload media bytes to bucket error: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  let (dataset_sample_token, media_file_token, _record_id) = insert_dataset_sample_and_media_file(InsertDatasetSampleAndMediaFileArgs {
    uuid_idempotency_token: &uuid_idempotency_token,
    media_type: media_upload_type,
    origin_category: media_file_origin,
    dataset_token: &dataset_token,
    maybe_mime_type: maybe_mimetype,
    file_size_bytes: file_size_bytes as u64,
    maybe_original_filename: upload_sample_request.file_name.as_deref(),
    maybe_original_duration_millis: maybe_duration_millis,
    maybe_original_audio_encoding: maybe_codec_name.as_deref(),
    checksum_sha2: &hash,
    media_file_path: &public_upload_path,
    maybe_public_bucket_prefix: Some(&file_prefix),
    maybe_public_bucket_extension: Some(&file_extension),
    //maybe_extra_file_modification_info: None,
    maybe_creator_user_token: maybe_user_token,
    maybe_creator_anonymous_visitor_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility,
    mysql_pool: &server_state.mysql_pool,
  })
      .await
      .map_err(|err| {
        warn!("New generic download creation DB error: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  info!("new media file token: {:?} dataset token: {:?}", media_file_token, dataset_sample_token);

  success_response(
    dataset_sample_token,
    media_file_token,
  )
}

fn success_response(
  sample_token: ZsVoiceDatasetSampleToken,
  media_file_token: MediaFileToken
) -> Result<HttpResponse, CommonWebError> {

  let response = UploadSampleResponse {
    success: true,
    sample_token,
    media_file_token,
  };

  let body = serde_json::to_string(&response)
      .map_err(CommonWebError::from_error)?;

  return Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body));
}
