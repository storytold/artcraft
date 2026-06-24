use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::web::Json;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::ToSchema;

use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use enums::common::visibility::Visibility;
use mysql_queries::queries::voice_designer::datasets::list_datasets_by_username::list_datasets_by_username;
use tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken;

use crate::state::server_state::ServerState;

#[derive(Serialize, Clone, ToSchema)]
pub struct ZsDatasetRecord {
  dataset_token: ZsVoiceDatasetToken,
  title: String,

  ietf_language_tag: String,
  ietf_primary_language_subtag: String,

  creator: UserDetailsLight,

  creator_set_visibility: Visibility,

  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
}


#[derive(Serialize, ToSchema)]
pub struct ListDatasetsByUserSuccessResponse {
  pub success: bool,
  pub datasets: Vec<ZsDatasetRecord>,
}

#[derive(Deserialize, ToSchema)]
pub struct ListDatasetsByUserPathInfo {
  username: String,
}

#[derive(Debug, ToSchema)]
pub enum ListDatasetsByUserError {
  NotAuthorized,
  ServerError,
}

impl fmt::Display for ListDatasetsByUserError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl ResponseError for ListDatasetsByUserError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListDatasetsByUserError::NotAuthorized => StatusCode::UNAUTHORIZED,
      ListDatasetsByUserError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }
}

#[utoipa::path(
  get,
  tag = "Voice Designer",
  path = "/v1/voice_designer/user/{username}/list",
  responses(
    (status = 200, description = "Found", body = ListDatasetsByUserSuccessResponse),
    (status = 401, description = "Not authorized", body = ListDatasetsByUserError),
    (status = 500, description = "Server error", body = ListDatasetsByUserError),
  ),
  params(
    ("path" = ListDatasetsByUserPathInfo, description = "Path for Request")
  )
)]
pub async fn list_datasets_by_user_handler(
  http_request: HttpRequest,
  path: Path<ListDatasetsByUserPathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<ListDatasetsByUserSuccessResponse>, ListDatasetsByUserError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListDatasetsByUserError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(ListDatasetsByUserError::NotAuthorized);
    }
  };

  let username = path.username.as_ref();
  let creator_user_token = user_session.user_token.as_str().to_string();
  let _is_mod = user_session.can_ban_users;

  // NB(bt,2024-01-18): Showing mods deleted files is actually kind of annoying!
  // We should focus on visibility-related controls instead.
  const CAN_SEE_DELETED : bool = false;

  let query_results = list_datasets_by_username(
    &server_state.mysql_pool,
    &username,
    CAN_SEE_DELETED,
  ).await.map_err(|e| {
    warn!("Error querying for datasets: {:?}", e);
    ListDatasetsByUserError::ServerError
  });
  let datasets = match query_results {
    Ok(datasets) => datasets,
    Err(e) => {
      warn!("Error querying for datasets: {:?}", e);
      return Err(ListDatasetsByUserError::ServerError);
    }
  };

  let datasets = datasets.into_iter().map(|dataset| {
    ZsDatasetRecord {
      dataset_token: dataset.dataset_token,
      title: dataset.title,
      creator_set_visibility: dataset.creator_set_visibility,
      ietf_language_tag: dataset.ietf_language_tag,
      ietf_primary_language_subtag: dataset.ietf_primary_language_subtag,
      creator: UserDetailsLight::from_db_fields(
        &dataset.creator_user_token,
        &dataset.creator_username,
        &dataset.creator_display_name,
        &dataset.creator_email_gravatar_hash,
      ),
      created_at: dataset.created_at,
      updated_at: dataset.updated_at,
    }
  }).collect();

  let response = ListDatasetsByUserSuccessResponse {
      success: true,
      datasets,
  };

  Ok(Json(response))
}
