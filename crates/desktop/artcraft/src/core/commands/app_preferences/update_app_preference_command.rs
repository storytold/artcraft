use crate::core::state::app_preferences::app_preferences_manager::AppPreferencesManager;
use crate::core::state::app_preferences::preferred_download_directory::PreferredDownloadDirectory;
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
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PreferenceName {
  PreferredDownloadDirectory,
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
  
  app_prefs.set_clone(&prefs)?;
  app_data_root.settings_dir().write_app_preferences(&prefs)?;
  
  Ok(())
}

fn string_value(value: &ValueType) -> AnyhowResult<String> {
  match value {
    ValueType::String(val) => Ok(val.to_string()),
    _ => Err(anyhow!("Invalid value type: {:?}", value)),
  }
}
