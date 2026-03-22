use enums_api::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug as Api;
use enums_db::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug as Db;

pub fn artcraft_credits_pack_slug_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Artcraft1000 => Db::Artcraft1000,
    Api::Artcraft2500 => Db::Artcraft2500,
    Api::Artcraft5000 => Db::Artcraft5000,
    Api::Artcraft10000 => Db::Artcraft10000,
    Api::Artcraft25000 => Db::Artcraft25000,
    Api::Artcraft50000 => Db::Artcraft50000,
  }
}

pub fn artcraft_credits_pack_slug_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Artcraft1000 => Api::Artcraft1000,
    Db::Artcraft2500 => Api::Artcraft2500,
    Db::Artcraft5000 => Api::Artcraft5000,
    Db::Artcraft10000 => Api::Artcraft10000,
    Db::Artcraft25000 => Api::Artcraft25000,
    Db::Artcraft50000 => Api::Artcraft50000,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = artcraft_credits_pack_slug_to_api(&variant);
      let back = artcraft_credits_pack_slug_to_db(&api);
      assert_eq!(variant, back);
    }
  }

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for variant in Api::iter() {
      let db = artcraft_credits_pack_slug_to_db(&variant);
      let back = artcraft_credits_pack_slug_to_api(&db);
      assert_eq!(variant, back);
    }
  }
}
