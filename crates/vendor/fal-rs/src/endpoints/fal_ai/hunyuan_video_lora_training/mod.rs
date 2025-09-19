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

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// URL to the lora configuration file.
    pub config_file: File,
    /// URL to the trained diffusers lora weights.
    pub diffusers_lora_file: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PublicInput {
    /// The format of the archive. If not specified, the format will be inferred from the URL.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_archive_format: Option<DataArchiveFormatProperty>,
    /// Whether to generate captions for the images.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub do_caption: Option<bool>,
    /// URL to zip archive with images. Try to use at least 4 images in general the more the better.
    ///
    /// In addition to images the archive can contain text files with captions. Each text file should have the same name as the image file it corresponds to.
    pub images_data_url: String,
    /// Learning rate to use for training.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub learning_rate: Option<f64>,
    /// Number of steps to train the LoRA on.
    /// 1000
    pub steps: i64,
    /// The trigger word to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trigger_word: Option<String>,
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
pub enum DataArchiveFormatProperty {
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

/// Train Hunyuan LoRA
///
/// Category: training
/// Machine Type: A100
///
///
/// Hunyuan Video LoRA fine-tuning endpoint.
///
/// This endpoint fine-tunes a LoRA model on a dataset of images.
///
/// To provide your own captions, you can include a text file with the same name as
/// the image file. For example, if you have an image `photo.jpg`, you can include a
/// text file `photo.txt` with the caption.
pub fn hunyuan_video_lora_training(params: PublicInput) -> FalRequest<PublicInput, Output> {
    FalRequest::new("fal-ai/hunyuan-video-lora-training", params)
}
