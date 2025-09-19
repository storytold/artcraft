#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CannyInput {
    /// High threshold for the hysteresis procedure. Edges with a strength higher than the high threshold will always appear as edges in the output image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub high_threshold: Option<i64>,
    /// URL of the image to process
    /// "https://storage.googleapis.com/falserverless/model_tests/image_preprocessors/cat.png"
    pub image_url: String,
    /// Low threshold for the hysteresis procedure. Edges with a strength higher than the low threshold will appear in the output image, if there are strong edges nearby.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub low_threshold: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CannyOutput {
    /// Image with edges detected using the Canny algorithm
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DepthAnythingV2Input {
    /// URL of the image to process
    /// "https://storage.googleapis.com/falserverless/model_tests/image_preprocessors/cat.png"
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DepthAnythingV2Output {
    /// Image with depth map
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HEDInput {
    /// URL of the image to process
    /// "https://storage.googleapis.com/falserverless/model_tests/image_preprocessors/cat.png"
    pub image_url: String,
    /// Whether to use the safe version of the HED detector
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safe: Option<bool>,
    /// Whether to use the scribble version of the HED detector
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scribble: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HEDOutput {
    /// Image with lines detected using the HED detector
    pub image: Image,
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
pub struct LineartInput {
    /// Whether to use the coarse model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub coarse: Option<bool>,
    /// URL of the image to process
    /// "https://storage.googleapis.com/falserverless/model_tests/image_preprocessors/cat.png"
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LineartOutput {
    /// Image with edges detected using the Canny algorithm
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MLSDInput {
    /// Distance threshold for the MLSD detector
    #[serde(skip_serializing_if = "Option::is_none")]
    pub distance_threshold: Option<f64>,
    /// URL of the image to process
    /// "https://storage.googleapis.com/falserverless/model_tests/image_preprocessors/cat.png"
    pub image_url: String,
    /// Score threshold for the MLSD detector
    #[serde(skip_serializing_if = "Option::is_none")]
    pub score_threshold: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MLSDOutput {
    /// Image with lines detected using the MLSD detector
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MiDaSInput {
    /// A parameter for the MiDaS detector
    #[serde(skip_serializing_if = "Option::is_none")]
    pub a: Option<f64>,
    /// Background threshold for the MiDaS detector
    #[serde(skip_serializing_if = "Option::is_none")]
    pub background_threshold: Option<f64>,
    /// URL of the image to process
    /// "https://storage.googleapis.com/falserverless/model_tests/image_preprocessors/cat.png"
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MiDaSOutput {
    /// Image with MiDaS depth map
    pub depth_map: Image,
    /// Image with MiDaS normal map
    pub normal_map: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PiDiInput {
    /// Whether to apply the filter to the image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub apply_filter: Option<bool>,
    /// URL of the image to process
    /// "https://storage.googleapis.com/falserverless/model_tests/image_preprocessors/cat.png"
    pub image_url: String,
    /// Whether to use the safe version of the Pidi detector
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safe: Option<bool>,
    /// Whether to use the scribble version of the Pidi detector
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scribble: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PiDiOutput {
    /// Image with Pidi lines detected
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SamInput {
    /// URL of the image to process
    /// "https://storage.googleapis.com/falserverless/model_tests/image_preprocessors/cat.png"
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SamOutput {
    /// Image with SAM segmentation map
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ScribbleInput {
    /// URL of the image to process
    /// "https://storage.googleapis.com/falserverless/model_tests/image_preprocessors/cat.png"
    pub image_url: String,
    /// The model to use for the Scribble detector
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    /// Whether to use the safe version of the Scribble detector
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safe: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ScribbleOutput {
    /// Image with lines detected using the Scribble detector
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TeeDInput {
    /// URL of the image to process
    /// "https://storage.googleapis.com/falserverless/model_tests/image_preprocessors/cat.png"
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TeeDOutput {
    /// Image with TeeD lines detected
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ZoeInput {
    /// URL of the image to process
    /// "https://storage.googleapis.com/falserverless/model_tests/image_preprocessors/cat.png"
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ZoeOutput {
    /// Image with depth map
    pub image: Image,
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

/// Image Preprocessors
///
/// Category: image-to-image
/// Machine Type: A6000
pub fn zoe(params: ZoeInput) -> FalRequest<ZoeInput, ZoeOutput> {
    FalRequest::new("fal-ai/image-preprocessors/zoe", params)
}
