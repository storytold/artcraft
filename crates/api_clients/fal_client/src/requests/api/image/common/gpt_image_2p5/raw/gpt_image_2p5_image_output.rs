use serde::{Deserialize, Serialize};

/// Response shape shared by all four GPT Image 2.5 endpoints.
#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage2p5ImageOutput {
  pub images: Vec<GptImage2p5ImageFile>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage2p5ImageFile {
  pub url: String,

  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub content_type: Option<String>,

  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub file_name: Option<String>,

  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub file_size: Option<u64>,

  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub width: Option<u32>,

  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub height: Option<u32>,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn deserializes_fal_example_response() {
    let json = r#"{"images":[{"file_name":"EnWrO3XWjPE0nxBDpaQrj.png","width":1024,"height":1024,"content_type":"image/png","url":"https://v3b.fal.media/files/b/0a869129/EnWrO3XWjPE0nxBDpaQrj.png"}]}"#;
    let output: GptImage2p5ImageOutput = serde_json::from_str(json).unwrap();
    assert_eq!(output.images.len(), 1);
    assert_eq!(output.images[0].url, "https://v3b.fal.media/files/b/0a869129/EnWrO3XWjPE0nxBDpaQrj.png");
    assert_eq!(output.images[0].width, Some(1024));
    assert_eq!(output.images[0].content_type.as_deref(), Some("image/png"));
    assert_eq!(output.images[0].file_size, None);
  }

  #[test]
  fn deserializes_url_only_file() {
    let json = r#"{"images":[{"url":"https://example.com/a.png"}]}"#;
    let output: GptImage2p5ImageOutput = serde_json::from_str(json).unwrap();
    assert_eq!(output.images[0].url, "https://example.com/a.png");
    assert_eq!(output.images[0].width, None);
  }
}
