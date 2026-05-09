use crate::requests::core_api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

/// Non-BYOK edit-image (image-to-image) binding for
/// `fal-ai/gpt-image-1/edit-image`. Fal hosts this model directly; pricing is
/// billed by Fal at their published rates.
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GptImage1NonByokEditImageInput {
  pub prompt: String,

  pub image_urls: Vec<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub mask_image_url: Option<String>,

  /// "auto", "1024x1024", "1536x1024", "1024x1536"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

  /// "low", "medium", "high"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub quality: Option<String>,

  /// "low", "high"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub input_fidelity: Option<String>,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// "auto", "transparent", "opaque"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub background: Option<String>,

  /// "jpeg", "png", "webp"
  /// Default: "png"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage1NonByokEditImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage1NonByokEditImageOutput {
  pub images: Vec<GptImage1NonByokEditImageFile>,
}

pub fn gpt_image_1_non_byok_edit_image(
  params: GptImage1NonByokEditImageInput,
) -> FalRequest<GptImage1NonByokEditImageInput, GptImage1NonByokEditImageOutput> {
  FalRequest::new("fal-ai/gpt-image-1/edit-image", params)
}
