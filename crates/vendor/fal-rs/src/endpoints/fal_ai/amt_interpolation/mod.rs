#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_amt-interpolation"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_fal-ai",
        feature = "endpoints_fal-ai_amt-interpolation"
    )))
)]
pub mod frame_interpolation;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AMTFrameInterpolationInput {
    /// Frames to interpolate
    /// [{"url":"https://storage.googleapis.com/falserverless/model_tests/amt-interpolation/start.png"},{"url":"https://storage.googleapis.com/falserverless/model_tests/amt-interpolation/end.png"}]
    pub frames: Vec<Frame>,
    /// Output frames per second
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_fps: Option<i64>,
    /// Number of recursive interpolation passes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recursive_interpolation_passes: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AMTInterpolationInput {
    /// Output frames per second
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_fps: Option<i64>,
    /// Number of recursive interpolation passes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recursive_interpolation_passes: Option<i64>,
    /// URL of the video to be processed
    /// "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/animatediff-vid2vid-input-2.gif"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AMTInterpolationOutput {
    /// Generated video
    pub video: File,
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
pub struct Frame {
    /// URL of the frame
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// AMT Interpolation
///
/// Category: video-to-video
/// Machine Type: A6000
pub fn amt_interpolation(
    params: AMTInterpolationInput,
) -> FalRequest<AMTInterpolationInput, AMTInterpolationOutput> {
    FalRequest::new("fal-ai/amt-interpolation", params)
}
