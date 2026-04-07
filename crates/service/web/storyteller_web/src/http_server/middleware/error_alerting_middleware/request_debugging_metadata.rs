use std::sync::Arc;

use actix_web::dev::ServiceRequest;
use actix_web::web;
use http_server_common::request::get_request_ip::get_request_ip;
use log::debug;

use crate::state::server_state::ServerState;

/// Optional per-request context extracted by the error alerting middleware
/// and forwarded to each handler-specific check. Every field fails open:
/// if extraction errors, the field is `None`.
#[derive(Debug, Default, Clone)]
pub(crate) struct RequestDebuggingMetadata {
  pub request_ip_address: Option<String>,
  pub avt_cookie_token: Option<String>,
  pub session_token: Option<String>,
  pub session_user_token: Option<String>,
}

impl RequestDebuggingMetadata {
  /// Extract whatever we can from a `ServiceRequest`. Never fails — each
  /// piece is best-effort and defaults to `None` on any error.
  pub(crate) fn from_service_request(req: &ServiceRequest) -> Self {
    let http_request = req.request();

    let request_ip_address = Some(get_request_ip(http_request));

    let server_state = req.app_data::<web::Data<Arc<ServerState>>>();

    let avt_cookie_token = server_state
      .and_then(|state| {
        state
          .avt_cookie_manager
          .decode_cookie_payload_from_request(http_request)
          .unwrap_or_else(|e| {
            debug!("Error alerting middleware: avt cookie decode failed: {:?}", e);
            None
          })
      })
      .map(|payload| payload.avt_token.as_str().to_string());

    let (session_token, session_user_token) = server_state
      .and_then(|state| {
        state
          .session_cookie_manager
          .decode_session_payload_from_request(http_request)
          .unwrap_or_else(|e| {
            debug!("Error alerting middleware: session cookie decode failed: {:?}", e);
            None
          })
      })
      .map(|payload| (Some(payload.session_token), payload.maybe_user_token))
      .unwrap_or((None, None));

    Self {
      request_ip_address,
      avt_cookie_token,
      session_token,
      session_user_token,
    }
  }
}
