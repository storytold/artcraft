use errors::AnyhowResult;

use crate::job::job_types::tts::vall_e_x::model_downloaders::VallEXDownloaders;
use crate::job::job_types::tts::vall_e_x::vall_e_x_inference_command::{VallEXCreateEmbeddingCommand, VallEXInferenceCommand};

pub struct VallExDependencies {
  pub create_embedding_command: VallEXCreateEmbeddingCommand,
  pub downloaders: VallEXDownloaders,
  pub inference_command: VallEXInferenceCommand,
}

impl VallExDependencies {
  pub fn setup() -> AnyhowResult<Self> {
    Ok(Self {
      create_embedding_command: VallEXCreateEmbeddingCommand::from_env()?,
      downloaders: VallEXDownloaders::build_all_from_env(),
      inference_command: VallEXInferenceCommand::from_env()?,
    })
  }
}
