use errors::AnyhowResult;

use crate::job::job_types::vc::rvc_v2::model_downloaders::RvcV2Downloaders;
use crate::job::job_types::vc::rvc_v2::pretrained_hubert_model::PretrainedHubertModel;
use crate::job::job_types::vc::rvc_v2::rvc_v2_inference_command::RvcV2InferenceCommand;

pub struct RvcV2Dependencies {
  pub inference_command: RvcV2InferenceCommand,
  pub pretrained_hubert_model: PretrainedHubertModel,
  pub downloaders: RvcV2Downloaders,
}

impl RvcV2Dependencies {
  pub fn setup() -> AnyhowResult<Self> {
    Ok(Self {
      inference_command: RvcV2InferenceCommand::from_env()?,
      pretrained_hubert_model: PretrainedHubertModel::from_env(),
      downloaders: RvcV2Downloaders::build_all_from_env(),
    })
  }
}
