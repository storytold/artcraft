use errors::AnyhowResult;

use crate::job::job_types::lipsync::sad_talker::model_downloaders::SadTalkerDownloaders;
use crate::job::job_types::lipsync::sad_talker::sad_talker_inference_command::SadTalkerInferenceCommand;
use crate::util::common_commands::ffmpeg::old::ffmpeg_logo_watermark_command::FfmpegLogoWatermarkCommand;

pub struct SadTalkerDependencies {
  pub downloaders: SadTalkerDownloaders,
  pub ffmpeg_watermark_command: FfmpegLogoWatermarkCommand,
  pub inference_command: SadTalkerInferenceCommand,
}

impl SadTalkerDependencies {
  pub fn setup() -> AnyhowResult<Self> {
    Ok(Self {
      downloaders: SadTalkerDownloaders::build_all_from_env(),
      ffmpeg_watermark_command: FfmpegLogoWatermarkCommand::from_env()?,
      inference_command: SadTalkerInferenceCommand::from_env()?,
    })
  }
}
