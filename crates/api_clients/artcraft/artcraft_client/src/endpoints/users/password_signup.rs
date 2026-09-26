use reqwest::Method;
use serde::{Deserialize, Serialize};

use crate::utils::login_challenge_client::{LoginChallengeClient, LoginChallengeClientError};
use super::password_auth_response::PasswordAuthResponse;

pub const SIGNUP_PATH: &str = "/v1/create_account";

// No Debug: the request contains credentials.
#[derive(Deserialize, Serialize)]
pub struct PasswordSignupRequest {
  pub username: String,
  pub email_address: String,
  pub password: String,
  pub password_confirmation: String,
  pub signup_source: String,
}

impl LoginChallengeClient {
  pub async fn password_signup(&self, request: &PasswordSignupRequest) -> Result<(PasswordAuthResponse, Option<String>), LoginChallengeClientError> {
    self.send(self.request(Method::POST, SIGNUP_PATH).json(request), SIGNUP_PATH).await
  }
}
