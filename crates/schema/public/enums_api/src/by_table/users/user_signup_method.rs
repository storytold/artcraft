use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `users` table in a `VARCHAR(16)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]
pub enum UserSignupMethod {
  /// Email + Password
  EmailPassword,

  /// "Sign in With Google" SSO
  GoogleSignIn,

  /// Stripe Checkout flow, where we provision user accounts for users with a
  /// synthetic/fake email address and no password. After checkout completes,
  /// the user gets a real email and password - or the user can set them.
  StripeCheckout,
}

/// NB: Legacy API for older code.
impl UserSignupMethod {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::EmailPassword => "email_password",
      Self::GoogleSignIn=> "google_sign_in",
      Self::StripeCheckout => "stripe_checkout",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "email_password" => Ok(Self::EmailPassword),
      "google_sign_in" => Ok(Self::GoogleSignIn),
      "stripe_checkout" => Ok(Self::StripeCheckout),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::EmailPassword,
      Self::GoogleSignIn,
      Self::StripeCheckout,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::UserSignupMethod;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in UserSignupMethod::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: UserSignupMethod = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
