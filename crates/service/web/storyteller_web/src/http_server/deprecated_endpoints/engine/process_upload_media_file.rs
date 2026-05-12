use std::collections::HashSet;
use std::sync::Arc;

use actix_multipart::Multipart;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
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
use crate::http_server::endpoints::media_files::upload::upload_generic::drain_multipart_request::{drain_multipart_request, MediaFileUploadSource};
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;

// TODO(bt,2023-12-20): THIS CODE NEEDS CLEANUP. This has been cargo culted three+ times.
//  It's ridiculous and complicated.

pub enum SuccessCase {
  MediaAlreadyUploaded {
    existing_media_file_token: MediaFileToken,
  },
  MediaSuccessfullyUploaded {
    media_file_token: MediaFileToken,
  }
}

impl SuccessCase {
  pub fn to_media_token(self) -> MediaFileToken {
    match self {
      SuccessCase::MediaAlreadyUploaded { existing_media_file_token } => existing_media_file_token,
      SuccessCase::MediaSuccessfullyUploaded { media_file_token } => media_file_token,
    }
  }
}

pub async fn process_upload_media_file(
  http_request: &HttpRequest,
  server_state: &web::Data<Arc<ServerState>>,
  mut multipart_payload: Multipart,
  allowed_mimetypes: &HashSet<&'static str>,
) -> Result<SuccessCase, MediaFileUploadError> {

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
      .maybe_get_user_session_from_connection(http_request, &mut mysql_connection)
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

  // ==================== READ MULTIPART REQUEST ==================== //

  let upload_media_request = drain_multipart_request(multipart_payload)
      .await
      .map_err(|e| {
        // TODO: Error handling could be nicer.
        MediaFileUploadError::BadInput("bad request".to_string())
      })?;

  let uuid_idempotency_token = upload_media_request.uuid_idempotency_token
      .ok_or(MediaFileUploadError::BadInput("no uuid".to_string()))?;

  // ==================== HANDLE IDEMPOTENCY ==================== //

  if let Err(reason) = validate_idempotency_token_format(&uuid_idempotency_token) {
    return Err(MediaFileUploadError::BadInput(reason));
  }

  insert_idempotency_token(&uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        MediaFileUploadError::BadInput("invalid idempotency token".to_string())
      })?;

  // ==================== PROCESS REQUEST ==================== //

  let creator_set_visibility = maybe_user_session
      .as_ref()
      .map(|user_session| user_session.preferred_tts_result_visibility) // TODO: We need a new type of visibility control.
      .unwrap_or(Visibility::default());

  let ip_address = get_request_ip(&http_request);

  let maybe_user_token = maybe_user_session
      .map(|session| session.get_strongly_typed_user_token());

  let maybe_file_size_bytes = upload_media_request.file_bytes
      .as_ref()
      .map(|bytes| bytes.len());

  info!("Upload maybe filesize: {:?}", maybe_file_size_bytes);

  let mut maybe_mimetype = upload_media_request.file_bytes
      .as_ref()
      .map(|bytes| get_mimetype_for_bytes(bytes.as_ref()))
      .flatten();

  let bytes = match upload_media_request.file_bytes {
    None => return Err(MediaFileUploadError::BadInput("missing file contents".to_string())),
    Some(bytes) => bytes,
  };

  let hash = sha256_hash_bytes(&bytes)
      .map_err(|io_error| {
        error!("Problem hashing bytes: {:?}", io_error);
        MediaFileUploadError::ServerError
      })?;

  let file_size_bytes = bytes.len();

  let mut maybe_duration_millis = None;
  let mut maybe_codec_name = None;
  let mut media_file_type = None;

  if let Some(mimetype) = maybe_mimetype.as_deref() {

    if !allowed_mimetypes.contains(mimetype) {
      // NB: Don't let our error message inject malicious strings
      let filtered_mimetype = mimetype
          .chars()
          .filter(|c| c.is_ascii())
          .filter(|c| c.is_alphanumeric() || *c == '/')
          .collect::<String>();
      return Err(MediaFileUploadError::BadInput(format!("unpermitted mime type: {}", &filtered_mimetype)));
    }

    // NB: .aiff (audio/aiff) isn't supported by Symphonia:
    //  It contains uncompressed PCM-encoded audio similar to wav.
    //  See: https://github.com/pdeljanov/Symphonia/issues/75
    // NB: The following formats are not supported by Symphonia and
    //  do not have any open issues filed. They may simply be too old:
    //  - .wma (audio/x-ms-wma)
    //  - .avi (video/x-msvideo)
    media_file_type = match mimetype {
      // Audio
      "audio/aac" /* .aac */ => Some(MediaFileType::Audio),
      "audio/m4a" /* .m4a */ => Some(MediaFileType::Audio),
      "audio/mpeg" /* .mp3 */ => Some(MediaFileType::Audio),
      "audio/ogg" /* .ogg */ => Some(MediaFileType::Audio),
      "audio/opus" /* .opus */ => Some(MediaFileType::Audio),
      "audio/x-flac" /* .flac */ => Some(MediaFileType::Audio),
      "audio/x-wav" /* .wav */ => Some(MediaFileType::Audio),
      // Image
      "image/gif" /* .gif */ => Some(MediaFileType::Image),
      "image/jpeg" /* .jpg */ => Some(MediaFileType::Image),
      "image/png" /* .png */ => Some(MediaFileType::Image),
      "image/webp" /* .webp */ => Some(MediaFileType::Image),
      // Video
      "video/mp4" /* .mp4 */ => Some(MediaFileType::Video),
      "video/quicktime" /* .mov */ => Some(MediaFileType::Video),
      "video/webm" /* .webm */ => Some(MediaFileType::Video),
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

    if do_audio_decode && media_file_type.is_some() {
      let basic_info = decode_basic_audio_bytes_info(
        bytes.as_ref(),
        Some(mimetype),
        None
      ).map_err(|e| {
        warn!("file decoding error: {:?}", e);
        MediaFileUploadError::BadInput("could not decode file".to_string())
      })?;

      maybe_duration_millis = basic_info.duration_millis;
      maybe_codec_name = basic_info.codec_name;
    }
  }

  if media_file_type.is_none() && maybe_mimetype.is_none() {
    // https://research.cs.wisc.edu/graphics/Courses/cs-838-1999/Jeff/BVH.html
    const BVH_HEADER : &[u8] = "HIERARCHY".as_bytes();

    // https://code.blender.org/2013/08/fbx-binary-file-format-specification/
    const FBX_HEADER : &[u8] = "Kaydara FBX Binary".as_bytes();

    // https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/gltfTutorial_002_BasicGltfStructure.md
    // TODO(bt,2024-01-28): Fix this ASAP
    const GLTF_CONTENTS_1 : &[u8] = "{".as_bytes();

    if bytes.starts_with(BVH_HEADER) {
      media_file_type = Some(MediaFileType::Bvh);
      maybe_mimetype = Some("application/octet-stream");
    } else if bytes.starts_with(FBX_HEADER) {
      media_file_type = Some(MediaFileType::Fbx);
      maybe_mimetype = Some("application/octet-stream");
    } else if bytes.starts_with(GLTF_CONTENTS_1) {
      // TODO(bt,2024-01-28): This is a horrible check!
      media_file_type = Some(MediaFileType::Gltf);
      maybe_mimetype = Some("application/json");
    }
  }

  let media_file_type = match media_file_type {
    Some(m) => m,
    None => {
      warn!("Invalid mimetype: {:?}", maybe_mimetype);
      return Err(MediaFileUploadError::BadInput(format!("unknown mimetype: {:?}", maybe_mimetype)))
    },
  };

  let upload_type = match upload_media_request.media_source {
    MediaFileUploadSource::Unknown => UploadType::Filesystem,
    MediaFileUploadSource::UserFile => UploadType::Filesystem,
    MediaFileUploadSource::UserDeviceApi => UploadType::DeviceCaptureApi,
  };

  // TODO: Clean up code
  let mime_type = match maybe_mimetype {
    Some(m) => m,
    None => {
      warn!("Missing mimetype!");
      return Err(MediaFileUploadError::BadInput("Missing mimetype".to_string()));
    },
  };

  let mut extension = mimetype_to_extension(mime_type)
      .map(|extension| format!(".{extension}"));

  if extension.is_none() {
    extension = match media_file_type {
      MediaFileType::Bvh => Some(".bvh".to_string()),
      MediaFileType::Fbx => Some(".fbx".to_string()),
      MediaFileType::Gltf => Some(".gltf".to_string()),
      _ => None,
    };
  }

  const PREFIX : Option<&str> = Some("upload_");

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, extension.as_deref());

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    bytes.as_ref(),
    mime_type)
      .await
      .map_err(|e| {
        warn!("Upload media bytes to bucket error: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  let (token, record_id) = insert_media_file_from_file_upload(InsertMediaFileFromUploadArgs {
    maybe_media_class: None,
    media_file_type,
    maybe_creator_user_token: maybe_user_token.as_ref(),
    maybe_creator_anonymous_visitor_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility,
    upload_type,
    maybe_engine_category: None,
    maybe_animation_type: None,
    maybe_prompt_token: None,
    maybe_batch_token: None,
    maybe_mime_type: Some(mime_type),
    file_size_bytes: file_size_bytes as u64,
    maybe_duration_millis: None,
    sha256_checksum: &hash,
    maybe_title: upload_media_request.title.as_deref(),
    maybe_scene_source_media_file_token: None,
    is_intermediate_system_file: false,
    maybe_generation_provider: None,
    public_bucket_directory_hash: public_upload_path.get_object_hash(),
    maybe_public_bucket_prefix: PREFIX,
    maybe_public_bucket_extension: extension.as_deref(),
    pool: &server_state.mysql_pool,
  })
      .await
      .map_err(|err| {
        warn!("New generic download creation DB error: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  info!("new media file id: {} token: {:?}", record_id, &token);

  Ok(SuccessCase::MediaSuccessfullyUploaded {
    media_file_token: token,
  })
}
