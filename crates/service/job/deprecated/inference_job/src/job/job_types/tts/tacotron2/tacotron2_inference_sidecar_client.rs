use std::path::Path;

use anyhow::anyhow;
use log::info;
use reqwest::Client;

use errors::AnyhowResult;
use filesys::path_to_string::path_to_string;
use mysql_queries::column_types::vocoder_type::VocoderType;

use crate::job::job_types::tts::tacotron2::vocoder_option::VocoderForInferenceOption;

/// This is used to talk to the TT2 Python HTTP sidecar (rather than shelling out over bash).
/// This keeps models loaded in memory and results in faster inference time.

pub struct Tacotron2InferenceSidecarClient {
  hostname: String,
}

#[derive(Serialize)]
struct InferenceRequest {
  // Vocoder information
  pub vocoder_type: VocoderType,
  pub waveglow_vocoder_checkpoint_path : String,
  pub hifigan_vocoder_checkpoint_path: String,
  pub hifigan_superres_vocoder_checkpoint_path: String,

  // Synthesizer information
  pub synthesizer_checkpoint_path : String,

  // Text
  pub inference_text : String,

  // Tacotron hyperparameter determining roughly the maximum number of seconds of output
  pub max_decoder_steps: u32,

  // Named text pipeline/algorithm, eg. "legacy_fakeyou", "english_v1", "spanish_v2", etc.
  pub text_pipeline_type: String,

  // Whether to multiply the mel outputs before being vocoded.
  use_default_mel_multiply_factor: bool,
  maybe_custom_mel_multiply_factor: Option<f64>,

  // Output information
  pub output_audio_filename : String,
  pub output_spectrogram_filename : String,
  pub output_metadata_filename : String,

  /// To instruct the sidecar to unload the model from memory
  pub maybe_clear_synthesizer_checkpoint_path: Option<String>,
}

impl Tacotron2InferenceSidecarClient {
  pub fn new(hostname: &str) -> Self {
    // TODO(bt): Why don't have have a cached HTTP client here? Did it get poisoned?
    //let client = Client::builder()
    //    .header("User-Agent", "actix/tts_inference_job")
    //    .finish();
    Self {
      hostname: hostname.to_string(),
    //  client,
    }
  }

  // TODO: Make the args a struct.
  /// NB: 'hifigan_vocoder_checkpoint_path' may be either a pretrained or custom vocoder
  pub async fn request_inference<P: AsRef<Path>>(
    &self,
    raw_text: &str,
    max_decoder_steps: u32,
    synthesizer_checkpoint_path: P,
    text_pipeline_type: &str,
    vocoder_option: VocoderForInferenceOption<P>,
    output_audio_filename: P,
    output_spectrogram_filename: P,
    output_metadata_filename: P,
    maybe_unload_model_path: Option<String>,
    use_default_mel_multiply_factor: bool,
    maybe_custom_mel_multiply_factor: Option<f64>,
  ) -> AnyhowResult<()> {

    // TODO(bt,2023-11-26): Clean this mutability / multi-configuration up
    let vocoder_type;

    let waveglow_vocoder_checkpoint_path;
    let hifigan_vocoder_checkpoint_path;
    let hifigan_superres_vocoder_checkpoint_path;

    match vocoder_option {
      VocoderForInferenceOption::Waveglow { waveglow_vocoder_checkpoint_path : path } => {
        vocoder_type = VocoderType::WaveGlow;
        waveglow_vocoder_checkpoint_path = path_to_string(path.as_ref());
        hifigan_vocoder_checkpoint_path = "BOGUS_NOT_USED".to_string();
        hifigan_superres_vocoder_checkpoint_path = "BOGUS_NOT_USED".to_string();
      }
      VocoderForInferenceOption::HifiganSuperres {
        hifigan_vocoder_checkpoint_path: path,
        hifigan_superres_vocoder_checkpoint_path : super_res_path,
      } => {
        vocoder_type = VocoderType::HifiGanSuperResolution;
        waveglow_vocoder_checkpoint_path = "BOGUS_NOT_USED".to_string();
        hifigan_vocoder_checkpoint_path = path_to_string(path.as_ref());
        hifigan_superres_vocoder_checkpoint_path = path_to_string(super_res_path.as_ref());
      }
    }

    let synthesizer_checkpoint_path = synthesizer_checkpoint_path
        .as_ref()
        .to_str()
        .map(|s| s.to_string())
        .ok_or(anyhow!("bad synthesizer path"))?;

    let output_audio_filename = output_audio_filename
        .as_ref()
        .to_str()
        .map(|s| s.to_string())
        .ok_or(anyhow!("bad output audio path"))?;

    let output_spectrogram_filename = output_spectrogram_filename
        .as_ref()
        .to_str()
        .map(|s| s.to_string())
        .ok_or(anyhow!("bad output spectrogram path"))?;

    let output_metadata_filename = output_metadata_filename
        .as_ref()
        .to_str()
        .map(|s| s.to_string())
        .ok_or(anyhow!("bad output metadata path"))?;

    let request = InferenceRequest {
      inference_text: raw_text.to_string(),
      max_decoder_steps,
      vocoder_type,
      text_pipeline_type: text_pipeline_type.to_string(),
      use_default_mel_multiply_factor,
      waveglow_vocoder_checkpoint_path,
      hifigan_vocoder_checkpoint_path,
      hifigan_superres_vocoder_checkpoint_path,
      synthesizer_checkpoint_path,
      output_audio_filename,
      output_spectrogram_filename,
      output_metadata_filename,
      maybe_clear_synthesizer_checkpoint_path: maybe_unload_model_path,
      maybe_custom_mel_multiply_factor,
    };

    let url = format!("http://{}/infer", self.hostname);

    info!("Requesting {}", url);

    let request = serde_json::to_string(&request)?;

    let client = Client::new();

    let response = client.post(&url)
        .header("content-type", "application/json")
        .body(request)
        .send()
        .await?;

    let status = response.status();

    info!("Response status: {} ({:?})", status, status.canonical_reason());

    if status.is_server_error() {
      return Err(anyhow!("sidecar server error: {} {:?}", status, status.canonical_reason()));
    } else if status.is_client_error() {
      return Err(anyhow!("sidecar client request error: {} {:?}", status, status.canonical_reason()));
    }

    Ok(())
  }
}