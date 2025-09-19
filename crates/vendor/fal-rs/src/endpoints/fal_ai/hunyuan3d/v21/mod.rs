use crate::prelude::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Hunyuan3DInput {
  /// Guidance scale for the model.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub guidance_scale: Option<f64>,
  /// URL of image to use while generating the 3D model.
  /// "https://storage.googleapis.com/falserverless/model_tests/video_models/robot.png"
  pub input_image_url: String,
  /// Number of inference steps to perform.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_inference_steps: Option<i64>,
  /// Octree resolution for the model.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub octree_resolution: Option<i64>,
  /// The same seed and the same prompt given to the same version of the model
  /// will output the same image every time.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,
  /// If set true, textured mesh will be generated and the price charged would be 3 times that of white mesh.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub textured_mesh: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ObjectOutput {
  /// Generated 3D object file.
  /// {"content_type":"application/octet-stream","file_name":"white_mesh.glb","file_size":720696,"url":"https://v3.fal.media/files/lion/WqIhtKPaSoeBtC30qzIGG_white_mesh.glb"}
  pub model_mesh: File,
  /// Seed value used for generation.
  pub seed: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
  /// The mime type of the file.
  /// "image/png"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub content_type: Option<String>,
  /// File data
  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_data: Option<String>,
  /// The name of the file. It will be auto-generated if not provided.
  /// "z9RV14K95DvU.png"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_name: Option<String>,
  /// The size of the file in bytes.
  /// 4404019
  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_size: Option<i64>,
  /// The URL where the file can be downloaded from.
  pub url: String,
}

/// Hunyuan3D
///
/// Category: image-to-3d
/// Machine Type: H100
/// License Type: commercial
pub fn v21(params: Hunyuan3DInput) -> FalRequest<Hunyuan3DInput, ObjectOutput> {
  FalRequest::new("fal-ai/hunyuan3d-v21", params)
}
