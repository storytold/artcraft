use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::tags::list_media_file_tags::{
  ListMediaFileTagsPathInfo, ListMediaFileTagsSuccessResponse,
};
use enums::common::visibility::Visibility;
use mysql_queries::queries::tags::get_media_file_access_fields::{
  get_media_file_access_fields, GetMediaFileAccessFieldsArgs,
};
use mysql_queries::queries::tags::list_tags_for_media_file::{
  list_tags_for_media_file, ListTagsForMediaFileArgs,
};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::tags::tag_details::tag_row_to_details;
use crate::state::server_state::ServerState;

/// All tags on a media file, sorted by tag value. No login required for
/// public and hidden media files (anyone with the URL); PRIVATE files
/// only reveal their tags to their creator — everyone else gets a 404,
/// same as a nonexistent file, so private tag vocabulary doesn't leak.
#[utoipa::path(
  get,
  tag = "Tags",
  path = "/v1/tags/media_file/list/{media_file_token}",
  params(("media_file_token" = MediaFileToken, description = "Media file token")),
  responses(
    (status = 200, body = ListMediaFileTagsSuccessResponse),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn list_media_file_tags_handler(
  http_request: HttpRequest,
  path: Path<ListMediaFileTagsPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListMediaFileTagsSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let access_fields = get_media_file_access_fields(GetMediaFileAccessFieldsArgs {
    media_file_token: &path.media_file_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Media file access lookup failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;
  let Some(access_fields) = access_fields else {
    return Err(CommonWebError::NotFound);
  };

  if access_fields.creator_set_visibility == Visibility::Private {
    // Only the creator may see a private file's tags. The session
    // lookup is deferred to here so the common (non-private) case
    // stays session-free.
    let maybe_user_session = server_state.session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut conn)
      .await
      .map_err(|err| {
        warn!("Session checker error: {:?}", err);
        CommonWebError::from_error(err)
      })?;

    let is_creator = match (&maybe_user_session, &access_fields.maybe_creator_user_token) {
      (Some(session), Some(creator)) => session.user_token.as_str() == creator.as_str(),
      _ => false,
    };
    if !is_creator {
      return Err(CommonWebError::NotFound);
    }
  }

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
