use errors::AnyhowResult;

use crate::job::job_types::videofilter::rerender_a_video::rerender_inference_command::RerenderInferenceCommand;

pub struct RerenderDependencies {
    pub inference_command: RerenderInferenceCommand,
}

impl RerenderDependencies {
    pub fn setup() -> AnyhowResult<Self> {
        Ok(Self {
            inference_command: RerenderInferenceCommand::from_env()?,
        })
    }
}
