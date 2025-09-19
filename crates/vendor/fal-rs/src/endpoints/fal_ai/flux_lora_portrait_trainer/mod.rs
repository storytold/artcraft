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

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// URL to the training configuration file.
    pub config_file: File,
    /// URL to the trained diffusers lora weights.
    pub diffusers_lora_file: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PublicInput {
    /// The format of the archive. If not specified, the format will be inferred from the URL.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_archive_format: Option<String>,
    /// URL to zip archive with images of a consistent style. Try to use at least 10 images, although more is better.
    ///
    /// In addition to images the archive can contain text files with captions. Each text file should have the same name as the image file it corresponds to.
    ///
    /// The captions can include a special string `[trigger]`. If a trigger_word is specified, it will replace `[trigger]` in the captions.
    pub images_data_url: String,
    /// Learning rate to use for training.
    /// 0.0002
    #[serde(skip_serializing_if = "Option::is_none")]
    pub learning_rate: Option<f64>,
    /// If True, multiresolution training will be used.
    /// true
    #[serde(skip_serializing_if = "Option::is_none")]
    pub multiresolution_training: Option<bool>,
    /// URL to a checkpoint to resume training from.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resume_from_checkpoint: Option<String>,
    /// Number of steps to train the LoRA on.
    /// 1000
    #[serde(skip_serializing_if = "Option::is_none")]
    pub steps: Option<i64>,
    /// If True, the subject will be cropped from the image.
    /// true
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subject_crop: Option<bool>,
    /// Trigger phrase to be used in the captions. If None, a trigger word will not be used.
    /// If no captions are provide the trigger_work will be used instead of captions. If captions are provided, the trigger word will replace the `[trigger]` string in the captions.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trigger_phrase: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Train Flux LoRAs For Portraits
///
/// Category: training
/// Machine Type: H100
pub fn flux_lora_portrait_trainer(params: PublicInput) -> FalRequest<PublicInput, Output> {
    FalRequest::new("fal-ai/flux-lora-portrait-trainer", params)
}
