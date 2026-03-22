use enums_api::by_table::model_weights::weights_file_type::WeightsFileType as Api;
use enums_db::by_table::model_weights::weights_file_type::WeightsFileType as Db;

pub fn weights_file_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Checkpoint => Db::Checkpoint,
    Api::SafeTensors => Db::SafeTensors,
  }
}

pub fn weights_file_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Checkpoint => Api::Checkpoint,
    Db::SafeTensors => Api::SafeTensors,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = weights_file_type_to_db(&api_variant);
      let back = weights_file_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = weights_file_type_to_api(&variant);
      let back = weights_file_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
