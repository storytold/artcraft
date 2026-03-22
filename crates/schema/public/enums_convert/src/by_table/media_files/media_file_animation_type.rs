use enums_api::by_table::media_files::media_file_animation_type::MediaFileAnimationType as Api;
use enums_db::by_table::media_files::media_file_animation_type::MediaFileAnimationType as Db;

pub fn media_file_animation_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::ArKit => Db::ArKit,
    Api::MikuMikuDance => Db::MikuMikuDance,
    Api::MikuMikuDanceArKit => Db::MikuMikuDanceArKit,
    Api::Mixamo => Db::Mixamo,
    Api::MixamoArKit => Db::MixamoArKit,
    Api::MocapNet => Db::MocapNet,
    Api::MocapNetArKit => Db::MocapNetArKit,
    Api::MoveAi => Db::MoveAi,
    Api::MoveAiArKit => Db::MoveAiArKit,
    Api::Rigify => Db::Rigify,
    Api::RigifyArKit => Db::RigifyArKit,
    Api::Rokoko => Db::Rokoko,
    Api::RokokoArKit => Db::RokokoArKit,
  }
}

pub fn media_file_animation_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::ArKit => Api::ArKit,
    Db::MikuMikuDance => Api::MikuMikuDance,
    Db::MikuMikuDanceArKit => Api::MikuMikuDanceArKit,
    Db::Mixamo => Api::Mixamo,
    Db::MixamoArKit => Api::MixamoArKit,
    Db::MocapNet => Api::MocapNet,
    Db::MocapNetArKit => Api::MocapNetArKit,
    Db::MoveAi => Api::MoveAi,
    Db::MoveAiArKit => Api::MoveAiArKit,
    Db::Rigify => Api::Rigify,
    Db::RigifyArKit => Api::RigifyArKit,
    Db::Rokoko => Api::Rokoko,
    Db::RokokoArKit => Api::RokokoArKit,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = media_file_animation_type_to_db(&api_variant);
      let back = media_file_animation_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = media_file_animation_type_to_api(&variant);
      let back = media_file_animation_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
