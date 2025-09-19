#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CodeformerInput {
    /// Should faces etc should be aligned.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aligned: Option<bool>,
    /// Should faces be upscaled
    #[serde(skip_serializing_if = "Option::is_none")]
    pub face_upscale: Option<bool>,
    /// Weight of the fidelity factor.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fidelity: Option<f64>,
    /// URL of image to be used for relighting
    /// "https://storage.googleapis.com/falserverless/model_tests/codeformer/codeformer_poor_1.jpeg"
    pub image_url: String,
    /// Should only center face be restored
    #[serde(skip_serializing_if = "Option::is_none")]
    pub only_center_face: Option<bool>,
    /// Random seed for reproducible generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Upscaling factor
    #[serde(skip_serializing_if = "Option::is_none")]
    pub upscaling: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConformerOutput {
    /// The generated image file info.
    /// {"content_type":"image/png","file_name":"36d3ca4791a647678b2ff01a35c87f5a.png","file_size":423052,"height":512,"url":"https://storage.googleapis.com/falserverless/model_tests/codeformer/codeformer_restored_1.jpeg","width":512}
    pub image: Image,
    /// Seed of the generated Image. It will be the same value of the one passed in the
    /// input or the randomly generated that was used in case none was passed.
    pub seed: i64,
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
    /// The height of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<i64>,
    /// The URL where the file can be downloaded from.
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

/// CodeFormer
///
/// Category: image-to-image
/// Machine Type: A6000
pub fn codeformer(params: CodeformerInput) -> FalRequest<CodeformerInput, ConformerOutput> {
    FalRequest::new("fal-ai/codeformer", params)
}
