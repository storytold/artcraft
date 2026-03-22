use enums_api::by_table::media_uploads::media_upload_type::MediaUploadType as Api;
use enums_db::by_table::media_uploads::media_upload_type::MediaUploadType as Db;

pub fn media_upload_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Audio => Db::Audio,
    Api::Image => Db::Image,
    Api::Video => Db::Video,
    Api::Binary => Db::Binary,
  }
}

pub fn media_upload_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Audio => Api::Audio,
    Db::Image => Api::Image,
    Db::Video => Api::Video,
    Db::Binary => Api::Binary,
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
      let db = media_upload_type_to_db(&api_variant);
      let back = media_upload_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = media_upload_type_to_db(&api_variant);
      let back = media_upload_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }
}
