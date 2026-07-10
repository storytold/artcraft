use std::collections::HashSet;
use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::tags::bulk_add_tags::{BulkAddTagsRequest, BulkAddTagsSuccessResponse};
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

pub const MAX_BULK_MEDIA_FILES: usize = 500;

/// The link insert is one multi-row statement over the full
/// files × tags cartesian product; cap the product so a maxed-out
/// request can't build an absurd statement.
pub const MAX_LINK_PRODUCT: usize = 25_000;

/// Add the same tag set to many media files at once (pairwise: every
/// tag goes on every file). Upsert semantics throughout — existing
/// tags and existing links are absorbed. Tags not mentioned are left
/// alone. Input tokens the user doesn't own (or that are deleted) are
/// silently skipped; the response lists the accepted tokens.
#[utoipa::path(
  post,
  tag = "Tags",
  path = "/v1/tags/bulk_add",
  request_body = BulkAddTagsRequest,
  responses(
    (status = 200, body = BulkAddTagsSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn bulk_add_tags_handler(
  http_request: HttpRequest,
  request: Json<BulkAddTagsRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<BulkAddTagsSuccessResponse>, CommonWebError> {
  let new_tags = parse_tag_input(
    request.maybe_tags.as_deref(),
    request.maybe_tags_list.as_deref(),
  )?;
  require_non_empty_tags(&new_tags)?;
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

  // Nothing to tag — don't create (or revive) tags that would attach
  // to no files.
  if accepted.is_empty() {
    return Ok(Json(BulkAddTagsSuccessResponse {
      success: true,
      accepted_media_file_tokens: Vec::new(),
      tags: Vec::new(),
    }));
  }

  let outcome = apply_tags_to_media_files(
    &mut conn,
    &user_session.user_token,
    &accepted,
    &new_tags,
    /* remove_unmentioned= */ false,
  ).await?;

  Ok(Json(BulkAddTagsSuccessResponse {
    success: true,
    accepted_media_file_tokens: accepted,
    tags: outcome.tags.into_iter().map(tag_row_to_details).collect(),
  }))
}

/// Dedupe (preserving order) and enforce the bulk size cap. Bails out
/// mid-loop the moment the cap is exceeded, so an oversized body costs
/// O(cap) rather than a full pass over an unbounded input. Shared with
/// the bulk_set handler.
pub fn dedupe_and_cap_media_file_tokens(
  input: &[MediaFileToken],
) -> Result<Vec<MediaFileToken>, CommonWebError> {
  let mut seen = HashSet::new();
  let mut deduped: Vec<MediaFileToken> = Vec::new();
  for token in input {
    if seen.insert(token.as_str()) {
      if deduped.len() >= MAX_BULK_MEDIA_FILES {
        return Err(CommonWebError::BadInputWithSimpleMessage(
          format!("too many media files in one request (max {})", MAX_BULK_MEDIA_FILES),
        ));
      }
      deduped.push(token.clone());
    }
  }
  Ok(deduped)
}
