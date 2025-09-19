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
    /// Whether to lip sync the audio to the video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub do_lipsync: Option<bool>,
    /// Target language to dub the video to
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_language: Option<String>,
    /// Input video URL to be dubbed.
    /// "https://storage.googleapis.com/falserverless/model_tests/dubbing/swapjokes_clip_cropped.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OutputModel {
    /// The generated video with the lip sync.
    /// {"content_type":"video/mp4","file_name":"output.mp4","file_size":120000,"url":"https://v3.fal.media/files/koala/7BzEwUucbr6yuFjpcJipl_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Dubbing
///
/// Category: video-to-video
///
/// License Type: commercial
pub fn dubbing(params: InputModel) -> FalRequest<InputModel, OutputModel> {
    FalRequest::new("fal-ai/dubbing", params)
}
