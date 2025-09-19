#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FastImageToVideoRequest {
    /// The aspect ratio of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// URL of the image to use as the first frame
    /// "https://fal.media/files/elephant/8kkhB12hEZI2kkbU8pZPA_test.jpeg"
    pub image_url: String,
    /// Negative prompt to be used for the generation
    /// "blurry, low quality, low resolution, pixelated, noisy, grainy, out of focus, poorly lit, poorly exposed, poorly composed, poorly framed, poorly cropped, poorly color corrected, poorly color graded"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    pub prompt: String,
    /// The resolution of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same video every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The style of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FastTextToVideoRequest {
    /// The aspect ratio of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// Negative prompt to be used for the generation
    /// "blurry, low quality, low resolution, pixelated, noisy, grainy, out of focus, poorly lit, poorly exposed, poorly composed, poorly framed, poorly cropped, poorly color corrected, poorly color graded"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    pub prompt: String,
    /// The resolution of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same video every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The style of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
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
pub struct I2VOutput {
    /// The generated video
    /// {"content_type":"video/mp4","file_name":"output.mp4","file_size":4060052,"url":"https://fal.media/files/tiger/8V9H8RLyFiWjmJDOxGbcG_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageToVideoRequest {
    /// The aspect ratio of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The duration of the generated video in seconds. 8s videos cost double. 1080p videos are limited to 5 seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    /// URL of the image to use as the first frame
    /// "https://fal.media/files/elephant/8kkhB12hEZI2kkbU8pZPA_test.jpeg"
    pub image_url: String,
    /// Negative prompt to be used for the generation
    /// "blurry, low quality, low resolution, pixelated, noisy, grainy, out of focus, poorly lit, poorly exposed, poorly composed, poorly framed, poorly cropped, poorly color corrected, poorly color graded"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    pub prompt: String,
    /// The resolution of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same video every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The style of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToVideoRequest {
    /// The aspect ratio of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The duration of the generated video in seconds. 8s videos cost double. 1080p videos are limited to 5 seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    /// Negative prompt to be used for the generation
    /// "blurry, low quality, low resolution, pixelated, noisy, grainy, out of focus, poorly lit, poorly exposed, poorly composed, poorly framed, poorly cropped, poorly color corrected, poorly color graded"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    pub prompt: String,
    /// The resolution of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same video every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The style of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VideoOutput {
    /// The generated video
    /// {"content_type":"video/mp4","file_name":"output.mp4","file_size":2995630,"url":"https://fal.media/files/zebra/11UahivZ3XZ1tRlcEcgPq_output.mp4"}
    pub video: File,
}

/// PixVerse v3.5
///
/// Category: text-to-video
/// Machine Type: A100
pub fn fast(params: FastTextToVideoRequest) -> FalRequest<FastTextToVideoRequest, VideoOutput> {
    FalRequest::new("fal-ai/pixverse/v3.5/text-to-video/fast", params)
}
