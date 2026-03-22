use enums_api::common::visibility::Visibility as Api;
use enums_db::common::visibility::Visibility as Db;

pub fn visibility_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Public => Db::Public,
    Api::Hidden => Db::Hidden,
    Api::Private => Db::Private,
  }
}

pub fn visibility_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Public => Api::Public,
    Db::Hidden => Api::Hidden,
    Db::Private => Api::Private,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = visibility_to_db(&api_variant);
      let back = visibility_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for variant in Api::iter() {
      let db = visibility_to_db(&variant);
      let back = visibility_to_api(&db);
      assert_eq!(variant, back);
    }
  }
}
