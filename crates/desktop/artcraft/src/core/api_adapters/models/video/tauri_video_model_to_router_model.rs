use artcraft_router::api::router_video_model::RouterVideoModel;

use crate::core::commands::generate::generate_video::request::TauriVideoModel;

/// Map TauriVideoModel to the artcraft_router's RouterVideoModel.
pub fn tauri_video_model_to_router_model(model: TauriVideoModel) -> RouterVideoModel {
  match model {
    TauriVideoModel::GrokVideo => RouterVideoModel::GrokImagineVideo,
    TauriVideoModel::GrokImagineVideo1p5 => RouterVideoModel::GrokImagineVideo1p5,
    TauriVideoModel::HappyHorse1p0 => RouterVideoModel::HappyHorse1p0,
    TauriVideoModel::Kling16Pro => RouterVideoModel::Kling16Pro,
    TauriVideoModel::Kling21Master => RouterVideoModel::Kling21Master,
    TauriVideoModel::Kling21Pro => RouterVideoModel::Kling21Pro,
    TauriVideoModel::Kling2p5TurboPro => RouterVideoModel::Kling2p5TurboPro,
    TauriVideoModel::Kling2p6Pro => RouterVideoModel::Kling2p6Pro,
    TauriVideoModel::Kling3p0Pro => RouterVideoModel::Kling3p0Pro,
    TauriVideoModel::Kling3p0Standard => RouterVideoModel::Kling3p0Standard,
    TauriVideoModel::Seedance10Lite => RouterVideoModel::Seedance10Lite,
    TauriVideoModel::Seedance1p5Pro => RouterVideoModel::Seedance1p5Pro,
    TauriVideoModel::Seedance2p0 => RouterVideoModel::Seedance2p0,
    TauriVideoModel::Seedance2p0Fast => RouterVideoModel::Seedance2p0Fast,
    TauriVideoModel::Sora2 => RouterVideoModel::Sora2,
    TauriVideoModel::Sora2Pro => RouterVideoModel::Sora2Pro,
    TauriVideoModel::Veo2 => RouterVideoModel::Veo2,
    TauriVideoModel::Veo3 => RouterVideoModel::Veo3,
    TauriVideoModel::Veo3Fast => RouterVideoModel::Veo3Fast,
    TauriVideoModel::Veo3p1 => RouterVideoModel::Veo3p1,
    TauriVideoModel::Veo3p1Fast => RouterVideoModel::Veo3p1Fast,
  }
}
