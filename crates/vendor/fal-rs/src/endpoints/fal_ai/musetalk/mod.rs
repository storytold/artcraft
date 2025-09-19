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
pub struct MuseTalkInput {
    /// URL of the audio
    /// "https://raw.githubusercontent.com/TMElyralab/MuseTalk/main/data/audio/sun.wav"
    pub audio_url: String,
    /// URL of the source video
    /// "https://raw.githubusercontent.com/TMElyralab/MuseTalk/main/data/video/sun.mp4"
    pub source_video_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MuseTalkOutput {
    /// The generated video file.
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// MuseTalk
///
/// Category: image-to-video
/// Machine Type: A100
pub fn musetalk(params: MuseTalkInput) -> FalRequest<MuseTalkInput, MuseTalkOutput> {
    FalRequest::new("fal-ai/musetalk", params)
}
