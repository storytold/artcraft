#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

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

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ObjectOutput {
    /// Generated 3D object file.
    pub model_mesh: File,
    /// Directory containing textures for the remeshed model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub remeshing_dir: Option<Option<File>>,
    /// Inference timings.
    pub timings: Timings,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct RemeshingInput {
    /// Number of faces for remesh
    #[serde(skip_serializing_if = "Option::is_none")]
    pub faces: Option<i64>,
    /// Merge duplicate vertices before exporting
    #[serde(skip_serializing_if = "Option::is_none")]
    pub merge: Option<bool>,
    /// Path for the object file to be remeshed.
    /// "https://huggingface.co/fal-ai/resources/resolve/main/inputs/example_obj.glb"
    pub object_url: String,
    /// Output format for the 3D model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// Preserve UVs during remeshing
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preserve_uvs: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TripoSRInput {
    /// Whether to remove the background from the input image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub do_remove_background: Option<bool>,
    /// Ratio of the foreground image to the original image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub foreground_ratio: Option<f64>,
    /// Path for the image file to be processed.
    /// "https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/ea034e12a428fa848684a3f9f267b2042d298ca6/examples/hamburger.png"
    /// "https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/ea034e12a428fa848684a3f9f267b2042d298ca6/examples/poly_fox.png"
    /// "https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/ea034e12a428fa848684a3f9f267b2042d298ca6/examples/robot.png"
    /// "https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/ea034e12a428fa848684a3f9f267b2042d298ca6/examples/teapot.png"
    /// "https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/ea034e12a428fa848684a3f9f267b2042d298ca6/examples/tiger_girl.png"
    /// "https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/ea034e12a428fa848684a3f9f267b2042d298ca6/examples/horse.png"
    /// "https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/ea034e12a428fa848684a3f9f267b2042d298ca6/examples/flamingo.png"
    /// "https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/ea034e12a428fa848684a3f9f267b2042d298ca6/examples/unicorn.png"
    /// "https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/ea034e12a428fa848684a3f9f267b2042d298ca6/examples/chair.png"
    /// "https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/ea034e12a428fa848684a3f9f267b2042d298ca6/examples/iso_house.png"
    /// "https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/ea034e12a428fa848684a3f9f267b2042d298ca6/examples/marble.png"
    /// "https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/ea034e12a428fa848684a3f9f267b2042d298ca6/examples/police_woman.png"
    /// "https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/ea034e12a428fa848684a3f9f267b2042d298ca6/examples/captured_p.png"
    pub image_url: String,
    /// Resolution of the marching cubes. Above 512 is not recommended.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mc_resolution: Option<i64>,
    /// Output format for the 3D model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Timings {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "type")]
    pub ty: Option<serde_json::Value>,
}

/// TripoSR
///
/// Category: image-to-3d
/// Machine Type: A6000
pub fn remeshing(params: RemeshingInput) -> FalRequest<RemeshingInput, ObjectOutput> {
    FalRequest::new("fal-ai/triposr/remeshing", params)
}
