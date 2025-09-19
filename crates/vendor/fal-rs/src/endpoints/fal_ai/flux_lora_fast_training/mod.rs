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
    /// URL to the preprocessed images.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub debug_preprocessed_output: Option<Option<File>>,
    /// URL to the trained diffusers lora weights.
    pub diffusers_lora_file: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PublicInput {
    /// If True segmentation masks will be used in the weight the training loss. For people a face mask is used if possible.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub create_masks: Option<bool>,
    /// The format of the archive. If not specified, the format will be inferred from the URL.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_archive_format: Option<String>,
    /// URL to zip archive with images. Try to use at least 4 images in general the more the better.
    ///
    /// In addition to images the archive can contain text files with captions. Each text file should have the same name as the image file it corresponds to.
    pub images_data_url: String,
    /// Specifies whether the input data is already in a processed format. When set to False (default), the system expects raw input where image files and their corresponding caption files share the same name (e.g., 'photo.jpg' and 'photo.txt'). Set to True if your data is already in a preprocessed format.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_input_format_already_preprocessed: Option<bool>,
    /// If True, the training will be for a style. This will deactivate segmentation, captioning and will use trigger word instead. Use the trigger word to specify the style.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_style: Option<bool>,
    /// Number of steps to train the LoRA on.
    /// 1000
    #[serde(skip_serializing_if = "Option::is_none")]
    pub steps: Option<i64>,
    /// Trigger word to be used in the captions. If None, a trigger word will not be used.
    /// If no captions are provide the trigger_word will be used instead of captions. If captions are the trigger word will not be used.
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

/// Train Flux LoRA
///
/// Category: training
/// Machine Type: A100
///
///
/// FLUX LoRA fine-tuning endpoint.
///
/// This endpoint fine-tunes a LoRA model on a dataset of images.
/// By default the fine-tuning process is configured for preprocessing a subject.
/// The training will generate both segmentation masks and caption for training.
///
/// If the `is_style` flag is set to `True`,
/// the training a style LoRA, which disables auto-captioning and sengmentation.
///
/// To provide your own captions, you can include a text file with the same name as
/// the image file. For example, if you have an image `photo.jpg`, you can include a
/// text file `photo.txt` with the caption.
///
/// Additionally you can include your own masks for the images. If you have a image
/// `photo.jpg`, you can include a mask file `photo_mask.jpg`.
pub fn flux_lora_fast_training(params: PublicInput) -> FalRequest<PublicInput, Output> {
    FalRequest::new("fal-ai/flux-lora-fast-training", params)
}
