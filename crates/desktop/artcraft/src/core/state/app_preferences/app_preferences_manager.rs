use crate::core::state::app_preferences::app_preferences::AppPreferences;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use memory_store::clone_cell::CloneCell;

pub type AppPreferencesManager = CloneCell<AppPreferences>;

pub fn load_app_preferences_or_default(data_root: &AppDataRoot) -> AppPreferencesManager {
  let prefs = AppPreferences::load_from_file_or_default(data_root);
  AppPreferencesManager::with_owned(prefs)
}
