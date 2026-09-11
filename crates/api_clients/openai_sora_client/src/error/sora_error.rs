use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::error::sora_specific_api_error::SoraSpecificApiError;
use cloudflare_errors::cloudflare_error::CloudflareError;
use std::error::Error;

#[derive(Debug)]
pub enum SoraError {
  Client(SoraClientError),
  ApiSpecific(SoraSpecificApiError),
  ApiGeneric(SoraGenericApiError),
}

impl SoraError {
  pub fn is_sora_having_downtime_issues(&self) -> bool {
    match self {
      Self::ApiGeneric(SoraGenericApiError::Http502ErrorBadGateway(_)) => true,
      Self::ApiGeneric(SoraGenericApiError::CloudflareError(CloudflareError::BadGateway502)) => true,
      Self::ApiGeneric(SoraGenericApiError::CloudflareError(CloudflareError::GatewayTimeout504)) => true,
      Self::ApiGeneric(SoraGenericApiError::CloudflareError(CloudflareError::TimeoutOccurred524)) => true,
      _ => false,
    }
  }
}

impl Error for SoraError {}

impl std::fmt::Display for SoraError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Client(e) => write!(f, "SoraClientError: {:?}", e),
      Self::ApiSpecific(e) => write!(f, "SoraSpecificApiError: {:?}", e),
      Self::ApiGeneric(e) => write!(f, "SoraGenericApiError: {:?}", e),
    }
  }
}

impl From<SoraClientError> for SoraError {
  fn from(error: SoraClientError) -> Self {
    Self::Client(error)
  }
}

impl From<SoraSpecificApiError> for SoraError {
  fn from(error: SoraSpecificApiError) -> Self {
    Self::ApiSpecific(error)
  }
}

impl From<SoraGenericApiError> for SoraError {
  fn from(error: SoraGenericApiError) -> Self {
    Self::ApiGeneric(error)
  }
}
