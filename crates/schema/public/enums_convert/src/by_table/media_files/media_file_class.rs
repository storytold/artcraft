use enums_api::by_table::media_files::media_file_class::MediaFileClass as Api;
use enums_db::by_table::media_files::media_file_class::MediaFileClass as Db;

pub fn media_file_class_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Unknown => Db::Unknown,
    Api::Audio => Db::Audio,
    Api::Image => Db::Image,
    Api::Video => Db::Video,
    Api::Dimensional => Db::Dimensional,
  }
}

pub fn media_file_class_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Unknown => Api::Unknown,
    Db::Audio => Api::Audio,
    Db::Image => Api::Image,
    Db::Video => Api::Video,
    Db::Dimensional => Api::Dimensional,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = media_file_class_to_db(&api_variant);
      let back = media_file_class_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = media_file_class_to_api(&variant);
      let back = media_file_class_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
