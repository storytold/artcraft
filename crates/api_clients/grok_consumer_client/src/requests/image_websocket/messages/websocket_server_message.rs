use crate::error::grok_generic_api_error::GrokGenericApiError;
use serde::Deserialize;

#[derive(Deserialize, Clone, Debug)]
#[serde(tag = "type")]
pub enum WebsocketServerMessage {
  /// Json with root `type = "image"`
  #[serde(rename = "image")]
  Image(ImageDataMessage),

  /// Json with root `type = "json"`
  #[serde(rename = "json")]
  Json(JsonDataMessage),

  /// Captures any other JSON messages.
  #[serde(untagged)]
  Unknown(serde_json::Value),
  //Unknown(String),
}

/// Images with a binary blob and URLs.
/// We may receive several of these for a single prompt.
#[derive(Deserialize, Clone, Debug)]
pub struct ImageDataMessage {
  /// UUID.
  pub id: Option<String>,

  /// UUID.
  pub job_id: Option<String>,

  /// UUID.
  pub request_id: Option<String>,

  /// Eg. "0", "50", "100"
  pub percentage_complete: Option<f32>,

  pub prompt: Option<String>,
  
  /// The enriched prompt
  pub full_prompt: Option<String>,

  /// Base64 encoded image blob.
  pub blob: Option<String>,

  /// URL to the image.
  pub url: Option<String>,

  /// NSFW flag
  pub r_rated: Option<bool>,

  /// Name of the model used to generate the image
  /// eg. "imagine_h_1"
  pub model_name: Option<String>,
}

#[derive(Deserialize, Clone, Debug)]
pub struct JsonDataMessage {
  /// UUID.
  pub job_id: Option<String>,

  /// UUID.
  pub request_id: Option<String>,

  /// Eg. "0", "50", "100"
  pub percentage_complete: Option<f32>,

  pub prompt: Option<String>,
  pub full_prompt: Option<String>,

  /// NSFW flag
  pub r_rated: Option<bool>,

  /// UUID.
  /// NB: This is observed to be nullable.
  pub image_id: Option<String>,
}

impl WebsocketServerMessage {
  pub fn from_json_str(json_str: &str) -> Result<Self, GrokGenericApiError> {
    Ok(serde_json::from_str(json_str)
        .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, json_str.to_string()))?)
  }
}

#[cfg(test)]
mod tests {
  use crate::requests::image_websocket::messages::websocket_server_message::WebsocketServerMessage;

  fn json_path(file_name: &str) -> String {
    format!("/Users/bt/dev/storyteller/storyteller-rust/crates/api_clients/grok_consumer_client/test_data/websocket_messages/{}", file_name)
  }

  #[test]
  fn test_image_complete() -> anyhow::Result<()> {
    let path = json_path("create_image_complete_response.json");
    let data = std::fs::read_to_string(path)?;
    //let message: WebsocketServerMessage = serde_json::from_str(&data)?;
    let message = WebsocketServerMessage::from_json_str(&data)?;

    match message {
      WebsocketServerMessage::Image(image_data) => {
        assert_eq!(image_data.percentage_complete, Some(50.0));
        assert!(image_data.url.is_some());
      },
      _ => panic!("Expected ImageData message"),
    }

    Ok(())
  }

  #[test]
  fn test_image_status_complete() -> anyhow::Result<()> {
    let path = json_path("create_image_complete_status_notification.json");
    let data = std::fs::read_to_string(path)?;
    //let message: WebsocketServerMessage = serde_json::from_str(&data)?;
    let message = WebsocketServerMessage::from_json_str(&data)?;

    match message {
      WebsocketServerMessage::Json(image_data) => {
        assert_eq!(image_data.percentage_complete, Some(100.0));
      },
      _ => panic!("Expected JsonData message"),
    }

    Ok(())
  }

  #[test]
  fn test_in_progress() -> anyhow::Result<()> {
    let path = json_path("create_image_in_progress_response.json");
    let data = std::fs::read_to_string(path)?;
    //let message: WebsocketServerMessage = serde_json::from_str(&data)?;
    let message = WebsocketServerMessage::from_json_str(&data)?;

    match message {
      WebsocketServerMessage::Json(image_data) => {
        assert_eq!(image_data.percentage_complete, Some(0.0));
      },
      _ => panic!("Expected JsonData message"),
    }

    Ok(())
  }

  #[test]
  fn test_wire() -> anyhow::Result<()> {
    let path = json_path("wire.json");
    let data = std::fs::read_to_string(path)?;
    //let message: WebsocketServerMessage = serde_json::from_str(&data)?;
    let message = WebsocketServerMessage::from_json_str(&data)?;

    match message {
      WebsocketServerMessage::Json(_value)=> {},
      _ => panic!("Expected Json message"),
    }

    Ok(())
  }

  #[test]
  fn test_wire_formatted() -> anyhow::Result<()> {
    let path = json_path("wire_formatted.json");
    let data = std::fs::read_to_string(path)?;
    //let message: WebsocketServerMessage = serde_json::from_str(&data)?;
    let message = WebsocketServerMessage::from_json_str(&data)?;

    match message {
      WebsocketServerMessage::Json(_value)=> {},
      _ => panic!("Expected Json message"),
    }

    Ok(())
  }

  #[test]
  fn test_empty() -> anyhow::Result<()> {
    let path = json_path("empty.json");
    let data = std::fs::read_to_string(path)?;
    //let message: WebsocketServerMessage = serde_json::from_str(&data)?;
    let message = WebsocketServerMessage::from_json_str(&data)?;

     match message {
      WebsocketServerMessage::Unknown(_value)=> {},
      _ => panic!("Expected Unknown message"),
    }

    Ok(())
  }

  #[test]
  fn test_other_type() -> anyhow::Result<()> {
    let path = json_path("other_type.json");
    let data = std::fs::read_to_string(path)?;
    ///let message: WebsocketServerMessage = serde_json::from_str(&data)?;
    let message = WebsocketServerMessage::from_json_str(&data)?;

    match message {
      WebsocketServerMessage::Unknown(_value)=> {},
      _ => panic!("Expected Unknown message"),
    }

    Ok(())
  }
}
