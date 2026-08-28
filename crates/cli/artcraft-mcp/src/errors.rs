use std::path::Path;

use serde::Serialize;
use serde_json::Value;

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ErrorCode {
  /// Artcraft desktop app hasn't been installed (or hasn't been run).
  ArtcraftNotInstalled,
  /// Desktop app is present but the user isn't signed in.
  NotLoggedIn,
  /// Session cookies present but the backend rejected them (likely expired).
  SessionExpired,
  /// Storyteller backend unreachable or returned an unexpected error.
  BackendUnavailable,
  /// Caller-provided parameters didn't pass validation.
  InvalidParams,
  /// Generation didn't complete inside our wait window.
  GenerationTimeout,
  /// Generation completed with a failure status.
  GenerationFailed,
  /// Reference image fetch / validation / upload failed.
  ReferenceImageFailed,
  /// Catch-all for unexpected errors.
  Internal,
}

#[derive(Debug, Serialize)]
pub struct ToolError {
  pub error_code: ErrorCode,
  pub message: String,
  pub remediation: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub details: Option<Value>,
}

impl ToolError {
  pub fn not_logged_in() -> Self {
    if is_artcraft_app_installed() {
      Self {
        error_code: ErrorCode::NotLoggedIn,
        message: "You're not signed in to Artcraft.".to_string(),
        remediation:
          "Open /Applications/ArtCraft.app and sign in to your account, then ask me again."
            .to_string(),
        details: None,
      }
    } else {
      Self {
        error_code: ErrorCode::ArtcraftNotInstalled,
        message: "The Artcraft desktop app isn't installed.".to_string(),
        remediation:
          "Download it from https://getartcraft.com, install, sign in, then ask me again."
            .to_string(),
        details: None,
      }
    }
  }

  pub fn session_expired() -> Self {
    Self {
      error_code: ErrorCode::SessionExpired,
      message: "Your Artcraft session has expired or been invalidated.".to_string(),
      remediation: "Open the Artcraft desktop app and sign in again, then ask me to retry."
        .to_string(),
      details: None,
    }
  }

  pub fn backend(message: impl Into<String>) -> Self {
    Self {
      error_code: ErrorCode::BackendUnavailable,
      message: message.into(),
      remediation:
        "This usually clears up on its own. Try again in a minute. If it persists, check the Artcraft desktop app — if it's also failing the backend is having issues."
          .to_string(),
      details: None,
    }
  }

  pub fn invalid_params(message: impl Into<String>) -> Self {
    Self {
      error_code: ErrorCode::InvalidParams,
      message: message.into(),
      remediation:
        "Call list_image_models to see valid model ids and per-model constraints, then retry with corrected parameters."
          .to_string(),
      details: None,
    }
  }

  pub fn generation_timeout(token: String) -> Self {
    Self {
      error_code: ErrorCode::GenerationTimeout,
      message: "Generation did not complete within 90 seconds.".to_string(),
      remediation:
        "The job may still be running on the Artcraft backend — check the desktop app. Or try a faster model (call list_image_models to compare options)."
          .to_string(),
      details: Some(serde_json::json!({ "inference_job_token": token })),
    }
  }

  pub fn generation_failed(message: impl Into<String>) -> Self {
    Self {
      error_code: ErrorCode::GenerationFailed,
      message: message.into(),
      remediation:
        "Adjust the prompt or parameters and retry. Use list_image_models to confirm the model's constraints."
          .to_string(),
      details: None,
    }
  }

  pub fn reference_image(message: impl Into<String>) -> Self {
    Self {
      error_code: ErrorCode::ReferenceImageFailed,
      message: message.into(),
      remediation:
        "Reference images must be publicly-reachable https:// URLs returning image/png, image/jpeg, or image/gif (max 20 MB). Check the URL and retry."
          .to_string(),
      details: None,
    }
  }

  pub fn internal(message: impl Into<String>) -> Self {
    Self {
      error_code: ErrorCode::Internal,
      message: message.into(),
      remediation:
        "If this keeps happening, restart Claude Desktop and inspect ~/Library/Logs/Claude/mcp-server-artcraft.log for details."
          .to_string(),
      details: None,
    }
  }
}

/// Filesystem signals that the desktop app has been installed and at
/// least launched once. We treat either condition as "installed".
pub fn is_artcraft_app_installed() -> bool {
  Path::new("/Applications/ArtCraft.app").exists() || cookie_jar_dir_exists()
}

fn cookie_jar_dir_exists() -> bool {
  directories::ProjectDirs::from("ai", "artcraft", "app")
    .map(|d| d.cache_dir().exists())
    .unwrap_or(false)
}
