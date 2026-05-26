use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;

use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

// =============== Request ===============

#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum EventLevel {
    Info,
    Warning,
    Error,
}

#[derive(Deserialize)]
pub struct AppAnalyticsReport {
    // The type of event being logged: 'login', 'model_download', 'switch_input', etc.
    // We can send initial events at application startup that report on the OS version,
    // number of microphone devices, etc.
    // Max length 64 characters.
    pub event_type: String,

    // Level of the event.
    // 'info', 'warning', 'error'
    pub event_level: EventLevel,

    // This can be a JSON-encoded payload.
    // Max length: 6,000 characters.
    pub event_payload: String,

    // Timestamp of when the event was recorded.
    // Milliseconds since the epoch.
    pub event_timestamp: u64,
}

#[derive(Deserialize)]
pub struct PostAppAnalyticsRequest {
    // Generate a unique UUID to send with each request so we don't double post.
    // Duplicate reports will be dropped.
    pub idempotency_token: String,

    // Name of the application, eg. 'fakeyou-live'
    pub program_name: String,

    // The user installation UUID
    pub program_installation_uuid: String,

    // If the user is logged in, their user token.
    // Typically we associate one user token with all sent events, but in some cases it may be
    // necessary to show changes, such as login/logout events. These should be sent separately
    // or designated in the JSON payloads of reports[].event_payload.
    pub maybe_user_token: Option<String>,

    // Individual reports, which may be batched.
    // For performance reasons, it's suggested to send reports in batches of 10-20, and then to
    // drain at shutdown. It's also possible to send one at a time by only populating a single
    // report if necessary.
    pub reports: Vec<AppAnalyticsReport>,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct PostAppAnalyticsResponse {
    pub success: bool,
}

// =============== Error Response ===============
// NB: Not using DeriveMore since Clion doesn't understand it.
// =============== Handler ===============

pub async fn post_app_analytics_handler(
    http_request: HttpRequest,
    request: web::Json<PostAppAnalyticsRequest>,
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

    let creator_ip_address = get_request_ip(&http_request);

    // TODO: Functionality

    let response = PostAppAnalyticsResponse {
        success: true,
    };

    let body = serde_json::to_string(&response)
        .map_err(CommonWebError::from_error)?;

    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .body(body))
}
