use std::sync::Arc;

use actix_web::dev::ServiceRequest;
use actix_web::http::header::{HeaderName, ORIGIN, REFERER, USER_AGENT};
use actix_web::web;
use actix_web::HttpMessage;
use actix_web::HttpRequest;
use http_server_common::request::get_request_ip::get_request_ip;
use log::debug;

use trace_id::TraceId;

use crate::state::server_state::ServerState;

/// Optional header sent by ArtCraft clients identifying the app release.
const ARTCRAFT_VERSION_HEADER: &str = "x-artcraft-version";

/// Optional per-request context extracted by the error alerting middleware
/// and forwarded to each handler-specific check. Every field fails open:
/// if extraction errors, the field is `None`.
#[derive(Debug, Default, Clone)]
pub(crate) struct RequestDebuggingMetadata {
  pub request_ip_address: Option<String>,
  pub avt_cookie_token: Option<String>,
  pub session_token: Option<String>,
  pub session_user_token: Option<String>,
  /// Set by `TraceIdMiddleware` (outermost middleware) on every request.
  pub trace_id: Option<String>,
  /// Hostname the client used to reach this server (Host / forwarded-host
  /// headers). Distinguishes api.storyteller.ai vs api.fakeyou.com etc.
  pub http_host: Option<String>,
  /// `Origin` header — scheme+host of the frontend page making the XHR call.
  pub http_origin: Option<String>,
  /// `Referer` header — URL of the frontend page making the XHR call
  /// (may be truncated to the origin by the browser's referrer policy).
  pub http_referer: Option<String>,
  /// `User-Agent` header.
  pub http_user_agent: Option<String>,
  /// `X-ArtCraft-Version` header — app release of the ArtCraft client, if sent.
  pub artcraft_version: Option<String>,
}

impl RequestDebuggingMetadata {
  /// Extract whatever we can from a `ServiceRequest`. Never fails — each
  /// piece is best-effort and defaults to `None` on any error.
  pub(crate) fn from_service_request(req: &ServiceRequest) -> Self {
    let http_request = req.request();

    let request_ip_address = Some(get_request_ip(http_request));

    let trace_id = http_request.extensions()
      .get::<TraceId>()
      .map(|t| t.to_string());

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

    // `connection_info()` prefers Forwarded / X-Forwarded-Host over the raw
    // Host header, so this reflects the hostname the client actually used
    // even behind the load balancer.
    let http_host = Some(http_request.connection_info().host().to_string())
      .filter(|host| !host.is_empty());

    let http_origin = get_header_value(http_request, ORIGIN);
    let http_referer = get_header_value(http_request, REFERER);
    let http_user_agent = get_header_value(http_request, USER_AGENT);
    let artcraft_version =
      get_header_value(http_request, HeaderName::from_static(ARTCRAFT_VERSION_HEADER));

    Self {
      request_ip_address,
      avt_cookie_token,
      session_token,
      session_user_token,
      trace_id,
      http_host,
      http_origin,
      http_referer,
      http_user_agent,
      artcraft_version,
    }
  }
}

/// Read a header as a UTF-8 string; `None` if absent or not valid UTF-8.
fn get_header_value(request: &HttpRequest, header_name: HeaderName) -> Option<String> {
  request.headers()
    .get(header_name)
    .and_then(|value| value.to_str().ok())
    .map(|value| value.to_string())
}
