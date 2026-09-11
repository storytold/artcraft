use chrono::Utc;
use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize)]
pub struct WebsocketClientMessage {
  /// Type of message
  /// eg. "conversation.item.create"
  pub r#type: String,

  /// Unix timestamp
  pub timestamp: u64,

  pub item: ClientMessageItem,
}

#[derive(Serialize)]
pub struct ClientMessageItem {
  /// Type of item
  /// eg. "message"
  pub r#type: String,

  pub content: Vec<ClientMessageItemContent>,
}

#[derive(Serialize)]
pub struct ClientMessageItemContent {
  /// UUID
  #[serde(rename="requestId")]
  pub request_id: String,

  /// Type of item content
  /// eg. "input_text"
  pub r#type: String,

  /// The prompt for the request
  pub text: String,

  pub properties: ClientMessageItemContentProperties,
}

#[derive(Serialize)]
pub struct ClientMessageItemContentProperties {
  pub section_count: usize,
  pub is_kids_mode: bool,
  pub enable_nsfw: bool,
  pub skip_upsampler: bool,
  pub is_initial: bool,
  pub aspect_ratio: ClientMessageAspectRatio,
}

#[derive(Serialize, Clone, Copy, Debug)]
pub enum ClientMessageAspectRatio {
  #[serde(rename = "2:3")]
  TallTwoByThree,

  #[serde(rename = "3:2")]
  WideThreeByTwo,

  #[serde(rename = "1:1")]
  Square,
}

impl WebsocketClientMessage {
  /// Create a new image prompt websocket client message
  pub fn new_image_prompt(prompt: &str, aspect_ratio: ClientMessageAspectRatio) -> Self {
    Self {
      r#type: "conversation.item.create".to_string(),
      timestamp: Utc::now().timestamp_millis() as u64,
      item: ClientMessageItem {
        r#type: "message".to_string(),
        content: vec![
          ClientMessageItemContent {
            request_id: Uuid::new_v4().to_string(),
            r#type: "input_text".to_string(),
            text: prompt.to_string(),
            properties: ClientMessageItemContentProperties {
              section_count: 0,
              is_kids_mode: false,
              enable_nsfw: true,
              skip_upsampler: false,
              is_initial: false,
              aspect_ratio,
            },
          }
        ],
      },
    }
  }
}
