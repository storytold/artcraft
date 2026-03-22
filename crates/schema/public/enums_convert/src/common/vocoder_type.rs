use enums_api::common::vocoder_type::VocoderType as Api;
use enums_db::common::vocoder_type::VocoderType as Db;

pub fn vocoder_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::HifiGan => Db::HifiGan,
    Api::HifiGanSuperResolution => Db::HifiGanSuperResolution,
    Api::HifiGanRocketVc => Db::HifiGanRocketVc,
  }
}

pub fn vocoder_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::HifiGan => Api::HifiGan,
    Db::HifiGanSuperResolution => Api::HifiGanSuperResolution,
    Db::HifiGanRocketVc => Api::HifiGanRocketVc,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = vocoder_type_to_db(&api_variant);
      let back = vocoder_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
}
}
