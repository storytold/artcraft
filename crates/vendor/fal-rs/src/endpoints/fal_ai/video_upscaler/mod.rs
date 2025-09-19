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
pub struct Input {
    /// The scale factor
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
    /// The URL of the video to upscale
    /// "https://storage.googleapis.com/falserverless/videos/_o3VmzjOytBwRjCVPFX6i_output.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// The stitched video
    /// {"content_type":"video/mp4","url":"https://storage.googleapis.com/falserverless/videos/h0jgPaO6AJAbyrsNYNbGl_upscaled_video.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Video Upscaler
///
/// Category: video-to-video
/// Machine Type: A6000
pub fn video_upscaler(params: Input) -> FalRequest<Input, Output> {
    FalRequest::new("fal-ai/video-upscaler", params)
}
