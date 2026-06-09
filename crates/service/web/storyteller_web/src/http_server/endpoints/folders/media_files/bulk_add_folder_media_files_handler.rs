use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::{error, warn};
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql, Transaction};
use tokens::tokens::media_files::MediaFileToken;

use artcraft_api_defs::folders::media_files::{
  BulkAddFolderMediaFilesRequest, BulkAddFolderMediaFilesSuccessResponse,
  FolderMediaFilesPathInfo,
};
use mysql_queries::queries::folders::folder::get_folder_for_owner::{
  get_folder_for_owner, GetFolderForOwnerArgs,
};
use mysql_queries::queries::folders::media_files::bulk_insert_folder_media_files::{
  bulk_insert_folder_media_files, BulkInsertFolderMediaFilesArgs,
};
use mysql_queries::queries::folders::media_files::filter_existing_media_file_tokens::{
  filter_existing_media_file_tokens, FilterExistingMediaFileTokensArgs,
};
use mysql_queries::queries::folders::media_files::recompute_folder_last_media_files::{
  recompute_folder_last_media_files, RecomputeFolderLastMediaFilesArgs,
};
use tokens::tokens::folders::FolderToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

const MAX_BULK: usize = 500;

/// Bulk-add media files to a folder. Idempotent via INSERT IGNORE on the
/// composite primary key. Media-file tokens that don't exist or are
/// soft-deleted are silently skipped; the response lists the accepted
/// tokens.
#[utoipa::path(
  post,
  tag = "Folders (Media File Management)",
  path = "/v1/folders/media_files/{folder_token}/bulk_add",
  params(("folder_token" = FolderToken, description = "Folder token")),
  request_body = BulkAddFolderMediaFilesRequest,
  responses(
    (status = 200, body = BulkAddFolderMediaFilesSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn bulk_add_folder_media_files_handler(
  http_request: HttpRequest,
  path: Path<FolderMediaFilesPathInfo>,
  request: Json<BulkAddFolderMediaFilesRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<BulkAddFolderMediaFilesSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session_using_connection(
    &http_request, &server_state.session_checker, &mut conn,
  ).await.map_err(|_| CommonWebError::NotAuthorized)?;

  if request.media_file_tokens.len() > MAX_BULK {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("too many media files in one request (max {})", MAX_BULK),
    ));
  }


  let folder = get_folder_for_owner(GetFolderForOwnerArgs {
    folder_token: &path.folder_token,
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Folder lookup failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;
  if folder.is_none() {
    return Err(CommonWebError::NotFound);
  }

  let accepted = filter_existing_media_file_tokens(FilterExistingMediaFileTokensArgs {
    candidate_tokens: &request.media_file_tokens,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("filter_existing_media_file_tokens failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // Empty `accepted` is a no-op — no membership change means no
  // recompute needed and no transaction to open.
  if !accepted.is_empty() {
    perform_atomic_add(&mut conn, &path.folder_token, &accepted).await?;
  }

  Ok(Json(BulkAddFolderMediaFilesSuccessResponse {
    success: true,
    accepted_media_file_tokens: accepted,
  }))
}

/// Open a transaction, run the insert + recompute as one unit, and
/// commit on success. On any failure inside [`perform_add_work`] the
/// transaction is explicitly rolled back before the original error is
/// re-raised — sqlx would roll back on drop too, but doing it explicitly
/// makes the failure path obvious and surfaces any rollback error in
/// the log.
async fn perform_atomic_add(
  conn: &mut PoolConnection<MySql>,
  folder_token: &FolderToken,
  media_file_tokens: &[MediaFileToken],
) -> Result<(), CommonWebError> {
  let mut tx = conn.begin().await.map_err(|err| {
    warn!("Failed to begin transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let work_result = perform_add_work(&mut tx, folder_token, media_file_tokens).await;

  match work_result {
    Ok(()) => {
      tx.commit().await.map_err(|err| {
        warn!("Failed to commit bulk_add transaction: {:?}", err);
        CommonWebError::from_error(err)
      })?;
      Ok(())
    }
    Err(err) => {
      if let Err(rollback_err) = tx.rollback().await {
        error!(
          "Rollback after bulk_add failure also failed: {:?} (original error: {:?})",
          rollback_err, err,
        );
      }
      Err(err)
    }
  }
}

async fn perform_add_work(
  tx: &mut Transaction<'_, MySql>,
  folder_token: &FolderToken,
  media_file_tokens: &[MediaFileToken],
) -> Result<(), CommonWebError> {
  bulk_insert_folder_media_files(BulkInsertFolderMediaFilesArgs {
    folder_token,
    media_file_tokens,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("bulk_insert_folder_media_files failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  recompute_folder_last_media_files(RecomputeFolderLastMediaFilesArgs {
    folder_token,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("recompute_folder_last_media_files failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(())
}
