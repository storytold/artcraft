use crate::error::kinovi_web_bad_request_api_error::KinoviWebBadRequestApiError;
use crate::error::kinovi_web_client_error::KinoviWebClientError;
use crate::error::kinovi_web_generic_api_error::KinoviWebGenericApiError;
use crate::error::kinovi_web_specific_api_error::KinoviWebSpecificApiError;
use cloudflare_errors::cloudflare_error::CloudflareError;
use std::error::Error;

#[derive(Debug)]
pub enum KinoviWebError {
  Client(KinoviWebClientError),
  ApiSpecific(KinoviWebSpecificApiError),
  ApiGeneric(KinoviWebGenericApiError),
  ApiBadRequest(KinoviWebBadRequestApiError),
}

impl KinoviWebError {
  pub fn is_having_downtime_issues(&self) -> bool {
    match self {
      Self::ApiGeneric(KinoviWebGenericApiError::CloudflareError(CloudflareError::BadGateway502)) => true,
      Self::ApiGeneric(KinoviWebGenericApiError::CloudflareError(CloudflareError::GatewayTimeout504)) => true,
      Self::ApiGeneric(KinoviWebGenericApiError::CloudflareError(CloudflareError::TimeoutOccurred524)) => true,
      Self::ApiGeneric(KinoviWebGenericApiError::UncategorizedBadResponseWithStatusAndBody { status_code, body: _ }) => {
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

impl Error for KinoviWebError {}

impl std::fmt::Display for KinoviWebError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Client(e) => write!(f, "KinoviWebClientError: {:?}", e),
      Self::ApiSpecific(e) => write!(f, "KinoviWebSpecificApiError: {:?}", e),
      Self::ApiGeneric(e) => write!(f, "KinoviWebGenericApiError: {:?}", e),
      Self::ApiBadRequest(e) => write!(f, "KinoviWebBadRequestApiError: {:?}", e),
    }
  }
}

impl From<KinoviWebClientError> for KinoviWebError {
  fn from(error: KinoviWebClientError) -> Self {
    Self::Client(error)
  }
}

impl From<KinoviWebSpecificApiError> for KinoviWebError {
  fn from(error: KinoviWebSpecificApiError) -> Self {
    Self::ApiSpecific(error)
  }
}

impl From<KinoviWebGenericApiError> for KinoviWebError {
  fn from(error: KinoviWebGenericApiError) -> Self {
    Self::ApiGeneric(error)
  }
}

impl From<KinoviWebBadRequestApiError> for KinoviWebError {
  fn from(error: KinoviWebBadRequestApiError) -> Self {
    Self::ApiBadRequest(error)
  }
}
