use strum::EnumCount;
use strum::EnumIter;

/// Used in the `users` table in a `VARCHAR(16)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(UserSignupMethod);
impl_mysql_enum_coders!(UserSignupMethod);
impl_mysql_from_row!(UserSignupMethod);

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

}

#[cfg(test)]
mod tests {
  use super::super::user_signup_method::UserSignupMethod;
  use enums_shared::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(UserSignupMethod::EmailPassword, "email_password");
      assert_serialization(UserSignupMethod::GoogleSignIn, "google_sign_in");
      assert_serialization(UserSignupMethod::StripeCheckout, "stripe_checkout");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(UserSignupMethod::EmailPassword.to_str(), "email_password");
      assert_eq!(UserSignupMethod::GoogleSignIn.to_str(), "google_sign_in");
      assert_eq!(UserSignupMethod::StripeCheckout.to_str(), "stripe_checkout");
    }

    #[test]
    fn from_str() {
      assert_eq!(UserSignupMethod::from_str("email_password").unwrap(), UserSignupMethod::EmailPassword);
      assert_eq!(UserSignupMethod::from_str("google_sign_in").unwrap(), UserSignupMethod::GoogleSignIn);
      assert_eq!(UserSignupMethod::from_str("stripe_checkout").unwrap(), UserSignupMethod::StripeCheckout);
      assert!(UserSignupMethod::from_str("foo").is_err());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in UserSignupMethod::iter() {
        assert_eq!(variant, UserSignupMethod::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, UserSignupMethod::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, UserSignupMethod::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 16;
      for variant in UserSignupMethod::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
