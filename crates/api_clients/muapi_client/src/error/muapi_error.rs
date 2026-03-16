use crate::error::muapi_client_error::MuapiClientError;
use crate::error::muapi_generic_api_error::MuapiGenericApiError;
use crate::error::muapi_specific_api_error::MuapiSpecificApiError;
use cloudflare_errors::cloudflare_error::CloudflareError;
use std::error::Error;

#[derive(Debug)]
pub enum MuapiError {
  Client(MuapiClientError),
  ApiSpecific(MuapiSpecificApiError),
  ApiGeneric(MuapiGenericApiError),
}

impl MuapiError {
  pub fn is_having_downtime_issues(&self) -> bool {
    match self {
      Self::ApiGeneric(MuapiGenericApiError::CloudflareError(CloudflareError::BadGateway502)) => true,
      Self::ApiGeneric(MuapiGenericApiError::CloudflareError(CloudflareError::GatewayTimeout504)) => true,
      Self::ApiGeneric(MuapiGenericApiError::CloudflareError(CloudflareError::TimeoutOccurred524)) => true,
      Self::ApiGeneric(MuapiGenericApiError::UncategorizedBadResponseWithStatusAndBody { status_code, body: _ }) => {
        match status_code.as_u16() {
          502 => true,
          504 => true,
          524 => true,
          _ => false,
        }
      },
      _ => false,
    }
  }
}

impl Error for MuapiError {}

impl std::fmt::Display for MuapiError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Client(e) => write!(f, "MuapiClientError: {:?}", e),
      Self::ApiSpecific(e) => write!(f, "MuapiSpecificApiError: {:?}", e),
      Self::ApiGeneric(e) => write!(f, "MuapiGenericApiError: {:?}", e),
    }
  }
}

impl From<MuapiClientError> for MuapiError {
  fn from(error: MuapiClientError) -> Self {
    Self::Client(error)
  }
}

impl From<MuapiSpecificApiError> for MuapiError {
  fn from(error: MuapiSpecificApiError) -> Self {
    Self::ApiSpecific(error)
  }
}

impl From<MuapiGenericApiError> for MuapiError {
  fn from(error: MuapiGenericApiError) -> Self {
    Self::ApiGeneric(error)
  }
}
