use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Hunyuan3dV21ImageTo3dInput {
  pub input_image_url: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub textured_mesh: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub guidance_scale: Option<f64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_inference_steps: Option<i64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub octree_resolution: Option<i64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3dV21ImageTo3dOutput {}

pub fn hunyuan3d_v21_image_to_3d(
  params: Hunyuan3dV21ImageTo3dInput,
) -> FalRequest<Hunyuan3dV21ImageTo3dInput, Hunyuan3dV21ImageTo3dOutput> {
  FalRequest::new("fal-ai/hunyuan3d-v21", params)
}
