use std::collections::{HashMap, HashSet};
use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::tags::bulk_list_media_file_tags::{
  BulkListMediaFileTagsRequest, BulkListMediaFileTagsSuccessResponse, MediaFileTagsEntry,
};
use artcraft_api_defs::tags::common::TagDetails;
use mysql_queries::queries::tags::bulk_list_tags_for_media_files::{
  bulk_list_tags_for_media_files, BulkListTagsForMediaFilesArgs,
};
use mysql_queries::queries::tags::filter_visible_media_file_tokens::{
  filter_visible_media_file_tokens, FilterVisibleMediaFileTokensArgs,
};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::user_lookup::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

const MAX_BULK: usize = 500;

/// All tags on each of the supplied media files, in one round-trip.
/// Follows the same visibility rule as the single-file listing: tags on
/// public and hidden files are readable by anyone; a PRIVATE file's
/// tags only appear for its creator (other requesters see it with an
/// empty tag list, indistinguishable from an untagged file). POST
/// because the token list belongs in a request body — the operation is
/// still a pure read.
#[utoipa::path(
  post,
  tag = "Tags",
  path = "/v1/tags/media_files/bulk_list_tags",
  request_body = BulkListMediaFileTagsRequest,
  responses(
    (status = 200, body = BulkListMediaFileTagsSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn bulk_list_media_file_tags_handler(
  http_request: HttpRequest,
  request: Json<BulkListMediaFileTagsRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<BulkListMediaFileTagsSuccessResponse>, CommonWebError> {
  // Cheap validation first — oversized requests shouldn't cost a pool
  // connection or a session query.
  if request.media_file_tokens.len() > MAX_BULK {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("too many media files in one request (max {})", MAX_BULK),
    ));
  }

  // Dedupe, preserving request order.
  let mut seen = HashSet::new();
  let mut media_file_tokens: Vec<MediaFileToken> = Vec::new();
  for token in &request.media_file_tokens {
    if seen.insert(token.as_str()) {
      media_file_tokens.push(token.clone());
    }
  }

  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session(&http_request, &server_state.session_checker, &mut *conn).await?;

  let visible_tokens = filter_visible_media_file_tokens(FilterVisibleMediaFileTokensArgs {
    candidate_tokens: &media_file_tokens,
    requester_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("filter_visible_media_file_tokens failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let pair_rows = bulk_list_tags_for_media_files(BulkListTagsForMediaFilesArgs {
    media_file_tokens: &visible_tokens,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("bulk_list_tags_for_media_files failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let mut tags_by_media_file: HashMap<MediaFileToken, Vec<TagDetails>> = HashMap::new();
  for pair in pair_rows {
    tags_by_media_file
      .entry(pair.media_file_token)
      .or_default()
      .push(TagDetails {
        tag_token: pair.tag_token,
        tag_value: pair.tag_value,
        tag_value_lowercase: pair.tag_value_lowercase,
        use_count: pair.use_count,
      });
  }

  // One entry per requested token, in request order, empty list when
  // the file has no tags (or isn't visible to the requester). Tags
  // sorted by value for stable output.
  let media_files = media_file_tokens.into_iter()
    .map(|media_file_token| {
      let mut tags = tags_by_media_file.remove(&media_file_token).unwrap_or_default();
      tags.sort_by(|a, b| a.tag_value_lowercase.cmp(&b.tag_value_lowercase));
      MediaFileTagsEntry { media_file_token, tags }
    })
    .collect();

  Ok(Json(BulkListMediaFileTagsSuccessResponse {
    success: true,
    media_files,
  }))
}
