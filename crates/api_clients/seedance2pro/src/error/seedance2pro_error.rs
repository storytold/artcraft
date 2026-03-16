use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::error::seedance2pro_specific_api_error::Seedance2ProSpecificApiError;
use cloudflare_errors::cloudflare_error::CloudflareError;
use std::error::Error;

#[derive(Debug)]
pub enum Seedance2ProError {
  Client(Seedance2ProClientError),
  ApiSpecific(Seedance2ProSpecificApiError),
  ApiGeneric(Seedance2ProGenericApiError),
}

impl Seedance2ProError {
  pub fn is_having_downtime_issues(&self) -> bool {
    match self {
      Self::ApiGeneric(Seedance2ProGenericApiError::CloudflareError(CloudflareError::BadGateway502)) => true,
      Self::ApiGeneric(Seedance2ProGenericApiError::CloudflareError(CloudflareError::GatewayTimeout504)) => true,
      Self::ApiGeneric(Seedance2ProGenericApiError::CloudflareError(CloudflareError::TimeoutOccurred524)) => true,
      Self::ApiGeneric(Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody { status_code, body: _ }) => {
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

impl Error for Seedance2ProError {}

impl std::fmt::Display for Seedance2ProError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Client(e) => write!(f, "Seedance2ProClientError: {:?}", e),
      Self::ApiSpecific(e) => write!(f, "Seedance2ProSpecificApiError: {:?}", e),
      Self::ApiGeneric(e) => write!(f, "Seedance2ProGenericApiError: {:?}", e),
    }
  }
}

impl From<Seedance2ProClientError> for Seedance2ProError {
  fn from(error: Seedance2ProClientError) -> Self {
    Self::Client(error)
  }
}

impl From<Seedance2ProSpecificApiError> for Seedance2ProError {
  fn from(error: Seedance2ProSpecificApiError) -> Self {
    Self::ApiSpecific(error)
  }
}

impl From<Seedance2ProGenericApiError> for Seedance2ProError {
  fn from(error: Seedance2ProGenericApiError) -> Self {
    Self::ApiGeneric(error)
  }
}
