//! Turns a raw `FalError` into a `FalErrorPlus` the rest of the app can act on.
//!
//! `FalRequest` passes fal's error body through as plain text (`FalError::Other`), so the only
//! way to tell "out of credit" or "bad API key" from other failures is to look at that text.
//! Called automatically by `From<FalError> for FalErrorPlus`, i.e. whenever `?` converts one.

use crate::error::fal_error::FalError;
use crate::error::fal_error_plus::FalErrorPlus;

/// The exact body fal returns when the account has run out of credit.
const BILLING_ERROR : &str = "{\"detail\": \"User is locked. Reason: Exhausted balance. Top up your balance at fal.ai/dashboard/billing.\"}";

/// Better classify the `FalError` into a more user-friendly `FalErrorPlus`.
///
/// Network and serialization errors pass through unchanged. For text errors we match on
/// phrases fal uses: billing/balance wording becomes `FalBillingError`, key-rejection
/// wording becomes `FalApiKeyError`, and anything else stays a plain `FalError`.
pub fn classify_fal_error(err: FalError) -> FalErrorPlus {
  match err {
    FalError::RequestError(_) => FalErrorPlus::FalError(err),
    FalError::SerializeError(_) => FalErrorPlus::FalError(err),
    FalError::Other(ref inner) => {
      // The first check is the exact known message; the substring checks below catch
      // rewordings of it.
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
