use std::path::PathBuf;

use actix_web::{HttpResponse, Responder, web};

use crate::audio_player::LoopSpec;
use crate::server_state::ServerState;

pub async fn loop_beep_handler(state: web::Data<ServerState>) -> impl Responder {
  play_loop_or_404(
    &state,
    "beep",
    state.config.alert_beep_sound.clone(),
    state.config.extra_alert_beep_sounds.clone(),
    "alert_beep_sound",
  )
}

pub async fn loop_done_handler(state: web::Data<ServerState>) -> impl Responder {
  play_loop_or_404(
    &state,
    "done",
    state.config.alert_done_sound.clone(),
    state.config.extra_alert_done_sounds.clone(),
    "alert_done_sound",
  )
}

pub async fn loop_await_handler(state: web::Data<ServerState>) -> impl Responder {
  play_loop_or_404(
    &state,
    "await",
    state.config.alert_await_user_input_sound.clone(),
    state.config.extra_alert_await_sounds.clone(),
    "alert_await_user_input_sound",
  )
}

fn play_loop_or_404(
  state: &ServerState,
  name: &str,
  primary: Option<PathBuf>,
  extras: Vec<PathBuf>,
  config_key: &str,
) -> HttpResponse {
  let Some(primary) = primary else {
    return HttpResponse::NotFound().body(format!("{} not configured\n", config_key));
  };

  let mut pool = Vec::with_capacity(1 + extras.len());
  pool.push(primary);
  pool.extend(extras);

  let spec = LoopSpec {
    name: name.to_string(),
    pool,
    gap_millis_schedule: state.config.loop_gap_schedule_millis(),
    jitter_millis_schedule: state.config.loop_jitter_schedule_millis(),
    escalate_waits_secs: state.config.escalate_waits_secs(),
  };
  state.audio.play_loop(spec);
  HttpResponse::Ok().body("ok\n")
}
