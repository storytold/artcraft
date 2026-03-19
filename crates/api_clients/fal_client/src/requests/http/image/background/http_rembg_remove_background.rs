use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct RembgRemoveBackgroundInput {
  pub image_url: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub crop_to_bbox: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RembgRemoveBackgroundFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RembgRemoveBackgroundOutput {
  pub image: RembgRemoveBackgroundFile,
}

pub fn rembg_remove_background(
  params: RembgRemoveBackgroundInput,
) -> FalRequest<RembgRemoveBackgroundInput, RembgRemoveBackgroundOutput> {
  FalRequest::new("fal-ai/imageutils/rembg", params)
}
