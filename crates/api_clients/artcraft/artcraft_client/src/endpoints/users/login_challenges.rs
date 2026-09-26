use std::time::Duration;

use artcraft_api_defs::users::login_challenges::{
  CreateLoginChallengeRequest, CreateLoginChallengeResponse, LoginChallengeResponse,
  PollLoginChallengeRequest,
};
use artcraft_api_defs::users::session_info::SessionInfoSuccessResponse;
use log::{info, warn};
use reqwest::header::SET_COOKIE;
use reqwest::{Client, Method, RequestBuilder};
use serde::de::DeserializeOwned;
use url::Url;

use crate::utils::api_host::ApiHost;
use crate::utils::constants::USER_AGENT;

pub const CREATE_PATH: &str = "/v1/login_challenges/create";
pub const POLL_PATH: &str = "/v1/login_challenges/poll";
pub const SESSION_PATH: &str = "/v1/session";

/// Native transport for the session bridge. No request/response bodies, cookies,
/// or challenge credentials are logged, even at debug level. Never follows redirects.
#[derive(Clone)]
pub struct LoginChallengeClient {
  client: Client,
  api_host: ApiHost,
}

// Deliberately no Debug/Serialize: the wire result contains a bearer credential.
pub struct PollLoginChallengeResult {
  pub response: LoginChallengeResponse,
  pub session_set_cookie: Option<String>,
}

#[derive(Debug)]
pub struct LoginChallengeClientError {
  pub status: Option<u16>,
  pub message: &'static str,
}

impl LoginChallengeClient {
  pub fn new(api_host: &ApiHost) -> Result<Self, LoginChallengeClientError> {
    let mut builder = Client::builder();
    if matches!(api_host, ApiHost::Localhost { .. }) {
      builder = builder.no_proxy();
    }
    let client = builder
      .timeout(Duration::from_secs(15))
      .redirect(reqwest::redirect::Policy::none())
      .user_agent(USER_AGENT)
      .build()
      .map_err(|_| LoginChallengeClientError::invalid("Unable to initialize login client"))?;
    Ok(Self {
      client,
      api_host: api_host.clone(),
    })
  }

  pub fn api_origin(&self) -> String {
    self.api_host.to_api_hostname_and_scheme()
  }

  pub fn api_url(&self) -> Url {
    Url::parse(&format!("{}/", self.api_origin())).expect("ApiHost must produce a valid origin")
  }

  pub fn allows_verification_url(&self, value: &str) -> bool {
    let Ok(url) = Url::parse(value) else {
      return false;
    };
    let origin_allowed = match self.api_host {
      ApiHost::Localhost { .. } => ["http://localhost:4200", "http://127.0.0.1:4200", "http://localhost:4201", "http://127.0.0.1:4201"]
        .contains(&url.origin().ascii_serialization().as_str()),
      ApiHost::Storyteller => ["https://app.getartcraft.com", "https://getartcraft.com", "https://www.getartcraft.com"]
        .contains(&url.origin().ascii_serialization().as_str()),
      ApiHost::FakeYou => false,
    };
    origin_allowed
      && url.username().is_empty()
      && url.password().is_none()
      && url.path() == "/login/desktop"
      && url.query().is_none()
      && url
        .fragment()
        .and_then(|f| f.strip_prefix("approval_token="))
        .map(|s| {
          s.len() == 43
            && s
              .bytes()
              .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
        })
        .unwrap_or(false)
  }

  pub async fn create(&self) -> Result<CreateLoginChallengeResponse, LoginChallengeClientError> {
    let request = self
      .request(Method::POST, CREATE_PATH)
      .json(&CreateLoginChallengeRequest {});
    let (result, _) = self.send(request, CREATE_PATH).await?;
    Ok(result)
  }

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

  pub(crate) fn request(&self, method: Method, path: &str) -> RequestBuilder {
    self
      .client
      .request(method, format!("{}{path}", self.api_origin()))
      .header("Accept", "application/json")
  }

  pub(crate) async fn send<T: DeserializeOwned>(
    &self,
    request: RequestBuilder,
    path: &str,
  ) -> Result<(T, Option<String>), LoginChallengeClientError> {
    let origin = self.api_origin();
    info!("Website login request: origin={} path={}", origin, path);
    let response = request.send().await.map_err(|_| {
      warn!(
        "Website login network failure: origin={} path={}",
        origin, path
      );
      LoginChallengeClientError::invalid("Unable to reach the login server")
    })?;
    let status = response.status();
    if !status.is_success() {
      warn!(
        "Website login HTTP failure: origin={} path={} status={}",
        origin,
        path,
        status.as_u16()
      );
      return Err(LoginChallengeClientError {
        status: Some(status.as_u16()),
        message: "Login server rejected the request",
      });
    }
    let session_cookie = response
      .headers()
      .get_all(SET_COOKIE)
      .iter()
      .filter_map(|v| v.to_str().ok())
      .find(|v| {
        cookie::Cookie::parse(*v)
          .map(|c| c.name() == "session")
          .unwrap_or(false)
      })
      .map(str::to_owned);
    let body = response.json().await.map_err(|_| {
      warn!(
        "Website login invalid response: origin={} path={}",
        origin, path
      );
      LoginChallengeClientError::invalid("Invalid response from login server")
    })?;
    Ok((body, session_cookie))
  }
}

impl LoginChallengeClientError {
  pub fn invalid(message: &'static str) -> Self {
    Self {
      status: None,
      message,
    }
  }
}

impl std::fmt::Display for LoginChallengeClientError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{} (HTTP {:?})", self.message, self.status)
  }
}

impl std::error::Error for LoginChallengeClientError {}
