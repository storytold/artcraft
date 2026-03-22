use enums_api::by_table::entity_stats::stats_entity_type::StatsEntityType as Api;
use enums_db::by_table::entity_stats::stats_entity_type::StatsEntityType as Db;

pub fn stats_entity_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Comment => Db::Comment,
    Api::MediaFile => Db::MediaFile,
    Api::ModelWeight => Db::ModelWeight,
  }
}

pub fn stats_entity_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Comment => Api::Comment,
    Db::MediaFile => Api::MediaFile,
    Db::ModelWeight => Api::ModelWeight,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = stats_entity_type_to_db(&api_variant);
      let back = stats_entity_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = stats_entity_type_to_api(&variant);
      let back = stats_entity_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
