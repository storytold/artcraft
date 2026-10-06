use crate::requests::videos::video_task_types::MediaUrl;
use serde_derive::{Deserialize, Serialize};

/// Hyper3D Rodin Gen-2: text or 1-5 images to a textured model (GLB by default).
pub const HYPER3D_GEN2_MODEL_ID: &str = "hyper3d-gen2-260112";

/// Hitem3D 2.0: 1-4 images to a high-precision model. Defaults to a zipped OBJ unless the
/// `--ff 2` (GLB) flag is sent.
pub const HITEM3D_2_MODEL_ID: &str = "hitem3d-2-0-251223";

// ── Request ──

/// Body of `POST /contents/generations/tasks` for a 3D model.
#[derive(Clone, Debug, Serialize)]
pub struct CreateModel3dTaskRequest {
  /// Dated model id (see the constants above) or an endpoint id (`ep-...`).
  pub model: String,

  /// Reference images plus an optional text item holding the prompt and `--option value` flags.
  pub content: Vec<Model3dContentItem>,

  /// Hyper3D only: `0..=65535`.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<u32>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Model3dContentItem {
  Text {
    text: String,
  },
  ImageUrl {
    image_url: MediaUrl,
  },
}

impl CreateModel3dTaskRequest {
  /// Builds the content list: the text item (prompt followed by option flags) comes first and is
  /// omitted when both are empty, then one item per reference image.
  pub fn new(model: &str, maybe_prompt: Option<&str>, option_flags: &str, image_urls: &[String]) -> Self {
    let text = [maybe_prompt.map(str::trim).unwrap_or_default(), option_flags.trim()]
        .into_iter()
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join(" ");

    let mut content = Vec::with_capacity(image_urls.len() + 1);
    if !text.is_empty() {
      content.push(Model3dContentItem::Text { text });
    }
    content.extend(image_urls.iter().map(|url| Model3dContentItem::ImageUrl {
      image_url: MediaUrl { url: url.clone() },
    }));

    Self {
      model: model.to_string(),
      content,
      seed: None,
    }
  }
}

// ── Response ──

#[derive(Debug, Deserialize)]
pub struct CreateModel3dTaskResponse {
  pub id: String,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn text_item_combines_prompt_and_flags_before_images() {
    let request = CreateModel3dTaskRequest::new(
      HITEM3D_2_MODEL_ID,
      None,
      "--ff 2 --resolution 1536pro",
      &["data:image/png;base64,iVBOR".to_string()],
    );
    let json = serde_json::to_value(&request).unwrap();
    assert_eq!(json, serde_json::json!({
      "model": "hitem3d-2-0-251223",
      "content": [
        {"type": "text", "text": "--ff 2 --resolution 1536pro"},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,iVBOR"}}
      ]
    }));
  }

  #[test]
  fn text_item_is_omitted_without_prompt_or_flags() {
    let mut request = CreateModel3dTaskRequest::new(HYPER3D_GEN2_MODEL_ID, Some("  "), "", &["https://example.com/a.png".to_string()]);
    request.seed = Some(8648);
    let json = serde_json::to_value(&request).unwrap();
    assert_eq!(json["content"].as_array().unwrap().len(), 1);
    assert_eq!(json["content"][0]["type"], "image_url");
    assert_eq!(json["seed"], 8648);
  }
}
