use std::marker::PhantomData;
use std::slice;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::tags::add_media_file_tags::{
  AddMediaFileTagsPathInfo, AddMediaFileTagsRequest, AddMediaFileTagsSuccessResponse,
};
use mysql_queries::queries::tags::filter_owned_media_file_tokens::{
  filter_owned_media_file_tokens, FilterOwnedMediaFileTokensArgs,
};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::tags::apply_tags::apply_tags_to_media_files;
use crate::http_server::endpoints::tags::tag_details::tag_row_to_details;
use crate::http_server::endpoints::tags::tag_input::{parse_tag_input, require_non_empty_tags};
use crate::http_server::user_lookup::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

/// Add tags to a media file. Upsert semantics: tags that don't exist
/// are created (reviving soft-deleted ones), tags already on the file
/// are absorbed without error. Tags not mentioned are left alone. Only
/// the media file's creator may tag it (404 otherwise).
#[utoipa::path(
  post,
  tag = "Tags",
  path = "/v1/tags/media_file/add/{media_file_token}",
  params(("media_file_token" = MediaFileToken, description = "Media file token")),
  request_body = AddMediaFileTagsRequest,
  responses(
    (status = 200, body = AddMediaFileTagsSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn add_media_file_tags_handler(
  http_request: HttpRequest,
  path: Path<AddMediaFileTagsPathInfo>,
  request: Json<AddMediaFileTagsRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<AddMediaFileTagsSuccessResponse>, CommonWebError> {
  let new_tags = parse_tag_input(
    request.maybe_tags.as_deref(),
    request.maybe_tags_list.as_deref(),
  )?;
  require_non_empty_tags(&new_tags)?;

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

  let outcome = apply_tags_to_media_files(
    &mut conn,
    &user_session.user_token,
    &owned,
    &new_tags,
    /* remove_unmentioned= */ false,
  ).await?;

  Ok(Json(AddMediaFileTagsSuccessResponse {
    success: true,
    tags: outcome.tags.into_iter().map(tag_row_to_details).collect(),
  }))
}
