use enums_api::by_table::voice_conversion_results::voice_conversion_media_token_type::VoiceConversionMediaTokenType as Api;
use enums_db::by_table::voice_conversion_results::voice_conversion_media_token_type::VoiceConversionMediaTokenType as Db;

pub fn voice_conversion_media_token_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::MediaUpload => Db::MediaUpload,
  }
}

pub fn voice_conversion_media_token_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::MediaUpload => Api::MediaUpload,
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
      let db = voice_conversion_media_token_type_to_db(&api_variant);
      let back = voice_conversion_media_token_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = voice_conversion_media_token_type_to_db(&api_variant);
      let back = voice_conversion_media_token_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }
}
