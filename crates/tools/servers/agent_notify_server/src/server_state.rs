use std::sync::Arc;

use crate::audio_player::AudioPlayerHandle;
use crate::config::NotifyConfig;

#[derive(Clone)]
pub struct ServerState {
  pub config: Arc<NotifyConfig>,
  pub audio: AudioPlayerHandle,
}
