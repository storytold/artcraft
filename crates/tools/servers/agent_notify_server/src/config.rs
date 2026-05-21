use std::fs::File;
use std::io::BufReader;
use std::path::{Path, PathBuf};

use serde_derive::{Deserialize, Serialize};

pub const DEFAULT_CONFIG_PATH: &str = "config/notify_config.yaml";

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct NotifyConfig {
  pub alert_beep_sound: Option<PathBuf>,
  pub alert_done_sound: Option<PathBuf>,
  pub alert_await_user_input_sound: Option<PathBuf>,
  pub loop_alert_timeout_millis: Option<u64>,
}

impl NotifyConfig {
  pub fn read_from_file<P: AsRef<Path>>(path: P) -> anyhow::Result<Self> {
    let file = File::open(&path)?;
    let reader = BufReader::new(file);
    let config: NotifyConfig = serde_yaml::from_reader(reader)?;
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
}
