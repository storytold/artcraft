use crate::core::state::app_preferences::app_preferences::AppPreferences;
use crate::core::state::app_preferences::preferred_download_directory::PreferredDownloadDirectory;
use crate::core::state::app_preferences::preferred_download_filename::PreferredDownloadFilename;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use errors::AnyhowResult;
use serde_derive::{Deserialize, Serialize};

/// Vector clock versioning string rather than semver.
/// - Version 1 - initial version.
/// - Version 2 - added "delete_file_sound", marked optionals "skip_serializing_if"
/// - Version 3 - added auto download and filename convention.
const CURRENT_VERSION: &str = "3";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppPreferencesSerializable {
  /// Versioning string.
  pub version: String,
  
  /// The downloads directory to use when a user downloads a file.
  pub preferred_download_directory: Option<PreferredDownloadDirectory>,

  #[serde(rename = "preferred_download_filename", skip_serializing_if = "Option::is_none")]
  pub maybe_preferred_download_filename: Option<PreferredDownloadFilename>,

  #[serde(rename = "auto_download", skip_serializing_if = "Option::is_none")]
  pub maybe_auto_download: Option<bool>,

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
      maybe_preferred_download_filename: Some(preferences.preferred_download_filename.clone()),
      maybe_auto_download: Some(preferences.auto_download),
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

    if let Some(filename) = &self.maybe_preferred_download_filename {
      preferences.preferred_download_filename = filename.clone();
    }
    if let Some(auto_download) = self.maybe_auto_download {
      preferences.auto_download = auto_download;
    }

    preferences.delete_file_sound = self.delete_file_sound.clone();
    preferences.generation_success_sound = self.generation_success_sound.clone();
    preferences.generation_failure_sound = self.generation_failure_sound.clone();
    preferences.generation_enqueue_sound = self.generation_enqueue_sound.clone();

    preferences
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn old_preferences_keep_the_directory_and_default_auto_download_off() {
    let old: AppPreferencesSerializable = serde_json::from_value(serde_json::json!({
      "version": "2", "preferred_download_directory": { "custom": "/my/downloads" },
      "play_sounds": false, "generation_success_sound": "special_flower",
    })).unwrap();
    let prefs = old.to_preferences();
    assert!(!prefs.auto_download);
    assert_eq!(prefs.preferred_download_filename, PreferredDownloadFilename::ArtcraftConvention);
    assert_eq!(prefs.preferred_download_directory, PreferredDownloadDirectory::Custom("/my/downloads".into()));
    assert!(!prefs.play_sounds);
    assert_eq!(prefs.generation_success_sound.as_deref(), Some("special_flower"));
  }

  #[test]
  fn download_preferences_round_trip_without_changing_existing_fields() {
    let prefs = AppPreferences {
      auto_download: true,
      preferred_download_filename: PreferredDownloadFilename::Custom("{model}_{date}".into()),
      preferred_download_directory: PreferredDownloadDirectory::Custom("/my/downloads".into()),
      ..AppPreferences::default()
    };
    let json = serde_json::to_value(prefs.to_serializable()).unwrap();
    assert_eq!(json["auto_download"], true);
    assert_eq!(json["preferred_download_filename"]["custom_format"], "{model}_{date}");
    let restored = serde_json::from_value::<AppPreferencesSerializable>(json).unwrap().to_preferences();
    assert!(restored.auto_download);
    assert_eq!(restored.preferred_download_filename, prefs.preferred_download_filename);
    assert_eq!(restored.preferred_download_directory, prefs.preferred_download_directory);
    assert_eq!(restored.generation_success_sound, prefs.generation_success_sound);
  }
}
