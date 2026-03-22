use enums_api::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug as Api;
use enums_db::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug as Db;

pub fn artcraft_subscription_slug_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::ArtcraftBasic => Db::ArtcraftBasic,
    Api::ArtcraftPro => Db::ArtcraftPro,
    Api::ArtcraftMax => Db::ArtcraftMax,
  }
}

pub fn artcraft_subscription_slug_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::ArtcraftBasic => Api::ArtcraftBasic,
    Db::ArtcraftPro => Api::ArtcraftPro,
    Db::ArtcraftMax => Api::ArtcraftMax,
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
      let api = artcraft_subscription_slug_to_api(&variant);
      let back = artcraft_subscription_slug_to_db(&api);
      assert_eq!(variant, back);
    }
  }

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for variant in Api::iter() {
      let db = artcraft_subscription_slug_to_db(&variant);
      let back = artcraft_subscription_slug_to_api(&db);
      assert_eq!(variant, back);
    }
  }
}
