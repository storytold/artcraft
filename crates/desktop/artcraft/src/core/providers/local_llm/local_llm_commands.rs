use crate::core::providers::local_llm::local_llm_config::LocalLlmConfig;
use crate::core::providers::local_llm::local_llm_handler::{get_config_or_default, list_models, save_config};
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use log::info;
use tauri::State;

/// Save the local LLM configuration to disk
#[tauri::command]
pub async fn save_local_llm_config_command(
  config: LocalLlmConfig,
  app_env_configs: State<'_, AppEnvConfigs>,
) -> Result<(), String> {
  info!("save_local_llm_config_command called");
  save_config(&app_env_configs.app_data_root, &config)
    .map_err(|e| format!("Failed to save local LLM config: {:?}", e))
}

/// Get the current local LLM configuration (or default if none exists)
#[tauri::command]
pub async fn get_local_llm_config_command(
  app_env_configs: State<'_, AppEnvConfigs>,
) -> Result<LocalLlmConfig, String> {
  info!("get_local_llm_config_command called");
  Ok(get_config_or_default(&app_env_configs.app_data_root))
}

/// Test the connection to the local LLM backend and return available models
#[tauri::command]
pub async fn test_local_llm_connection_command(
  app_env_configs: State<'_, AppEnvConfigs>,
) -> Result<Vec<String>, String> {
  info!("test_local_llm_connection_command called");
  let config = get_config_or_default(&app_env_configs.app_data_root);
  list_models(&config).await.map_err(|e| format!("{:?}", e))
}

/// Check if the local LLM backend is reachable
#[tauri::command]
pub async fn check_local_llm_health_command(
  app_env_configs: State<'_, AppEnvConfigs>,
) -> Result<bool, String> {
  let config = get_config_or_default(&app_env_configs.app_data_root);
  match list_models(&config).await {
    Ok(_) => Ok(true),
    Err(_) => Ok(false),
  }
}
