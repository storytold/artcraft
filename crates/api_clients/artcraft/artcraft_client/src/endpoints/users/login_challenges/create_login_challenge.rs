use artcraft_api_defs::users::login_challenges::{CreateLoginChallengeRequest, CreateLoginChallengeResponse};
use reqwest::Method;

use crate::utils::login_challenge_client::{LoginChallengeClient, LoginChallengeClientError};

pub const CREATE_PATH: &str = "/v1/login_challenges/create";

impl LoginChallengeClient {
  pub async fn create(&self) -> Result<CreateLoginChallengeResponse, LoginChallengeClientError> {
    let request = self
      .request(Method::POST, CREATE_PATH)
      .json(&CreateLoginChallengeRequest {});
    let (result, _) = self.send(request, CREATE_PATH).await?;
    Ok(result)
  }
}
