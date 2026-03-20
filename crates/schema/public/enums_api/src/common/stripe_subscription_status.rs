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
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
