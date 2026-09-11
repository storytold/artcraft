use crate::creds::sora_cookies::SoraCookies;
use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use crate::creds::sora_sentinel::SoraSentinel;
use crate::creds::sora_sentinel_token::SoraSentinelToken;
use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;

pub struct SoraCredentialBuilder {
  cookies: Option<String>,
  
  jwt_bearer_token: Option<String>,
  
  #[deprecated(note="use sora_sentinel_token instead")]
  sora_sentinel: Option<String>,
  
  /// This is the newer sentinel token. Gradually phase out the older one.
  sora_sentinel_token: Option<SoraSentinelToken>,
}

impl SoraCredentialBuilder {
  pub fn new() -> Self {
    SoraCredentialBuilder {
      cookies: None,
      jwt_bearer_token: None,
      sora_sentinel: None,
      sora_sentinel_token: None,
    }
  }
  
  // Consuming methods
  
  pub fn with_cookies(mut self, cookies: &str) -> Self {
    self.cookies = Some(cookies.to_string());
    self
  }
  
  pub fn with_jwt_bearer_token(mut self, token: &str) -> Self {
    self.jwt_bearer_token = Some(token.to_string());
    self
  }
  
  pub fn with_sora_sentinel(mut self, sentinel: &str) -> Self {
    self.sora_sentinel = Some(sentinel.to_string());
    self
  }

  pub fn with_sora_sentinel_token(mut self, sentinel_token: &SoraSentinelToken) -> Self {
    self.sora_sentinel_token = Some(sentinel_token.clone());
    self
  }

  // Mutable methods

  pub fn set_cookies(&mut self, cookies: &str) {
    self.cookies = Some(cookies.to_string());
  }

  pub fn set_jwt_bearer_token(&mut self, token: &str) {
    self.jwt_bearer_token = Some(token.to_string());
  }

  pub fn set_sora_sentinel(&mut self, sentinel: &str) {
    self.sora_sentinel = Some(sentinel.to_string());
  }

  pub fn set_sora_sentinel_token(&mut self, sentinel_token: &SoraSentinelToken) {
    self.sora_sentinel_token = Some(sentinel_token.clone());
  }
  
  pub fn build(self) -> Result<SoraCredentialSet, SoraError> {
    let cookies = match self.cookies {
      Some(c) => SoraCookies::new(c),
      None => return Err(SoraClientError::SoraCredentialBuilderError("no cookies provided").into()),
    };

    let jwt_bearer_token = match self.jwt_bearer_token {
      Some(t) => Some(SoraJwtBearerToken::new(t)?),
      None => None,
    };

    let sora_sentinel = match self.sora_sentinel {
      Some(s) => Some(SoraSentinel::new(s)),
      None => None,
    };

    let sora_sentinel_token = match self.sora_sentinel_token {
      Some(s) => Some(s),
      None => None,
    };

    Ok(SoraCredentialSet {
      cookies,
      jwt_bearer_token,
      sora_sentinel,
      sora_sentinel_token,
    })
  }
}
