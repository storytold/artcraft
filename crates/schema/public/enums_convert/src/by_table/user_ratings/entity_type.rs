use enums_api::by_table::user_ratings::entity_type::UserRatingEntityType as Api;
use enums_db::by_table::user_ratings::entity_type::UserRatingEntityType as Db;

pub fn user_rating_entity_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::MediaFile => Db::MediaFile,
    Api::ModelWeight => Db::ModelWeight,
    Api::TtsModel => Db::TtsModel,
    Api::TtsResult => Db::TtsResult,
    Api::W2lTemplate => Db::W2lTemplate,
    Api::W2lResult => Db::W2lResult,
  }
}

pub fn user_rating_entity_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::MediaFile => Api::MediaFile,
    Db::ModelWeight => Api::ModelWeight,
    Db::TtsModel => Api::TtsModel,
    Db::TtsResult => Api::TtsResult,
    Db::W2lTemplate => Api::W2lTemplate,
    Db::W2lResult => Api::W2lResult,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = user_rating_entity_type_to_db(&api_variant);
      let back = user_rating_entity_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = user_rating_entity_type_to_db(&api_variant);
      let back = user_rating_entity_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }
}
