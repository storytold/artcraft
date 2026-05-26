// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use crate::http_server::common_responses::common_web_error::CommonWebError;

use actix_artcraft::sessions::user_sessions::http_user_session_manager::HttpUserSessionManager;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use mysql_queries::queries::users::user_sessions::delete_user_session::delete_user_session;
use sqlx::MySqlPool;
use user_traits_component::traits::internal_session_cache_purge::InternalSessionCachePurge;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
pub struct LogoutSuccessResponse {
  pub success: bool,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
#[utoipa::path(
  post,
  tag = "Users",
  path = "/v1/logout",
  responses(
    (status = 200, description = "Found", body = LogoutSuccessResponse),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
)]
pub async fn logout_handler(
  http_request: HttpRequest,
  session_cookie_manager: web::Data<HttpUserSessionManager>,
  mysql_pool: web::Data<MySqlPool>,
  internal_session_cache_purge: web::Data<dyn InternalSessionCachePurge>,
) -> Result<HttpResponse, CommonWebError>
{
  // Best effort to delete Redis session cache
  internal_session_cache_purge.best_effort_purge_session_cache(&http_request);

  let maybe_session = session_cookie_manager
      .decode_session_payload_from_request(&http_request)
      .map_err(|e| {
        warn!("Session cookie decode error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  if let Some(session) = maybe_session {
    let _r = delete_user_session(&session.session_token, &mysql_pool).await;
  }

  let mut delete_cookie = match http_request.cookie("session") {
    Some(cookie) => {
      cookie // delete this cookie
    },
    None => {
      session_cookie_manager.delete_cookie()
    }
  };

  let response = LogoutSuccessResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
    .map_err(CommonWebError::from_error)?;

  // Mark cookie for deletion
  delete_cookie.make_removal();

  Ok(HttpResponse::Ok()
    .cookie(delete_cookie)
    .content_type("application/json")
    .body(body))
}
