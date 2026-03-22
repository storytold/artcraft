use enums_api::by_table::usages::usages_type::UsagesType as Api;
use enums_db::by_table::usages::usages_type::UsagesType as Db;

pub fn usages_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::ModelWeight => Db::ModelWeight,
    Api::MediaFile => Db::MediaFile,
  }
}

pub fn usages_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::ModelWeight => Api::ModelWeight,
    Db::MediaFile => Api::MediaFile,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = usages_type_to_db(&api_variant);
      let back = usages_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = usages_type_to_api(&variant);
      let back = usages_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
