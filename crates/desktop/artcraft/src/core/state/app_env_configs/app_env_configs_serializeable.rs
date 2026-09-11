use crate::core::state::data_dir::app_data_root::AppDataRoot;
use errors::AnyhowResult;
use serde_derive::{Deserialize, Serialize};

const CURRENT_VERSION: &str = "1";

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StorytellerApiHost {
  Production,
  Localhost,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct AppEnvConfigsSerializable {
  /// Versioning string.
  pub version: Option<String>,
  pub storyteller_port: Option<u32>,
  pub storyteller_host: Option<StorytellerApiHost>,
}

impl AppEnvConfigsSerializable {
  pub fn load_from_filesystem(app_data_root: &AppDataRoot) -> AnyhowResult<Option<Self>> {
    let filename = app_data_root.settings_dir().get_app_env_configs_path();
    if !filename.exists() {
      return Ok(None);
    }

    let contents = std::fs::read_to_string(filename)?;
    let data: Self = serde_json::from_str(&contents)?;
    Ok(Some(data))
  }
}
