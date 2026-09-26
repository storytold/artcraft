use artcraft_api_defs::users::login_challenges::{LoginChallengeResponse, PollLoginChallengeRequest};
use reqwest::Method;

use crate::utils::login_challenge_client::{LoginChallengeClient, LoginChallengeClientError};

pub const POLL_PATH: &str = "/v1/login_challenges/poll";

// Deliberately no Debug/Serialize: the wire result contains a bearer credential.
pub struct PollLoginChallengeResult {
  pub response: LoginChallengeResponse,
  pub session_set_cookie: Option<String>,
}

impl LoginChallengeClient {
  pub async fn poll(
    &self,
    device_token: &str,
  ) -> Result<PollLoginChallengeResult, LoginChallengeClientError> {
    let request = self
      .request(Method::POST, POLL_PATH)
      .json(&PollLoginChallengeRequest {
        device_token: device_token.to_owned(),
      });
    let (response, session_set_cookie) = self.send(request, POLL_PATH).await?;
    Ok(PollLoginChallengeResult {
      response,
      session_set_cookie,
    })
  }
}
