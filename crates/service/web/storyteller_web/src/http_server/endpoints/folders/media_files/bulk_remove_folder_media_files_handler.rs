use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::{error, warn};

use artcraft_api_defs::folders::media_files::{
  BulkRemoveFolderMediaFilesRequest, BulkRemoveFolderMediaFilesSuccessResponse,
  FolderMediaFilesPathInfo,
};
use mysql_queries::queries::folders::folder::get_folder_for_owner::{
  get_folder_for_owner, GetFolderForOwnerArgs,
};
use mysql_queries::queries::folders::media_files::bulk_delete_folder_media_files::{
  bulk_delete_folder_media_files, BulkDeleteFolderMediaFilesArgs,
};
use mysql_queries::queries::folders::media_files::recompute_folder_last_media_files::{
  recompute_folder_last_media_files, RecomputeFolderLastMediaFilesArgs,
};
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql, Transaction};
use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

const MAX_BULK: usize = 500;

/// Bulk-remove media files from a folder. Hard-deletes the membership
/// rows; idempotent (rows that don't exist are silently skipped).
#[utoipa::path(
  post,
  tag = "Folders (Media File Management)",
  path = "/v1/folders/media_files/{folder_token}/bulk_remove",
  params(("folder_token" = FolderToken, description = "Folder token")),
  request_body = BulkRemoveFolderMediaFilesRequest,
  responses(
    (status = 200, body = BulkRemoveFolderMediaFilesSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn bulk_remove_folder_media_files_handler(
  http_request: HttpRequest,
  path: Path<FolderMediaFilesPathInfo>,
  request: Json<BulkRemoveFolderMediaFilesRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<BulkRemoveFolderMediaFilesSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session(&http_request, &server_state.session_checker, &mut *conn).await?;

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

  // Empty input short-circuits with zero work — no transaction needed.
  if request.media_file_tokens.is_empty() {
    return Ok(Json(BulkRemoveFolderMediaFilesSuccessResponse {
      success: true,
      removed_count: 0,
    }));
  }

  let removed_count = perform_atomic_remove(
    &mut conn,
    &path.folder_token,
    &request.media_file_tokens,
  ).await?;

  Ok(Json(BulkRemoveFolderMediaFilesSuccessResponse {
    success: true,
    removed_count,
  }))
}

/// Open a transaction, run the delete + recompute as one unit, and
/// commit on success. On any failure inside [`perform_remove_work`] the
/// transaction is explicitly rolled back before the original error is
/// re-raised — sqlx would roll back on drop too, but doing it explicitly
/// makes the failure path obvious and surfaces any rollback error in
/// the log.
async fn perform_atomic_remove(
  conn: &mut PoolConnection<MySql>,
  folder_token: &FolderToken,
  media_file_tokens: &[MediaFileToken],
) -> Result<u64, CommonWebError> {
  let mut tx = conn.begin().await.map_err(|err| {
    warn!("Failed to begin transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let work_result = perform_remove_work(&mut tx, folder_token, media_file_tokens).await;

  match work_result {
    Ok(removed_count) => {
      tx.commit().await.map_err(|err| {
        warn!("Failed to commit bulk_remove transaction: {:?}", err);
        CommonWebError::from_error(err)
      })?;
      Ok(removed_count)
    }
    Err(err) => {
      if let Err(rollback_err) = tx.rollback().await {
        error!(
          "Rollback after bulk_remove failure also failed: {:?} (original error: {:?})",
          rollback_err, err,
        );
      }
      Err(err)
    }
  }
}

async fn perform_remove_work(
  tx: &mut Transaction<'_, MySql>,
  folder_token: &FolderToken,
  media_file_tokens: &[MediaFileToken],
) -> Result<u64, CommonWebError> {
  let removed_count = bulk_delete_folder_media_files(BulkDeleteFolderMediaFilesArgs {
    folder_token,
    media_file_tokens,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("bulk_delete_folder_media_files failed: {:?}", err);
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

  Ok(removed_count)
}
