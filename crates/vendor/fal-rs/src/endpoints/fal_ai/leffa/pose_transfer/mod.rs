#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

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
    /// The height of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<i64>,
    /// The URL where the file can be downloaded from.
    pub url: String,
    /// The width of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PoseTransferInput {
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your input when generating the image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// Url to the garment image.
    /// "https://storage.googleapis.com/falserverless/model_tests/leffa/pose_image.jpg"
    pub person_image_url: String,
    /// Url for the human image.
    /// "https://storage.googleapis.com/falserverless/model_tests/leffa/person_image.jpg"
    pub pose_image_url: String,
    /// The same seed and the same input given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PoseTransferOutput {
    /// Whether the image contains NSFW concepts.
    pub has_nsfw_concepts: bool,
    /// The output image.
    /// {"content_type":"image/jpeg","height":1024,"url":"https://fal.media/files/tiger/y6ZwaYdP9Q92FnsJcSbYz.png","width":768}
    pub image: Image,
    /// The seed for the inference.
    pub seed: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VTONInput {
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// Url to the garment image.
    /// "https://storage.googleapis.com/falserverless/model_tests/leffa/tshirt_image.jpg"
    pub garment_image_url: String,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your input when generating the image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// Url for the human image.
    /// "https://storage.googleapis.com/falserverless/model_tests/leffa/person_image.jpg"
    pub human_image_url: String,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The same seed and the same input given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VTONOutput {
    /// Whether the image contains NSFW concepts.
    pub has_nsfw_concepts: bool,
    /// The output image.
    /// {"content_type":"image/jpeg","height":1024,"url":"https://fal.media/files/elephant/9NTQQNo9eyiQUSLa6cYBW.png","width":768}
    pub image: Image,
    /// The seed for the inference.
    pub seed: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Leffa Virtual TryOn
///
/// Category: image-to-image
/// Machine Type: A100
/// License Type: commercial
pub fn pose_transfer(
    params: PoseTransferInput,
) -> FalRequest<PoseTransferInput, PoseTransferOutput> {
    FalRequest::new("fal-ai/leffa/pose-transfer", params)
}
