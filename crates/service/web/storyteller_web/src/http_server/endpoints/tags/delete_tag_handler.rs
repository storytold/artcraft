use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::{error, warn};
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql, Transaction};

use artcraft_api_defs::tags::delete_tag::{DeleteTagPathInfo, DeleteTagSuccessResponse};
use mysql_queries::queries::tags::delete_media_file_tags_for_tag::{
  delete_media_file_tags_for_tag, DeleteMediaFileTagsForTagArgs,
};
use mysql_queries::queries::tags::get_tag_for_owner::{get_tag_for_owner, GetTagForOwnerArgs};
use mysql_queries::queries::tags::soft_delete_tag::{soft_delete_tag, SoftDeleteTagArgs};
use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::user_lookup::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

/// Delete a tag: hard-deletes every media-file link, then soft-deletes
/// the tag record itself (its token can be revived later by re-adding
/// the same tag text). Only the tag's creator may do this (404
/// otherwise).
#[utoipa::path(
  delete,
  tag = "Tags",
  path = "/v1/tags/{tag_token}",
  params(("tag_token" = TagToken, description = "Tag token")),
  responses(
    (status = 200, body = DeleteTagSuccessResponse),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn delete_tag_handler(
  http_request: HttpRequest,
  path: Path<DeleteTagPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<DeleteTagSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session(&http_request, &server_state.session_checker, &mut *conn).await?;

  let tag = get_tag_for_owner(GetTagForOwnerArgs {
    tag_token: &path.tag_token,
    creator_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Tag lookup failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;
  if tag.is_none() {
    return Err(CommonWebError::NotFound);
  }

  let removed_link_count = perform_atomic_delete(
    &mut conn,
    &path.tag_token,
    &user_session.user_token,
  ).await?;

  Ok(Json(DeleteTagSuccessResponse {
    success: true,
    removed_link_count,
  }))
}

/// Run the link hard-delete and the tag soft-delete as one unit.
async fn perform_atomic_delete(
  conn: &mut PoolConnection<MySql>,
  tag_token: &TagToken,
  creator_user_token: &UserToken,
) -> Result<u64, CommonWebError> {
  let mut tx = conn.begin().await.map_err(|err| {
    warn!("Failed to begin delete-tag transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let work_result = perform_delete_work(&mut tx, tag_token, creator_user_token).await;

  match work_result {
    Ok(removed_link_count) => {
      tx.commit().await.map_err(|err| {
        warn!("Failed to commit delete-tag transaction: {:?}", err);
        CommonWebError::from_error(err)
      })?;
      Ok(removed_link_count)
    }
    Err(err) => {
      if let Err(rollback_err) = tx.rollback().await {
        error!(
          "Rollback after delete-tag failure also failed: {:?} (original error: {:?})",
          rollback_err, err,
        );
      }
      Err(err)
    }
  }
}

async fn perform_delete_work(
  tx: &mut Transaction<'_, MySql>,
  tag_token: &TagToken,
  creator_user_token: &UserToken,
) -> Result<u64, CommonWebError> {
  let removed_link_count = delete_media_file_tags_for_tag(DeleteMediaFileTagsForTagArgs {
    tag_token,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("delete_media_file_tags_for_tag failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let updated = soft_delete_tag(SoftDeleteTagArgs {
    tag_token,
    creator_user_token,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("soft_delete_tag failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // The pre-check passed but the tag vanished mid-flight (concurrent
  // delete). The rollback keeps the links intact.
  if updated == 0 {
    return Err(CommonWebError::NotFound);
  }

  Ok(removed_link_count)
}
