use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;
use sqlx::pool::PoolConnection;
use artcraft_api_defs::folders::folder::{
  FolderPathInfo, SetFolderCoverImageRequest, SetFolderCoverImageSuccessResponse,
};
use enums::by_table::media_files::media_file_class::MediaFileClass;
use mysql_queries::queries::folders::folder::get_folder_for_owner::{
  get_folder_for_owner, GetFolderForOwnerArgs,
};
use mysql_queries::queries::folders::folder::update_folder_cover_image::{
  update_folder_cover_image, UpdateFolderCoverImageArgs,
};
use mysql_queries::queries::media_files::get::lookup_media_file_for_cover_check::{
  lookup_media_file_for_cover_check, LookupMediaFileForCoverCheckArgs,
};
use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

/// Set or clear the custom cover image on a folder.
///
/// If `maybe_media_file_token` is `None`, the cover is cleared. Otherwise
/// the server resolves the supplied media file to a usable cover token:
///
/// 1. The media file must exist, not be soft-deleted, and be owned by the
///    requesting user (same owner as the folder).
/// 2. If the media file is an `image` or `video`, the token is used as-is.
/// 3. Otherwise, if the media file has its own `maybe_cover_image_media_file_token`
///    set, that token is used instead.
/// 4. If neither path applies, the request is rejected with 400.
#[utoipa::path(
  put,
  tag = "Folders",
  path = "/v1/folders/folder/{folder_token}/cover_image",
  params(("folder_token" = FolderToken, description = "Folder token")),
  request_body = SetFolderCoverImageRequest,
  responses(
    (status = 200, body = SetFolderCoverImageSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn cover_image_folder_handler(
  http_request: HttpRequest,
  path: Path<FolderPathInfo>,
  request: Json<SetFolderCoverImageRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<SetFolderCoverImageSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session_using_connection(
    &http_request, &server_state.session_checker, &mut conn,
  ).await.map_err(|_| CommonWebError::NotAuthorized)?;

  // Confirm the folder exists + is owned. Authoritative 404 source.
  get_folder_for_owner(GetFolderForOwnerArgs {
    folder_token: &path.folder_token,
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Folder lookup failed: {:?}", err);
    CommonWebError::from_error(err)
  })?
  .ok_or(CommonWebError::NotFound)?;

  // Resolve the requested media file to a usable cover token (or `None`
  // if clearing).
  let maybe_resolved_token = match &request.maybe_media_file_token {
    None => None,
    Some(media_file_token) => Some(
      resolve_cover_image_token(
        media_file_token,
        &user_session.user_token,
        &mut conn,
      ).await?,
    ),
  };

  update_folder_cover_image(UpdateFolderCoverImageArgs {
    folder_token: &path.folder_token,
    owner_user_token: &user_session.user_token,
    maybe_cover_image_media_file_token: maybe_resolved_token.as_ref(),
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("update_folder_cover_image failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(SetFolderCoverImageSuccessResponse {
    success: true,
    maybe_resolved_cover_media_file_token: maybe_resolved_token,
  }))
}

/// Look up `media_file_token`, verify ownership matches the session, and
/// pick a usable token to store: the media file itself if it's an
/// image/video, otherwise its own self-referential cover image. Returns
/// `Err(CommonWebError::BadInputWithSimpleMessage(_))` if neither applies.
async fn resolve_cover_image_token(
  media_file_token: &MediaFileToken,
  session_user_token: &UserToken,
  conn: &mut PoolConnection<sqlx::MySql>,
) -> Result<MediaFileToken, CommonWebError> {
  let media_file = lookup_media_file_for_cover_check(LookupMediaFileForCoverCheckArgs {
    media_file_token,
    mysql_executor: &mut **conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("lookup_media_file_for_cover_check failed: {:?}", err);
    CommonWebError::from_error(err)
  })?
  .ok_or_else(|| CommonWebError::BadInputWithSimpleMessage(
    "media file does not exist".to_string(),
  ))?;

  let creator_matches = media_file.maybe_creator_user_token
    .as_ref()
    .map(|t| t.as_str() == session_user_token.as_str())
    .unwrap_or(false);

  if !creator_matches {
    // Don't leak whether the file exists; "not yours" reads the same as
    // "doesn't exist" from the client's perspective.
    return Err(CommonWebError::BadInputWithSimpleMessage(
      "media file does not exist".to_string(),
    ));
  }

  match media_file.media_class {
    MediaFileClass::Image | MediaFileClass::Video => Ok(media_file_token.clone()),
    _ => media_file.maybe_cover_image_media_file_token.ok_or_else(|| {
      CommonWebError::BadInputWithSimpleMessage(
        "media file isn't an image or video and has no cover image".to_string(),
      )
    }),
  }
}
