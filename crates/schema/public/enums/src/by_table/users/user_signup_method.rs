use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `users` table in a `VARCHAR(16)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
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
  use crate::by_table::users::user_signup_method::UserSignupMethod;
  use crate::test_helpers::assert_serialization;

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

  mod manual_variant_checks {
    use super::*;

    #[test]
    fn all_variants() {
      let mut variants = UserSignupMethod::all_variants();
      assert_eq!(variants.len(), 3);
      assert_eq!(variants.pop_first(), Some(UserSignupMethod::EmailPassword));
      assert_eq!(variants.pop_first(), Some(UserSignupMethod::GoogleSignIn));
      assert_eq!(variants.pop_first(), Some(UserSignupMethod::StripeCheckout));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(UserSignupMethod::all_variants().len(), UserSignupMethod::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in UserSignupMethod::all_variants() {
        assert_eq!(variant, UserSignupMethod::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, UserSignupMethod::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, UserSignupMethod::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 16;
      for variant in UserSignupMethod::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
