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
pub struct LCMI2IInput {
    /// If set to true, the resulting image will be checked whether it includes any
    /// potentially unsafe content. If it does, it will be replaced with a black
    /// image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checks: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The image to use as a base.
    /// "https://storage.googleapis.com/falserverless/model_tests/lcm/beach.png"
    pub image_url: String,
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
    /// "masterpiece, colorful, photo of a beach in hawaii, sun"
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
    /// The strength of the image.
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
    /// will have a false for each generated image.
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

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Timings {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "type")]
    pub ty: Option<serde_json::Value>,
}

/// Optimized Latent Consistency (SDv1.5)
///
/// Category: image-to-image
/// Machine Type: A100
pub fn lcm_sd15_i2i(params: LCMI2IInput) -> FalRequest<LCMI2IInput, LCMOutput> {
    FalRequest::new("fal-ai/lcm-sd15-i2i", params)
}
