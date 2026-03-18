use errors::AnyhowResult;

use crate::job::job_types::tts::styletts2::model_downloaders::StyleTTS2Downloaders;
use crate::job::job_types::tts::styletts2::styletts2_inference_command::{StyleTTS2CreateEmbeddingCommand, StyleTTS2InferenceCommand};

pub struct StyleTTS2Dependencies {
  pub create_embedding_command: StyleTTS2CreateEmbeddingCommand,
  pub downloaders: StyleTTS2Downloaders,
  pub inference_command: StyleTTS2InferenceCommand,
}

impl StyleTTS2Dependencies {
  pub fn setup() -> AnyhowResult<Self> {
    Ok(Self {
      create_embedding_command: StyleTTS2CreateEmbeddingCommand::from_env()?,
      downloaders: StyleTTS2Downloaders::build_all_from_env(),
      inference_command: StyleTTS2InferenceCommand::from_env()?,
    })
  }
}
