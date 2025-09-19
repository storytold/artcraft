#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DreamshaperImageToImageInput {
    /// The list of embeddings to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub embeddings: Option<Vec<Option<Embedding>>>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// If set to true, the prompt will be expanded with additional prompts.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_prompt: Option<bool>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<String>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The URL of the image to use as a starting point for the generation.
    /// "https://fal-cdn.batuhan-941.workers.dev/files/tiger/IExuP-WICqaIesLZAZPur.jpeg"
    pub image_url: String,
    /// The list of LoRA weights to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// The Dreamshaper model to use.
    /// "Lykon/dreamshaper-8"
    /// "Lykon/dreamshaper-xl-1-0"
    /// "Lykon/dreamshaper-xl-v2-turbo"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_name: Option<String>,
    /// The negative prompt to use.Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    /// "cartoon, illustration, animation. face. male, female"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "an island near sea, with seagulls, moon shining over the sea, light house, boats int he background, fish flying over the sea"
    pub prompt: String,
    /// The version of the safety checker to use. v1 is the default CompVis safety checker. v2 uses a custom ViT model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_checker_version: Option<String>,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// determines how much the generated image resembles the initial image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strength: Option<f64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DreamshaperInpaintingInput {
    /// The list of embeddings to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub embeddings: Option<Vec<Option<Embedding>>>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// If set to true, the prompt will be expanded with additional prompts.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_prompt: Option<bool>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<String>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The URL of the image to use as a starting point for the generation.
    /// "https://raw.githubusercontent.com/CompVis/latent-diffusion/main/data/inpainting_examples/overture-creations-5sI6fQgYIuo.png"
    pub image_url: String,
    /// The list of LoRA weights to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// The URL of the mask to use for inpainting.
    /// "https://raw.githubusercontent.com/CompVis/latent-diffusion/main/data/inpainting_examples/overture-creations-5sI6fQgYIuo_mask.png"
    pub mask_url: String,
    /// The Dreamshaper model to use.
    /// "Lykon/dreamshaper-8"
    /// "Lykon/dreamshaper-xl-1-0"
    /// "Lykon/dreamshaper-xl-v2-turbo"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_name: Option<String>,
    /// The negative prompt to use.Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    /// "cartoon, illustration, animation. face. male, female"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "a tiger sitting on a park bench"
    pub prompt: String,
    /// The version of the safety checker to use. v1 is the default CompVis safety checker. v2 uses a custom ViT model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_checker_version: Option<String>,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// determines how much the generated image resembles the initial image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strength: Option<f64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DreamshaperTextToImageInput {
    /// The list of embeddings to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub embeddings: Option<Vec<Option<Embedding>>>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// If set to true, the prompt will be expanded with additional prompts.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_prompt: Option<bool>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<String>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The list of LoRA weights to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// The Dreamshaper model to use.
    /// "Lykon/dreamshaper-8"
    /// "Lykon/dreamshaper-xl-1-0"
    /// "Lykon/dreamshaper-xl-v2-turbo"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_name: Option<String>,
    /// The negative prompt to use. Use it to address details that you don't want in the image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "A hyperdetailed photograph of a Cat dressed as a mafia boss holding a fish walking down a Japanese fish market with an angry face, 8k resolution, best quality, beautiful photograph, dynamic lighting,"
    pub prompt: String,
    /// The version of the safety checker to use. v1 is the default CompVis safety checker. v2 uses a custom ViT model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_checker_version: Option<String>,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
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
pub struct Embedding {
    /// URL or the path to the embedding weights.
    /// "https://civitai.com/api/download/models/135931"
    /// "https://filebin.net/3chfqasxpqu21y8n/my-custom-lora-v1.safetensors"
    pub path: String,
    /// The list of tokens to use for the embedding.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tokens: Option<Vec<Option<String>>>,
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
    /// If set to true, the embedding will be forced to be used.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub force: Option<bool>,
    /// URL or the path to the LoRA weights. Or HF model name.
    /// "https://civitai.com/api/download/models/135931"
    /// "https://filebin.net/3chfqasxpqu21y8n/my-custom-lora-v1.safetensors"
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

/// Dreamshaper
///
/// Category: text-to-image
/// Machine Type: A100
pub fn image_to_image(
    params: DreamshaperImageToImageInput,
) -> FalRequest<DreamshaperImageToImageInput, Output> {
    FalRequest::new("fal-ai/dreamshaper/image-to-image", params)
}
