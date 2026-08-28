use serde_json::{json, Value};

use artcraft_client::endpoints::credits::get_session_credits::get_session_credits;
use enums::common::payments_namespace::PaymentsNamespace;

use crate::creds::load_session;
use crate::errors::{is_artcraft_app_installed, ToolError};

/// Health check that always succeeds (returns Ok) and reports a
/// structured diagnostic. Safe to call any time — useful when Claude
/// suspects something is off or when the user explicitly asks
/// "is the connection working?".
pub async fn run() -> Result<Value, ToolError> {
  let app_installed = is_artcraft_app_installed();

  match load_session() {
    Err(err) => Ok(json!({
      "status": status_from_error_code(&err.error_code),
      "desktop_app_installed": app_installed,
      "signed_in": false,
      "session_valid": null,
      "error_code": err.error_code,
      "remediation": err.remediation,
    })),
    Ok((api_host, creds)) => {
      // Cheap authenticated call. If it succeeds the session is good;
      // a failure here usually means the cookie expired since sign-in.
      match get_session_credits(&api_host, Some(&creds), PaymentsNamespace::Artcraft).await {
        Ok(_) => Ok(json!({
          "status": "ok",
          "desktop_app_installed": app_installed,
          "signed_in": true,
          "session_valid": true,
          "error_code": null,
          "remediation": null,
        })),
        Err(api_err) => {
          let expired = ToolError::session_expired();
          Ok(json!({
            "status": "session_invalid",
            "desktop_app_installed": app_installed,
            "signed_in": true,
            "session_valid": false,
            "error_code": expired.error_code,
            "remediation": expired.remediation,
            "details": { "api_error": format!("{:?}", api_err) },
          }))
        }
      }
    }
  }
}

fn status_from_error_code(code: &crate::errors::ErrorCode) -> &'static str {
  use crate::errors::ErrorCode::*;
  match code {
    ArtcraftNotInstalled => "not_installed",
    NotLoggedIn => "not_logged_in",
    SessionExpired => "session_invalid",
    _ => "error",
  }
}
