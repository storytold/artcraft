//! Core logic for the "save new project" endpoints
//! (`/v1/media_files/upload/project/{kind}/new`).
//!
//! Each project kind (mood board, video timeline, 2D editor, 3D scene) gets a
//! thin handler that delegates here with its own
//! [`super::project_upload_config::ProjectUploadConfig`].

use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::text::Text;
use actix_multipart::form::MultipartForm;
use actix_web::HttpRequest;
use log::{error, info, warn};
use utoipa::ToSchema;

use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_file_upload::{insert_media_file_from_file_upload, InsertMediaFileFromUploadArgs, UploadType};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::media_files::upload::project::project_upload_config::{ProjectUploadConfig, PROJECT_MIMETYPE};
use crate::http_server::endpoints::media_files::upload::project::project_upload_helpers::{read_and_hash_form_file, upload_project_to_bucket};
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;

/// Form-multipart request fields for saving a new project.
///
/// IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `NewProjectMultipartForm` (Under "Schema") FOR DETAILS ON FIELDS AND NULLABILITY.
#[derive(MultipartForm, ToSchema)]
#[multipart(duplicate_field = "deny")]
pub struct NewProjectMultipartForm {
  /// UUID for request idempotency
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = String, format = Binary)]
  pub uuid_idempotency_token: Text<String>,

  /// The project JSON document
  #[multipart(limit = "512 MiB")]
  #[schema(value_type = Vec<u8>, format = Binary)]
  pub file: TempFile,

  /// Optional: Title (name) of the project
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  pub maybe_title: Option<Text<String>>,

  /// Optional: Visibility of the project
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<String>, format = Binary)]
  pub maybe_visibility: Option<Text<Visibility>>,
}

pub struct SaveNewProjectArgs<'a> {
  pub http_request: &'a HttpRequest,
  pub server_state: &'a ServerState,
  pub config: &'a ProjectUploadConfig,
  pub form: NewProjectMultipartForm,
}

/// Save a brand new project media file: insert the record and upload the
/// document to the public bucket. Anonymous (logged-out) creators are allowed.
pub async fn save_new_project(args: SaveNewProjectArgs<'_>) -> Result<MediaFileToken, CommonWebError> {
  let SaveNewProjectArgs { http_request, server_state, config, mut form } = args;

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("MySql pool error: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  // ==================== SESSION (OPTIONAL) + BAN CHECK ==================== //

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(http_request, &mut mysql_connection)
      .await
      .map_err(|err| {
        error!("Session checker error: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  if let Some(ref user) = maybe_user_session {
    if user.is_banned {
      return Err(CommonWebError::NotAuthorized);
    }
  }

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(http_request);

  // ==================== IDEMPOTENCY ==================== //

  let uuid_idempotency_token = form.uuid_idempotency_token.as_ref();

  if let Err(reason) = validate_idempotency_token_format(uuid_idempotency_token) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
  }

  insert_idempotency_token(uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        warn!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("invalid or duplicate idempotency token".to_string())
      })?;

  // NB: Release the connection before the bucket upload — never hold a pooled
  // connection across a network call.
  drop(mysql_connection);

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

  let ip_address = get_request_ip(http_request);

  // ==================== FILE DATA + BUCKET UPLOAD ==================== //

  let (file_bytes, sha256_checksum) = read_and_hash_form_file(&mut form.file)?;

  let public_upload_path = upload_project_to_bucket(server_state, config, &file_bytes).await?;

  // ==================== SAVE RECORD ==================== //

  let (token, record_id) = insert_media_file_from_file_upload(InsertMediaFileFromUploadArgs {
    maybe_media_class: Some(MediaFileClass::Project),
    maybe_project_type: Some(config.project_type),
    media_file_type: config.media_file_type,
    maybe_creator_user_token: maybe_user_session.as_ref().map(|session| session.get_user_token()),
    maybe_creator_anonymous_visitor_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility,
    maybe_prompt_token: None,
    maybe_batch_token: None,
    upload_type: UploadType::ProjectFile,
    maybe_engine_category: None,
    maybe_animation_type: None,
    maybe_mime_type: Some(PROJECT_MIMETYPE),
    file_size_bytes: file_bytes.len() as u64,
    maybe_duration_millis: None,
    sha256_checksum: &sha256_checksum,
    maybe_title: maybe_title.as_deref(),
    maybe_scene_source_media_file_token: None,
    is_intermediate_system_file: false, // NB: is_user_upload = TRUE
    maybe_generation_provider: None,
    public_bucket_directory_hash: public_upload_path.get_object_hash(),
    maybe_public_bucket_prefix: Some(config.bucket_prefix),
    maybe_public_bucket_extension: Some(config.bucket_suffix),
    pool: &server_state.mysql_pool,
  })
      .await
      .map_err(|err| {
        warn!("New project media file insert error: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  info!("New {} project media file id: {} token: {:?}",
    config.project_type, record_id, &token);

  Ok(token)
}
