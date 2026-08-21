use crate::api::router_provider::RouterProvider;
use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_audio::audio_generation_cost_estimate::AudioGenerationCostEstimate;
use crate::generate::generate_audio::generate_audio_response::GenerateAudioResponse;
use crate::generate::generate_audio::providers::artcraft::seed_audio_1p0::cost::ArtcraftSeedAudio1p0CostState;
use crate::generate::generate_audio::providers::artcraft::seed_audio_1p0::request::ArtcraftSeedAudio1p0RequestState;
use crate::generate::generate_audio::providers::artcraft::suno_music::cost::ArtcraftSunoMusicCostState;
use crate::generate::generate_audio::providers::artcraft::suno_music::request::ArtcraftSunoMusicRequestState;
use crate::generate::generate_audio::providers::artcraft::suno_remix::cost::ArtcraftSunoRemixCostState;
use crate::generate::generate_audio::providers::artcraft::suno_remix::request::ArtcraftSunoRemixRequestState;
use crate::generate::generate_audio::providers::artcraft::suno_sample::cost::ArtcraftSunoSampleCostState;
use crate::generate::generate_audio::providers::artcraft::suno_sample::request::ArtcraftSunoSampleRequestState;
use crate::generate::generate_audio::providers::artcraft::suno_sounds::cost::ArtcraftSunoSoundsCostState;
use crate::generate::generate_audio::providers::artcraft::suno_sounds::request::ArtcraftSunoSoundsRequestState;
use crate::generate::generate_audio::providers::fal::seed_audio_1p0::cost::FalSeedAudio1p0CostState;
use crate::generate::generate_audio::providers::fal::seed_audio_1p0::request::FalSeedAudio1p0RequestState;
use crate::generate::generate_audio::providers::kinovi::suno_music::cost::KinoviSunoMusicCostState;
use crate::generate::generate_audio::providers::kinovi::suno_music::request::KinoviSunoMusicRequestState;
use crate::generate::generate_audio::providers::kinovi::suno_remix::cost::KinoviSunoRemixCostState;
use crate::generate::generate_audio::providers::kinovi::suno_remix::request::KinoviSunoRemixRequestState;
use crate::generate::generate_audio::providers::kinovi::suno_sample::cost::KinoviSunoSampleCostState;
use crate::generate::generate_audio::providers::kinovi::suno_sample::request::KinoviSunoSampleRequestState;
use crate::generate::generate_audio::providers::kinovi::suno_sounds::cost::KinoviSunoSoundsCostState;
use crate::generate::generate_audio::providers::kinovi::suno_sounds::request::KinoviSunoSoundsRequestState;

#[derive(Clone, Debug)]
pub enum AudioGenerationRequest {
  ArtcraftSunoMusic(ArtcraftSunoMusicRequestState),
  ArtcraftSunoRemix(ArtcraftSunoRemixRequestState),
  ArtcraftSunoSounds(ArtcraftSunoSoundsRequestState),
  ArtcraftSunoSample(ArtcraftSunoSampleRequestState),
  ArtcraftSeedAudio1p0(ArtcraftSeedAudio1p0RequestState),
  FalSeedAudio1p0(FalSeedAudio1p0RequestState),
  KinoviSunoMusic(KinoviSunoMusicRequestState),
  KinoviSunoRemix(KinoviSunoRemixRequestState),
  KinoviSunoSounds(KinoviSunoSoundsRequestState),
  KinoviSunoSample(KinoviSunoSampleRequestState),
}

impl AudioGenerationRequest {

  pub fn get_provider(&self) -> RouterProvider {
    match self {
      Self::ArtcraftSunoMusic(_) => RouterProvider::Artcraft,
      Self::ArtcraftSunoRemix(_) => RouterProvider::Artcraft,
      Self::ArtcraftSunoSounds(_) => RouterProvider::Artcraft,
      Self::ArtcraftSunoSample(_) => RouterProvider::Artcraft,
      Self::ArtcraftSeedAudio1p0(_) => RouterProvider::Artcraft,
      Self::FalSeedAudio1p0(_) => RouterProvider::Fal,
      Self::KinoviSunoMusic(_) => RouterProvider::KinoviWeb,
      Self::KinoviSunoRemix(_) => RouterProvider::KinoviWeb,
      Self::KinoviSunoSounds(_) => RouterProvider::KinoviWeb,
      Self::KinoviSunoSample(_) => RouterProvider::KinoviWeb,
    }
  }

  /// Return a cost estimate to fulfill the request.
  pub fn estimate_cost(&self) -> Result<AudioGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      AudioGenerationRequest::ArtcraftSunoMusic(request) => Ok(ArtcraftSunoMusicCostState::from_request(request).estimate_cost()),
      AudioGenerationRequest::ArtcraftSunoRemix(request) => Ok(ArtcraftSunoRemixCostState::from_request(request).estimate_cost()),
      AudioGenerationRequest::ArtcraftSunoSounds(request) => Ok(ArtcraftSunoSoundsCostState::from_request(request).estimate_cost()),
      AudioGenerationRequest::ArtcraftSunoSample(request) => Ok(ArtcraftSunoSampleCostState::from_request(request).estimate_cost()),
      AudioGenerationRequest::ArtcraftSeedAudio1p0(request) => Ok(ArtcraftSeedAudio1p0CostState::from_request(request).estimate_cost()),
      AudioGenerationRequest::FalSeedAudio1p0(request) => Ok(FalSeedAudio1p0CostState::from_request(request).estimate_cost()),
      AudioGenerationRequest::KinoviSunoMusic(request) => Ok(KinoviSunoMusicCostState::from_request(request).estimate_cost()),
      AudioGenerationRequest::KinoviSunoRemix(request) => Ok(KinoviSunoRemixCostState::from_request(request).estimate_cost()),
      AudioGenerationRequest::KinoviSunoSounds(request) => Ok(KinoviSunoSoundsCostState::from_request(request).estimate_cost()),
      AudioGenerationRequest::KinoviSunoSample(request) => Ok(KinoviSunoSampleCostState::from_request(request).estimate_cost()),
    }
  }

  /// Send the audio generation request
  /// If successful, returns the job IDs.
  pub async fn send_request(&self, client: &RouterClient) -> Result<GenerateAudioResponse, ArtcraftRouterError> {
    match self {
      AudioGenerationRequest::ArtcraftSunoMusic(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      AudioGenerationRequest::ArtcraftSunoRemix(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      AudioGenerationRequest::ArtcraftSunoSounds(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      AudioGenerationRequest::ArtcraftSunoSample(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      AudioGenerationRequest::ArtcraftSeedAudio1p0(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      AudioGenerationRequest::FalSeedAudio1p0(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      AudioGenerationRequest::KinoviSunoMusic(request) => {
        let client_ref = client.get_kinovi_web_client_ref()?;
        request.send(client_ref).await
      },
      AudioGenerationRequest::KinoviSunoRemix(request) => {
        let client_ref = client.get_kinovi_web_client_ref()?;
        request.send(client_ref).await
      },
      AudioGenerationRequest::KinoviSunoSounds(request) => {
        let client_ref = client.get_kinovi_web_client_ref()?;
        request.send(client_ref).await
      },
      AudioGenerationRequest::KinoviSunoSample(request) => {
        let client_ref = client.get_kinovi_web_client_ref()?;
        request.send(client_ref).await
      },
    }
  }
}
