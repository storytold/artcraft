#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_mmaudio-v2"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_fal-ai",
        feature = "endpoints_fal-ai_mmaudio-v2"
    )))
)]
pub mod text_to_audio;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AudioInput {
    /// The strength of Classifier Free Guidance.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cfg_strength: Option<f64>,
    /// The duration of the audio to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<f64>,
    /// Whether to mask away the clip.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_away_clip: Option<bool>,
    /// The negative prompt to generate the audio for.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of steps to generate the audio for.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_steps: Option<i64>,
    /// The prompt to generate the audio for.
    /// "Indian holy music"
    pub prompt: String,
    /// The seed for the random number generator
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<SeedProperty>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AudioOutput {
    /// The generated audio.
    /// {"content_type":"application/octet-stream","file_name":"mmaudio_input.flac","file_size":1001342,"url":"https://storage.googleapis.com/falserverless/model_tests/video_models/mmaudio_output.flac"}
    pub audio: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BaseInput {
    /// The strength of Classifier Free Guidance.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cfg_strength: Option<f64>,
    /// The duration of the audio to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<f64>,
    /// Whether to mask away the clip.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_away_clip: Option<bool>,
    /// The negative prompt to generate the audio for.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of steps to generate the audio for.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_steps: Option<i64>,
    /// The prompt to generate the audio for.
    /// "Indian holy music"
    pub prompt: String,
    /// The seed for the random number generator
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<SeedProperty>,
    /// The URL of the video to generate the audio for.
    /// "https://storage.googleapis.com/falserverless/model_tests/video_models/mmaudio_input.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
    /// The mime type of the file.
    /// "image/png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_type: Option<ContentTypeProperty>,
    /// The name of the file. It will be auto-generated if not provided.
    /// "z9RV14K95DvU.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_name: Option<FileNameProperty>,
    /// The size of the file in bytes.
    /// 4404019
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_size: Option<FileSizeProperty>,
    /// The URL where the file can be downloaded from.
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// The generated video with the lip sync.
    /// {"content_type":"application/octet-stream","file_name":"mmaudio_input.mp4","file_size":1001342,"url":"https://storage.googleapis.com/falserverless/model_tests/video_models/mmaudio_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum ContentTypeProperty {
    #[default]
    String(String),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum FileNameProperty {
    #[default]
    String(String),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum FileSizeProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum SeedProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

/// MMAudio V2
///
/// Category: video-to-video
/// Machine Type: A100
pub fn mmaudio_v2(params: BaseInput) -> FalRequest<BaseInput, Output> {
    FalRequest::new("fal-ai/mmaudio-v2", params)
}
