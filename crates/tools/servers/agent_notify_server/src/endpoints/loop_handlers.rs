use std::path::PathBuf;

use actix_web::{HttpResponse, Responder, web};

use crate::server_state::ServerState;

pub async fn loop_beep_handler(state: web::Data<ServerState>) -> impl Responder {
  play_loop_or_404(&state, state.config.alert_beep_sound.clone(), "alert_beep_sound")
}

pub async fn loop_done_handler(state: web::Data<ServerState>) -> impl Responder {
  play_loop_or_404(&state, state.config.alert_done_sound.clone(), "alert_done_sound")
}

pub async fn loop_await_handler(state: web::Data<ServerState>) -> impl Responder {
  play_loop_or_404(
    &state,
    state.config.alert_await_user_input_sound.clone(),
    "alert_await_user_input_sound",
  )
}

fn play_loop_or_404(
  state: &ServerState,
  maybe_path: Option<PathBuf>,
  config_key: &str,
) -> HttpResponse {
  match maybe_path {
    Some(path) => {
      let gap_millis = state.config.loop_alert_timeout_millis.unwrap_or(0);
      state.audio.play_loop(path, gap_millis);
      HttpResponse::Ok().body("ok\n")
    }
    None => HttpResponse::NotFound().body(format!("{} not configured\n", config_key)),
  }
}
