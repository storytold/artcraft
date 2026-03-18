use crate::job::job_types::studio_gen2::stable_animator::stable_animator_command::StableAnimatorCommand;
use errors::AnyhowResult;
use std::path::PathBuf;

pub struct StableAnimatorDependencies {
  pub command: StableAnimatorCommand,

  pub pretrained_model_name_or_path: PathBuf,
  pub posenet_model_name_or_path: PathBuf,
  pub face_encoder_model_name_or_path: PathBuf,
  pub unet_model_name_or_path: PathBuf,
}

impl StableAnimatorDependencies {
  pub fn setup() -> AnyhowResult<Self> {
    Ok(Self {
      command: StableAnimatorCommand::new_from_env()?,

      pretrained_model_name_or_path: easyenv::get_env_pathbuf_required("STABLE_ANIMATOR_PRETRAINED_MODEL_PATH")?,
      posenet_model_name_or_path: easyenv::get_env_pathbuf_required("STABLE_ANIMATOR_POSENET_MODEL_PATH")?,
      face_encoder_model_name_or_path: easyenv::get_env_pathbuf_required("STABLE_ANIMATOR_FACE_ENCODER_MODEL_PATH")?,
      unet_model_name_or_path: easyenv::get_env_pathbuf_required("STABLE_ANIMATOR_UNET_MODEL_PATH")?,
    })
  }
}
