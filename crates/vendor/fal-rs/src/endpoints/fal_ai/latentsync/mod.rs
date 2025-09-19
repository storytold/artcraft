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

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Input {
    /// The URL of the audio to generate the lip sync for.
    /// "https://fal.media/files/lion/vyFWygmZsIZlUO4s0nr2n.wav"
    pub audio_url: String,
    /// Guidance scale for the model inference
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// Video loop mode when audio is longer than video. Options: pingpong, loop
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loop_mode: Option<LoopModeProperty>,
    /// Random seed for generation. If None, a random seed will be used.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<SeedProperty>,
    /// The URL of the video to generate the lip sync for.
    /// "https://fal.media/files/koala/8teUPbRRMtAUTORDvqy0l.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// The generated video with the lip sync.
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
pub enum LoopModeProperty {
    #[default]
    #[serde(rename = "pingpong")]
    Pingpong,
    #[serde(rename = "loop")]
    Loop,
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum SeedProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

/// LatentSync
///
/// Category: video-to-video
///
/// License Type: commercial
pub fn latentsync(params: Input) -> FalRequest<Input, Output> {
    FalRequest::new("fal-ai/latentsync", params)
}
