#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

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
pub struct OmniZeroInput {
    /// Composition image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/omni_zero/structure.jpg"
    pub composition_image_url: String,
    /// Composition strength.
    /// 1
    #[serde(skip_serializing_if = "Option::is_none")]
    pub composition_strength: Option<f64>,
    /// Depth strength.
    /// 0.5
    #[serde(skip_serializing_if = "Option::is_none")]
    pub depth_strength: Option<f64>,
    /// Face strength.
    /// 1
    #[serde(skip_serializing_if = "Option::is_none")]
    pub face_strength: Option<f64>,
    /// Guidance scale.
    /// 5
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// Identity image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/omni_zero/identity.jpg"
    pub identity_image_url: String,
    /// Identity strength.
    /// 1
    #[serde(skip_serializing_if = "Option::is_none")]
    pub identity_strength: Option<f64>,
    /// Image strength.
    /// 0.75
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_strength: Option<f64>,
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/omni_zero/structure.jpg"
    pub image_url: String,
    /// Negative prompt to guide the image generation.
    /// ""
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of images.
    /// 1
    #[serde(skip_serializing_if = "Option::is_none")]
    pub number_of_images: Option<i64>,
    /// Prompt to guide the image generation.
    /// "A woman"
    pub prompt: String,
    /// Seed.
    /// 42
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Style image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/omni_zero/style.jpg"
    pub style_image_url: String,
    /// Style strength.
    /// 1
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style_strength: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OmniZeroOutput {
    /// The generated image.
    /// {"content_type":"image/png","height":1024,"url":"https://storage.googleapis.com/falserverless/model_tests/omni_zero/result.png","width":1024}
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Omni Zero
///
/// Category: image-to-image
/// Machine Type: A100
pub fn omni_zero(params: OmniZeroInput) -> FalRequest<OmniZeroInput, OmniZeroOutput> {
    FalRequest::new("fal-ai/omni-zero", params)
}
