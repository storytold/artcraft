#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DiffusionEdgeInput {
    /// The text prompt you would like to convert to speech.
    /// "https://storage.googleapis.com/falserverless/model_tests/upscale/hamburger.png"
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiffusionEdgeOutput {
    /// The generated image file info.
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Image {
    /// The mime type of the file.
    /// "image/png"
    pub content_type: String,
    /// The name of the file. It will be auto-generated if not provided.
    /// "z9RV14K95DvU.png"
    pub file_name: String,
    /// The size of the file in bytes.
    /// 4404019
    pub file_size: i64,
    /// The height of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<i64>,
    /// The URL where the file can be downloaded from.
    /// "https://url.to/generated/file/z9RV14K95DvU.png"
    pub url: String,
    /// The width of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// DiffusionEdge
///
/// Category: text-to-image
/// Machine Type: A6000
pub fn diffusion_edge(
    params: DiffusionEdgeInput,
) -> FalRequest<DiffusionEdgeInput, DiffusionEdgeOutput> {
    FalRequest::new("fal-ai/diffusion-edge", params)
}
