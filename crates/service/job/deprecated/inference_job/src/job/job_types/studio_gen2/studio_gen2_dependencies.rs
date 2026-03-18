use crate::job::job_types::studio_gen2::stable_animator::stable_animator_dependencies::StableAnimatorDependencies;
use crate::state::common::watermark_configs::WatermarkConfigs;
use crate::util::common_commands::ffmpeg::runner::ffmpeg_command_runner::FfmpegCommandRunner;
use errors::AnyhowResult;
use std::path::PathBuf;
use crate::job::job_types::studio_gen2::animate_x::animate_x_dependencies::AnimateXDependencies;

pub struct StudioGen2Dependencies {
  /// Watermarks added to videos (or perhaps images in the future)
  pub watermarks: WatermarkConfigs,

  pub input_directory: PathBuf,
  pub output_directory: PathBuf,

  pub ffmpeg: FfmpegCommandRunner,

  pub animate_x: Option<AnimateXDependencies>,
  pub stable_animator: Option<StableAnimatorDependencies>,
}

impl StudioGen2Dependencies {
  pub fn setup() -> AnyhowResult<Self> {

    let animate_x =
        match easyenv::get_env_bool_optional("ANIMATE_X_ENABLED") {
          Some(true) => Some(AnimateXDependencies::setup()?),
          _ => None,
        };
    
    let stable_animator =
        match easyenv::get_env_bool_optional("STABLE_ANIMATOR_ENABLED") {
          Some(true) => Some(StableAnimatorDependencies::setup()?),
          _ => None,
        };

    Ok(Self {
      watermarks: WatermarkConfigs::from_env()?,

      // TODO: Configurability of input/output dirs
      input_directory: PathBuf::from("/tmp/input"),
      output_directory: PathBuf::from("/tmp/output"),
      
      ffmpeg: FfmpegCommandRunner::from_env()?,

      animate_x,
      stable_animator,
    })
  }
}
