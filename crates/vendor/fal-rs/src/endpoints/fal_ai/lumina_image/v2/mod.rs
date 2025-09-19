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

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageOutput {
    /// Whether the generated images contain NSFW concepts.
    pub has_nsfw_concepts: Vec<bool>,
    /// The generated images
    /// [{"content_type":"image/jpeg","height":768,"url":"https://v3.fal.media/files/rabbit/pBwaEZysJhnstKWEHGpLc.png","width":1024}]
    pub images: Vec<Image>,
    /// The prompt used for generating the image.
    pub prompt: String,
    /// Seed of the generated Image. It will be the same value of the one passed in the
    /// input or the randomly generated that was used in case none was passed.
    pub seed: i64,
    pub timings: Timings,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageSize {
    /// The height of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<i64>,
    /// The width of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToImageInput {
    /// Whether to normalize the CFG.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cfg_normalization: Option<bool>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    /// ""
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to generate an image from.
    /// "A vibrant and artistic digital composition featuring colorful splashes of paint in the background, creating an energetic and dynamic effect. The text 'Lumina on Fal' is elegantly integrated into the scene, standing out with a modern, bold, and slightly futuristic font. The colors are bright and varied, including neon blues, purples, pinks, and oranges, blending seamlessly in a fluid, abstract style. The text appears slightly illuminated, complementing the vivid splashes around it."
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
    /// The system prompt to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system_prompt: Option<String>,
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
pub enum ImageSizeProperty {
    #[default]
    ImageSize(ImageSize),
    #[serde(rename = "square_hd")]
    SquareHd,
    #[serde(rename = "square")]
    Square,
    #[serde(rename = "portrait_4_3")]
    Portrait43,
    #[serde(rename = "portrait_16_9")]
    Portrait169,
    #[serde(rename = "landscape_4_3")]
    Landscape43,
    #[serde(rename = "landscape_16_9")]
    Landscape169,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Timings {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "type")]
    pub ty: Option<serde_json::Value>,
}

/// Lumina Image 2
///
/// Category: text-to-image
/// Machine Type: A100
/// License Type: commercial
pub fn v2(params: TextToImageInput) -> FalRequest<TextToImageInput, ImageOutput> {
    FalRequest::new("fal-ai/lumina-image/v2", params)
}
