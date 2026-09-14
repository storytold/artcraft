use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_client_error::MidjourneyClientError;
use crate::error::midjourney_error::MidjourneyError;
use browser_emulation::browser_profile::BrowserProfile;
use serde::Deserialize;

/// Google Identity Toolkit endpoint that Midjourney's Firebase auth uses to
/// exchange a refresh token for a fresh ID token.
const SECURE_TOKEN_URL: &str = "https://securetoken.googleapis.com/v1/token";

/// The public Firebase Web API key embedded in the Midjourney web app. This is
/// not a secret (it ships in the client bundle); it identifies the Firebase
/// project, and access is still gated by the refresh token.
pub const DEFAULT_FIREBASE_API_KEY: &str = "AIzaSyAjizp68NsH3JGUS0EyLXsChW4fN0A92tM";

/// Exchanges a refresh token for a new ID/access token.
///
/// The refresh token is the value of the `__Host-Midjourney.AuthUserTokenV3_r`
/// cookie. The returned `id_token` is the new value for the
/// `__Host-Midjourney.AuthUserTokenV3_i` cookie.
pub struct RefreshTokenRequest<'a> {
  pub refresh_token: &'a str,

  /// Firebase Web API key. Pass `DEFAULT_FIREBASE_API_KEY` unless overriding.
  pub api_key: &'a str,
}

/// A refresh-token request plus its transport concerns. This endpoint hits
/// Google's securetoken service (not Midjourney), so it has no cookie or
/// hostname — only an optional browser profile.
pub struct RefreshTokenArgs<'a> {
  pub request: RefreshTokenRequest<'a>,
  /// Defaults to [`BrowserProfile::default`] if absent.
  pub browser: Option<BrowserProfile>,
}

#[derive(Debug, Clone)]
pub struct RefreshTokenResponse {
  /// The new access token (same value as `id_token`).
  pub access_token: String,

  /// The new Firebase ID token — the fresh `AuthUserTokenV3_i` cookie value.
  pub id_token: String,

  /// The refresh token to use next time (may be rotated).
  pub refresh_token: String,

  /// Seconds until `access_token` expires (as returned, a stringified number).
  pub expires_in: Option<String>,

  pub token_type: Option<String>,
  pub user_id: Option<String>,
  pub project_id: Option<String>,
}

pub async fn refresh_token(args: RefreshTokenArgs<'_>) -> Result<RefreshTokenResponse, MidjourneyError> {
  let client = args.browser.clone().unwrap_or_default().build_client().map_err(MidjourneyClientError::WreqError)?;

  let url = format!("{}?key={}", SECURE_TOKEN_URL, args.request.api_key);

  let form = [("grant_type", "refresh_token"), ("refresh_token", args.request.refresh_token)];

  let http_request = client.post(url).header("Origin", "https://www.midjourney.com").header("Referer", "https://www.midjourney.com/").header("accept", "*/*").header("accept-language", "en-US,en;q=0.8").header("content-type", "application/x-www-form-urlencoded").form(&form).build().map_err(MidjourneyClientError::WreqError)?;

  let response = client.execute(http_request).await.map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

  let status = response.status();
  let response_body = response.text().await.map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

  if !status.is_success() {
    return Err(
      match status.as_u16() {
        400 => MidjourneyApiError::InvalidRequest(response_body),
        401 => MidjourneyApiError::Unauthorized(response_body),
        403 => MidjourneyApiError::Forbidden(response_body),
        code => MidjourneyApiError::UnknownHttpFailure { status_code: code, body: response_body },
      }
      .into(),
    );
  }

  #[derive(Deserialize)]
  struct RawResponse {
    access_token: String,
    id_token: String,
    refresh_token: String,
    expires_in: Option<String>,
    token_type: Option<String>,
    user_id: Option<String>,
    project_id: Option<String>,
  }

  let response = serde_json::from_str::<RawResponse>(&response_body).map_err(|err| MidjourneyApiError::deserialization(err, response_body.as_str()))?;

  Ok(RefreshTokenResponse { access_token: response.access_token, id_token: response.id_token, refresh_token: response.refresh_token, expires_in: response.expires_in, token_type: response.token_type, user_id: response.user_id, project_id: response.project_id })
}
