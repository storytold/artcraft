use std::collections::HashSet;
use std::fmt;
use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_file_cover_image_details_builder::MediaFileCoverImageDetailsBuilder;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::common_responses::user_details_lite_builder::UserDetailsLightBuilder;
use crate::http_server::endpoints::media_files::get::get_media_file_handler::GetMediaFilePathInfo;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest, HttpResponse};
use actix_web_lab::extract::Query;
use artcraft_api_defs::common::responses::media_links::MediaLinks;
use artcraft_api_defs::common::responses::simple_entity_stats::SimpleEntityStats;
use artcraft_api_defs::media_file::list_batch_generated_media_files::{BatchGeneratedReduxMediaFileInfo, ListBatchGeneratedReduxMediaFilesPathInfo, ListBatchGeneratedReduxMediaFilesSuccessResponse};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use chrono::{DateTime, Utc};
use enums_public::by_table::model_weights::public_weights_types::PublicWeightsType;
use log::warn;
use mysql_queries::queries::media_files::get::batch_get_media_files::batch_get_media_files;
use mysql_queries::queries::media_files::list::list_batch_generated_redux_media_files::list_batch_generated_redux_media_files_with_connection;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::prompts::PromptToken;
use utoipa::{IntoParams, ToSchema};

/// List media files generated as part of the same batch (redux endpoint)
#[utoipa::path(
  get,
  tag = "Media Files",
  path = "/v1/media_files/batch_gen_redux/{token}",
  responses(
    (status = 200, description = "Success", body = ListBatchGeneratedReduxMediaFilesSuccessResponse),
  ),
  params(
    ("request" = ListBatchGeneratedReduxMediaFilesPathInfo, description = "Payload for Request"),
  )
)]
pub async fn list_batch_generated_redux_media_files_handler(
  http_request: HttpRequest,
  path: Path<ListBatchGeneratedReduxMediaFilesPathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<ListBatchGeneratedReduxMediaFilesSuccessResponse>, CommonWebError> {
  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::ServerError
      })?;

  let mut show_deleted_results = false;
  let mut is_moderator = false;

  if let Some(user_session) = maybe_user_session {
    // NB: Moderators can see deleted results.
    // Original creators cannot see them (unless they're moderators!)
    show_deleted_results = user_session.can_delete_other_users_tts_results;
    // Moderators get to see all the fields.
    is_moderator = user_session.can_delete_other_users_tts_results
        || user_session.can_edit_other_users_tts_models;
  }

  // NB(bt,2024-03-24): I'm sorry, this is gross. We're not respecting sorting, input ordering,
  // de-duplication, (if we swap types), etc. Gotta go fast.
  let result = list_batch_generated_redux_media_files_with_connection(
    &path.token,
    show_deleted_results,
    &mut mysql_connection,
  ).await;

  let media_files = match result {
    Ok(batch) => batch.media_files,
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(CommonWebError::ServerError);
    }
  };

  let media_domain = get_media_domain(&http_request);

  let media_files = media_files.into_iter()
      .map(|result| {
        let public_bucket_path = MediaFileBucketPath::from_object_hash(
          &result.public_bucket_directory_hash,
          result.maybe_public_bucket_prefix.as_deref(),
          result.maybe_public_bucket_extension.as_deref());

        BatchGeneratedReduxMediaFileInfo {
          token: result.token.clone(),
          media_class: result.media_class,
          media_type: result.media_type,
          maybe_batch_token: result.maybe_batch_token,
          media_links: MediaLinksBuilder::from_media_path_and_env(
            media_domain,
            server_state.server_environment,
            &public_bucket_path
          ),
          cover_image: MediaFileCoverImageDetailsBuilder::from_optional_db_fields(
            &result.token,
            media_domain,
            server_state.server_environment,
            result.maybe_file_cover_image_public_bucket_hash.as_deref(),
            result.maybe_file_cover_image_public_bucket_prefix.as_deref(),
            result.maybe_file_cover_image_public_bucket_extension.as_deref(),
          ),
          maybe_title: result.maybe_title,
          maybe_creator_user: UserDetailsLightBuilder::from_optional_db_fields_owned(
            result.maybe_creator_user_token,
            result.maybe_creator_username,
            result.maybe_creator_display_name,
            result.maybe_creator_gravatar_hash,
          ),
          creator_set_visibility: result.creator_set_visibility,
          maybe_prompt_token: result.maybe_prompt_token,
          maybe_original_filename: result.maybe_origin_filename,
          maybe_duration_millis: result.maybe_duration_millis,
          created_at: result.created_at,
          updated_at: result.updated_at,
        }
      })
      .collect();

  Ok(Json(ListBatchGeneratedReduxMediaFilesSuccessResponse {
    success: true,
    media_files,
  }))
}
