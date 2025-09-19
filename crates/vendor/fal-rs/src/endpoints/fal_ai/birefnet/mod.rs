#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_birefnet"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_fal-ai",
        feature = "endpoints_fal-ai_birefnet"
    )))
)]
pub mod v2;

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
    /// URL of the image to remove background from
    /// "https://fal.media/files/panda/K5Rndvzmn1j-OI1VZXDVd.jpeg"
    pub image_url: String,
    /// Model to use for background removal.
    /// The 'General Use (Light)' model is the original model used in the BiRefNet repository.
    /// The 'General Use (Heavy)' model is a slower but more accurate model.
    /// The 'Portrait' model is a model trained specifically for portrait images.
    /// The 'General Use (Light)' model is recommended for most use cases.
    ///
    /// The corresponding models are as follows:
    /// - 'General Use (Light)': BiRefNet-DIS_ep580.pth
    /// - 'General Use (Heavy)': BiRefNet-massive-epoch_240.pth
    /// - 'Portrait': BiRefNet-portrait-TR_P3M_10k-epoch_120.pth
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    /// The resolution to operate on. The higher the resolution, the more accurate the output will be for high res input images.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operating_resolution: Option<String>,
    /// The format of the output image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// Whether to output the mask used to remove the background
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_mask: Option<bool>,
    /// Whether to refine the foreground using the estimated mask
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refine_foreground: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct InputV2 {
    /// URL of the image to remove background from
    /// "https://fal.media/files/panda/K5Rndvzmn1j-OI1VZXDVd.jpeg"
    pub image_url: String,
    /// Model to use for background removal.
    /// The 'General Use (Light)' model is the original model used in the BiRefNet repository.
    /// The 'General Use (Light)' model is the original model used in the BiRefNet repository but trained with 2K images.
    /// The 'General Use (Heavy)' model is a slower but more accurate model.
    /// The 'Matting' model is a model trained specifically for matting images.
    /// The 'Portrait' model is a model trained specifically for portrait images.
    /// The 'General Use (Light)' model is recommended for most use cases.
    ///
    /// The corresponding models are as follows:
    /// - 'General Use (Light)': BiRefNet-DIS_ep580.pth
    /// - 'General Use (Heavy)': BiRefNet-massive-epoch_240.pth
    /// - 'Portrait': BiRefNet-portrait-TR_P3M_10k-epoch_120.pth
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    /// The resolution to operate on. The higher the resolution, the more accurate the output will be for high res input images.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operating_resolution: Option<String>,
    /// The format of the output image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// Whether to output the mask used to remove the background
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_mask: Option<bool>,
    /// Whether to refine the foreground using the estimated mask
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refine_foreground: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// Image with background removed
    pub image: Image,
    /// Mask used to remove the background
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_image: Option<Option<Image>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Birefnet Background Removal
///
/// Category: image-to-image
/// Machine Type: A100
pub fn birefnet(params: Input) -> FalRequest<Input, Output> {
    FalRequest::new("fal-ai/birefnet", params)
}
