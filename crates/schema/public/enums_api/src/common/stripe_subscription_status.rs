use strum::EnumIter;
use utoipa::ToSchema;

#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
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

#[cfg(test)]
mod tests {
  use super::StripeSubscriptionStatus;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
    fn test_deserialization() {
      assert_deserialization("active", StripeSubscriptionStatus::Active);
      assert_deserialization("canceled", StripeSubscriptionStatus::Canceled);
      assert_deserialization("incomplete", StripeSubscriptionStatus::Incomplete);
      assert_deserialization("incomplete_expired", StripeSubscriptionStatus::IncompleteExpired);
      assert_deserialization("past_due", StripeSubscriptionStatus::PastDue);
      assert_deserialization("trialing", StripeSubscriptionStatus::Trialing);
      assert_deserialization("unpaid", StripeSubscriptionStatus::Unpaid);
      assert_deserialization("paused", StripeSubscriptionStatus::Paused);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(StripeSubscriptionStatus::iter().count(), 8);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in StripeSubscriptionStatus::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: StripeSubscriptionStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
