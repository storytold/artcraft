use enums_api::tauri::tasks::task_model_type::TaskModelType as Api;
use enums_db::tauri::tasks::task_model_type::TaskModelType as Db;

pub fn task_model_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Flux1Dev => Db::Flux1Dev,
    Api::Flux1Schnell => Db::Flux1Schnell,
    Api::FluxDevJuggernaut => Db::FluxDevJuggernaut,
    Api::FluxPro1 => Db::FluxPro1,
    Api::FluxPro11 => Db::FluxPro11,
    Api::FluxPro11Ultra => Db::FluxPro11Ultra,
    Api::FluxProKontextMax => Db::FluxProKontextMax,
    Api::Gemini25Flash => Db::Gemini25Flash,
    Api::NanoBanana => Db::NanoBanana,
    Api::NanoBanana2 => Db::NanoBanana2,
    Api::NanoBananaPro => Db::NanoBananaPro,
    Api::GptImage1 => Db::GptImage1,
    Api::GptImage1p5 => Db::GptImage1p5,
    Api::Seedream4 => Db::Seedream4,
    Api::Seedream4p5 => Db::Seedream4p5,
    Api::Seedream5Lite => Db::Seedream5Lite,
    Api::QwenEdit2511Angles => Db::QwenEdit2511Angles,
    Api::Flux2LoraAngles => Db::Flux2LoraAngles,
    Api::GrokImage => Db::GrokImage,
    Api::Recraft3 => Db::Recraft3,
    Api::Midjourney => Db::Midjourney,
    Api::GrokVideo => Db::GrokVideo,
    Api::Kling16Pro => Db::Kling16Pro,
    Api::Kling21Pro => Db::Kling21Pro,
    Api::Kling21Master => Db::Kling21Master,
    Api::Kling2p5TurboPro => Db::Kling2p5TurboPro,
    Api::Kling2p6Pro => Db::Kling2p6Pro,
    Api::Kling3p0Standard => Db::Kling3p0Standard,
    Api::Kling3p0Pro => Db::Kling3p0Pro,
    Api::Seedance10Lite => Db::Seedance10Lite,
    Api::Seedance1p5Pro => Db::Seedance1p5Pro,
    Api::Seedance2p0 => Db::Seedance2p0,
    Api::Sora2 => Db::Sora2,
    Api::Sora2Pro => Db::Sora2Pro,
    Api::Veo2 => Db::Veo2,
    Api::Veo3 => Db::Veo3,
    Api::Veo3Fast => Db::Veo3Fast,
    Api::Veo3p1 => Db::Veo3p1,
    Api::Veo3p1Fast => Db::Veo3p1Fast,
    Api::Hunyuan3d2_0 => Db::Hunyuan3d2_0,
    Api::Hunyuan3d2_1 => Db::Hunyuan3d2_1,
    Api::Hunyuan3d3 => Db::Hunyuan3d3,
    Api::WorldlabsMarble => Db::WorldlabsMarble,
    Api::WorldlabsMarble0p1Mini => Db::WorldlabsMarble0p1Mini,
    Api::WorldlabsMarble0p1Plus => Db::WorldlabsMarble0p1Plus,
  }
}

pub fn task_model_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Flux1Dev => Api::Flux1Dev,
    Db::Flux1Schnell => Api::Flux1Schnell,
    Db::FluxDevJuggernaut => Api::FluxDevJuggernaut,
    Db::FluxPro1 => Api::FluxPro1,
    Db::FluxPro11 => Api::FluxPro11,
    Db::FluxPro11Ultra => Api::FluxPro11Ultra,
    Db::FluxProKontextMax => Api::FluxProKontextMax,
    Db::Gemini25Flash => Api::Gemini25Flash,
    Db::NanoBanana => Api::NanoBanana,
    Db::NanoBanana2 => Api::NanoBanana2,
    Db::NanoBananaPro => Api::NanoBananaPro,
    Db::GptImage1 => Api::GptImage1,
    Db::GptImage1p5 => Api::GptImage1p5,
    Db::Seedream4 => Api::Seedream4,
    Db::Seedream4p5 => Api::Seedream4p5,
    Db::Seedream5Lite => Api::Seedream5Lite,
    Db::QwenEdit2511Angles => Api::QwenEdit2511Angles,
    Db::Flux2LoraAngles => Api::Flux2LoraAngles,
    Db::GrokImage => Api::GrokImage,
    Db::Recraft3 => Api::Recraft3,
    Db::Midjourney => Api::Midjourney,
    Db::GrokVideo => Api::GrokVideo,
    Db::Kling16Pro => Api::Kling16Pro,
    Db::Kling21Pro => Api::Kling21Pro,
    Db::Kling21Master => Api::Kling21Master,
    Db::Kling2p5TurboPro => Api::Kling2p5TurboPro,
    Db::Kling2p6Pro => Api::Kling2p6Pro,
    Db::Kling3p0Standard => Api::Kling3p0Standard,
    Db::Kling3p0Pro => Api::Kling3p0Pro,
    Db::Seedance10Lite => Api::Seedance10Lite,
    Db::Seedance1p5Pro => Api::Seedance1p5Pro,
    Db::Seedance2p0 => Api::Seedance2p0,
    Db::Sora2 => Api::Sora2,
    Db::Sora2Pro => Api::Sora2Pro,
    Db::Veo2 => Api::Veo2,
    Db::Veo3 => Api::Veo3,
    Db::Veo3Fast => Api::Veo3Fast,
    Db::Veo3p1 => Api::Veo3p1,
    Db::Veo3p1Fast => Api::Veo3p1Fast,
    Db::Hunyuan3d2_0 => Api::Hunyuan3d2_0,
    Db::Hunyuan3d2_1 => Api::Hunyuan3d2_1,
    Db::Hunyuan3d3 => Api::Hunyuan3d3,
    Db::WorldlabsMarble => Api::WorldlabsMarble,
    Db::WorldlabsMarble0p1Mini => Api::WorldlabsMarble0p1Mini,
    Db::WorldlabsMarble0p1Plus => Api::WorldlabsMarble0p1Plus,
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
      let api = task_model_type_to_api(&variant);
      let back = task_model_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for variant in Api::iter() {
      let db = task_model_type_to_db(&variant);
      let back = task_model_type_to_api(&db);
      assert_eq!(variant, back);
    }
  }
}
