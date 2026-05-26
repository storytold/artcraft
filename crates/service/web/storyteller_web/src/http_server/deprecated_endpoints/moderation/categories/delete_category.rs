use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::model_categories::toggle_model_category_soft_delete::{toggle_model_category_soft_delete, ToggleSoftDeleteState};

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

// =============== Request ===============

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct DeleteCategoryPathInfo {
  token: String,
}

#[derive(Deserialize)]
pub struct DeleteCategoryRequest {
  set_delete: bool,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct DeleteCategoryResponse {
  pub success: bool,
}

// =============== Error Response ===============
// NB: Not using DeriveMore since Clion doesn't understand it.
// =============== Handler ===============

pub async fn delete_category_handler(
  http_request: HttpRequest,
  path: Path<DeleteCategoryPathInfo>,
  request: web::Json<DeleteCategoryRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  // TODO: We don't have a permission for categories, so we use this as a proxy.
  if !user_session.can_ban_users {
    warn!("no permission to delete categories");
    return Err(CommonWebError::NotAuthorized);
  }

  let soft_delete_state = if request.set_delete {
    ToggleSoftDeleteState::Delete
  } else {
    ToggleSoftDeleteState::Undelete
  };

  let query_result = toggle_model_category_soft_delete(
    &path.token,
    soft_delete_state,
    &server_state.mysql_pool
  ).await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Delete/undelete category edit DB error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  let response = DeleteCategoryResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      ?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
