#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FaceToStickerInput {
    /// If set to false, the safety checker will be disabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// URL of the video.
    /// "https://storage.googleapis.com/falserverless/model_tests/face_to_sticker/elon.jpg"
    pub image_url: String,
    /// The strength of the instant ID.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub instant_id_strength: Option<f64>,
    /// The amount of noise to add to the IP adapter.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_adapter_noise: Option<f64>,
    /// The weight of the IP adapter.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_adapter_weight: Option<f64>,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Increasing the amount of steps tells Stable Diffusion that it should take more steps
    /// to generate your final result which can increase the amount of detail in your image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "a person"
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Whether to upscale the image 2x.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub upscale: Option<bool>,
    /// The number of steps to use for upscaling. Only used if `upscale` is `true`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub upscale_steps: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FaceToStickerOutput {
    /// Whether the generated images contain NSFW concepts.
    /// The key is the image type and the value is a boolean.
    /// {"sticker_image":false,"sticker_image_background_removed":false}
    pub has_nsfw_concepts: HasNsfwConcepts,
    /// The generated images.
    /// [{"content_type":"image/PNG","file_name":"cd8bab71b946470099d5fa20c7eed440.png","file_size":560358,"height":1024,"url":"https://storage.googleapis.com/falserverless/model_tests/face_to_sticker/elon_output_1.png","width":1024},{"content_type":"image/PNG","file_name":"181ae8fa12534c6f9285a991b415d9a7.png","file_size":452906,"height":1024,"url":"https://storage.googleapis.com/falserverless/model_tests/face_to_sticker/elon_output_2.png","width":1024}]
    pub images: Vec<Image>,
    /// Seed used during the inference.
    /// 3625437076
    pub seed: i64,
    /// The generated face sticker image.
    /// {"content_type":"image/PNG","file_name":"cd8bab71b946470099d5fa20c7eed440.png","file_size":560358,"height":1024,"url":"https://storage.googleapis.com/falserverless/model_tests/face_to_sticker/elon_output_1.png","width":1024}
    pub sticker_image: Image,
    /// The generated face sticker image with the background removed.
    /// {"content_type":"image/PNG","file_name":"181ae8fa12534c6f9285a991b415d9a7.png","file_size":452906,"height":1024,"url":"https://storage.googleapis.com/falserverless/model_tests/face_to_sticker/elon_output_2.png","width":1024}
    pub sticker_image_background_removed: Image,
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
pub struct ImageSize {
    /// The height of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<i64>,
    /// The width of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HasNsfwConcepts {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "type")]
    pub ty: Option<serde_json::Value>,
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

/// Face to Sticker
///
/// Category: image-to-image
/// Machine Type: A100
/// License Type: research
pub fn face_to_sticker(
    params: FaceToStickerInput,
) -> FalRequest<FaceToStickerInput, FaceToStickerOutput> {
    FalRequest::new("fal-ai/face-to-sticker", params)
}
