use crate::job::job_types::studio_gen2::animate_x::animate_x_inference_command::AnimateXInferenceCommand;
use crate::job::job_types::studio_gen2::animate_x::animate_x_process_frames_command::AnimateXProcessFramesCommand;
use errors::AnyhowResult;
use std::path::PathBuf;

pub struct AnimateXDependencies {
  pub process_frames_command: AnimateXProcessFramesCommand,
  pub inference_command: AnimateXInferenceCommand,

  pub model_directory_path: PathBuf,
}

impl AnimateXDependencies {
  pub fn setup() -> AnyhowResult<Self> {
    Ok(Self {
      process_frames_command: AnimateXProcessFramesCommand::new_from_env()?,
      inference_command: AnimateXInferenceCommand::new_from_env()?,
      model_directory_path: easyenv::get_env_pathbuf_required("ANIMATE_X_MODEL_DIRECTORY_PATH")?,
    })
  }
}
