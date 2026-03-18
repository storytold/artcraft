use errors::AnyhowResult;

use crate::job::job_types::mocap::mocap_net::mocapnet_inference_command::MocapnetInferenceCommand;

pub struct MocapNetDependencies {
    pub inference_command: MocapnetInferenceCommand,
}

impl MocapNetDependencies {
    pub fn setup() -> AnyhowResult<Self> {
        Ok(Self {
            inference_command: MocapnetInferenceCommand::from_env()?,
        })
    }
}
