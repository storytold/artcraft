// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, warn};

use enums_db::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::w2l::w2l_results::edit_w2l_result::{edit_w2l_result, CreatorOrModFields, EditW2lResultArgs};
use mysql_queries::queries::w2l::w2l_results::query_w2l_result::select_w2l_result_by_token;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct EditW2lResultPathInfo {
  token: String,
}

#[derive(Deserialize)]
pub struct EditW2lResultRequest {
  // ========== Author + Moderator options ==========
  pub creator_set_visibility: Option<String>,
}

#[derive(Debug)]
pub enum EditW2lResultError {
  BadInput(String),
  NotAuthorized,
  ResultNotFound,
  ServerError,
}

impl ResponseError for EditW2lResultError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EditW2lResultError::BadInput(_) => StatusCode::BAD_REQUEST,
      EditW2lResultError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EditW2lResultError::ResultNotFound => StatusCode::NOT_FOUND,
      EditW2lResultError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      EditW2lResultError::BadInput(reason) => reason.to_string(),
      EditW2lResultError::NotAuthorized=> "unauthorized".to_string(),
      EditW2lResultError::ResultNotFound => "not found".to_string(),
      EditW2lResultError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for EditW2lResultError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn edit_w2l_inference_result_handler(
  http_request: HttpRequest,
  path: Path<EditW2lResultPathInfo>,
  request: web::Json<EditW2lResultRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, EditW2lResultError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        EditW2lResultError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(EditW2lResultError::NotAuthorized);
    }
  };

  // NB: Moderators can see deleted results.
  // Original creators cannot see them (unless they're moderators!)
  let show_deleted_results = user_session.can_delete_other_users_w2l_results;

  // Moderators get to see all the fields.
  let is_moderator = user_session.can_delete_other_users_w2l_results
      || user_session.can_edit_other_users_w2l_templates; // TODO: Not an exact permission fit

  let inference_result_query_result = select_w2l_result_by_token(
    &path.token,
    show_deleted_results,
    &server_state.mysql_pool
  ).await;

  let inference_result = match inference_result_query_result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(EditW2lResultError::ServerError);
    }
    Ok(None) => return Err(EditW2lResultError::ResultNotFound),
    Ok(Some(inference_result)) => inference_result,
  };

  // NB: Second set of permission checks
  let mut is_author = false;
  if let Some(creator_user_token) = inference_result.maybe_creator_user_token.as_deref() {
    is_author = creator_user_token == user_session.user_token.as_str();
  }

  if !is_author && !is_moderator {
    warn!("user is not allowed to edit result: {:?}", user_session.user_token);
    return Err(EditW2lResultError::NotAuthorized);
  }

  // Author + Mod fields.
  // These fields must be present on all requests.
  let mut creator_set_visibility = Visibility::Public;

  if let Some(visibility) = request.creator_set_visibility.as_deref() {
    creator_set_visibility = Visibility::from_str(visibility)
        .map_err(|_| EditW2lResultError::BadInput("bad record visibility".to_string()))?;
  }

  let ip_address = get_request_ip(&http_request);

  let args = EditW2lResultArgs {
    w2l_result_token: &inference_result.w2l_result_token,
    creator_set_visibility,
    role_dependent_fields: if is_author {
      CreatorOrModFields::CreatorFields {
        creator_ip_address: &ip_address,
      }
    } else {
      CreatorOrModFields::ModFields {
        mod_user_token: user_session.user_token.as_str(),
      }
    },
    mysql_pool: &server_state.mysql_pool,
  };

  edit_w2l_result(args)
      .await
      .map_err(|err| {
        error!("Update W2L result DB error: {:?}", err);
        EditW2lResultError::ServerError
      })?;

  Ok(simple_json_success())
}
