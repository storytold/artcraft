use enums_api::by_table::model_weights::weights_types::WeightsType as Api;
use enums_db::by_table::model_weights::weights_types::WeightsType as Db;

pub fn weights_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Tacotron2_5 => Db::GptSoVits,
    Api::HifiganTacotron2 => Db::HifiganTacotron2,
    Api::RvcV2 => Db::RvcV2,
    Api::StableDiffusion15 => Db::StableDiffusion15,
    Api::StableDiffusionXL => Db::StableDiffusionXL,
    Api::SoVitsSvc => Db::SoVitsSvc,
    Api::Tacotron2 => Db::Tacotron2,
    Api::LoRA => Db::LoRA,
    Api::VallE => Db::VallE,
    Api::ComfyUi => Db::ComfyUi,
  }
}

pub fn weights_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::GptSoVits => Api::Tacotron2_5,
    Db::HifiganTacotron2 => Api::HifiganTacotron2,
    Db::RvcV2 => Api::RvcV2,
    Db::StableDiffusion15 => Api::StableDiffusion15,
    Db::StableDiffusionXL => Api::StableDiffusionXL,
    Db::SoVitsSvc => Api::SoVitsSvc,
    Db::Tacotron2 => Api::Tacotron2,
    Db::LoRA => Api::LoRA,
    Db::VallE => Api::VallE,
    Db::ComfyUi => Api::ComfyUi,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for db_variant in Db::iter() {
      let api = weights_type_to_api(&db_variant);
      let db = weights_type_to_db(&api);
      let back = weights_type_to_api(&db);
      assert_eq!(api, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = weights_type_to_api(&variant);
      let back = weights_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }

  #[test]
  fn renamed_variants() {
    assert_eq!(weights_type_to_db(&Api::Tacotron2_5), Db::GptSoVits);
    assert_eq!(weights_type_to_api(&Db::GptSoVits), Api::Tacotron2_5);
  }
}
