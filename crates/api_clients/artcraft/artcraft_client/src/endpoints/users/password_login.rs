use reqwest::Method;
use serde::{Deserialize, Serialize};

use crate::utils::login_challenge_client::{LoginChallengeClient, LoginChallengeClientError};
use super::password_auth_response::PasswordAuthResponse;

pub const LOGIN_PATH: &str = "/v1/login";

// No Debug: the request contains credentials.
#[derive(Deserialize, Serialize)]
pub struct PasswordLoginRequest {
  pub username_or_email: String,
  pub password: String,
}

impl LoginChallengeClient {
  pub async fn password_login(&self, request: &PasswordLoginRequest) -> Result<(PasswordAuthResponse, Option<String>), LoginChallengeClientError> {
    self.send(self.request(Method::POST, LOGIN_PATH).json(request), LOGIN_PATH).await
  }
}
