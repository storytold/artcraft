use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, warn};

use enums_db::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::voice_designer::datasets::create_dataset::{create_dataset, CreateDatasetArgs};
use tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken;

use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub struct CreateDatasetRequest {
  pub title: String,

  pub creator_set_visibility: Option<Visibility>,

  pub idempotency_token: Option<String>,
}

#[derive(Serialize)]
pub struct CreateDatasetResponse {
  pub success: bool,
  pub token: Option<ZsVoiceDatasetToken>,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum CreateDatasetError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for CreateDatasetError {
  fn status_code(&self) -> StatusCode {
    match *self {
      CreateDatasetError::BadInput(_) => StatusCode::BAD_REQUEST,
      CreateDatasetError::NotAuthorized => StatusCode::UNAUTHORIZED,
      CreateDatasetError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for CreateDatasetError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn create_dataset_handler(http_request: HttpRequest, request: web::Json<CreateDatasetRequest>, server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CreateDatasetError> {
  let maybe_user_session = server_state.session_checker.maybe_get_user_session(&http_request, &server_state.mysql_pool).await.map_err(|e| {
    error!("Error getting user session: {:?}", e);
    CreateDatasetError::ServerError
  })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CreateDatasetError::NotAuthorized);
    },
  };

  let idempotency_token = request.idempotency_token.clone().ok_or(CreateDatasetError::BadInput("no idempotency token provided".to_string()))?;

  let title = request.title.clone();

  let creator_ip_address = get_request_ip(&http_request);

  let creator_set_visibility = request.creator_set_visibility.unwrap_or(Visibility::Public);

  let query_result = create_dataset(CreateDatasetArgs {
      dataset_title: &title,
      maybe_creator_user_token: Some(user_session.user_token.as_str()),
      creator_ip_address: &creator_ip_address,
      creator_set_visibility,
      mysql_pool: &server_state.mysql_pool
  }).await;

  let dataset_token = match query_result {
    Ok(token) => token,
    Err(e) => {
      error!("Error creating dataset: {:?}", e);
      return Err(CreateDatasetError::ServerError);
    }
  };

  let response = CreateDatasetResponse {
    success: true,
    token: Some(dataset_token),
  };


  let body = serde_json::to_string(&response)
      .map_err(|e| CreateDatasetError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
