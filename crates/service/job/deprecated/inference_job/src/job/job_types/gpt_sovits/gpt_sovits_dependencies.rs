use errors::AnyhowResult;

use crate::job::job_types::gpt_sovits::gpt_sovits_inference_command::GptSovitsInferenceCommand;
use crate::util::common_commands::ffmpeg::runner::ffmpeg_command_runner::FfmpegCommandRunner;

pub struct GptSovitsDependencies {
  pub inference_command: GptSovitsInferenceCommand,
  pub ffmpeg_command_runner: FfmpegCommandRunner,
}


impl GptSovitsDependencies {
  pub fn setup() -> AnyhowResult<Self> {
    Ok(Self {
      inference_command: GptSovitsInferenceCommand::from_env()?,
      ffmpeg_command_runner: FfmpegCommandRunner::from_env()?,
    })
  }
}