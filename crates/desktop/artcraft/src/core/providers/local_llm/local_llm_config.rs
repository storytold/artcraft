use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

/// Configuration for a local LLM backend (Ollama, llama.cpp, LM Studio, etc.)
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LocalLlmBackend {
  Ollama,
  LlamaCpp,
  LmStudio,
  Custom,
}

impl LocalLlmBackend {
  pub fn default_port(&self) -> u16 {
    match self {
      Self::Ollama => 11434,
      Self::LlamaCpp => 8080,
      Self::LmStudio => 1234,
      Self::Custom => 11434,
    }
  }

  pub fn default_base_url(&self) -> String {
    format!("http://localhost:{}", self.default_port())
  }
}

/// Configuration for local LLM generation
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LocalLlmConfig {
  pub backend: LocalLlmBackend,
  pub base_url: String,
  pub model: String,
  pub api_key: Option<String>,
  pub temperature: f32,
  pub max_tokens: u32,
  pub system_prompt: Option<String>,
  pub timeout_seconds: u64,
}

impl Default for LocalLlmConfig {
  fn default() -> Self {
    Self {
      backend: LocalLlmBackend::Ollama,
      base_url: LocalLlmBackend::Ollama.default_base_url(),
      model: "llama3.2".to_string(),
      api_key: None,
      temperature: 0.7,
      max_tokens: 2048,
      system_prompt: None,
      timeout_seconds: 120,
    }
  }
}

impl LocalLlmConfig {
  pub fn load_from_file(path: &Path) -> anyhow::Result<Self> {
    let contents = fs::read_to_string(path)?;
    let config: LocalLlmConfig = serde_json::from_str(&contents)?;
    Ok(config)
  }

  pub fn save_to_file(&self, path: &Path) -> anyhow::Result<()> {
    let contents = serde_json::to_string_pretty(self)?;
    if let Some(parent) = path.parent() {
      fs::create_dir_all(parent)?;
    }
    fs::write(path, contents)?;
    Ok(())
  }

  pub fn get_chat_completion_url(&self) -> String {
    match self.backend {
      LocalLlmBackend::Ollama => format!("{}/api/chat", self.base_url),
      LocalLlmBackend::LlamaCpp => format!("{}/v1/chat/completions", self.base_url),
      LocalLlmBackend::LmStudio => format!("{}/v1/chat/completions", self.base_url),
      LocalLlmBackend::Custom => format!("{}/v1/chat/completions", self.base_url),
    }
  }

  pub fn get_models_url(&self) -> String {
    match self.backend {
      LocalLlmBackend::Ollama => format!("{}/api/tags", self.base_url),
      _ => format!("{}/v1/models", self.base_url),
    }
  }
}
