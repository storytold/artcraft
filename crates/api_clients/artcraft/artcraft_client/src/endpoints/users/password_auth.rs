use reqwest::Method;
use serde::{Deserialize, Serialize};

use super::login_challenges::{LoginChallengeClient, LoginChallengeClientError};

// No Debug: these request/response types contain credentials.
#[derive(Deserialize, Serialize)]
pub struct PasswordLoginRequest {
  pub username_or_email: String,
  pub password: String,
}

#[derive(Deserialize, Serialize)]
pub struct PasswordSignupRequest {
  pub username: String,
  pub email_address: String,
  pub password: String,
  pub password_confirmation: String,
  pub signup_source: String,
}

#[derive(Deserialize)]
pub struct PasswordAuthResponse {
  pub success: bool,
  pub signed_session: Option<String>,
}

impl LoginChallengeClient {
  pub async fn password_login(&self, request: &PasswordLoginRequest) -> Result<(PasswordAuthResponse, Option<String>), LoginChallengeClientError> {
    let path = "/v1/login";
    self.send(self.request(Method::POST, path).json(request), path).await
  }

  pub async fn password_signup(&self, request: &PasswordSignupRequest) -> Result<(PasswordAuthResponse, Option<String>), LoginChallengeClientError> {
    let path = "/v1/create_account";
    self.send(self.request(Method::POST, path).json(request), path).await
  }
}
