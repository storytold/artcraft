use enums_api::by_table::users::user_feature_flag::UserFeatureFlag as Api;
use enums_db::by_table::users::user_feature_flag::UserFeatureFlag as Db;

pub fn user_feature_flag_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::ExploreMedia => Db::ExploreMedia,
    Api::Studio => Db::Studio,
    Api::Upload3d => Db::Upload3d,
    Api::VideoStyleTransfer => Db::VideoStyleTransfer,
  }
}

pub fn user_feature_flag_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::ExploreMedia => Api::ExploreMedia,
    Db::Studio => Api::Studio,
    Db::Upload3d => Api::Upload3d,
    Db::VideoStyleTransfer => Api::VideoStyleTransfer,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = user_feature_flag_to_db(&api_variant);
      let back = user_feature_flag_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = user_feature_flag_to_api(&variant);
      let back = user_feature_flag_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
