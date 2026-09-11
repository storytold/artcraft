use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use anyhow::anyhow;
use errors::AnyhowResult;
use tauri::{AppHandle, Manager};

pub fn load_provider_priority_state(
  app: &AppHandle,
  root: &AppDataRoot,
) -> AnyhowResult<()> {
  let provider_priority = match ProviderPriorityStore::from_filesystem_configs(root) {
    Ok(Some(priority)) => {
      println!("Loaded provider priority from disk: {:?}", priority.get_priority());
      priority
    }
    Ok(None) => {
      println!("No provider priority found on disk, using default.");
      ProviderPriorityStore::default()
    }
    Err(err) => {
      eprintln!("Failed to read provider priority from disk: {:?}", err);
      ProviderPriorityStore::default()
    }
  };

  let success = app.manage(provider_priority);

  if !success {
    eprintln!("Failed to manage provider priority state.");
    return Err(anyhow!("Failed to manage provider priority state."));
  }

  Ok(())
}
