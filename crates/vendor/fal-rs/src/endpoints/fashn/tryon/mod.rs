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
pub struct Input {
    /// Allow to change the appearance of the model’s hands. Example use-cases: Remove gloves, get hands out of pockets, long sleeves that should cover hands.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub adjust_hands: Option<bool>,
    /// Category of the garment to try-on.
    pub category: String,
    /// Allows long garments to cover the feet/shoes or change their appearance.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cover_feet: Option<bool>,
    /// URL or base64 of the garment image
    /// "https://utfs.io/f/wXFHUNfTHmLjtkhepmqOUnkr8XxZbNIFmRWldShDLu320TeC"
    pub garment_image: String,
    /// Specifies the type of garment photo to optimize internal parameters for better performance. 'model' is for photos of garments on a model, 'flat-lay' is for flat-lay or ghost mannequin images, and 'auto' attempts to automatically detect the photo type.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub garment_photo_type: Option<String>,
    /// Higher guidance scales can help with preserving garment detail, but risks oversaturated colors.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// Adjusts internal parameters for better performance on long tops such as: Longline shirts, tunics, coats, etc.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub long_top: Option<bool>,
    /// URL or base64 of the model image
    /// "https://utfs.io/f/wXFHUNfTHmLj4prvqbRMQ6JXFyUr3IT0avK2HSOmZWiAsxg9"
    pub model_image: String,
    /// Runs NSFW content filter on inputs.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nsfw_filter: Option<bool>,
    /// Number of images to generate in a single run. Image generation has a random element in it, so trying multiple images at once increases the chances of getting a good result.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_samples: Option<i64>,
    /// Apply additional steps to preserve the original background. Runtime will be slower. Not needed for simple backgrounds.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub restore_background: Option<bool>,
    /// Apply additional steps to preserve the appearance of clothes that weren’t swapped (e.g. keep pants if trying-on top).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub restore_clothes: Option<bool>,
    /// Sets random operations to a fixed state. Use the same seed to reproduce results with the same inputs, or different seed to force different results.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Determines how many steps the diffusion model will take to generate the image. For simple try-ons, steps can be reduced for faster runtime.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timesteps: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// URLs of the generated images
    pub images: Vec<Image>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// FASHN Virtual Try-On
///
/// Category: image-to-image
/// Machine Type: H100
/// License Type: commercial
pub fn tryon(params: Input) -> FalRequest<Input, Output> {
    FalRequest::new("fashn/tryon", params)
}
