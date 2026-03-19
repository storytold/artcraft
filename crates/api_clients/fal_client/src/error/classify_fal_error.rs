use crate::error::fal_error::FalError;
use crate::error::fal_error_plus::FalErrorPlus;

const BILLING_ERROR : &str = "{\"detail\": \"User is locked. Reason: Exhausted balance. Top up your balance at fal.ai/dashboard/billing.\"}";

/// Better classify the `FalError` into a more user-friendly `FalErrorPlus`.
pub fn classify_fal_error(err: FalError) -> FalErrorPlus {
  match err {
    FalError::RequestError(_) => FalErrorPlus::FalError(err),
    FalError::SerializeError(_) => FalErrorPlus::FalError(err),
    FalError::Other(ref inner) => {
      if inner == BILLING_ERROR {
        FalErrorPlus::FalBillingError(inner.to_string())
      } else if inner.contains("billing") {
        FalErrorPlus::FalBillingError(inner.to_string())
      } else if inner.contains("balance") {
        FalErrorPlus::FalBillingError(inner.to_string())
      } else if inner.contains("Invalid Key Authorization header format") {
        FalErrorPlus::FalApiKeyError(inner.to_string())
      } else if inner.contains("No user found for Key ID and Secret") {
        FalErrorPlus::FalApiKeyError(inner.to_string())
      } else {
        FalErrorPlus::FalError(err)
      }
    }
  }
}
