use errors::AnyhowResult;

use crate::job::job_types::f5_tts::f5_tts_inference_command::F5TTSInferenceCommand;
use crate::util::common_commands::ffmpeg::runner::ffmpeg_command_runner::FfmpegCommandRunner;

pub struct F5TTSDependencies {
  pub inference_command: F5TTSInferenceCommand,
  pub ffmpeg_command_runner: FfmpegCommandRunner,
}


impl F5TTSDependencies {
  pub fn setup() -> AnyhowResult<Self> {
    Ok(Self {
      inference_command: F5TTSInferenceCommand::from_env()?,
      ffmpeg_command_runner: FfmpegCommandRunner::from_env()?,
    })
  }
}