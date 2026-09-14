use crate::core::state::app_preferences::app_preferences_manager::AppPreferencesManager;
use crate::core::state::app_preferences::preferred_download_directory::PreferredDownloadDirectory;
use crate::core::state::app_preferences::preferred_download_filename::PreferredDownloadFilename;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use anyhow::anyhow;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::{Deserialize, Serialize};
use tauri::State;

/// For now, we'll only update a single preference at a time.
#[derive(Deserialize)]
pub struct UpdateAppPreferencesRequest {
  pub preference: PreferenceName,
  /// We'll decode this with respect to the preference value.
  pub value: Option<ValueType>,
}

#[derive(Deserialize, Debug)]
#[serde(untagged)]
pub enum ValueType {
  Bool(bool),
  String(String),
  DownloadDirectory(PreferredDownloadDirectory),
  DownloadFilename(PreferredDownloadFilename),
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PreferenceName {
  PreferredDownloadDirectory,
  PreferredDownloadFilename,
  AutoDownload,
  PlaySounds,
  DeleteFileSound,
  EnqueueSuccessSound,
  EnqueueFailureSound,
  GenerationSuccessSound,
  GenerationFailureSound,
}

#[derive(Serialize)]
pub struct UpdateAppPreferencesResponse {
  pub success: bool,
}

#[tauri::command]
pub async fn update_app_preferences_command(
  request: UpdateAppPreferencesRequest,
  app_prefs: State<'_, AppPreferencesManager>,
  app_data_root: State<'_, AppDataRoot>,
) -> Result<UpdateAppPreferencesResponse, String> {
  info!("update_app_preferences_command called");

  update_prefs(request, &app_prefs, &app_data_root)
      .await
      .map_err(|err| {
        error!("Error getting app preferences: {:?}", err);
        format!("Error getting app preferences: {:?}", err)
      })?;

  Ok(UpdateAppPreferencesResponse {
    success: true,
  })
}

async fn update_prefs(
  request: UpdateAppPreferencesRequest, 
  app_prefs: &AppPreferencesManager,
  app_data_root: &AppDataRoot,
) -> AnyhowResult<()> {
  let mut prefs = app_prefs.get_clone()?;
  
  info!("Value is: {:?}", request.value);
  
  match request.preference {
    PreferenceName::AutoDownload => {
      match request.value {
        Some(ValueType::Bool(value)) => prefs.auto_download = value,
        _ => return Err(anyhow!("Auto Download must be a boolean")),
      }
    }
    PreferenceName::PreferredDownloadFilename => {
      prefs.preferred_download_filename = filename_value(request.value)?;
    }
    PreferenceName::PreferredDownloadDirectory => {
      match request.value {
        Some(ValueType::DownloadDirectory(dir)) => 
          prefs.preferred_download_directory = dir,
        _ =>
          return Err(anyhow!("Invalid value: {:?}", request.value)),
      }
    }
    PreferenceName::PlaySounds => {
      match request.value {
        Some(ValueType::Bool(val)) => 
          prefs.play_sounds = val,
        _ => 
          return Err(anyhow!("Invalid value: {:?}", request.value)),
      }
    }
    PreferenceName::DeleteFileSound => {
      prefs.delete_file_sound = request.value
          .map(|val| string_value(&val))
          .transpose()?;
    }
    PreferenceName::EnqueueSuccessSound => {
      prefs.enqueue_success_sound = request.value
          .map(|val| string_value(&val))
          .transpose()?;
    }
    PreferenceName::EnqueueFailureSound => {
      prefs.enqueue_failure_sound = request.value
          .map(|val| string_value(&val))
          .transpose()?;
    }
    PreferenceName::GenerationSuccessSound => {
      prefs.generation_success_sound = request.value
          .map(|val| string_value(&val))
          .transpose()?;
    }
    PreferenceName::GenerationFailureSound => {
      prefs.generation_failure_sound = request.value
          .map(|val| string_value(&val))
          .transpose()?;
    }
  }
  
  app_data_root.settings_dir().write_app_preferences(&prefs)?;
  app_prefs.set_clone(&prefs)?;
  
  Ok(())
}

fn string_value(value: &ValueType) -> AnyhowResult<String> {
  match value {
    ValueType::String(val) => Ok(val.to_string()),
    _ => Err(anyhow!("Invalid value type: {:?}", value)),
  }
}

fn filename_value(value: Option<ValueType>) -> AnyhowResult<PreferredDownloadFilename> {
  // The untagged value enum decodes string variants as String first.
  let filename = match value {
    Some(ValueType::String(value)) if value == "artcraft_convention" => PreferredDownloadFilename::ArtcraftConvention,
    Some(ValueType::DownloadFilename(filename)) => filename,
    _ => return Err(anyhow!("Invalid download filename preference")),
  };
  if let PreferredDownloadFilename::Custom(format) = &filename {
    PreferredDownloadFilename::validate_custom_format(format).map_err(|err| anyhow!(err))?;
  }
  Ok(filename)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::state::app_preferences::app_preferences::AppPreferences;

  #[tokio::test]
  async fn download_preferences_accept_wire_values_and_survive_reloading() {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    let manager = AppPreferencesManager::with_owned(AppPreferences::default());
    for request in [
      serde_json::json!({ "preference": "preferred_download_directory", "value": {"custom": "/existing/downloads"} }),
      serde_json::json!({ "preference": "auto_download", "value": true }),
      serde_json::json!({ "preference": "preferred_download_filename", "value": {"custom_format": "my_{model}_{date}"} }),
    ] {
      update_prefs(serde_json::from_value(request).unwrap(), &manager, &root).await.unwrap();
    }
    let prefs = AppPreferences::load_from_file_or_default(&root);
    assert!(prefs.auto_download);
    assert_eq!(prefs.preferred_download_directory, PreferredDownloadDirectory::Custom("/existing/downloads".into()));
    assert_eq!(prefs.preferred_download_filename, PreferredDownloadFilename::Custom("my_{model}_{date}".into()));

    let invalid = serde_json::json!({ "preference": "preferred_download_filename", "value": {"custom_format": "../escape"} });
    assert!(update_prefs(serde_json::from_value(invalid).unwrap(), &manager, &root).await.is_err());
    assert_eq!(AppPreferences::load_from_file_or_default(&root).preferred_download_filename, prefs.preferred_download_filename);
    let reset = serde_json::json!({ "preference": "preferred_download_filename", "value": "artcraft_convention" });
    update_prefs(serde_json::from_value(reset).unwrap(), &manager, &root).await.unwrap();
    assert_eq!(AppPreferences::load_from_file_or_default(&root).preferred_download_filename, PreferredDownloadFilename::ArtcraftConvention);
    assert!(manager.get_clone().unwrap().auto_download);
  }
}
