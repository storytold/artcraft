use std::fs::File;
use std::io::BufReader;
use std::path::{Path, PathBuf};

use serde_derive::{Deserialize, Serialize};

/// Default config location, resolved at compile time relative to the crate
/// root so `cargo run` works regardless of CWD.
pub const DEFAULT_CONFIG_PATH: &str =
  concat!(env!("CARGO_MANIFEST_DIR"), "/config/notify_config.yaml");

pub const DEFAULT_ESCALATE_WAIT_1_SECS: u64 = 15;
pub const DEFAULT_ESCALATE_WAIT_2_SECS: u64 = 30;
pub const DEFAULT_ESCALATE_WAIT_3_SECS: u64 = 45;

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct NotifyConfig {
  pub alert_beep_sound: Option<PathBuf>,
  pub alert_done_sound: Option<PathBuf>,
  pub alert_await_user_input_sound: Option<PathBuf>,

  #[serde(default)]
  pub extra_alert_beep_sounds: Vec<PathBuf>,
  #[serde(default)]
  pub extra_alert_done_sounds: Vec<PathBuf>,
  #[serde(default)]
  pub extra_alert_await_sounds: Vec<PathBuf>,

  pub loop_alert_timeout_millis: Option<u64>,
  /// Gap (millis) between plays once the loop has been running for
  /// `escalate_wait_1` seconds. Falls back to the previous stage.
  pub loop_alert_timeout_millis_1: Option<u64>,
  /// Gap (millis) after `escalate_wait_2`. Falls back to stage 1.
  pub loop_alert_timeout_millis_2: Option<u64>,
  /// Gap (millis) after `escalate_wait_3`. Falls back to stage 2.
  pub loop_alert_timeout_millis_3: Option<u64>,

  /// Maximum +/- random jitter (millis) applied to each sleep at stage 0.
  /// Each sleep becomes `timeout +/- rand(0..=jitter)`, clamped at 0.
  pub loop_alert_jitter_millis: Option<u64>,
  /// Jitter at stage 1. Falls back to the previous stage.
  pub loop_alert_jitter_millis_1: Option<u64>,
  /// Jitter at stage 2. Falls back to stage 1.
  pub loop_alert_jitter_millis_2: Option<u64>,
  /// Jitter at stage 3. Falls back to stage 2.
  pub loop_alert_jitter_millis_3: Option<u64>,

  /// Seconds after a loop starts before a second concurrent voice is added.
  pub escalate_wait_1: Option<u64>,
  /// Seconds before a third concurrent voice is added.
  pub escalate_wait_2: Option<u64>,
  /// Seconds before a fourth concurrent voice is added.
  pub escalate_wait_3: Option<u64>,
}

impl NotifyConfig {
  pub fn read_from_file<P: AsRef<Path>>(path: P) -> anyhow::Result<Self> {
    let path = path.as_ref();
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let mut config: NotifyConfig = serde_yaml::from_reader(reader)?;
    if let Some(base) = path.parent() {
      config.resolve_relative_paths(base);
    }
    Ok(config)
  }

  pub fn read_from_file_or_default<P: AsRef<Path>>(path: P) -> Self {
    match Self::read_from_file(&path) {
      Ok(c) => {
        log::info!("loaded notify config from {}", path.as_ref().display());
        c
      }
      Err(e) => {
        log::warn!(
          "failed to load notify config from {}: {} — falling back to empty config",
          path.as_ref().display(),
          e
        );
        Self::default()
      }
    }
  }

  pub fn escalate_waits_secs(&self) -> [u64; 3] {
    [
      self.escalate_wait_1.unwrap_or(DEFAULT_ESCALATE_WAIT_1_SECS),
      self.escalate_wait_2.unwrap_or(DEFAULT_ESCALATE_WAIT_2_SECS),
      self.escalate_wait_3.unwrap_or(DEFAULT_ESCALATE_WAIT_3_SECS),
    ]
  }

  /// Per-stage gap (millis) between plays of a single voice. Each entry
  /// falls back to the previous stage when unset, so a config that only
  /// specifies `loop_alert_timeout_millis_1: 200` will use that 200ms gap
  /// for stages 2 and 3 too.
  pub fn loop_gap_schedule_millis(&self) -> [u64; 4] {
    let g0 = self.loop_alert_timeout_millis.unwrap_or(0);
    let g1 = self.loop_alert_timeout_millis_1.unwrap_or(g0);
    let g2 = self.loop_alert_timeout_millis_2.unwrap_or(g1);
    let g3 = self.loop_alert_timeout_millis_3.unwrap_or(g2);
    [g0, g1, g2, g3]
  }

  /// Per-stage jitter (millis). Same fallback semantics as the gap schedule.
  pub fn loop_jitter_schedule_millis(&self) -> [u64; 4] {
    let j0 = self.loop_alert_jitter_millis.unwrap_or(0);
    let j1 = self.loop_alert_jitter_millis_1.unwrap_or(j0);
    let j2 = self.loop_alert_jitter_millis_2.unwrap_or(j1);
    let j3 = self.loop_alert_jitter_millis_3.unwrap_or(j2);
    [j0, j1, j2, j3]
  }

  fn resolve_relative_paths(&mut self, base: &Path) {
    resolve_opt(&mut self.alert_beep_sound, base);
    resolve_opt(&mut self.alert_done_sound, base);
    resolve_opt(&mut self.alert_await_user_input_sound, base);
    resolve_vec(&mut self.extra_alert_beep_sounds, base);
    resolve_vec(&mut self.extra_alert_done_sounds, base);
    resolve_vec(&mut self.extra_alert_await_sounds, base);
  }
}

fn resolve_opt(slot: &mut Option<PathBuf>, base: &Path) {
  if let Some(p) = slot.as_ref() {
    if p.is_relative() {
      *slot = Some(base.join(p));
    }
  }
}

fn resolve_vec(slot: &mut Vec<PathBuf>, base: &Path) {
  for p in slot.iter_mut() {
    if p.is_relative() {
      *p = base.join(&*p);
    }
  }
}
