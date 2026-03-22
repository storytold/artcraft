use enums_api::common::generation::generation_provider::GenerationProvider as Api;
use enums_db::common::generation::generation_provider::GenerationProvider as Db;

pub fn generation_provider_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Artcraft => Db::Artcraft,
    Api::Fal => Db::Fal,
    Api::Grok => Db::Grok,
    Api::Midjourney => Db::Midjourney,
    Api::Sora => Db::Sora,
    Api::WorldLabs => Db::WorldLabs,
  }
}

pub fn generation_provider_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Artcraft => Api::Artcraft,
    Db::Fal => Api::Fal,
    Db::Grok => Api::Grok,
    Db::Midjourney => Api::Midjourney,
    Db::Sora => Api::Sora,
    Db::WorldLabs => Api::WorldLabs,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for variant in Api::iter() {
      let db = generation_provider_to_db(&variant);
      let back = generation_provider_to_api(&db);
      assert_eq!(variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = generation_provider_to_db(&api_variant);
      let back = generation_provider_to_api(&db);
      assert_eq!(api_variant, back);
    }
}
}
