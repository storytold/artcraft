use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::{error, warn};
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql, Transaction};

use artcraft_api_defs::tags::common::TagDetails;
use artcraft_api_defs::tags::rename_tag::{
  RenameTagPathInfo, RenameTagRequest, RenameTagSuccessResponse,
};
use mysql_queries::errors::database_insert_error::DatabaseInsertError;
use mysql_queries::queries::tags::delete_media_file_tags_for_tag::{
  delete_media_file_tags_for_tag, DeleteMediaFileTagsForTagArgs,
};
use mysql_queries::queries::tags::get_soft_deleted_tag_by_lowercase::{
  get_soft_deleted_tag_by_lowercase, GetSoftDeletedTagByLowercaseArgs,
};
use mysql_queries::queries::tags::get_tag_for_owner::{get_tag_for_owner, GetTagForOwnerArgs};
use mysql_queries::queries::tags::hard_delete_soft_deleted_tag::{
  hard_delete_soft_deleted_tag, HardDeleteSoftDeletedTagArgs,
};
use mysql_queries::queries::tags::rename_tag::{rename_tag, RenameTagArgs};
use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::tags::tag_input::MAX_TAG_LENGTH_CHARS;
use crate::http_server::user_lookup::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

/// Rename a tag. Handles both case-only changes (same lowercased value)
/// and wholesale renames. If the target name is held by one of the
/// user's SOFT-DELETED tags, the dead row is purged so the rename can
/// take the name over; a LIVE tag with the target name fails with 400.
/// Only the tag's creator may do this (404 otherwise).
#[utoipa::path(
  put,
  tag = "Tags",
  path = "/v1/tags/rename/{tag_token}",
  params(("tag_token" = TagToken, description = "Tag token")),
  request_body = RenameTagRequest,
  responses(
    (status = 200, body = RenameTagSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn rename_tag_handler(
  http_request: HttpRequest,
  path: Path<RenameTagPathInfo>,
  request: Json<RenameTagRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<RenameTagSuccessResponse>, CommonWebError> {
  let new_tag_value = request.new_tag_value.trim();
  if new_tag_value.is_empty() {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      "new_tag_value must not be empty".to_string(),
    ));
  }
  // NB: check the lowercased form too — Unicode lowercasing can EXPAND
  // a string (e.g. 'İ' U+0130 → "i\u{307}"), and both columns are
  // VARCHAR(255).
  let new_tag_value_lowercase = new_tag_value.to_lowercase();
  if new_tag_value.chars().count() > MAX_TAG_LENGTH_CHARS
    || new_tag_value_lowercase.chars().count() > MAX_TAG_LENGTH_CHARS
  {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("tag is too long (max {} characters)", MAX_TAG_LENGTH_CHARS),
    ));
  }

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
  let Some(tag) = tag else {
    return Err(CommonWebError::NotFound);
  };

  perform_atomic_rename(
    &mut conn,
    &path.tag_token,
    &user_session.user_token,
    new_tag_value,
    &new_tag_value_lowercase,
  ).await?;

  Ok(Json(RenameTagSuccessResponse {
    success: true,
    tag: TagDetails {
      tag_token: tag.token,
      tag_value: new_tag_value.to_string(),
      tag_value_lowercase: new_tag_value_lowercase,
      use_count: tag.use_count,
    },
  }))
}

/// Purge any soft-deleted tag squatting on the target name, then rename
/// — as one unit, so a failed rename doesn't leave the dead tag purged.
async fn perform_atomic_rename(
  conn: &mut PoolConnection<MySql>,
  tag_token: &TagToken,
  creator_user_token: &UserToken,
  new_tag_value: &str,
  new_tag_value_lowercase: &str,
) -> Result<(), CommonWebError> {
  let mut tx = conn.begin().await.map_err(|err| {
    warn!("Failed to begin rename-tag transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let work_result = perform_rename_work(
    &mut tx,
    tag_token,
    creator_user_token,
    new_tag_value,
    new_tag_value_lowercase,
  ).await;

  match work_result {
    Ok(()) => {
      tx.commit().await.map_err(|err| {
        warn!("Failed to commit rename-tag transaction: {:?}", err);
        CommonWebError::from_error(err)
      })?;
      Ok(())
    }
    Err(err) => {
      if let Err(rollback_err) = tx.rollback().await {
        error!(
          "Rollback after rename-tag failure also failed: {:?} (original error: {:?})",
          rollback_err, err,
        );
      }
      Err(err)
    }
  }
}

async fn perform_rename_work(
  tx: &mut Transaction<'_, MySql>,
  tag_token: &TagToken,
  creator_user_token: &UserToken,
  new_tag_value: &str,
  new_tag_value_lowercase: &str,
) -> Result<(), CommonWebError> {
  // A soft-deleted tag still occupies the (tag_value_lowercase,
  // creator_user_token) unique key. The user's tag list doesn't show
  // it, so from their perspective the name is free — purge the dead
  // row (and any stray links to it) so the rename can take the name.
  let maybe_dead_tag_token = get_soft_deleted_tag_by_lowercase(GetSoftDeletedTagByLowercaseArgs {
    tag_value_lowercase: new_tag_value_lowercase,
    creator_user_token,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("get_soft_deleted_tag_by_lowercase failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  if let Some(dead_tag_token) = maybe_dead_tag_token {
    delete_media_file_tags_for_tag(DeleteMediaFileTagsForTagArgs {
      tag_token: &dead_tag_token,
      mysql_executor: &mut **tx,
      phantom: PhantomData,
    }).await.map_err(|err| {
      warn!("delete_media_file_tags_for_tag failed: {:?}", err);
      CommonWebError::from_error(err)
    })?;

    hard_delete_soft_deleted_tag(HardDeleteSoftDeletedTagArgs {
      tag_token: &dead_tag_token,
      creator_user_token,
      mysql_executor: &mut **tx,
      phantom: PhantomData,
    }).await.map_err(|err| {
      warn!("hard_delete_soft_deleted_tag failed: {:?}", err);
      CommonWebError::from_error(err)
    })?;
  }

  let updated = rename_tag(RenameTagArgs {
    tag_token,
    creator_user_token,
    new_tag_value,
    new_tag_value_lowercase,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    // A LIVE tag with the target name still rejects the rename via the
    // (tag_value_lowercase, creator_user_token) unique key.
    match DatabaseInsertError::from(err) {
      DatabaseInsertError::DuplicateKeyError => CommonWebError::BadInputWithSimpleMessage(
        "you already have a tag with that name".to_string(),
      ),
      other => {
        warn!("rename_tag failed: {:?}", other);
        CommonWebError::server_error_with_message("Failed to rename tag")
      }
    }
  })?;

  // The pre-check passed but the tag vanished mid-flight.
  if updated == 0 {
    return Err(CommonWebError::NotFound);
  }

  Ok(())
}
