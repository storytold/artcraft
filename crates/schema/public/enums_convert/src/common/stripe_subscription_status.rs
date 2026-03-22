use enums_api::common::stripe_subscription_status::StripeSubscriptionStatus as Api;
use enums_db::common::stripe_subscription_status::StripeSubscriptionStatus as Db;

pub fn stripe_subscription_status_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Active => Db::Active,
    Api::Canceled => Db::Canceled,
    Api::Incomplete => Db::Incomplete,
    Api::IncompleteExpired => Db::IncompleteExpired,
    Api::PastDue => Db::PastDue,
    Api::Trialing => Db::Trialing,
    Api::Unpaid => Db::Unpaid,
    Api::Paused => Db::Paused,
  }
}

pub fn stripe_subscription_status_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Active => Api::Active,
    Db::Canceled => Api::Canceled,
    Db::Incomplete => Api::Incomplete,
    Db::IncompleteExpired => Api::IncompleteExpired,
    Db::PastDue => Api::PastDue,
    Db::Trialing => Api::Trialing,
    Db::Unpaid => Api::Unpaid,
    Db::Paused => Api::Paused,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = stripe_subscription_status_to_api(&variant);
      let back = stripe_subscription_status_to_db(&api);
      assert_eq!(variant, back);
    }
}
}
