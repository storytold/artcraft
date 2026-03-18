use errors::AnyhowResult;

use crate::job::job_types::tts::tacotron2::health_check_state::HealthCheckState;
use crate::job::job_types::tts::tacotron2::tacotron2_inference_command::Tacotron2InferenceCommand;
use crate::job::job_types::tts::tacotron2::tacotron2_inference_sidecar_client::Tacotron2InferenceSidecarClient;
use crate::job::job_types::tts::tacotron2::tacotron2_sidecar_health_check_client::Tacotron2SidecarHealthCheckClient;
use crate::job::job_types::tts::tacotron2::virtual_lfu_cache::SyncVirtualLfuCache;

pub struct Tacotron2Dependencies {
  pub inference_command: Tacotron2InferenceCommand,

  /// Common pretrained waveglow vocoder filename
  pub waveglow_vocoder_model_filename: String,

  /// Common pretrained hifigan vocoder filename
  pub hifigan_vocoder_model_filename: String,

  /// Common pretrained hifigan super resolution vocoder filename
  pub hifigan_superres_vocoder_model_filename: String,

  /// dependencies that are for the sidecar version of TT2
  pub sidecar: SidecarDeps,

  /// Rollout flag for uploading results as `media_files` instead of `tts_results`.
  pub upload_as_media_file: bool,
}

pub struct SidecarDeps {
  pub use_sidecar_instead_of_shell: bool,
  pub inference_client: Tacotron2InferenceSidecarClient,
  pub health_check_client: Tacotron2SidecarHealthCheckClient,
  pub health_check_state: HealthCheckState,
  pub virtual_lfu_cache: SyncVirtualLfuCache,
}

impl Tacotron2Dependencies {
  pub fn setup() -> AnyhowResult<Self> {

    // The following are for TT2 that existed in inference-job but that are in an unknown state:

    let waveglow_vocoder_model_filename = easyenv::get_env_string_or_default(
      "TTS_WAVEGLOW_VOCODER_MODEL_FILENAME", "waveglow.pth");

    let hifigan_vocoder_model_filename = easyenv::get_env_string_or_default(
      "TTS_HIFIGAN_VOCODER_MODEL_FILENAME", "hifigan.pth");

    let hifigan_superres_vocoder_model_filename = easyenv::get_env_string_or_default(
      "TTS_HIFIGAN_SUPERRES_VOCODER_MODEL_FILENAME", "hifigan_superres.pth");

    // The following are for TT2 that was directly ported from tts-inference-job

    let sidecar_hostname =
        easyenv::get_env_string_required("TTS_INFERENCE_SIDECAR_HOSTNAME")?;

    let inference_client =
        Tacotron2InferenceSidecarClient::new(&sidecar_hostname);

    let health_check_client=
        Tacotron2SidecarHealthCheckClient::new(&sidecar_hostname)?;

    let sidecar_max_synthesizer_models = easyenv::get_env_num(
      "TTS_SIDECAR_MAX_SYNTHESIZER_MODELS", 3)?;

    let virtual_lfu_cache = SyncVirtualLfuCache::new(sidecar_max_synthesizer_models)?;

    Ok(Self {
      inference_command: Tacotron2InferenceCommand::from_env()?,
      waveglow_vocoder_model_filename,
      hifigan_vocoder_model_filename,
      hifigan_superres_vocoder_model_filename,
      sidecar: SidecarDeps {
        use_sidecar_instead_of_shell: true, // TODO: ENV VAR
        inference_client,
        health_check_client,
        health_check_state: HealthCheckState::new(),
        virtual_lfu_cache,
      },
      upload_as_media_file: easyenv::get_env_bool_or_default("TT2_AS_MEDIA_FILES", false),
    })
  }
}
