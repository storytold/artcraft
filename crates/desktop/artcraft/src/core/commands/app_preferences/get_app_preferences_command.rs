use crate::core::state::app_preferences::app_preferences_manager::AppPreferencesManager;
use crate::core::state::app_preferences::preferred_download_directory::PreferredDownloadDirectory;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct GetAppPreferencesResponse {
  pub preferences: AppPreferencesPayload,
}

#[derive(Serialize)]
pub struct AppPreferencesPayload {
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


#[tauri::command]
pub async fn get_app_preferences_command(
  app_prefs: State<'_, AppPreferencesManager>,
) -> Result<GetAppPreferencesResponse, String> {
  info!("get_app_preferences_command called");

  let result = get_prefs(&app_prefs)
      .await
      .map_err(|err| {
        error!("Error getting app preferences: {:?}", err);
        format!("Error getting app preferences: {:?}", err)
      })?;

  Ok(GetAppPreferencesResponse {
    preferences: result,
  })
}

async fn get_prefs(app_prefs: &AppPreferencesManager) -> AnyhowResult<AppPreferencesPayload> {
  let prefs = app_prefs.get_clone()?;
  Ok(AppPreferencesPayload {
    preferred_download_directory: prefs.preferred_download_directory,
    play_sounds: prefs.play_sounds,
    delete_file_sound: prefs.delete_file_sound,
    enqueue_success_sound: prefs.enqueue_success_sound,
    enqueue_failure_sound: prefs.enqueue_failure_sound,
    generation_success_sound: prefs.generation_success_sound,
    generation_failure_sound: prefs.generation_failure_sound,
    generation_enqueue_sound: prefs.generation_enqueue_sound,
  })
}
