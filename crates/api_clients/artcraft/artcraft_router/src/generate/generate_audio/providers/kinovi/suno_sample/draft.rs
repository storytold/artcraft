use seedance2pro_client::generate::audio::generate_suno_sample::GenerateSunoSampleRequest;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_audio::audio_generation_draft_context::AudioGenerationDraftContext;
use crate::generate::generate_audio::providers::kinovi::resolve::{
  resolve_and_upload_audio_ref, SingleAudioRef,
};
use crate::generate::generate_audio::providers::kinovi::suno_sample::request::KinoviSunoSampleRequestState;

#[derive(Debug, Clone)]
pub struct KinoviSunoSampleDraftState {
  // Materialized / finalized types

  pub prompt: String,
  pub style_tags: Option<String>,
  pub instrumental: bool,

  /// Start of the sample window within the audio, in seconds.
  /// NB: the omni audio API doesn't carry a sample window yet, so builds
  /// default this to 0.
  pub chop_sample_start_seconds: u32,

  /// End of the sample window within the audio, in seconds.
  /// NB: the omni audio API doesn't carry a sample window yet, so builds
  /// default this to 30.
  pub chop_sample_end_seconds: u32,

  // Pending types that need to be resolved and uploaded to the Kinovi CDN.
  pub audio_source: Option<SingleAudioRef>,
}

impl KinoviSunoSampleDraftState {
  pub async fn to_request(
    &mut self,
    draft_context: &AudioGenerationDraftContext<'_>,
  ) -> Result<KinoviSunoSampleRequestState, ArtcraftRouterError> {
    let client = draft_context.get_seedance2pro_client_ref()?;
    let session = &client.session;

    let audio_source = self.audio_source.take().ok_or_else(|| {
      ArtcraftRouterError::InvalidInput(
        "Suno Sample draft has no audio source (already finalized?)".to_string(),
      )
    })?;

    let kinovi_audio_url = resolve_and_upload_audio_ref(session, &audio_source, draft_context).await?;

    let request = GenerateSunoSampleRequest {
      prompt: self.prompt.clone(),
      audio_url: kinovi_audio_url,
      chop_sample_start_seconds: self.chop_sample_start_seconds,
      chop_sample_end_seconds: self.chop_sample_end_seconds,
      style_tags: self.style_tags.clone(),
      instrumental: self.instrumental,
    };

    Ok(KinoviSunoSampleRequestState { request })
  }
}
