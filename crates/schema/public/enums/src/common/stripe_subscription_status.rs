//! This is copied from the stripe crate's `SubscriptionStatus`, 
//! and then from `reusable_types`. 

// There are three changes from the source create:
//   - Renamed the struct from SubscriptionStatus to StripeSubscriptionStatus
//   - Added StripeSubscriptionStatus::from_str()
//   - Added derive sqlx::Type and sqlx(rename_all)
//   - Added Deref impl
//   - Added tests
//
// Then, moving into enums:
//   - Changed derives
//   - as_st() -> to_str() (gross! but convention as of now...)
//   - from_str() : changed error from string to EnumError
//   - Added all_variants()
//   - commented out all other impls.
// 

use std::collections::BTreeSet;

use crate::error::enum_error::EnumError;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;


// NB: Added "sqlx::Type".
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum StripeSubscriptionStatus {
  Active,
  Canceled,
  Incomplete,
  IncompleteExpired,
  PastDue,
  Trialing,
  Unpaid,
  Paused,
}

impl_enum_display_and_debug_using_to_str!(StripeSubscriptionStatus);
impl_mysql_enum_coders!(StripeSubscriptionStatus);
impl_mysql_from_row!(StripeSubscriptionStatus);

impl StripeSubscriptionStatus {
  pub fn to_str(self) -> &'static str {
    match self {
      Self::Active => "active",
      Self::Canceled => "canceled",
      Self::Incomplete => "incomplete",
      Self::IncompleteExpired => "incomplete_expired",
      Self::PastDue => "past_due",
      Self::Trialing => "trialing",
      Self::Unpaid => "unpaid",
      Self::Paused => "paused"
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
    match value {
      "active" => Ok(Self::Active),
      "canceled" => Ok(Self::Canceled),
      "incomplete" => Ok(Self::Incomplete),
      "incomplete_expired" => Ok(Self::IncompleteExpired),
      "past_due" => Ok(Self::PastDue),
      "trialing" => Ok(Self::Trialing),
      "unpaid" => Ok(Self::Unpaid),
      "paused" => Ok(Self::Paused),
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Active,
      Self::Canceled,
      Self::Incomplete,
      Self::IncompleteExpired,
      Self::PastDue,
      Self::Trialing,
      Self::Unpaid,
      Self::Paused,
    ])
  }
}

//impl AsRef<str> for StripeSubscriptionStatus {
//  fn as_ref(&self) -> &str {
//    self.as_str()
//  }
//}
//
//// NB: Added by us.
//impl std::ops::Deref for StripeSubscriptionStatus {
//  type Target = str;
//
//  fn deref(&self) -> &Self::Target {
//    self.as_str()
//  }
//}
//
//impl std::fmt::Display for StripeSubscriptionStatus {
//  fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
//    self.as_str().fmt(f)
//  }
//}
//
//impl std::default::Default for StripeSubscriptionStatus {
//  fn default() -> Self {
//    Self::Active
//  }
//}

#[cfg(test)]
mod tests {
  use crate::error::enum_error::EnumError;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use crate::common::stripe_subscription_status::StripeSubscriptionStatus;

    #[test]
    fn test_serialization() {
      assert_serialization(StripeSubscriptionStatus::Active, "active");
      assert_serialization(StripeSubscriptionStatus::Canceled, "canceled");
      assert_serialization(StripeSubscriptionStatus::Incomplete, "incomplete");
      assert_serialization(StripeSubscriptionStatus::IncompleteExpired, "incomplete_expired");
      assert_serialization(StripeSubscriptionStatus::PastDue, "past_due");
      assert_serialization(StripeSubscriptionStatus::Trialing, "trialing");
      assert_serialization(StripeSubscriptionStatus::Unpaid, "unpaid");
      assert_serialization(StripeSubscriptionStatus::Paused, "paused");
    }

    #[test]
    fn to_str() {
      assert_eq!(StripeSubscriptionStatus::Active.to_str(), "active");
      assert_eq!(StripeSubscriptionStatus::Canceled.to_str(), "canceled");
      assert_eq!(StripeSubscriptionStatus::Incomplete.to_str(), "incomplete");
      assert_eq!(StripeSubscriptionStatus::IncompleteExpired.to_str(), "incomplete_expired");
      assert_eq!(StripeSubscriptionStatus::PastDue.to_str(), "past_due");
      assert_eq!(StripeSubscriptionStatus::Trialing.to_str(), "trialing");
      assert_eq!(StripeSubscriptionStatus::Unpaid.to_str(), "unpaid");
      assert_eq!(StripeSubscriptionStatus::Paused.to_str(), "paused");
    }

    #[test]
    fn from_str() {
      assert_eq!(StripeSubscriptionStatus::from_str("active").unwrap(), StripeSubscriptionStatus::Active);
      assert_eq!(StripeSubscriptionStatus::from_str("canceled").unwrap(), StripeSubscriptionStatus::Canceled);
      assert_eq!(StripeSubscriptionStatus::from_str("incomplete").unwrap(), StripeSubscriptionStatus::Incomplete);
      assert_eq!(StripeSubscriptionStatus::from_str("incomplete_expired").unwrap(), StripeSubscriptionStatus::IncompleteExpired);
      assert_eq!(StripeSubscriptionStatus::from_str("past_due").unwrap(), StripeSubscriptionStatus::PastDue);
      assert_eq!(StripeSubscriptionStatus::from_str("trialing").unwrap(), StripeSubscriptionStatus::Trialing);
      assert_eq!(StripeSubscriptionStatus::from_str("unpaid").unwrap(), StripeSubscriptionStatus::Unpaid);
      assert_eq!(StripeSubscriptionStatus::from_str("paused").unwrap(), StripeSubscriptionStatus::Paused);
    }

    #[test]
    fn from_str_err() {
      let result = StripeSubscriptionStatus::from_str("asdf");
      assert!(result.is_err());
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "asdf");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = StripeSubscriptionStatus::all_variants();
      assert_eq!(variants.len(), 8);
      assert_eq!(variants.pop_first(), Some(StripeSubscriptionStatus::Active));
      assert_eq!(variants.pop_first(), Some(StripeSubscriptionStatus::Canceled));
      assert_eq!(variants.pop_first(), Some(StripeSubscriptionStatus::Incomplete));
      assert_eq!(variants.pop_first(), Some(StripeSubscriptionStatus::IncompleteExpired));
      assert_eq!(variants.pop_first(), Some(StripeSubscriptionStatus::PastDue));
      assert_eq!(variants.pop_first(), Some(StripeSubscriptionStatus::Trialing));
      assert_eq!(variants.pop_first(), Some(StripeSubscriptionStatus::Unpaid));
      assert_eq!(variants.pop_first(), Some(StripeSubscriptionStatus::Paused));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use crate::common::stripe_subscription_status::StripeSubscriptionStatus;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(StripeSubscriptionStatus::all_variants().len(), StripeSubscriptionStatus::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in StripeSubscriptionStatus::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, StripeSubscriptionStatus::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, StripeSubscriptionStatus::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, StripeSubscriptionStatus::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 32;
      for variant in StripeSubscriptionStatus::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}




























