use artcraft_api_defs::users::session_info::SessionInfoSuccessResponse;
use reqwest::Method;

use crate::utils::login_challenge_client::{LoginChallengeClient, LoginChallengeClientError};

pub const SESSION_PATH: &str = "/v1/session";

impl LoginChallengeClient {
  pub async fn session(
    &self,
    signed_session: &str,
  ) -> Result<SessionInfoSuccessResponse, LoginChallengeClientError> {
    let request = self
      .request(Method::GET, SESSION_PATH)
      .header("Cookie", format!("session={signed_session}"));
    let (result, _) = self.send(request, SESSION_PATH).await?;
    Ok(result)
  }
}
