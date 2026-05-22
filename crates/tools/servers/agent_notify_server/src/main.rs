//! Tiny local HTTP server that plays configured notification sounds.
//!
//! Default bind address: `127.0.0.1:43110`. Override with `HTTP_BIND_ADDRESS`.
//!
//! Audio playback runs on a dedicated OS thread (see [`audio_player`]). The
//! actix server itself is single-worker — we expect only the local agent to
//! call it. On SIGINT we tell actix to skip its grace period and we ship a
//! `Shutdown` command to the audio thread so any in-progress sound is dropped
//! immediately.

use std::env;
use std::path::PathBuf;
use std::sync::Arc;

use actix_web::middleware::Logger;
use actix_web::web::Data;
use actix_web::{App, HttpServer, web};

use crate::audio_player::spawn_audio_player;
use crate::config::{DEFAULT_CONFIG_PATH, NotifyConfig};
use crate::endpoints::alert_handlers::{
  alert_await_handler, alert_beep_handler, alert_done_handler,
};
use crate::endpoints::loop_handlers::{
  loop_await_handler, loop_beep_handler, loop_done_handler,
};
use crate::endpoints::root_handler::root_handler;
use crate::endpoints::state_handler::state_handler;
use crate::endpoints::stop_handler::stop_handler;
use crate::server_state::ServerState;

pub mod audio_player;
pub mod config;
pub mod endpoints;
pub mod server_state;

const DEFAULT_BIND_ADDRESS: &str = "127.0.0.1:43110";
const DEFAULT_RUST_LOG: &str = "info,actix_web=info";

#[actix_web::main]
async fn main() -> anyhow::Result<()> {
  if env::var_os("RUST_LOG").is_none() {
    // SAFETY: single-threaded at this point — no other thread can read env.
    unsafe { env::set_var("RUST_LOG", DEFAULT_RUST_LOG); }
  }
  env_logger::init();

  let bind_address = env::var("HTTP_BIND_ADDRESS")
    .unwrap_or_else(|_| DEFAULT_BIND_ADDRESS.to_string());

  let config_path: PathBuf = env::var("NOTIFY_CONFIG_PATH")
    .map(PathBuf::from)
    .unwrap_or_else(|_| PathBuf::from(DEFAULT_CONFIG_PATH));

  let config = Arc::new(NotifyConfig::read_from_file_or_default(&config_path));

  let (audio_handle, audio_thread) = spawn_audio_player();

  let state = ServerState {
    config: config.clone(),
    audio: audio_handle.clone(),
  };

  log::info!("agent-notify-server listening on http://{}", bind_address);

  let server = HttpServer::new(move || {
    App::new()
      .app_data(Data::new(state.clone()))
      .wrap(Logger::default())
      .route("/", web::get().to(root_handler))
      .route("/alert_beep", web::get().to(alert_beep_handler))
      .route("/alert_done", web::get().to(alert_done_handler))
      .route("/alert_await", web::get().to(alert_await_handler))
      .route("/loop_beep", web::get().to(loop_beep_handler))
      .route("/loop_done", web::get().to(loop_done_handler))
      .route("/loop_await", web::get().to(loop_await_handler))
      .route("/stop", web::get().to(stop_handler))
      .route("/state", web::get().to(state_handler))
  })
  .bind(&bind_address)?
  .workers(1)
  .shutdown_timeout(0)
  .run()
  .await?;

  log::info!("server stopped; shutting down audio engine");
  audio_handle.shutdown();
  if let Err(e) = audio_thread.join() {
    log::warn!("audio thread join failed: {:?}", e);
  }
  let _ = server;
  Ok(())
}
