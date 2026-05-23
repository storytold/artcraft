use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::error::grok_specific_api_error::GrokSpecificApiError;
use cloudflare_errors::cloudflare_error::CloudflareError;
use std::error::Error;

#[derive(Debug)]
pub enum GrokError {
  Client(GrokClientError),
  ApiSpecific(GrokSpecificApiError),
  ApiGeneric(GrokGenericApiError),
}

impl GrokError {
  pub fn is_grok_having_downtime_issues(&self) -> bool {
    match self {
      Self::ApiGeneric(GrokGenericApiError::CloudflareError(CloudflareError::BadGateway502)) => true,
      Self::ApiGeneric(GrokGenericApiError::CloudflareError(CloudflareError::GatewayTimeout504)) => true,
      Self::ApiGeneric(GrokGenericApiError::CloudflareError(CloudflareError::TimeoutOccurred524)) => true,
      _ => false,
    }
  }
}

impl Error for GrokError {}

impl std::fmt::Display for GrokError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Client(e) => write!(f, "GrokClientError: {:?}", e),
      Self::ApiSpecific(e) => write!(f, "GrokSpecificApiError: {:?}", e),
      Self::ApiGeneric(e) => write!(f, "GrokGenericApiError: {:?}", e),
    }
  }
}

impl From<GrokClientError> for GrokError {
  fn from(error: GrokClientError) -> Self {
    Self::Client(error)
  }
}

impl From<GrokSpecificApiError> for GrokError {
  fn from(error: GrokSpecificApiError) -> Self {
    Self::ApiSpecific(error)
  }
}

impl From<GrokGenericApiError> for GrokError {
  fn from(error: GrokGenericApiError) -> Self {
    Self::ApiGeneric(error)
  }
}
