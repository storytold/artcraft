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

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct InputModel {
    /// URL of the input image to convert to 3D
    /// "https://storage.googleapis.com/falserverless/web-examples/rodin3d/warriorwoman.png"
    pub image_url: String,
    /// Mesh simplification factor
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mesh_simplify: Option<f64>,
    /// Random seed for reproducibility
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Guidance strength for structured latent generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slat_guidance_strength: Option<f64>,
    /// Sampling steps for structured latent generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slat_sampling_steps: Option<i64>,
    /// Guidance strength for sparse structure generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ss_guidance_strength: Option<f64>,
    /// Sampling steps for sparse structure generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ss_sampling_steps: Option<i64>,
    /// Texture resolution
    #[serde(skip_serializing_if = "Option::is_none")]
    pub texture_size: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ObjectOutput {
    /// Generated 3D mesh file
    pub model_mesh: File,
    /// Processing timings
    pub timings: Timings,
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

/// Trellis
///
/// Category: image-to-3d
/// Machine Type: A100
/// License Type: commercial
pub fn trellis(params: InputModel) -> FalRequest<InputModel, ObjectOutput> {
    FalRequest::new("fal-ai/trellis", params)
}
