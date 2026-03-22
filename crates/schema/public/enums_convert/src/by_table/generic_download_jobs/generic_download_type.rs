use enums_api::by_table::generic_download_jobs::generic_download_type::GenericDownloadType as Api;
use enums_db::by_table::generic_download_jobs::generic_download_type::GenericDownloadType as Db;

pub fn generic_download_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::HifiGan => Db::HifiGan,
    Api::HifiGanRocketVc => Db::HifiGanRocketVc,
    Api::HifiGanSoVitsSvc => Db::HifiGanSoVitsSvc,
    Api::RocketVc => Db::RocketVc,
    Api::RvcV2 => Db::RvcV2,
    Api::SoVitsSvc => Db::SoVitsSvc,
    Api::Tacotron2 => Db::Tacotron2,
    Api::Vits => Db::Vits,
  }
}

pub fn generic_download_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::HifiGan => Api::HifiGan,
    Db::HifiGanRocketVc => Api::HifiGanRocketVc,
    Db::HifiGanSoVitsSvc => Api::HifiGanSoVitsSvc,
    Db::RocketVc => Api::RocketVc,
    Db::RvcV2 => Api::RvcV2,
    Db::SoVitsSvc => Api::SoVitsSvc,
    Db::Tacotron2 => Api::Tacotron2,
    Db::Vits => Api::Vits,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = generic_download_type_to_db(&api_variant);
      let back = generic_download_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = generic_download_type_to_api(&variant);
      let back = generic_download_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
