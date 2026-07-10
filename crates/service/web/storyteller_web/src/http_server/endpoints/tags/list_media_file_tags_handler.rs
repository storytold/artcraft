use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::web;
use log::warn;

use artcraft_api_defs::tags::list_media_file_tags::{
  ListMediaFileTagsPathInfo, ListMediaFileTagsSuccessResponse,
};
use mysql_queries::queries::tags::list_tags_for_media_file::{
  list_tags_for_media_file, ListTagsForMediaFileArgs,
};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::tags::tag_details::tag_row_to_details;
use crate::state::server_state::ServerState;

/// All tags on a media file, sorted by tag value. Public — no login
/// required, and not scoped to the tag creator.
#[utoipa::path(
  get,
  tag = "Tags",
  path = "/v1/tags/media_file/list/{media_file_token}",
  params(("media_file_token" = MediaFileToken, description = "Media file token")),
  responses(
    (status = 200, body = ListMediaFileTagsSuccessResponse),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn list_media_file_tags_handler(
  path: Path<ListMediaFileTagsPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListMediaFileTagsSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let rows = list_tags_for_media_file(ListTagsForMediaFileArgs {
    media_file_token: &path.media_file_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("list_tags_for_media_file failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(ListMediaFileTagsSuccessResponse {
    success: true,
    tags: rows.into_iter().map(tag_row_to_details).collect(),
  }))
}
