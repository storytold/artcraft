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
pub struct ImageSize {
    /// The height of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<i64>,
    /// The width of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct InputModel {
    /// Guidance scale
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// if you want to mix two ID image, please turn this on, otherwise, turn this off
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id_mix: Option<bool>,
    /// ID scale
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id_scale: Option<f64>,
    /// Size of the generated image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// Mode of generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode: Option<String>,
    /// Negative prompt to generate the face from
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of images to generate
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// Number of steps to take
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// Prompt to generate the face from
    /// "portrait, impressionist painting, loose brushwork, vibrant color, light and shadow play"
    pub prompt: String,
    /// List of reference faces, ideally 4 images.
    /// [{"image_url":"https://fal.media/files/monkey/CxgWoVIo1BklMncNKpqWB.webp"},{"image_url":"https://fal.media/files/kangaroo/ffgpzpvs4j9BE_B5ol6a1.webp"},{"image_url":"https://fal.media/files/rabbit/glcNYPonhV1_klj_xWhPy.webp"},{"image_url":"https://fal.media/files/rabbit/E4gKiWRvPH4efX24GfhHE.jpeg"}]
    pub reference_images: Vec<ReferenceFace>,
    /// Random seed for reproducibility
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OutputModel {
    /// List of generated images
    pub images: Vec<Image>,
    /// Random seed used for reproducibility
    pub seed: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ReferenceFace {
    /// URL of the reference face image
    pub image_url: String,
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

/// PuLID
///
/// Category: image-to-image
/// Machine Type: A6000
pub fn pulid(params: InputModel) -> FalRequest<InputModel, OutputModel> {
    FalRequest::new("fal-ai/pulid", params)
}
