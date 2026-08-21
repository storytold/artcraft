use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use log::{error, warn};

use artcraft_api_defs::common::responses::pagination_cursors::PaginationCursors;
use artcraft_api_defs::media_file::list_session_project_media_files::{ListSessionProjectMediaFilesQueryParams, ListSessionProjectMediaFilesSuccessResponse, ProjectMediaFileInfo};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use mysql_queries::queries::media_files::list::list_session_project_media_files::{list_session_project_media_files, ListSessionProjectMediaFilesArgs};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_file_cover_image_details_builder::MediaFileCoverImageDetailsBuilder;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::common_responses::user_details_lite_builder::UserDetailsLightBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::user_lookup::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

const DEFAULT_PAGE_SIZE: usize = 100;
const MAX_PAGE_SIZE: usize = 1000;

/// List the session user's project files (`media_class = 'project'`), such as
/// 3D scenes, mood boards, workflows, and video timelines (paginated).
///
/// Use `filter_project_type` to scope the results to a single project type.
#[utoipa::path(
  get,
  tag = "Media Files",
  path = "/v1/media_files/project/list",
  params(ListSessionProjectMediaFilesQueryParams),
  responses(
    (status = 200, description = "List the session user's project files", body = ListSessionProjectMediaFilesSuccessResponse),
    (status = 401, description = "Not authorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn list_session_project_media_files_handler(
  http_request: HttpRequest,
  query: Query<ListSessionProjectMediaFilesQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListSessionProjectMediaFilesSuccessResponse>, CommonWebError> {

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("MySql pool error: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  let user_session = require_user_session(
    &http_request,
    &server_state.session_checker,
    &mut *mysql_connection,
  ).await?;

  let limit = query.page_size
      .unwrap_or(DEFAULT_PAGE_SIZE)
      .min(MAX_PAGE_SIZE);

  let sort_ascending = query.sort_ascending.unwrap_or(false);
  let cursor_is_reversed = query.cursor_is_reversed.unwrap_or(false);

  let maybe_cursor_id = if let Some(cursor) = query.cursor.as_deref() {
    Some(server_state.sort_key_crypto.decrypt_id(cursor)?)
  } else {
    None
  };

  let results_page = list_session_project_media_files(ListSessionProjectMediaFilesArgs {
    user_token: user_session.get_user_token(),
    maybe_filter_project_type: query.filter_project_type,
    limit,
    maybe_cursor_id,
    cursor_is_reversed,
    sort_ascending,
    mysql_executor: &mut *mysql_connection,
    phantom: PhantomData,
  })
      .await
      .map_err(|err| {
        warn!("List session project media files query error: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  let maybe_next = if let Some(id) = results_page.last_id {
    Some(server_state.sort_key_crypto.encrypt_id(id)?)
  } else {
    None
  };

  let maybe_previous = if let Some(id) = results_page.first_id {
    Some(server_state.sort_key_crypto.encrypt_id(id)?)
  } else {
    None
  };

  let media_domain = get_media_domain(&http_request);

  let results = results_page.records.into_iter()
      .map(|record| {
        let public_bucket_path = MediaFileBucketPath::from_object_hash(
          &record.public_bucket_directory_hash,
          record.maybe_public_bucket_prefix.as_deref(),
          record.maybe_public_bucket_extension.as_deref(),
        );
        ProjectMediaFileInfo {
          media_links: MediaLinksBuilder::from_media_path_and_env(
            media_domain,
            server_state.server_environment,
            &public_bucket_path,
          ),
          cover_image: MediaFileCoverImageDetailsBuilder::from_optional_db_fields(
            &record.token,
            media_domain,
            server_state.server_environment,
            record.maybe_file_cover_image_public_bucket_hash.as_deref(),
            record.maybe_file_cover_image_public_bucket_prefix.as_deref(),
            record.maybe_file_cover_image_public_bucket_extension.as_deref(),
          ),
          maybe_creator_user: UserDetailsLightBuilder::from_optional_db_fields_owned(
            record.maybe_creator_user_token,
            record.maybe_creator_username,
            record.maybe_creator_display_name,
            record.maybe_creator_gravatar_hash,
          ),
          token: record.token,
          media_class: record.media_class,
          project_type: record.project_type,
          media_type: record.media_type,
          creator_set_visibility: record.creator_set_visibility,
          maybe_title: record.maybe_title,
          created_at: record.created_at,
          updated_at: record.updated_at,
        }
      })
      .collect::<Vec<_>>();

  Ok(Json(ListSessionProjectMediaFilesSuccessResponse {
    success: true,
    results,
    pagination: PaginationCursors {
      maybe_next,
      maybe_previous,
      cursor_is_reversed,
    },
  }))
}
