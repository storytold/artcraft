use crate::core::state::app_preferences::app_preferences::AppPreferences;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use errors::AnyhowResult;
use serde::Serialize;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::{Path, PathBuf};

/// For now, let's just keep a collection of loose json files in a settings dir.
/// Once we know the structure and schema, we can standardize on a single json file.
#[derive(Clone)]
pub struct AppSettingsDir {
  path: PathBuf,
}

impl DataSubdir for AppSettingsDir {
  const DIRECTORY_NAME: &'static str = "settings";

  fn new_from<P: AsRef<Path>> (dir: P) -> Self {
    Self {
      path: dir.as_ref().to_path_buf(),
    }
  }

  fn path(&self) -> &Path {
    &self.path
  }
}

impl AppSettingsDir {
  pub fn get_app_preferences_path(&self) -> PathBuf {
    self.path.join("app_preferences.json")
  }

  pub fn get_app_env_configs_path(&self) -> PathBuf {
    self.path.join("env_configs.json")
  }

  pub fn get_provider_preferences_path(&self) -> PathBuf {
    self.path.join("provider_preferences.json")
  }

  pub fn write_app_preferences(&self, prefs: &AppPreferences) -> AnyhowResult<()> {
    let serializable = prefs.to_serializable();

    let formatter = serde_json::ser::PrettyFormatter::with_indent(b"  ");
    let mut buf = Vec::new();
    let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
    serializable.serialize(&mut ser)?;

    let filename = self.get_app_preferences_path();

    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(filename)?;

    file.write_all(&buf)?;
    file.flush()?;
    
    Ok(())
  }
}
