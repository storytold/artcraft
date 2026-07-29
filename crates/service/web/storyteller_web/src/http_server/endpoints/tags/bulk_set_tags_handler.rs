use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::tags::bulk_set_tags::{BulkSetTagsRequest, BulkSetTagsSuccessResponse};
use mysql_queries::queries::tags::filter_owned_media_file_tokens::{
  filter_owned_media_file_tokens, FilterOwnedMediaFileTokensArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::tags::apply_tags::apply_tags_to_media_files;
use crate::http_server::endpoints::tags::bulk_add_tags_handler::{
  dedupe_and_cap_media_file_tokens, MAX_LINK_PRODUCT,
};
use crate::http_server::endpoints::tags::tag_details::tag_row_to_details;
use crate::http_server::endpoints::tags::tag_input::parse_tag_input;
use crate::http_server::user_lookup::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

/// Replace the tag set on many media files at once (pairwise: every
/// file ends up with exactly the mentioned tags). Mentioned tags are
/// upserted and attached like `bulk_add`; previously-attached tags that
/// weren't mentioned are unlinked (orphaned tags are not deleted). An
/// empty tag set clears every listed file. Input tokens the user
/// doesn't own (or that are deleted) are silently skipped; the
/// response lists the accepted tokens.
#[utoipa::path(
  post,
  tag = "Tags",
  path = "/v1/tags/bulk_set",
  request_body = BulkSetTagsRequest,
  responses(
    (status = 200, body = BulkSetTagsSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn bulk_set_tags_handler(
  http_request: HttpRequest,
  request: Json<BulkSetTagsRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<BulkSetTagsSuccessResponse>, CommonWebError> {
  // Empty (after trimming) is allowed here: "set to nothing" clears.
  let new_tags = parse_tag_input(
    request.maybe_tags.as_deref(),
    request.maybe_tags_list.as_deref(),
  )?;
  let media_file_tokens = dedupe_and_cap_media_file_tokens(&request.media_file_tokens)?;

  if media_file_tokens.len() * new_tags.len() > MAX_LINK_PRODUCT {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("media_files × tags is too large (max {} pairs)", MAX_LINK_PRODUCT),
    ));
  }

  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session(&http_request, &server_state.session_checker, &mut *conn).await?;

  let accepted = filter_owned_media_file_tokens(FilterOwnedMediaFileTokensArgs {
    candidate_tokens: &media_file_tokens,
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Media file ownership check failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // Nothing to update — don't create (or revive) tags that would
  // attach to no files.
  if accepted.is_empty() {
    return Ok(Json(BulkSetTagsSuccessResponse {
      success: true,
      accepted_media_file_tokens: Vec::new(),
      tags: Vec::new(),
      removed_count: 0,
    }));
  }

  let outcome = apply_tags_to_media_files(
    &mut conn,
    &user_session.user_token,
    &accepted,
    &new_tags,
    /* remove_unmentioned= */ true,
  ).await?;

  Ok(Json(BulkSetTagsSuccessResponse {
    success: true,
    accepted_media_file_tokens: accepted,
    tags: outcome.tags.into_iter().map(tag_row_to_details).collect(),
    removed_count: outcome.removed_count,
  }))
}
