use crate::core::state::app_preferences::app_preferences::AppPreferences;
use crate::core::state::app_preferences::preferred_download_directory::PreferredDownloadDirectory;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use errors::AnyhowResult;
use serde_derive::{Deserialize, Serialize};

/// Vector clock versioning string rather than semver.
/// - Version 1 - initial version.
/// - Version 2 - added "delete_file_sound", marked optionals "skip_serializing_if"
const CURRENT_VERSION: &str = "2";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppPreferencesSerializable {
  /// Versioning string.
  pub version: String,
  
  /// The downloads directory to use when a user downloads a file.
  pub preferred_download_directory: Option<PreferredDownloadDirectory>,

  /// Play sounds on events.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub play_sounds: Option<bool>,

  /// Key pointing to file; defined in the frontend code.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub delete_file_sound: Option<String>,

  /// Key pointing to file; defined in the frontend code.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generation_success_sound: Option<String>,
  
  /// Key pointing to file; defined in the frontend code.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generation_failure_sound: Option<String>,
  
  /// Key pointing to file; defined in the frontend code.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generation_enqueue_sound: Option<String>,
}

impl AppPreferencesSerializable {
  pub fn load_from_file(app_data_root: &AppDataRoot) -> AnyhowResult<Option<Self>> {
    let filename = app_data_root.settings_dir().get_app_preferences_path();
    if !filename.exists() {
      return Ok(None);
    }

    let contents = std::fs::read_to_string(filename)?;
    let data: Self = serde_json::from_str(&contents)?;
    Ok(Some(data))
  }

  pub fn from_preferences(preferences: &AppPreferences) -> Self {
    Self {
      version: CURRENT_VERSION.to_string(),
      preferred_download_directory: Some(preferences.preferred_download_directory.clone()),
      play_sounds: Some(preferences.play_sounds),
      delete_file_sound: preferences.delete_file_sound.clone(),
      generation_success_sound: preferences.generation_success_sound.clone(),
      generation_failure_sound: preferences.generation_failure_sound.clone(),
      generation_enqueue_sound: preferences.generation_enqueue_sound.clone(),
    }
  }

  pub fn to_preferences(&self) -> AppPreferences {
    let mut preferences = AppPreferences::default();

    if let Some(preferred_download_directory) = &self.preferred_download_directory {
      preferences.preferred_download_directory = preferred_download_directory.clone();
    }

    if let Some(play_sounds) = self.play_sounds {
      preferences.play_sounds = play_sounds;
    }

    preferences.delete_file_sound = self.delete_file_sound.clone();
    preferences.generation_success_sound = self.generation_success_sound.clone();
    preferences.generation_failure_sound = self.generation_failure_sound.clone();
    preferences.generation_enqueue_sound = self.generation_enqueue_sound.clone();

    preferences
  }
}
