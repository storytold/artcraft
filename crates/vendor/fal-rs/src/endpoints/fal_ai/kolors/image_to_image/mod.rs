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
pub struct KolorsImg2ImgInput {
    /// Enable safety checker.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show
    /// you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// URL of image to use for image to image
    /// "https://storage.googleapis.com/falserverless/model_tests/image_models/bunny_source.png"
    pub image_url: String,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small
    /// details (e.g. moustache, blurry, low resolution).
    /// "ugly, deformed, blurry"
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
    /// "high quality image of a capybara wearing sunglasses. In the background of the image there are trees, poles, grass and other objects. At the bottom of the object there is the road., 8k, highly detailed."
    pub prompt: String,
    /// The scheduler to use for the model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scheduler: Option<String>,
    /// Seed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The strength to use for image-to-image. 1.0 is completely remakes the image while 0.0 preserves the original.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strength: Option<f64>,
    /// If set to true, the function will wait for the image to be generated and
    /// uploaded before returning the response. This will increase the latency of
    /// the function but it allows you to get the image directly in the response
    /// without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct KolorsInput {
    /// Enable safety checker.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show
    /// you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small
    /// details (e.g. moustache, blurry, low resolution).
    /// "ugly, deformed, blurry"
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
    /// The prompt to use for generating the image. Be as descriptive as possible
    /// for best results.
    /// "A young Chinese couple with fair skin, dressed in stylish sportswear, with the modern Beijing city skyline in the background. Facial details, clear pores, captured using the latest camera model, close-up shot, ultra-high quality, 8K, visual feast."
    /// "The image features four mythical beasts: Vermilion Bird, Black Tortoise, Azure Dragon, and White Tiger. The Vermilion Bird is at the top of the image, with feathers as red as fire and a tail as magnificent as a phoenix, its wings spreading like burning flames. The Black Tortoise is at the bottom, depicted as a giant turtle intertwined with a snake. Ancient runes adorn the turtle's shell, and the snake's eyes are cold and sharp. The Azure Dragon is on the right, its long body coiling in the sky, with jade-green scales, flowing whiskers, deer-like horns, and exhaling clouds and mist. The White Tiger is on the left, with a majestic posture, white fur with black stripes, piercing eyes, sharp teeth and claws, surrounded by vast mountains and grasslands."
    pub prompt: String,
    /// The scheduler to use for the model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scheduler: Option<String>,
    /// Seed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and
    /// uploaded before returning the response. This will increase the latency of
    /// the function but it allows you to get the image directly in the response
    /// without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
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

/// Kolors
///
/// Category: text-to-image
/// Machine Type: A6000
/// License Type: commercial
pub fn image_to_image(params: KolorsImg2ImgInput) -> FalRequest<KolorsImg2ImgInput, Output> {
    FalRequest::new("fal-ai/kolors/image-to-image", params)
}
