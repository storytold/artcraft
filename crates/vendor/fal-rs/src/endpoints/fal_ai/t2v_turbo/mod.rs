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
    /// The FPS of the exported video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub export_fps: Option<i64>,
    /// The guidance scale
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The number of frames to generate
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_frames: Option<i64>,
    /// The number of steps to sample
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to generate images from
    /// "a dog wearing vr goggles on a boat"
    pub prompt: String,
    /// The seed to use for the random number generator
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<SeedProperty>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// The URL to the generated video
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

/// T2V Turbo - Video Crafter
///
/// Category: text-to-video
/// Machine Type: A100
pub fn t2v_turbo(params: Input) -> FalRequest<Input, Output> {
    FalRequest::new("fal-ai/t2v-turbo", params)
}
