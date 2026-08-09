use crate::core::commands::generate::generate_video::request::TauriVideoModel;
use crate::core::events::generation_events::common::GenerationModel;

/// Map TauriVideoModel to the GenerationModel used in events and the task database.
/// NB: GenerationModel serializations are stored in the tasks database — they keep
/// their legacy spellings for compatibility.
pub fn tauri_video_model_to_generation_model(model: TauriVideoModel) -> GenerationModel {
  match model {
    TauriVideoModel::GrokVideo => GenerationModel::GrokVideo,
    TauriVideoModel::GrokImagineVideo1p5 => GenerationModel::GrokImagineVideo1p5,
    TauriVideoModel::HappyHorse1p0 => GenerationModel::HappyHorse1p0,
    TauriVideoModel::Kling16Pro => GenerationModel::Kling1_6,
    TauriVideoModel::Kling21Master => GenerationModel::Kling21Master,
    TauriVideoModel::Kling21Pro => GenerationModel::Kling21Pro,
    TauriVideoModel::Kling2p5TurboPro => GenerationModel::Kling2p5TurboPro,
    TauriVideoModel::Kling2p6Pro => GenerationModel::Kling2p6Pro,
    TauriVideoModel::Kling3p0Pro => GenerationModel::Kling3p0Pro,
    TauriVideoModel::Kling3p0Standard => GenerationModel::Kling3p0Standard,
    TauriVideoModel::Seedance10Lite => GenerationModel::Seedance10Lite,
    TauriVideoModel::Seedance1p5Pro => GenerationModel::Seedance1p5Pro,
    TauriVideoModel::Seedance2p0 => GenerationModel::Seedance2p0,
    TauriVideoModel::Seedance2p0Fast => GenerationModel::Seedance2p0Fast,
    TauriVideoModel::Seedance2p5Preview => GenerationModel::Seedance2p5Preview,
    TauriVideoModel::Seedance2p5 => GenerationModel::Seedance2p5,
    TauriVideoModel::Seedance2p5Ultra => GenerationModel::Seedance2p5Ultra,
    TauriVideoModel::Sora2 => GenerationModel::Sora2,
    TauriVideoModel::Sora2Pro => GenerationModel::Sora2Pro,
    TauriVideoModel::Veo2 => GenerationModel::Veo2,
    TauriVideoModel::Veo3 => GenerationModel::Veo3,
    TauriVideoModel::Veo3Fast => GenerationModel::Veo3Fast,
    TauriVideoModel::Veo3p1 => GenerationModel::Veo3p1,
    TauriVideoModel::Veo3p1Fast => GenerationModel::Veo3p1Fast,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn seedance_2p5_models_map_to_generation_event_identifiers() {
    for (model, expected) in [
      (TauriVideoModel::Seedance2p5Preview, r#""seedance_2p5_preview""#),
      (TauriVideoModel::Seedance2p5, r#""seedance_2p5""#),
      (TauriVideoModel::Seedance2p5Ultra, r#""seedance_2p5_u""#),
    ] {
      let generation_model = tauri_video_model_to_generation_model(model);
      assert_eq!(serde_json::to_string(&generation_model).unwrap(), expected);
    }
  }
}
