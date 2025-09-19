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
    pub images: Vec<File>,
    /// Seed used for generation
    /// 42
    pub seed: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ReferenceImage {
    /// URL to the reference image file (PNG format recommended)
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SubjectCustomizeInput {
    /// A description of what to discourage in the generated images
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of images to generate (1-4)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The text prompt describing what you want to see, using [1] to reference the subject
    /// "Image of [1] in sunglasses posing as an astronaut in the moon"
    pub prompt: String,
    /// 1-4 reference images of the subject to customize
    /// [{"image_url":"https://raw.githubusercontent.com/google/dreambooth/refs/heads/main/dataset/dog/01.jpg"},{"image_url":"https://raw.githubusercontent.com/google/dreambooth/refs/heads/main/dataset/dog/02.jpg"}]
    pub reference_images: Vec<ReferenceImage>,
    /// Random seed for reproducible generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Optional description of the subject in the reference images
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subject_description: Option<String>,
    /// Type of subject in the reference images
    /// "animal"
    pub subject_type: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToImageInput {
    /// The aspect ratio of the generated image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// A description of what to discourage in the generated images
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of images to generate (1-4)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The text prompt describing what you want to see
    /// "A serene landscape with mountains reflected in a crystal clear lake at sunset"
    pub prompt: String,
    /// Random seed for reproducible generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Imagen3
///
/// Category: text-to-image
///
///
///
/// Generate images using Google's Imagen 3 Fast model for lower latency.
///
/// A faster version of Imagen 3 that maintains high quality while providing:
/// - Quicker generation times
/// - Support for diverse art styles
/// - Good prompt understanding
/// - Reliable text rendering
pub fn fast(params: TextToImageInput) -> FalRequest<TextToImageInput, Output> {
    FalRequest::new("fal-ai/imagen3/fast", params)
}
