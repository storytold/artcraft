use crate::creds::ark_api_key::ArkApiKey;
use crate::error::ark_error::ArkError;
use crate::requests::ark_host::ARK_AP_SOUTHEAST_BASE_URL;
use crate::requests::http::send_json;
use reqwest::Method;
use serde_derive::{Deserialize, Serialize};
use std::time::Duration;

/// Long system prompts (prompt-writing guides) take a while to read.
const CHAT_COMPLETION_TIMEOUT: Duration = Duration::from_secs(180);

/// `POST /chat/completions` (Seed LLMs, OpenAI-compatible). Returns the whole answer at once.
pub async fn create_chat_completion(
  api_key: &ArkApiKey,
  request: &ChatCompletionRequest,
) -> Result<ChatCompletionResponse, ArkError> {
  create_chat_completion_with_timeout(api_key, request, CHAT_COMPLETION_TIMEOUT).await
}

/// Same, for requests that take longer to read, eg. a minute of video as 1,500 frames.
pub async fn create_chat_completion_with_timeout(
  api_key: &ArkApiKey,
  request: &ChatCompletionRequest,
  timeout: Duration,
) -> Result<ChatCompletionResponse, ArkError> {
  let url = format!("{}/chat/completions", ARK_AP_SOUTHEAST_BASE_URL);
  send_json(api_key, Method::POST, &url, Some(request), timeout).await
}

// ── Request ──

#[derive(Clone, Debug, Serialize)]
pub struct ChatCompletionRequest {
  /// Dated model id, eg. `seed-2-0-pro-260328`.
  pub model: String,

  pub messages: Vec<ChatMessage>,

  /// Seed 2.x reasons before answering unless this is disabled.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub thinking: Option<ChatThinking>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub max_tokens: Option<u32>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub temperature: Option<f32>,
}

#[derive(Clone, Debug, Serialize)]
pub struct ChatMessage {
  pub role: ChatRole,
  pub content: Vec<ChatContentPart>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ChatRole {
  System,
  User,
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ChatContentPart {
  Text { text: String },
  ImageUrl { image_url: ChatImageUrl },
  /// Only Seed 2.0 Lite and Mini hear audio.
  InputAudio { input_audio: ChatInputAudio },
}

#[derive(Clone, Debug, Serialize)]
pub struct ChatImageUrl {
  /// An http(s) URL or a `data:image/<format>;base64,...` string.
  pub url: String,

  /// Seed 2.0 bills every image as 1,280 tokens by default (`high`); `low` bills its pixels
  /// (width × height ÷ 1764), so a 448×252 video frame costs 64.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub detail: Option<ChatImageDetail>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ChatImageDetail {
  Low,
  High,
}

#[derive(Clone, Debug, Serialize)]
pub struct ChatInputAudio {
  /// Base64 audio, without a `data:` prefix (at most 25 MB).
  pub data: String,
  /// eg. `wav`, `mp3`.
  pub format: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct ChatThinking {
  #[serde(rename = "type")]
  pub thinking_type: ChatThinkingType,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ChatThinkingType {
  Enabled,
  Disabled,
  Auto,
}

// ── Response ──

#[derive(Clone, Debug, Deserialize)]
pub struct ChatCompletionResponse {
  #[serde(default)]
  pub choices: Vec<ChatChoice>,

  pub usage: Option<ChatUsage>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct ChatChoice {
  pub message: ChatResponseMessage,

  pub finish_reason: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct ChatResponseMessage {
  #[serde(default)]
  pub content: String,
}

#[derive(Clone, Copy, Debug, Deserialize)]
pub struct ChatUsage {
  pub prompt_tokens: u64,
  pub completion_tokens: u64,
  pub total_tokens: u64,
}

impl ChatMessage {
  pub fn system(text: &str) -> Self {
    Self { role: ChatRole::System, content: vec![ChatContentPart::text(text)] }
  }

  pub fn user(content: Vec<ChatContentPart>) -> Self {
    Self { role: ChatRole::User, content }
  }
}

impl ChatContentPart {
  pub fn text(text: &str) -> Self {
    Self::Text { text: text.to_string() }
  }

  pub fn image(url: &str) -> Self {
    Self::ImageUrl { image_url: ChatImageUrl { url: url.to_string(), detail: None } }
  }

  /// An image billed by its pixels, not the fixed 1,280 tokens.
  pub fn image_low_detail(url: String) -> Self {
    Self::ImageUrl { image_url: ChatImageUrl { url, detail: Some(ChatImageDetail::Low) } }
  }

  pub fn audio(base64: String, format: &str) -> Self {
    Self::InputAudio { input_audio: ChatInputAudio { data: base64, format: format.to_string() } }
  }
}

impl ChatThinking {
  pub fn disabled() -> Self {
    Self { thinking_type: ChatThinkingType::Disabled }
  }
}

impl ChatCompletionResponse {
  /// The first answer's text, if the model returned one.
  pub fn first_answer(&self) -> Option<&str> {
    self.choices.first()
        .map(|choice| choice.message.content.trim())
        .filter(|content| !content.is_empty())
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  const API_KEY_ENV_VAR: &str = "BYTEPLUS_API_KEY";

  #[test]
  fn serializes_text_and_images() {
    let request = ChatCompletionRequest {
      model: "seed-2-0-pro-260328".to_string(),
      messages: vec![
        ChatMessage::system("Rewrite prompts."),
        ChatMessage::user(vec![ChatContentPart::text("a cat"), ChatContentPart::image("data:image/jpeg;base64,AAAA")]),
      ],
      thinking: Some(ChatThinking::disabled()),
      max_tokens: Some(2000),
      temperature: None,
    };

    assert_eq!(serde_json::to_value(&request).unwrap(), json!({
      "model": "seed-2-0-pro-260328",
      "messages": [
        { "role": "system", "content": [{ "type": "text", "text": "Rewrite prompts." }] },
        { "role": "user", "content": [
          { "type": "text", "text": "a cat" },
          { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,AAAA" } },
        ] },
      ],
      "thinking": { "type": "disabled" },
      "max_tokens": 2000,
    }));
  }

  #[test]
  fn reads_the_first_answer() {
    let response: ChatCompletionResponse = serde_json::from_value(json!({
      "id": "021",
      "choices": [{ "index": 0, "message": { "role": "assistant", "content": "  A cat.\n" }, "finish_reason": "stop" }],
      "usage": { "prompt_tokens": 10, "completion_tokens": 3, "total_tokens": 13 },
    })).unwrap();
    assert_eq!(response.first_answer(), Some("A cat."));
    assert_eq!(response.usage.unwrap().total_tokens, 13);

    let empty: ChatCompletionResponse = serde_json::from_value(json!({ "choices": [] })).unwrap();
    assert_eq!(empty.first_answer(), None);
  }

  // PAID (a few hundred tokens): BYTEPLUS_API_KEY=... cargo test -p byteplus_ark_client
  // answers_a_short_prompt -- --ignored --nocapture
  #[tokio::test]
  #[ignore]
  async fn answers_a_short_prompt() {
    let key = std::env::var(API_KEY_ENV_VAR).expect("set BYTEPLUS_API_KEY for live tests");
    let request = ChatCompletionRequest {
      model: "seed-2-0-pro-260328".to_string(),
      messages: vec![ChatMessage::user(vec![ChatContentPart::text("Reply with the single word: ready")])],
      thinking: Some(ChatThinking::disabled()),
      max_tokens: Some(20),
      temperature: None,
    };
    let response = create_chat_completion(&ArkApiKey::new(&key), &request).await.unwrap();
    println!("{:?} {:?}", response.first_answer(), response.usage);
    assert!(response.first_answer().is_some());
  }
}
