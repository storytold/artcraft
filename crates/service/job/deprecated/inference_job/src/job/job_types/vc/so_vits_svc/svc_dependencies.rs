use errors::AnyhowResult;

use crate::job::job_types::vc::so_vits_svc::so_vits_svc_inference_command::SoVitsSvcInferenceCommand;

pub struct SvcDependencies {
  pub inference_command: SoVitsSvcInferenceCommand,
}

impl SvcDependencies {
  pub fn setup() -> AnyhowResult<Self> {
    Ok(Self {
      inference_command: SoVitsSvcInferenceCommand::from_env()?,
    })
  }
}
