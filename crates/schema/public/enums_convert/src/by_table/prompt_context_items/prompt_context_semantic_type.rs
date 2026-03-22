use enums_api::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType as Api;
use enums_db::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType as Db;

pub fn prompt_context_semantic_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::VidStartFrame => Db::VidStartFrame,
    Api::VidEndFrame => Db::VidEndFrame,
    Api::VidRef => Db::VidRef,
    Api::Imgsrc => Db::Imgsrc,
    Api::Imgmask => Db::Imgmask,
    Api::Imgref => Db::Imgref,
    Api::ImgrefCharacter => Db::ImgrefCharacter,
    Api::ImgrefStyle => Db::ImgrefStyle,
    Api::ImgrefBg => Db::ImgrefBg,
    Api::Audioref => Db::Audioref,
  }
}

pub fn prompt_context_semantic_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::VidStartFrame => Api::VidStartFrame,
    Db::VidEndFrame => Api::VidEndFrame,
    Db::VidRef => Api::VidRef,
    Db::Imgsrc => Api::Imgsrc,
    Db::Imgmask => Api::Imgmask,
    Db::Imgref => Api::Imgref,
    Db::ImgrefCharacter => Api::ImgrefCharacter,
    Db::ImgrefStyle => Api::ImgrefStyle,
    Db::ImgrefBg => Api::ImgrefBg,
    Db::Audioref => Api::Audioref,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = prompt_context_semantic_type_to_db(&api_variant);
      let back = prompt_context_semantic_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = prompt_context_semantic_type_to_api(&variant);
      let back = prompt_context_semantic_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
