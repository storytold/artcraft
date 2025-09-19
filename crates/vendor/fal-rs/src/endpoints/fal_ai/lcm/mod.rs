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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
    pub height: i64,
    pub url: String,
    pub width: i64,
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
pub struct LCMInput {
    /// If set to true, the inpainting pipeline will use controlnet inpainting.
    /// Only effective for inpainting pipelines.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnet_inpaint: Option<bool>,
    /// If set to true, the resulting image will be checked whether it includes any
    /// potentially unsafe content. If it does, it will be replaced with a black
    /// image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checks: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image. You can choose between some presets or
    /// custom height and width that **must be multiples of 8**.
    ///
    /// If not provided:
    /// - For text-to-image generations, the default size is 512x512.
    /// - For image-to-image generations, the default size is the same as the input image.
    /// - For inpainting generations, the default size is the same as the input image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The base image to use for guiding the image generation on image-to-image
    /// generations. If the either width or height of the image is larger than 1024
    /// pixels, the image will be resized to 1024 pixels while keeping the aspect ratio.
    /// "https://storage.googleapis.com/falserverless/model_tests/lcm/inpaint_image.png"
    /// "https://storage.googleapis.com/falserverless/model_tests/lcm/beach.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    /// If set to true, the inpainting pipeline will only inpaint the provided mask
    /// area. Only effective for inpainting pipelines.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inpaint_mask_only: Option<bool>,
    /// The scale of the lora server to use for image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lora_scale: Option<f64>,
    /// The url of the lora server to use for image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lora_url: Option<String>,
    /// The mask to use for guiding the image generation on image
    /// inpainting. The model will focus on the mask area and try to fill it with
    /// the most relevant content.
    ///
    /// The mask must be a black and white image where the white area is the area
    /// that needs to be filled and the black area is the area that should be
    /// ignored.
    ///
    /// The mask must have the same dimensions as the image passed as `image_url`.
    /// "https://storage.googleapis.com/falserverless/model_tests/lcm/inpaint_mask.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_url: Option<String>,
    /// The model to use for generating the image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    /// The negative prompt to use.Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    /// "cartoon, illustration, animation. face. male, female"
    /// "ugly, deformed"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of images to generate. The function will return a list of images
    /// with the same prompt and negative prompt but different seeds.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to use for generating the image. The more steps
    /// the better the image will be but it will also take longer to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "a black cat with glowing eyes, cute, adorable, disney, pixar, highly detailed, 8k"
    /// "an island near sea, with seagulls, moon shining over the sea, light house, boats int he background, fish flying over the sea"
    pub prompt: String,
    /// An id bound to a request, can be used with response to identify the request
    /// itself.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    /// 42
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The strength of the image that is passed as `image_url`. The strength
    /// determines how much the generated image will be similar to the image passed as
    /// `image_url`. The higher the strength the more model gets "creative" and
    /// generates an image that's different from the initial image. A strength of 1.0
    /// means that the initial image is more or less ignored and the model will try to
    /// generate an image that's as close as possible to the prompt.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strength: Option<f64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LCMOutput {
    /// The generated image files info.
    pub images: Vec<Image>,
    /// A list of booleans indicating whether the generated image contains any
    /// potentially unsafe content. If the safety check is disabled, this field
    /// will all will be false.
    pub nsfw_content_detected: Vec<bool>,
    /// Number of inference steps used to generate the image. It will be the same value of the one passed in the
    /// input or the default one in case none was passed.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// An id bound to a request, can be used with response to identify the request
    /// itself.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
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

/// Latent Consistency (SDXL & SDv1.5)
///
/// Category: text-to-image
/// Machine Type: A100
///
///
/// Generates an image using the given prompt and model.
///
/// If only the prompt is given, the model will generate an image from scratch, this
/// process is also known as "text-to-image".
///
/// If an image is given (via `image_url` parameter), the model will generate an image
/// that's similar to the given image depending on the `strength` parameter. This
/// process is also known as "image-to-image".
///
/// If an image and a mask are given (via `image_url` and `mask_url` parameters), the
/// model will generate an image that fills the mask area with the most relevant
/// content from the given image. This process is also known as "inpainting".
pub fn lcm(params: LCMInput) -> FalRequest<LCMInput, LCMOutput> {
    FalRequest::new("fal-ai/lcm", params)
}
