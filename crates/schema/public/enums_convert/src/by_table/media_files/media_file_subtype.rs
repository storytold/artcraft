use enums_api::by_table::media_files::media_file_subtype::MediaFileSubtype as Api;
use enums_db::by_table::media_files::media_file_subtype::MediaFileSubtype as Db;

pub fn media_file_subtype_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Deprecated => Db::Deprecated,
    Api::Mixamo => Db::Mixamo,
    Api::MocapNet => Db::MocapNet,
    Api::AnimationOnly => Db::AnimationOnly,
    Api::SceneImport => Db::SceneImport,
    Api::StorytellerScene => Db::StorytellerScene,
    Api::Scene => Db::Scene,
    Api::Character => Db::Character,
    Api::Animation => Db::Animation,
    Api::Object => Db::Object,
    Api::Skybox => Db::Skybox,
  }
}

pub fn media_file_subtype_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Deprecated => Api::Deprecated,
    Db::Mixamo => Api::Mixamo,
    Db::MocapNet => Api::MocapNet,
    Db::AnimationOnly => Api::AnimationOnly,
    Db::SceneImport => Api::SceneImport,
    Db::StorytellerScene => Api::StorytellerScene,
    Db::Scene => Api::Scene,
    Db::Character => Api::Character,
    Db::Animation => Api::Animation,
    Db::Object => Api::Object,
    Db::Skybox => Api::Skybox,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = media_file_subtype_to_db(&api_variant);
      let back = media_file_subtype_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = media_file_subtype_to_api(&variant);
      let back = media_file_subtype_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
