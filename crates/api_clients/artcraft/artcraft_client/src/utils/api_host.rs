
use artcraft_client_identity::origins::{ARTCRAFT_DESKTOP_DEVELOPMENT_ORIGIN, ARTCRAFT_DESKTOP_ORIGIN};

const HTTP_SCHEME: &str = "http";

const HTTPS_SCHEME: &str = "https";

#[derive(Clone, Debug)]
pub enum ApiHost {
  Storyteller,
  FakeYou,
  Localhost { port: u32 },
}

impl ApiHost {
  pub fn to_api_hostname(&self) -> String {
    match self {
      ApiHost::Storyteller => "api.storyteller.ai".to_string(),
      ApiHost::FakeYou => "api.fakeyou.com".to_string(),
      ApiHost::Localhost { port } => format!("localhost:{}", port),
    }
  }

  pub fn to_api_hostname_and_scheme(&self) -> String {
    match self {
      ApiHost::Storyteller => "https://api.storyteller.ai".to_string(),
      ApiHost::FakeYou => "https://api.fakeyou.com".to_string(),
      ApiHost::Localhost { port } => format!("http://localhost:{}", port),
    }
  }
  
  /// The `Origin` the desktop client declares to this API.
  pub fn request_origin(&self) -> &'static str {
    match self {
      ApiHost::Storyteller => ARTCRAFT_DESKTOP_ORIGIN,
      ApiHost::FakeYou => ARTCRAFT_DESKTOP_ORIGIN,
      ApiHost::Localhost { .. } => ARTCRAFT_DESKTOP_DEVELOPMENT_ORIGIN,
    }
  }

  pub fn scheme(&self) -> &'static str {
    match self {
      ApiHost::Storyteller => HTTPS_SCHEME,
      ApiHost::FakeYou => HTTPS_SCHEME,
      ApiHost::Localhost { .. } => HTTP_SCHEME,
    }
  }
}
