use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::tags::common::TagDetails;
use artcraft_api_defs::tags::rename_tag::{
  RenameTagPathInfo, RenameTagRequest, RenameTagSuccessResponse,
};
use mysql_queries::errors::database_insert_error::DatabaseInsertError;
use mysql_queries::queries::tags::get_tag_for_owner::{get_tag_for_owner, GetTagForOwnerArgs};
use mysql_queries::queries::tags::rename_tag::{rename_tag, RenameTagArgs};
use tokens::tokens::tags::TagToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::tags::tag_input::MAX_TAG_LENGTH_CHARS;
use crate::http_server::user_lookup::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

/// Rename a tag. Handles both case-only changes (same lowercased value)
/// and wholesale renames. Fails with 400 if the user already has a
/// different tag with the same lowercased value. Only the tag's creator
/// may do this (404 otherwise).
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
  if new_tag_value.chars().count() > MAX_TAG_LENGTH_CHARS {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("tag is too long (max {} characters)", MAX_TAG_LENGTH_CHARS),
    ));
  }
  let new_tag_value_lowercase = new_tag_value.to_lowercase();

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

  let updated = rename_tag(RenameTagArgs {
    tag_token: &path.tag_token,
    creator_user_token: &user_session.user_token,
    new_tag_value,
    new_tag_value_lowercase: &new_tag_value_lowercase,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    // The (tag_value_lowercase, creator_user_token) unique key rejects
    // renames that collide with another of the user's tags.
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
