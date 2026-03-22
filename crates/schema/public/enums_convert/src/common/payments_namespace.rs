use enums_api::common::payments_namespace::PaymentsNamespace as Api;
use enums_db::common::payments_namespace::PaymentsNamespace as Db;

pub fn payments_namespace_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Artcraft => Db::Artcraft,
    Api::FakeYou => Db::FakeYou,
  }
}

pub fn payments_namespace_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Artcraft => Api::Artcraft,
    Db::FakeYou => Api::FakeYou,
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
      let api = payments_namespace_to_api(&variant);
      let back = payments_namespace_to_db(&api);
      assert_eq!(variant, back);
    }
  }

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for variant in Api::iter() {
      let db = payments_namespace_to_db(&variant);
      let back = payments_namespace_to_api(&db);
      assert_eq!(variant, back);
    }
  }
}
