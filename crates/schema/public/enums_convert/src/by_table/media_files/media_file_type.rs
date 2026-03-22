use enums_api::by_table::media_files::media_file_type::MediaFileType as Api;
use enums_db::by_table::media_files::media_file_type::MediaFileType as Db;

pub fn media_file_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Audio => Db::Audio,
    Api::Image => Db::Image,
    Api::Video => Db::Video,
    Api::Bvh => Db::Bvh,
    Api::Fbx => Db::Fbx,
    Api::Glb => Db::Glb,
    Api::Gltf => Db::Gltf,
    Api::Spz => Db::Spz,
    Api::SceneRon => Db::SceneRon,
    Api::SceneJson => Db::SceneJson,
    Api::Pmd => Db::Pmd,
    Api::Vmd => Db::Vmd,
    Api::Pmx => Db::Pmx,
    Api::Csv => Db::Csv,
    Api::Jpg => Db::Jpg,
    Api::Png => Db::Png,
    Api::Gif => Db::Gif,
    Api::Mp4 => Db::Mp4,
    Api::Wav => Db::Wav,
    Api::Mp3 => Db::Mp3,
  }
}

pub fn media_file_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Audio => Api::Audio,
    Db::Image => Api::Image,
    Db::Video => Api::Video,
    Db::Bvh => Api::Bvh,
    Db::Fbx => Api::Fbx,
    Db::Glb => Api::Glb,
    Db::Gltf => Api::Gltf,
    Db::Spz => Api::Spz,
    Db::SceneRon => Api::SceneRon,
    Db::SceneJson => Api::SceneJson,
    Db::Pmd => Api::Pmd,
    Db::Vmd => Api::Vmd,
    Db::Pmx => Api::Pmx,
    Db::Csv => Api::Csv,
    Db::Jpg => Api::Jpg,
    Db::Png => Api::Png,
    Db::Gif => Api::Gif,
    Db::Mp4 => Api::Mp4,
    Db::Wav => Api::Wav,
    Db::Mp3 => Api::Mp3,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = media_file_type_to_db(&api_variant);
      let back = media_file_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = media_file_type_to_api(&variant);
      let back = media_file_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
