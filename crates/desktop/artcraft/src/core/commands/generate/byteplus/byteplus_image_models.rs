use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;

/// ModelArk (ap-southeast) model ids for the Seedream entries in the image catalog. Dated ids
/// change when BytePlus ships new versions; these match the ModelArk catalog on 2026-09-15.
pub fn byteplus_image_model_id(model: TauriImageModel) -> Option<&'static str> {
  match model {
    TauriImageModel::Seedream4 => Some("seedream-4-0-250828"),
    TauriImageModel::Seedream4p5 => Some("seedream-4-5-251128"),
    // The catalog entry is still labelled "5 Lite"; ModelArk serves Seedream 5.0.
    TauriImageModel::Seedream5Lite => Some("seedream-5-0-260128"),
    TauriImageModel::Seedream5p0Pro => Some("dola-seedream-5-0-pro-260628"),
    _ => None,
  }
}

/// Seedream 5.0 Pro takes at most 10 input images (the others take 14).
pub fn max_reference_images(model: TauriImageModel) -> usize {
  match model {
    TauriImageModel::Seedream5p0Pro => 10,
    _ => 14,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn every_seedream_model_has_a_modelark_id() {
    for model in [TauriImageModel::Seedream4, TauriImageModel::Seedream4p5, TauriImageModel::Seedream5Lite, TauriImageModel::Seedream5p0Pro] {
      assert!(byteplus_image_model_id(model).is_some(), "{:?}", model);
    }
  }

  #[test]
  fn other_models_are_not_served_by_byteplus() {
    assert_eq!(byteplus_image_model_id(TauriImageModel::NanoBanana), None);
    assert_eq!(byteplus_image_model_id(TauriImageModel::GptImage2), None);
  }
}
