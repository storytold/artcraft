use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SeedEditV3EditInput {
  pub prompt: String,

  pub image_url: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub guidance_scale: Option<f64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SeedEditV3EditFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SeedEditV3EditOutput {
  pub image: Vec<SeedEditV3EditFile>,
}

pub fn seededit_v3_edit(
  params: SeedEditV3EditInput,
) -> FalRequest<SeedEditV3EditInput, SeedEditV3EditOutput> {
  FalRequest::new("fal-ai/bytedance/seededit/v3/edit-image", params)
}
