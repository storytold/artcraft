use enums_api::by_table::media_files::media_file_engine_category::MediaFileEngineCategory as Api;
use enums_db::by_table::media_files::media_file_engine_category::MediaFileEngineCategory as Db;

pub fn media_file_engine_category_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Scene => Db::Scene,
    Api::Character => Db::Character,
    Api::Creature => Db::Creature,
    Api::Animation => Db::Animation,
    Api::Expression => Db::Expression,
    Api::Location => Db::Location,
    Api::SetDressing => Db::SetDressing,
    Api::Object => Db::Object,
    Api::Skybox => Db::Skybox,
    Api::ImagePlane => Db::ImagePlane,
    Api::VideoPlane => Db::VideoPlane,
  }
}

pub fn media_file_engine_category_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Scene => Api::Scene,
    Db::Character => Api::Character,
    Db::Creature => Api::Creature,
    Db::Animation => Api::Animation,
    Db::Expression => Api::Expression,
    Db::Location => Api::Location,
    Db::SetDressing => Api::SetDressing,
    Db::Object => Api::Object,
    Db::Skybox => Api::Skybox,
    Db::ImagePlane => Api::ImagePlane,
    Db::VideoPlane => Api::VideoPlane,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = media_file_engine_category_to_db(&api_variant);
      let back = media_file_engine_category_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = media_file_engine_category_to_api(&variant);
      let back = media_file_engine_category_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
