use std::marker::PhantomData;
use std::slice;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::tags::clear_media_file_tags::{
  ClearMediaFileTagsPathInfo, ClearMediaFileTagsSuccessResponse,
};
use mysql_queries::queries::tags::filter_owned_media_file_tokens::{
  filter_owned_media_file_tokens, FilterOwnedMediaFileTokensArgs,
};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::tags::apply_tags::apply_tags_to_media_files;
use crate::http_server::user_lookup::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

/// Remove ALL tags from a media file (hard delete of the links — the
/// orphaned tags themselves are not deleted, and their use counts are
/// recounted). Only the media file's creator may do this (404
/// otherwise).
#[utoipa::path(
  post,
  tag = "Tags",
  path = "/v1/tags/media_file/clear/{media_file_token}",
  params(("media_file_token" = MediaFileToken, description = "Media file token")),
  responses(
    (status = 200, body = ClearMediaFileTagsSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn clear_media_file_tags_handler(
  http_request: HttpRequest,
  path: Path<ClearMediaFileTagsPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ClearMediaFileTagsSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session(&http_request, &server_state.session_checker, &mut *conn).await?;

  let owned = filter_owned_media_file_tokens(FilterOwnedMediaFileTokensArgs {
    candidate_tokens: slice::from_ref(&path.media_file_token),
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Media file ownership check failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;
  if owned.is_empty() {
    return Err(CommonWebError::NotFound);
  }

  // Clearing is just "set to the empty tag set".
  let outcome = apply_tags_to_media_files(
    &mut conn,
    &user_session.user_token,
    &owned,
    /* new_tags= */ &[],
    /* remove_unmentioned= */ true,
  ).await?;

  Ok(Json(ClearMediaFileTagsSuccessResponse {
    success: true,
    removed_count: outcome.removed_count,
  }))
}
