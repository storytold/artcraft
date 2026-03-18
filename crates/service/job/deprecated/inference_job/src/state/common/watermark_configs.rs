use std::path::PathBuf;
use easyenv::{get_env_num, get_env_pathbuf_required};
use errors::AnyhowResult;

#[derive(Clone)]
pub struct WatermarkConfigs {
  pub fakeyou: WatermarkFfmpegDetails,
  pub storyteller: WatermarkFfmpegDetails,
}

#[derive(Clone)]
pub struct WatermarkFfmpegDetails {
  pub path: PathBuf,
  pub alpha: f32,
  pub scale: f32,
}

impl WatermarkConfigs {
  pub fn from_env() -> AnyhowResult<Self> {
    Ok(Self {
      fakeyou: WatermarkFfmpegDetails {
        path: get_env_pathbuf_required("FAKEYOU_WATERMARK_PATH")?,
        alpha: get_env_num("FAKEYOU_WATERMARK_ALPHA", 0.6)?,
        scale: get_env_num("FAKEYOU_WATERMARK_SCALE", 0.1)?,
      },
      storyteller: WatermarkFfmpegDetails {
        path: get_env_pathbuf_required("STORYTELLER_WATERMARK_PATH")?,
        alpha: get_env_num("STORYTELLER_WATERMARK_ALPHA", 0.6)?,
        scale: get_env_num("STORYTELLER_WATERMARK_SCALE", 0.1)?,
      },
    })
  }
}
