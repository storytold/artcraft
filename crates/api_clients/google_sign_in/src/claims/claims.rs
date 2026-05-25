use crate::claims::google_custom_claims::GoogleCustomClaims;
use crate::error::google_sign_in_error::GoogleSignInError;
use jwt_simple::claims::{Audiences, JWTClaims};

pub struct Claims {
  pub (crate) claims: JWTClaims<GoogleCustomClaims>,
}

impl Claims {
  pub fn subject(&self) -> Option<&str> {
    self.claims.subject.as_deref()
  }

  pub fn email(&self) -> Option<&str> {
    self.claims.custom.email.as_deref()
  }

  pub fn email_verified(&self) -> bool {
    self.claims.custom.email_verified.unwrap_or(false)
  }

  pub fn name(&self) -> Option<&str> {
    self.claims.custom.name.as_deref()
  }

  pub fn given_name(&self) -> Option<&str> {
    self.claims.custom.given_name.as_deref()
  }

  pub fn family_name(&self) -> Option<&str> {
    self.claims.custom.family_name.as_deref()
  }

  pub fn locale(&self) -> Option<&str> {
    self.claims.custom.locale.as_deref()
  }

  /// Determine if the claim audience is as expected.
  /// This is necessary so third parties don't send claims signed on their behalf by Google.
  pub fn audience_matches(&self, audience: &str) -> Result<bool, GoogleSignInError> {
    match self.claims.audiences.as_ref() {
      Some(Audiences::AsString(claim_audience)) => Ok(claim_audience.eq(audience)),
      Some(Audiences::AsSet(audiences)) => Ok(audiences.contains(audience)),
      _ => Err(GoogleSignInError::AudienceMissing),
    }
  }

  // TODO(bt,2024-09-20): Other fields if important.
}
