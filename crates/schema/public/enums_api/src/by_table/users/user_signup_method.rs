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

#[cfg(test)]
mod tests {
  use super::UserSignupMethod;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(UserSignupMethod::EmailPassword, "email_password");
      assert_serialization(UserSignupMethod::GoogleSignIn, "google_sign_in");
      assert_serialization(UserSignupMethod::StripeCheckout, "stripe_checkout");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("email_password", UserSignupMethod::EmailPassword);
      assert_deserialization("google_sign_in", UserSignupMethod::GoogleSignIn);
      assert_deserialization("stripe_checkout", UserSignupMethod::StripeCheckout);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(UserSignupMethod::iter().count(), 3);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in UserSignupMethod::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: UserSignupMethod = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
