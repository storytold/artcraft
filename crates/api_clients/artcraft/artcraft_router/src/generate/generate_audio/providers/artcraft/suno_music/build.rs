use enums::common::generation::common_audio_model::CommonAudioModel as CommonAudioModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_audio::audio_generation_draft_or_request::AudioGenerationDraftOrRequest;
use crate::generate::generate_audio::audio_generation_request::AudioGenerationRequest;
use crate::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
use crate::generate::generate_audio::providers::artcraft::build_common::build_artcraft_omni_audio_request;
use crate::generate::generate_audio::providers::artcraft::suno_music::request::ArtcraftSunoMusicRequestState;

pub fn build_artcraft_suno_music(builder: GenerateAudioRequestBuilder) -> Result<AudioGenerationDraftOrRequest, ArtcraftRouterError> {
  let request = build_artcraft_omni_audio_request(builder, CommonAudioModelEnum::SunoMusic)?;
  let state = ArtcraftSunoMusicRequestState { request };
  Ok(AudioGenerationDraftOrRequest::Request(AudioGenerationRequest::ArtcraftSunoMusic(state)))
}
