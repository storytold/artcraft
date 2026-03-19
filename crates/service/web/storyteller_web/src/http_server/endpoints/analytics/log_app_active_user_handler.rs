use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use actix_helpers::extractors::get_request_user_agent::get_request_user_agent;
use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use artcraft_api_defs::analytics::log_active_user::{LogAppActiveUserRequest, LogAppActiveUserResponse};
use enums::common::payments_namespace::PaymentsNamespace;
use errors::AnyhowResult;
use http_server_common::request::get_request_ip::get_request_ip;
use log::{info, warn};
use mysql_queries::queries::analytics_active_users::upsert_analytics_app_active_user::UpsertAnalyticsAppActiveUser;
use mysql_queries::queries::analytics_active_users::upsert_analytics_app_session::UpsertAnalyticsAppSession;
use tokens::tokens::app_session::AppSessionToken;
use utoipa::ToSchema;

const CLIENT_WAIT_FOR_RETRY_MILLIS: u64 = 1_000 * 60 * 1; // Every minute

/// Log an active app user - user must be logged in.
#[utoipa::path(
  post,
  tag = "Analytics",
  path = "/v1/analytics/active_user",
  responses(
    (status = 200, description = "Success", body = LogAppActiveUserResponse),
  ),
  params(
    ("request" = LogAppActiveUserRequest, description = "Payload for Request"),
  )
)]
pub async fn log_app_active_user_handler(
  http_request: HttpRequest,
  request: Query<LogAppActiveUserRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<LogAppActiveUserResponse>, CommonWebError>
{
  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await?;

  let user_token = maybe_user_session
      .ok_or(CommonWebError::NotAuthorized)?
      .user_token;

  let ip_address = get_request_ip(&http_request);
  
  info!("Logging active user: {:?}", request);

  let app_version = {
    let user_agent = get_request_user_agent(&http_request);

    let mut maybe_recorded_version = None;

    if let Some(user_agent) = user_agent {
      maybe_recorded_version = Some(user_agent.to_string());
    };

    let pair = (
      request.maybe_app_name.as_deref(),
      request.maybe_app_version.as_deref(),
    );

    match pair {
      (Some(name), Some(version)) => {
        let version = version.trim().to_string();
        let name = name.trim().to_string();
        if !version.is_empty() && !name.is_empty() {
          maybe_recorded_version = Some(format!("{}/{}", name, version));
        }
      },
      (Some(name), None) => {
        let name = name.trim().to_string();
        if !name.is_empty() {
          maybe_recorded_version = Some(name);
        }
      },
      (None, Some(version)) => {
        let version = version.trim().to_string();
        if !version.is_empty() {
          maybe_recorded_version = Some(version);
        }
      },
      _ => {}
    }

    maybe_recorded_version
  };

  let upsert = UpsertAnalyticsAppActiveUser {
    namespace: PaymentsNamespace::Artcraft,
    user_token: &user_token,
    ip_address: &ip_address,
    app_version: app_version.as_deref(),
    os_platform: request.maybe_os_platform.as_deref(),
    os_version: request.maybe_os_version.as_deref(),
    session_duration_seconds: request.maybe_session_duration_seconds,
  };

  upsert.upsert_with_connection(&mut mysql_connection).await?;
  
  if let Some(token) = request.maybe_app_session_token.as_ref() {
    validate_app_session_token_format(token)?;
    
    let upsert = UpsertAnalyticsAppSession{
      app_session_token: token,
      namespace: PaymentsNamespace::Artcraft,
      user_token: &user_token,
      ip_address: &ip_address,
      app_version: app_version.as_deref(),
      os_platform: request.maybe_os_platform.as_deref(),
      os_version: request.maybe_os_version.as_deref(),
      session_duration_seconds: request.maybe_session_duration_seconds,
      total_generation_count: 0,
      image_generation_count: 0,
      video_generation_count: 0,
      object_generation_count: 0,
      text_to_image_count: 0,
      image_to_image_count: 0,
      text_to_video_count: 0,
      image_to_video_count: 0,
      text_to_object_count: 0,
      image_to_object_count: 0,
      image_page_prompt_count: 0,
      video_page_prompt_count: 0,
      edit_page_prompt_count: 0,
      stage_page_prompt_count: 0,
      object_page_prompt_count: 0,
      other_page_prompt_count: 0,
    };
  
    upsert.upsert_with_connection(&mut mysql_connection).await?;
  }

  Ok(Json(LogAppActiveUserResponse {
    success: true,
    wait_for_retry_millis: CLIENT_WAIT_FOR_RETRY_MILLIS,
  }))
}

fn validate_app_session_token_format(app_session_token: &AppSessionToken) -> Result<(), CommonWebError> {
  if !app_session_token.as_str().starts_with(AppSessionToken::token_prefix()) {
    warn!("App session token has invalid prefix: {}", app_session_token.as_str());
    return Err(CommonWebError::BadInputWithSimpleMessage("Invalid app session token format".to_string()));
  }
  
  Ok(())
}
