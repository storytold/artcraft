use serde::{Deserialize, Serialize};

// ── Request types ──

#[derive(Serialize)]
pub(crate) struct RawRequest {
  pub world_prompt: WorldPrompt,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub display_name: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub model: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<u32>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub tags: Option<Vec<String>>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub permission: Option<Permission>,
}

#[derive(Clone, Debug, Serialize)]
pub struct Permission {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub public: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub allow_id_access: Option<bool>,
}

/// The world prompt — a tagged union describing the input.
///
/// Discriminated on the `type` field:
/// - `"text"` — text-only prompt
/// - `"image"` — single image (+ optional text)
/// - `"multi-image"` — multiple images with optional azimuth
/// - `"video"` — video input (+ optional text)
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum WorldPrompt {
  Text {
    #[serde(skip_serializing_if = "Option::is_none")]
    text_prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    disable_recaption: Option<bool>,
  },
  Image {
    image_prompt: ContentReference,
    #[serde(skip_serializing_if = "Option::is_none")]
    text_prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    is_pano: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    disable_recaption: Option<bool>,
  },
  MultiImage {
    multi_image_prompt: Vec<SphericallyLocatedContent>,
    #[serde(skip_serializing_if = "Option::is_none")]
    text_prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    reconstruct_images: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    disable_recaption: Option<bool>,
  },
  Video {
    video_prompt: ContentReference,
    #[serde(skip_serializing_if = "Option::is_none")]
    text_prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    disable_recaption: Option<bool>,
  },
}

/// A content reference — tagged union on `source`.
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "source", rename_all = "snake_case")]
pub enum ContentReference {
  Uri {
    uri: String,
  },
  MediaAsset {
    media_asset_id: String,
  },
  DataBase64 {
    data_base64: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    extension: Option<String>,
  },
}

/// A spherically-located content item for multi-image prompts.
#[derive(Clone, Debug, Serialize)]
pub struct SphericallyLocatedContent {
  pub content: ContentReference,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub azimuth: Option<f64>,
}

// ── Response types ──

#[derive(Deserialize)]
#[allow(dead_code)]
pub(crate) struct RawResponse {
  pub operation_id: String,
  pub done: Option<bool>,
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
  pub expires_at: Option<String>,
  pub error: Option<RawOperationError>,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub(crate) struct RawOperationError {
  pub code: Option<i32>,
  pub message: Option<String>,
}
