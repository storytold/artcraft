use log::{error, info, warn};
use serde_json::{json, Value};

use crate::core::commands::enqueue::generate_error::{GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::providers::local_llm::local_llm_config::{LocalLlmConfig, LocalLlmBackend};
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use uuid_utils::uuid::generate_random_uuid;

/// Get the path to the local LLM config file
fn get_config_path(app_data_root: &AppDataRoot) -> std::path::PathBuf {
  app_data_root.credentials_dir().path().join("local_llm.config.json")
}

/// Load the local LLM config from disk
fn load_config(app_data_root: &AppDataRoot) -> Result<LocalLlmConfig, GenerateError> {
  let path = get_config_path(app_data_root);
  if !path.exists() {
    return Err(GenerateError::MissingCredentials(
      MissingCredentialsReason::NeedsLocalLlmConfig,
    ));
  }
  LocalLlmConfig::load_from_file(&path)
    .map_err(|e| GenerateError::AnyhowError(anyhow::anyhow!("Failed to load local LLM config: {:?}", e)))
}

/// Check if the local LLM backend is reachable
async fn check_backend_health(config: &LocalLlmConfig) -> Result<(), GenerateError> {
  let client = reqwest::Client::new();
  let url = config.get_models_url();

  let result = tokio::time::timeout(
    std::time::Duration::from_secs(5),
    client.get(&url).send(),
  )
  .await;

  match result {
    Ok(Ok(response)) => {
      if response.status().is_success() {
        Ok(())
      } else {
        Err(GenerateError::AnyhowError(anyhow::anyhow!(
          "Local LLM backend returned status: {}",
          response.status()
        )))
      }
    }
    Ok(Err(e)) => Err(GenerateError::AnyhowError(anyhow::anyhow!(
      "Failed to connect to local LLM backend at {}: {}",
      config.base_url,
      e
    ))),
    Err(_) => Err(GenerateError::AnyhowError(anyhow::anyhow!(
      "Timeout connecting to local LLM backend at {}",
      config.base_url
    ))),
  }
}

/// Send a chat completion request to the local LLM backend
async fn send_chat_request(
  config: &LocalLlmConfig,
  prompt: &str,
) -> Result<String, GenerateError> {
  let client = reqwest::Client::new();
  let url = config.get_chat_completion_url();

  let mut request_body = json!({
    "model": config.model,
    "messages": build_messages(config, prompt),
    "temperature": config.temperature,
    "max_tokens": config.max_tokens,
    "stream": false,
  });

  // Ollama uses "num_predict" instead of "max_tokens"
  if matches!(config.backend, LocalLlmBackend::Ollama) {
    request_body["max_tokens"] = json!(null);
    request_body["num_predict"] = json!(config.max_tokens);
    request_body["stream"] = json!(false);
  }

  let mut request = client
    .post(&url)
    .json(&request_body)
    .timeout(std::time::Duration::from_secs(config.timeout_seconds));

  if let Some(api_key) = &config.api_key {
    request = request.header("Authorization", format!("Bearer {}", api_key));
  }

  let response = request
    .send()
    .await
    .map_err(|e| GenerateError::AnyhowError(anyhow::anyhow!(
      "Failed to send request to local LLM: {}",
      e
    )))?;

  if !response.status().is_success() {
    let status = response.status();
    let body = response.text().await.unwrap_or_default();
    return Err(GenerateError::AnyhowError(anyhow::anyhow!(
      "Local LLM backend returned error {}: {}",
      status,
      body
    )));
  }

  let response_json: Value = response
    .json()
    .await
    .map_err(|e| GenerateError::AnyhowError(anyhow::anyhow!(
      "Failed to parse local LLM response: {}",
      e
    )))?;

  // Extract the response text based on backend type
  let response_text = match config.backend {
    LocalLlmBackend::Ollama => {
      response_json
        .get("message")
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .map(|s| s.to_string())
    }
    _ => {
      // OpenAI-compatible format
      response_json
        .get("choices")
        .and_then(|c| c.as_array())
        .and_then(|arr| arr.first())
        .and_then(|choice| choice.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .map(|s| s.to_string())
    }
  };

  response_text.ok_or_else(|| {
    GenerateError::AnyhowError(anyhow::anyhow!(
      "Local LLM response did not contain expected content field"
    ))
  })
}

/// Build the messages array for the chat completion request
fn build_messages(config: &LocalLlmConfig, prompt: &str) -> Vec<Value> {
  let mut messages = Vec::new();

  if let Some(system_prompt) = &config.system_prompt {
    messages.push(json!({
      "role": "system",
      "content": system_prompt,
    }));
  }

  messages.push(json!({
    "role": "user",
    "content": prompt,
  }));

  messages
}

/// Handle a local LLM generation request
pub async fn handle_local_llm(
  request: &TauriGenerateImageRequest,
  app_env_configs: &AppEnvConfigs,
  credential_cache: &ProviderCredentialLoadingCache,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  info!("handle_local_llm called");

  // Load the local LLM config
  let config = load_config(&app_env_configs.app_data_root)?;

  // Check backend health
  check_backend_health(&config).await?;

  // Extract the prompt from the request
  let prompt = request.prompt.clone().unwrap_or_default();
  if prompt.is_empty() {
    return Err(GenerateError::BadInput(
      crate::core::commands::enqueue::generate_error::BadInputReason::NoModelSpecified,
    ));
  }

  // Send the request to the local LLM
  let response_text = send_chat_request(&config, &prompt).await?;

  info!("Local LLM response received, length: {}", response_text.len());

  // Create a task success result
  let job_token = generate_random_uuid();
  let success = TaskEnqueueSuccess {
    task_type: crate::core::commands::enqueue::task_enqueue_success::TaskType::ImageGeneration,
    model: Some(crate::core::events::generation_events::common::GenerationModel::Unknown(
      config.model.clone(),
    )),
    provider: GenerationProvider::LocalLlm,
    provider_job_id: Some(job_token),
    maybe_queue_status_url: None,
    maybe_queue_response_url: None,
    maybe_prompt_token: None,
  };

  Ok(success)
}

/// Save a local LLM config to disk
pub fn save_config(
  app_data_root: &AppDataRoot,
  config: &LocalLlmConfig,
) -> Result<(), GenerateError> {
  let path = get_config_path(app_data_root);
  config
    .save_to_file(&path)
    .map_err(|e| GenerateError::AnyhowError(anyhow::anyhow!("Failed to save local LLM config: {:?}", e)))
}

/// Get the current local LLM config (or default if none exists)
pub fn get_config_or_default(app_data_root: &AppDataRoot) -> LocalLlmConfig {
  let path = get_config_path(app_data_root);
  if path.exists() {
    LocalLlmConfig::load_from_file(&path).unwrap_or_default()
  } else {
    LocalLlmConfig::default()
  }
}

/// List available models from the local LLM backend
pub async fn list_models(config: &LocalLlmConfig) -> Result<Vec<String>, GenerateError> {
  let client = reqwest::Client::new();
  let url = config.get_models_url();

  let response = client
    .get(&url)
    .timeout(std::time::Duration::from_secs(10))
    .send()
    .await
    .map_err(|e| GenerateError::AnyhowError(anyhow::anyhow!(
      "Failed to list models from local LLM: {}",
      e
    )))?;

  if !response.status().is_success() {
    return Err(GenerateError::AnyhowError(anyhow::anyhow!(
      "Failed to list models: status {}",
      response.status()
    )));
  }

  let response_json: Value = response
    .json()
    .await
    .map_err(|e| GenerateError::AnyhowError(anyhow::anyhow!(
      "Failed to parse models response: {}",
      e
    )))?;

  let models = match config.backend {
    LocalLlmBackend::Ollama => {
      response_json
        .get("models")
        .and_then(|m| m.as_array())
        .map(|arr| {
          arr.iter()
            .filter_map(|m| m.get("name").and_then(|n| n.as_str()).map(|s| s.to_string()))
            .collect()
        })
        .unwrap_or_default()
    }
    _ => {
      response_json
        .get("data")
        .and_then(|d| d.as_array())
        .map(|arr| {
          arr.iter()
            .filter_map(|m| m.get("id").and_then(|i| i.as_str()).map(|s| s.to_string()))
            .collect()
        })
        .unwrap_or_default()
    }
  };

  Ok(models)
}
