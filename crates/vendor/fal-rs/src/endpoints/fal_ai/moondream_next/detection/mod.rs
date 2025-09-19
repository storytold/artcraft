#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BatchMoonDreamOutput {
    /// URL to the generated captions JSON file containing filename-caption pairs.
    pub captions_file: File,
    /// List of generated captions
    pub outputs: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BatchQueryInput {
    /// List of image URLs to be processed (maximum 32 images)
    pub images_data_url: String,
    /// Maximum number of tokens to generate
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<i64>,
    /// Single prompt to apply to all images
    /// "Describe this image in detail."
    pub prompt: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DetectionInput {
    /// Text description of what to detect
    /// "Person"
    pub detection_prompt: String,
    /// Image URL to be processed
    /// "https://llava-vl.github.io/static/images/monalisa.jpg"
    pub image_url: String,
    /// Type of detection to perform
    pub task_type: String,
    /// Whether to use ensemble for gaze detection
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_ensemble: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DetectionOutput {
    /// Output image with detection visualization
    pub image: Image,
    /// Detection results as text
    pub text_output: String,
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
pub struct MoonDreamOutput {
    /// Response from the model
    pub output: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct QueryInput {
    /// Image URL to be processed
    /// "https://llava-vl.github.io/static/images/monalisa.jpg"
    pub image_url: String,
    /// Maximum number of tokens to generate
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<i64>,
    /// Prompt for query task
    /// "Describe this image in detail."
    pub prompt: String,
    /// Type of task to perform
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// MoonDreamNext
///
/// Category: vision
///
/// License Type: commercial
pub fn detection(params: DetectionInput) -> FalRequest<DetectionInput, DetectionOutput> {
    FalRequest::new("fal-ai/moondream-next/detection", params)
}
