use crate::core::state::app_preferences::app_preferences_serializable::AppPreferencesSerializable;
use crate::core::state::app_preferences::preferred_download_directory::{PreferredDownloadDirectory, SystemDownloadDirectory};
use crate::core::state::data_dir::app_data_root::AppDataRoot;

#[derive(Clone)]
pub struct AppPreferences {
  /// The downloads directory to use when a user downloads a file.
  pub preferred_download_directory: PreferredDownloadDirectory,

  /// Play sounds on events.
  pub play_sounds: bool,

  /// Key pointing to file; defined in the frontend code.
  pub delete_file_sound: Option<String>,

  /// Key pointing to file; defined in the frontend code.
  /// Defined for enqueue since image enqueue can be async
  pub enqueue_success_sound: Option<String>,

  /// Key pointing to file; defined in the frontend code.
  /// Defined for enqueue since image enqueue can be async
  pub enqueue_failure_sound: Option<String>,
  
  /// Key pointing to file; defined in the frontend code.
  pub generation_success_sound: Option<String>,
  
  /// Key pointing to file; defined in the frontend code.
  pub generation_failure_sound: Option<String>,
  
  /// Key pointing to file; defined in the frontend code.
  #[deprecated]
  pub generation_enqueue_sound: Option<String>,
}

impl Default for AppPreferences {
  fn default() -> Self {
    Self {
      preferred_download_directory: PreferredDownloadDirectory::System(SystemDownloadDirectory::Downloads),
      play_sounds: true,
      // NB: These are defined in the frontend.
      enqueue_success_sound: Some("done".to_string()),
      enqueue_failure_sound: Some("spike_throw".to_string()),
      generation_success_sound: Some("special_flower".to_string()),
      generation_failure_sound: Some("crumble".to_string()),
      generation_enqueue_sound: Some("done".to_string()),
      delete_file_sound: Some("trash".to_string()),
    }
  }
}

impl AppPreferences {
  pub fn load_from_file_or_default(data_root: &AppDataRoot) -> Self {
    let filename = data_root.settings_dir().get_app_preferences_path();
    if !filename.exists() {
      return Self::default();
    }

    match AppPreferencesSerializable::load_from_file(data_root) {
      Ok(Some(serializable)) => {
        serializable.to_preferences()
      }
      Ok(None) => {
        Self::default()
      }
      Err(err) => {
        println!("Error loading app preferences: {}", err);
        Self::default()
      }
    }
  }
  
  pub fn to_serializable(&self) -> AppPreferencesSerializable {
    AppPreferencesSerializable::from_preferences(self)
  }
}
