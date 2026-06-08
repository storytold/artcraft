use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::{error, warn};
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql, Transaction};
use tokens::tokens::media_files::MediaFileToken;

use artcraft_api_defs::folders::media_files::{
  BulkMoveFolderMediaFilesRequest, BulkMoveFolderMediaFilesSuccessResponse,
  FolderMediaFilesPathInfo,
};
use mysql_queries::queries::folders::folder::get_folder_for_owner::{
  get_folder_for_owner, GetFolderForOwnerArgs,
};
use mysql_queries::queries::folders::media_files::bulk_delete_folder_media_files::{
  bulk_delete_folder_media_files, BulkDeleteFolderMediaFilesArgs,
};
use mysql_queries::queries::folders::media_files::bulk_insert_folder_media_files::{
  bulk_insert_folder_media_files, BulkInsertFolderMediaFilesArgs,
};
use mysql_queries::queries::folders::media_files::filter_existing_media_file_tokens::{
  filter_existing_media_file_tokens, FilterExistingMediaFileTokensArgs,
};
use tokens::tokens::folders::FolderToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

const MAX_BULK: usize = 500;

/// Atomically move media files from `source_folder` (request body) to the
/// URL `folder_token` (destination).
///
/// The delete-from-source and insert-into-destination steps run inside a
/// single MySQL transaction so a partial failure leaves both folders
/// untouched. Idempotent on both sides:
/// * tokens not currently in the source are silently skipped by the
///   delete;
/// * tokens already in the destination stay there (INSERT IGNORE on the
///   composite primary key);
/// * media files that don't exist or are soft-deleted are filtered out
///   before the insert.
#[utoipa::path(
  post,
  tag = "Folders (Media File Management)",
  path = "/v1/folders/media_files/{folder_token}/bulk_move",
  params(("folder_token" = FolderToken, description = "Destination folder token")),
  request_body = BulkMoveFolderMediaFilesRequest,
  responses(
    (status = 200, body = BulkMoveFolderMediaFilesSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn bulk_move_folder_media_files_handler(
  http_request: HttpRequest,
  path: Path<FolderMediaFilesPathInfo>,
  request: Json<BulkMoveFolderMediaFilesRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<BulkMoveFolderMediaFilesSuccessResponse>, CommonWebError> {
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

  // Short-circuit when source and destination are the same folder.
  // A "move" within one folder would otherwise delete and re-insert
  // every matching membership row inside the transaction, bumping `id`
  // and `created_at` for no observable benefit. Validation above
  // already proved the folder exists; nothing else needs doing.
  if request.source_folder.as_str() == path.folder_token.as_str() {
    return Ok(Json(BulkMoveFolderMediaFilesSuccessResponse {
      success: true,
      removed_from_source_count: 0,
      added_to_destination_count: 0,
      accepted_media_file_tokens: Vec::new(),
    }));
  }

  // Destination must exist + be owned (URL resource → 404 on miss).
  let destination = get_folder_for_owner(GetFolderForOwnerArgs {
    folder_token: &path.folder_token,
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Destination folder lookup failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  if destination.is_none() {
    return Err(CommonWebError::NotFound);
  }

  // Source must exist + be owned (body input → 400 on miss).
  let source = get_folder_for_owner(GetFolderForOwnerArgs {
    folder_token: &request.source_folder,
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Source folder lookup failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  if source.is_none() {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      "source folder does not exist".to_string(),
    ));
  }

  let outcome = perform_atomic_move(
    &mut conn,
    &request.source_folder,
    &path.folder_token,
    &request.media_file_tokens,
  ).await?;

  Ok(Json(BulkMoveFolderMediaFilesSuccessResponse {
    success: true,
    removed_from_source_count: outcome.removed_from_source_count,
    added_to_destination_count: outcome.added_to_destination_count,
    accepted_media_file_tokens: outcome.accepted_media_file_tokens,
  }))
}

struct MoveOutcome {
  removed_from_source_count: u64,
  added_to_destination_count: u64,
  accepted_media_file_tokens: Vec<MediaFileToken>,
}

/// Open a transaction, run the delete + filter + insert as one unit, and
/// commit on success. On any failure inside [`perform_move_work`], the
/// transaction is explicitly rolled back before the original error is
/// re-raised — sqlx would roll back on drop too, but doing it explicitly
/// makes the failure path obvious and surfaces any rollback error in the
/// log.
async fn perform_atomic_move(
  conn: &mut PoolConnection<MySql>,
  source_folder_token: &FolderToken,
  destination_folder_token: &FolderToken,
  media_file_tokens: &[MediaFileToken],
) -> Result<MoveOutcome, CommonWebError> {
  let mut tx = conn.begin().await.map_err(|err| {
    warn!("Failed to begin transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let work_result = perform_move_work(
    &mut tx,
    source_folder_token,
    destination_folder_token,
    media_file_tokens,
  ).await;

  match work_result {
    Ok(outcome) => {
      tx.commit().await.map_err(|err| {
        warn!("Failed to commit move transaction: {:?}", err);
        CommonWebError::from_error(err)
      })?;
      Ok(outcome)
    }
    Err(err) => {
      if let Err(rollback_err) = tx.rollback().await {
        error!(
          "Rollback after move failure also failed: {:?} (original error: {:?})",
          rollback_err, err,
        );
      }
      Err(err)
    }
  }
}

async fn perform_move_work(
  tx: &mut Transaction<'_, MySql>,
  source_folder_token: &FolderToken,
  destination_folder_token: &FolderToken,
  media_file_tokens: &[MediaFileToken],
) -> Result<MoveOutcome, CommonWebError> {
  let removed_from_source_count = bulk_delete_folder_media_files(BulkDeleteFolderMediaFilesArgs {
    folder_token: source_folder_token,
    media_file_tokens,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("bulk_delete_folder_media_files (source) failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let accepted_media_file_tokens = filter_existing_media_file_tokens(FilterExistingMediaFileTokensArgs {
    candidate_tokens: media_file_tokens,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("filter_existing_media_file_tokens failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let added_to_destination_count = if accepted_media_file_tokens.is_empty() {
    0
  } else {
    bulk_insert_folder_media_files(BulkInsertFolderMediaFilesArgs {
      folder_token: destination_folder_token,
      media_file_tokens: &accepted_media_file_tokens,
      mysql_executor: &mut **tx,
      phantom: PhantomData,
    }).await.map_err(|err| {
      warn!("bulk_insert_folder_media_files (destination) failed: {:?}", err);
      CommonWebError::from_error(err)
    })?
  };

  Ok(MoveOutcome {
    removed_from_source_count,
    added_to_destination_count,
    accepted_media_file_tokens,
  })
}
