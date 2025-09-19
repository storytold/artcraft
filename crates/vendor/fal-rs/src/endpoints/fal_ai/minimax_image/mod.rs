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
pub struct MiniMaxTextToImageOutput {
    /// Generated images
    pub images: Vec<File>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MiniMaxTextToImageRequest {
    /// Aspect ratio of the generated image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// Number of images to generate (1-9)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// Text prompt for image generation (max 1500 characters)
    /// "Man dressed in white t shirt, full-body stand front view image, outdoor, Venice beach sign, full-body image, Los Angeles, Fashion photography of 90s, documentary, Film grain, photorealistic"
    pub prompt: String,
    /// Whether to enable automatic prompt optimization
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_optimizer: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// MiniMax (Hailuo AI) Text to Image
///
/// Category: text-to-image
///
///
///
/// Generate images from text prompt using MiniMax API.
pub fn minimax_image(
    params: MiniMaxTextToImageRequest,
) -> FalRequest<MiniMaxTextToImageRequest, MiniMaxTextToImageOutput> {
    FalRequest::new("fal-ai/minimax-image", params)
}
