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
    /// The prompt to generate audio from
    /// "128 BPM tech house drum loop"
    pub prompt: String,
    /// The start point of the audio clip to generate
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seconds_start: Option<i64>,
    /// The duration of the audio clip to generate
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seconds_total: Option<i64>,
    /// The number of steps to denoise the audio for
    #[serde(skip_serializing_if = "Option::is_none")]
    pub steps: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// The generated audio clip
    pub audio_file: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Stable Audio Open
///
/// Category: text-to-audio
/// Machine Type: A100
pub fn stable_audio(params: Input) -> FalRequest<Input, Output> {
    FalRequest::new("fal-ai/stable-audio", params)
}
