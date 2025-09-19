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
    /// The rate at which the model learns. Higher values can lead to faster training, but over-fitting.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub learning_rate: Option<f64>,
    /// The number of steps to train for.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub number_of_steps: Option<i64>,
    /// URL to zip archive with images of a consistent style. Try to use at least 10 images and/or videos, although more is better.
    ///
    /// In addition to images the archive can contain text files with captions. Each text file should have the same name as the image/video file it corresponds to.
    pub training_data_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// Configuration used for setting up the inference endpoints.
    pub config_file: File,
    /// URL to the trained LoRA weights.
    pub lora_file: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Wan-2.1 LoRA Trainer
///
/// Category: training
/// Machine Type: H100
pub fn wan_trainer(params: Input) -> FalRequest<Input, Output> {
    FalRequest::new("fal-ai/wan-trainer", params)
}
