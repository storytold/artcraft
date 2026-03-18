use errors::AnyhowResult;

use crate::job::job_types::tts::vits::vits_inference_command::VitsInferenceCommand;

pub struct VitsDependencies {
  pub inference_command: VitsInferenceCommand,
}

impl VitsDependencies {
  pub fn setup() -> AnyhowResult<Self> {
    Ok(Self {
      inference_command: VitsInferenceCommand::from_env()?,
    })
  }
}
