#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FillInput {
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// Use an image fill input to fill in particular images into the masked area.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fill_image: Option<Option<ImageFillInput>>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// URL of image to use for fill operation
    /// "https://storage.googleapis.com/falserverless/flux-lora/example-images/knight.jpeg"
    pub image_url: String,
    /// The LoRAs to use for the image generation. You can use any number of LoRAs
    /// and they will be merged together to generate the final image.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// The mask to area to Inpaint in.
    /// "https://storage.googleapis.com/falserverless/flux-lora/example-images/mask_knight.jpeg"
    pub mask_url: String,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// Specifies whether to paste-back the original image onto to the non-inpainted areas of the output
    #[serde(skip_serializing_if = "Option::is_none")]
    pub paste_back: Option<bool>,
    /// The prompt to generate an image from.
    /// "A knight in shining armour holding a greatshield with 'FAL' on it"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    /// Resizes the image back to the original size. Use when you wish to preserve the exact image size as the originally provided image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resize_to_original: Option<bool>,
    /// The same seed and the same prompt given to the same version of the model
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
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Image {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
    pub height: i64,
    pub url: String,
    pub width: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageFillInput {
    /// URLs of images to be filled into the masked area.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fill_image_url: Option<FillImageUrlProperty>,
    /// Uses the provided fill image in context with the base image to fill in more faithfully. Will increase price.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub in_context_fill: Option<bool>,
    /// Whether to use the prompt as well in the generation, along with the redux image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_prompt: Option<bool>,
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
pub struct LoraWeight {
    /// URL or the path to the LoRA weights.
    pub path: String,
    /// The scale of the LoRA weight. This is used to scale the LoRA weight
    /// before merging it with the base model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// Whether the generated images contain NSFW concepts.
    pub has_nsfw_concepts: Vec<bool>,
    /// The generated image files info.
    pub images: Vec<Image>,
    /// The prompt used for generating the image.
    pub prompt: String,
    /// Seed of the generated Image. It will be the same value of the one passed in the
    /// input or the randomly generated that was used in case none was passed.
    pub seed: i64,
    pub timings: Timings,
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
pub enum FillImageUrlProperty {
    #[default]
    Array(Vec<String>),
    String(String),
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

/// FLUX.1 [dev] Fill with LoRAs
///
/// Category: image-to-image
/// Machine Type: H100
/// License Type: commercial
///
/// FLUX.1 [dev], next generation text-to-image model.
pub fn flux_lora_fill(params: FillInput) -> FalRequest<FillInput, Output> {
    FalRequest::new("fal-ai/flux-lora-fill", params)
}
