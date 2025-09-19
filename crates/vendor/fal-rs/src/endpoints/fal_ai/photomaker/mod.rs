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
pub struct PhotoMakerInput {
    /// The base pipeline to use for generating the image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_pipeline: Option<String>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The URL of the image archive containing the images you want to use.
    /// "https://storage.googleapis.com/falserverless/model_tests/photomaker/elon.zip"
    pub image_archive_url: String,
    /// How much noise to add to the latent image. O for no noise, 1 for maximum noise.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub initial_image_strength: Option<f64>,
    /// Optional initial image for img2img
    #[serde(skip_serializing_if = "Option::is_none")]
    pub initial_image_url: Option<String>,
    /// The negative prompt to use.Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    /// "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of images to generate in one request. Note that the higher the batch size,
    /// the longer it will take to generate the images.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// Increasing the amount of steps tells Stable Diffusion that it should take more steps
    /// to generate your final result which can increase the amount of detail in your image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "instagram photo, portrait photo of a man img, colorful, perfect face, natural skin, hard shadows, film grain"
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    /// 42
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style_strength: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PhotoMakerOutput {
    pub images: Vec<Image>,
    pub seed: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// PhotoMaker
///
/// Category: image-to-image
/// Machine Type: A6000
pub fn photomaker(params: PhotoMakerInput) -> FalRequest<PhotoMakerInput, PhotoMakerOutput> {
    FalRequest::new("fal-ai/photomaker", params)
}
