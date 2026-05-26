use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;

use enums::by_table::media_files::media_file_type::MediaFileType;
use mysql_queries::queries::voice_designer::voice_samples::list_dataset_samples_for_dataset_token::list_dataset_samples_for_dataset_token;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::zs_voice_dataset_samples::ZsVoiceDatasetSampleToken;
use tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken;

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

#[derive(Serialize, Clone)]
pub struct ZsSampleRecordForResponse {
  sample_token: ZsVoiceDatasetSampleToken,

  media_file_token: MediaFileToken,
  media_type: MediaFileType,

  public_bucket_directory_hash: String,
  maybe_public_bucket_prefix: Option<String>,
  maybe_public_bucket_extension: Option<String>,

  maybe_creator_user_token: Option<UserToken>,

  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct ListSamplesByDatasetSuccessResponse {
  pub success: bool,
  pub samples: Vec<ZsSampleRecordForResponse>,
}

#[derive(Deserialize)]
pub struct ListSamplesByDatasetPathInfo {
  dataset_token: String,
}
pub async fn list_samples_by_dataset_handler(
  http_request: HttpRequest,
  path: web::Path<ListSamplesByDatasetPathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, CommonWebError> {
  let maybe_user_session = server_state.session_checker.maybe_get_user_session(
    &http_request,
    &server_state.mysql_pool
  ).await.map_err(|e| {
    warn!("Session checker error: {:?}", e);
    CommonWebError::from_error(e)
  })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CommonWebError::NotAuthorized);
    },
  };

  let dataset_token = ZsVoiceDatasetToken(path.dataset_token.clone());
  let _is_mod = user_session.can_ban_users;

  // NB(bt,2024-01-18): Showing mods deleted files is actually kind of annoying!
  // We should focus on visibility-related controls instead.
  const CAN_SEE_DELETED : bool = false;

  let query_results = list_dataset_samples_for_dataset_token(
    &dataset_token,
    CAN_SEE_DELETED,
    &server_state.mysql_pool
  ).await.map_err(|e| {
    warn!("list_samples error: {:?}", e);
    CommonWebError::from_anyhow_error(e)
  });

  let samples = match query_results {
    Ok(samples) => samples,
    Err(e) => {
      warn!("list_samples error: {:?}", e);
      return Err(CommonWebError::from_error(e));
    },
  };

  let samples = samples
    .into_iter()
    .map(|sample| ZsSampleRecordForResponse {
      sample_token: sample.sample_token,
      media_file_token: sample.media_file_token,
      media_type: sample.media_type,
      public_bucket_directory_hash: sample.public_bucket_directory_hash,
      maybe_public_bucket_prefix: sample.maybe_public_bucket_prefix,
      maybe_public_bucket_extension: sample.maybe_public_bucket_extension,
      maybe_creator_user_token: sample.maybe_creator_user_token,
      created_at: sample.created_at,
      updated_at: sample.updated_at,
    })
    .collect();

  let response = ListSamplesByDatasetSuccessResponse {
    success: true,
    samples
  };

  let body = serde_json::to_string(&response).map_err(|e| {
    warn!("json serialization error: {:?}", e);
    CommonWebError::from_error(e)
  })?;

  Ok(HttpResponse::Ok().content_type("application/json").body(body))
}
