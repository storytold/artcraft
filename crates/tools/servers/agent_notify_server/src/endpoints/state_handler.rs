use std::path::PathBuf;

use actix_web::{HttpResponse, Responder, web};
use serde_derive::Serialize;

use crate::audio_player::EngineStatus;
use crate::server_state::ServerState;

pub async fn state_handler(state: web::Data<ServerState>) -> impl Responder {
  let resp = StateResponse {
    audio: state.audio.status(),
    config: ConfigSummary::from_state(&state),
  };
  HttpResponse::Ok().json(resp)
}

#[derive(Serialize)]
struct StateResponse {
  audio: EngineStatus,
  config: ConfigSummary,
}

#[derive(Serialize)]
struct ConfigSummary {
  alert_beep_sound: Option<PathBuf>,
  alert_done_sound: Option<PathBuf>,
  alert_await_user_input_sound: Option<PathBuf>,
  extra_alert_beep_count: usize,
  extra_alert_done_count: usize,
  extra_alert_await_count: usize,
  gap_schedule_millis: [u64; 4],
  jitter_schedule_millis: [u64; 4],
  escalate_waits_secs: [u64; 3],
}

impl ConfigSummary {
  fn from_state(state: &ServerState) -> Self {
    let c = &state.config;
    Self {
      alert_beep_sound: c.alert_beep_sound.clone(),
      alert_done_sound: c.alert_done_sound.clone(),
      alert_await_user_input_sound: c.alert_await_user_input_sound.clone(),
      extra_alert_beep_count: c.extra_alert_beep_sounds.len(),
      extra_alert_done_count: c.extra_alert_done_sounds.len(),
      extra_alert_await_count: c.extra_alert_await_sounds.len(),
      gap_schedule_millis: c.loop_gap_schedule_millis(),
      jitter_schedule_millis: c.loop_jitter_schedule_millis(),
      escalate_waits_secs: c.escalate_waits_secs(),
    }
  }
}
