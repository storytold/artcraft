//! Core logic for the "upload updated project" endpoints
//! (`/v1/media_files/upload/project/{kind}/update/{token}`).
//!
//! Each project kind (mood board, video timeline, 2D editor, 3D scene) gets a
//! thin handler that delegates here with its own
//! [`super::project_upload_config::ProjectUploadConfig`].

use std::marker::PhantomData;

use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::text::Text;
use actix_multipart::form::MultipartForm;
use actix_web::HttpRequest;
use log::{error, warn};
use utoipa::ToSchema;

use enums::by_table::media_files::media_file_class::MediaFileClass;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::edit::update_project_media_file_contents::{update_project_media_file_contents, UpdateProjectMediaFileContentsArgs};
use mysql_queries::queries::media_files::get::lookup_media_file_for_project_update::{lookup_media_file_for_project_update, LookupMediaFileForProjectUpdateArgs};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::media_files::upload::project::project_upload_config::{ProjectUploadConfig, PROJECT_MIMETYPE};
use crate::http_server::endpoints::media_files::upload::project::project_upload_helpers::{read_and_hash_form_file, upload_project_to_bucket};
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::check_creator_tokens::{check_creator_tokens, CheckCreatorTokenArgs, CheckCreatorTokenResult};

/// Form-multipart request fields for overwriting an existing project.
///
/// IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UpdateProjectMultipartForm` (Under "Schema") FOR DETAILS ON FIELDS AND NULLABILITY.
#[derive(MultipartForm, ToSchema)]
#[multipart(duplicate_field = "deny")]
pub struct UpdateProjectMultipartForm {
  /// UUID for request idempotency
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = String, format = Binary)]
  pub uuid_idempotency_token: Text<String>,

  /// The project JSON document
  #[multipart(limit = "512 MiB")]
  #[schema(value_type = Vec<u8>, format = Binary)]
  pub file: TempFile,
}

pub struct UpdateProjectArgs<'a> {
  pub http_request: &'a HttpRequest,
  pub server_state: &'a ServerState,
  pub config: &'a ProjectUploadConfig,
  pub media_file_token: &'a MediaFileToken,
  pub form: UpdateProjectMultipartForm,
}

/// Overwrite an existing project media file. Only the creator may update:
/// user-owned files require a matching user session; anonymously created
/// files require a matching anonymous visitor token.
pub async fn update_project(args: UpdateProjectArgs<'_>) -> Result<(), CommonWebError> {
  let UpdateProjectArgs { http_request, server_state, config, media_file_token, mut form } = args;

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

  // ==================== LOOK UP RECORD + CHECK OWNERSHIP ==================== //

  let media_file = lookup_media_file_for_project_update(LookupMediaFileForProjectUpdateArgs {
    media_file_token,
    mysql_executor: &mut *mysql_connection,
    phantom: PhantomData,
  })
      .await
      .map_err(|err| {
        error!("Error looking up media file for project update: {:?}", err);
        CommonWebError::from_error(err)
      })?
      .ok_or(CommonWebError::NotFound)?;

  // Only overwrite records that are the right kind of project document.
  // (Legacy records may predate `maybe_project_type`, so the media type is
  // the source of truth; the project type just has to not disagree.)
  let is_expected_media_type = media_file.media_type == config.media_file_type;
  let project_type_disagrees = media_file.maybe_project_type
      .is_some_and(|project_type| project_type != config.project_type);

  if !is_expected_media_type || project_type_disagrees {
    return Err(CommonWebError::BadInputWithSimpleMessage(format!(
      "media file is not a {} project", config.project_type)));
  }

  let creator_check = check_creator_tokens(CheckCreatorTokenArgs {
    maybe_creator_user_token: media_file.maybe_creator_user_token.as_ref(),
    maybe_current_request_user_token: maybe_user_session.as_ref().map(|session| session.get_user_token()),
    maybe_creator_anonymous_visitor_token: media_file.maybe_creator_anonymous_visitor_token.as_ref(),
    maybe_current_request_anonymous_visitor_token: maybe_avt_token.as_ref(),
  });

  match creator_check {
    CheckCreatorTokenResult::UserTokenMatch => {} // Allowed
    CheckCreatorTokenResult::NoUserAnonymousVisitorTokenMatch => {} // Allowed
    CheckCreatorTokenResult::UserTokenMismatch
    | CheckCreatorTokenResult::NoUserAnonymousVisitorTokenMismatch
    | CheckCreatorTokenResult::InsufficientInformation => {
      return Err(CommonWebError::NotAuthorized);
    }
  }

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

  // ==================== FILE DATA + BUCKET UPLOAD ==================== //

  let ip_address = get_request_ip(http_request);

  let (file_bytes, sha256_checksum) = read_and_hash_form_file(&mut form.file)?;

  // NB: Each save writes a fresh bucket object and repoints the record; old
  // objects are left behind as cruft to clean up later (same as the legacy
  // scene endpoints).
  let public_upload_path = upload_project_to_bucket(server_state, config, &file_bytes).await?;

  // ==================== UPDATE RECORD ==================== //

  // NB: The pool is only handed over after the held connection is dropped
  // above, so this acquires the request's single connection at a time.
  update_project_media_file_contents(UpdateProjectMediaFileContentsArgs {
    media_file_token,
    media_class: MediaFileClass::Project,
    media_type: config.media_file_type,
    project_type: config.project_type,
    public_bucket_directory_hash: public_upload_path.get_object_hash(),
    maybe_public_bucket_prefix: Some(config.bucket_prefix),
    maybe_public_bucket_extension: Some(config.bucket_suffix),
    maybe_mime_type: Some(PROJECT_MIMETYPE),
    file_size_bytes: file_bytes.len() as u64,
    sha256_checksum: &sha256_checksum,
    update_ip_address: &ip_address,
    mysql_executor: &server_state.mysql_pool,
    phantom: PhantomData,
  })
      .await
      .map_err(|err| {
        warn!("Project media file update error: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  Ok(())
}
