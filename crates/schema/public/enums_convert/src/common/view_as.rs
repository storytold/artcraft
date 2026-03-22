use enums_api::common::view_as::ViewAs as Api;
use enums_db::common::view_as::ViewAs as Db;

pub fn view_as_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Author => Db::Author,
    Api::Moderator => Db::Moderator,
    Api::AnotherUser => Db::AnotherUser,
  }
}

pub fn view_as_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Author => Api::Author,
    Db::Moderator => Api::Moderator,
    Db::AnotherUser => Api::AnotherUser,
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
      let db = view_as_to_db(&api_variant);
      let back = view_as_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for variant in Api::iter() {
      let db = view_as_to_db(&variant);
      let back = view_as_to_api(&db);
      assert_eq!(variant, back);
    }
  }
}
