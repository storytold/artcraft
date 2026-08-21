use kinovi_web_client::generate::audio::generate_suno_remix::{
  GenerateSunoRemixRequest, KinoviSunoRemixSource,
};

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_audio::audio_generation_draft_context::AudioGenerationDraftContext;
use crate::generate::generate_audio::providers::kinovi::resolve::{
  resolve_and_upload_audio_ref, SingleAudioRef,
};
use crate::generate::generate_audio::providers::kinovi::suno_remix::request::KinoviSunoRemixRequestState;

#[derive(Debug, Clone)]
pub struct KinoviSunoRemixDraftState {
  // Materialized / finalized types

  pub prompt: String,
  pub style_tags: Option<String>,
  pub keep_lyrics: bool,

  // Pending types that need to be resolved and uploaded to the Kinovi CDN.
  pub audio_source: Option<SingleAudioRef>,
}

impl KinoviSunoRemixDraftState {
  pub async fn to_request(
    &mut self,
    draft_context: &AudioGenerationDraftContext<'_>,
  ) -> Result<KinoviSunoRemixRequestState, ArtcraftRouterError> {
    let client = draft_context.get_kinovi_web_client_ref()?;
    let session = &client.session;

    let audio_source = self.audio_source.take().ok_or_else(|| {
      ArtcraftRouterError::InvalidInput(
        "Suno Remix draft has no audio source (already finalized?)".to_string(),
      )
    })?;

    let kinovi_audio_url = resolve_and_upload_audio_ref(session, &audio_source, draft_context).await?;

    let request = GenerateSunoRemixRequest {
      prompt: self.prompt.clone(),
      source: KinoviSunoRemixSource::AudioUrl(kinovi_audio_url),
      style_tags: self.style_tags.clone(),
      keep_lyrics: self.keep_lyrics,
    };

    Ok(KinoviSunoRemixRequestState { request })
  }
}
