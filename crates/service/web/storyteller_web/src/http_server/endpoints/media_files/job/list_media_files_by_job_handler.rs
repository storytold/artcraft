use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::{error, warn};

use artcraft_api_defs::media_file::job::list_media_files_by_job::{
  JobMediaFileInfo, ListMediaFilesByJobSuccessResponse,
};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use mysql_queries::queries::generic_inference::job::list_media_files_by_source_job::{
  list_media_files_by_source_job, ListMediaFilesBySourceJobArgs,
};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use utoipa::ToSchema;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_file_cover_image_details_builder::MediaFileCoverImageDetailsBuilder;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::user_lookup::api_or_web_session::require_api_or_web_session::require_api_or_web_session;
use crate::state::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct ListMediaFilesByJobPathInfo {
  job_token: InferenceJobToken,
}

/// List the media files produced by an inference job.
/// Authenticates as either a web-session (cookie) user or an API-key (`Authorization` header)
/// user, and only returns files from the caller's own jobs.
#[utoipa::path(
  get,
  tag = "Media Files",
  path = "/v1/media_files/by_job/{job_token}",
  responses(
    (status = 200, description = "Success", body = ListMediaFilesByJobSuccessResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
  params(
    ("path" = ListMediaFilesByJobPathInfo, description = "Path for Request")
  )
)]
pub async fn list_media_files_by_job_handler(
  http_request: HttpRequest,
  path: Path<ListMediaFilesByJobPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListMediaFilesByJobSuccessResponse>, CommonWebError> {
  let job_token = &path.job_token;

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("MySql pool error: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  let session = require_api_or_web_session(
    &http_request,
    &server_state.session_checker,
    &server_state.avt_cookie_manager,
    &mut *mysql_connection,
  ).await?;

  // NB: Jobs another user owns (or unknown job tokens) simply return an empty
  // list — the query filters on the session user's ownership.
  let records = list_media_files_by_source_job(ListMediaFilesBySourceJobArgs {
    job_token,
    creator_user_token: &session.user_token,
    mysql_executor: &mut *mysql_connection,
    phantom: PhantomData,
  })
      .await
      .map_err(|err| {
        warn!("List media files by job {:?} query error: {:?}", job_token, err);
        CommonWebError::from_error(err)
      })?;

  let media_domain = get_media_domain(&http_request);

  let media_files = records.into_iter()
      .map(|record| {
        let public_bucket_path = MediaFileBucketPath::from_object_hash(
          &record.public_bucket_directory_hash,
          record.maybe_public_bucket_prefix.as_deref(),
          record.maybe_public_bucket_extension.as_deref(),
        );
        JobMediaFileInfo {
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
          token: record.token,
          media_class: record.media_class,
          media_type: record.media_type,
          maybe_batch_token: record.maybe_batch_token,
          maybe_prompt_token: record.maybe_prompt_token,
          maybe_original_filename: record.maybe_origin_filename,
          maybe_duration_millis: record.maybe_duration_millis,
          created_at: record.created_at,
          updated_at: record.updated_at,
        }
      })
      .collect::<Vec<_>>();

  Ok(Json(ListMediaFilesByJobSuccessResponse {
    success: true,
    media_files,
  }))
}
