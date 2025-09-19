#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Era3DInput {
    /// Background removal
    #[serde(skip_serializing_if = "Option::is_none")]
    pub background_removal: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cfg: Option<f64>,
    /// Size of the image to crop to
    #[serde(skip_serializing_if = "Option::is_none")]
    pub crop_size: Option<i64>,
    /// URL of the image to remove background from
    /// "https://storage.googleapis.com/falserverless/model_tests/era3d/DnvGjd9CCS-ESmLgTYgOn.png"
    pub image_url: String,
    /// Seed for random number generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Number of steps to run the model for
    #[serde(skip_serializing_if = "Option::is_none")]
    pub steps: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Era3DOutput {
    /// Images with background removed
    pub images: Vec<Image>,
    /// Normal images with background removed
    pub normal_images: Vec<Image>,
    /// Seed used for random number generation
    pub seed: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Image {
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
    /// The height of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<HeightProperty>,
    /// The URL where the file can be downloaded from.
    pub url: String,
    /// The width of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<WidthProperty>,
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
pub enum HeightProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum WidthProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

/// Era 3D
///
/// Category: image-to-image
/// Machine Type: A100
/// License Type: commercial
pub fn era_3d(params: Era3DInput) -> FalRequest<Era3DInput, Era3DOutput> {
    FalRequest::new("fal-ai/era-3d", params)
}
