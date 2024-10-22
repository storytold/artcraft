use errors::AnyhowResult;

use crate::job::job_types::vc::seed_vc::seed_vc_inference_command::SeedVcInferenceCommand;
use crate::util::common_commands::ffmpeg::runner::ffmpeg_command_runner::FfmpegCommandRunner;

pub struct SeedVcDependencies {
  pub inference_command: SeedVcInferenceCommand,
  pub ffmpeg_command_runner: FfmpegCommandRunner,
}


impl SeedVcDependencies {
  pub fn setup() -> AnyhowResult<Self> {
    Ok(Self {
      inference_command: SeedVcInferenceCommand::from_env()?,
      ffmpeg_command_runner: FfmpegCommandRunner::from_env()?,
    })
  }
}