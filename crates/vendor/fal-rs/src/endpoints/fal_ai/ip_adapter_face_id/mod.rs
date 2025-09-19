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
pub struct IpAdapterFaceIdInput {
    /// The URL to the base 1.5 model. Default is SG161222/Realistic_Vision_V4.0_noVAE
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_1_5_model_repo: Option<String>,
    /// The URL to the base SDXL model. Default is SG161222/RealVisXL_V3.0
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_sdxl_model_repo: Option<String>,
    /// The size of the face detection model. The higher the number the more accurate
    /// the detection will be but it will also take longer to run. The higher the number the more
    /// likely it will fail to find a face as well. Lower it if you are having trouble
    /// finding a face in the image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub face_id_det_size: Option<i64>,
    /// An image of a face to match. If an image with a size of 640x640 is not provided, it will be scaled and cropped to that size.
    /// "https://storage.googleapis.com/falserverless/model_tests/upscale/image%20(8).png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub face_image_url: Option<String>,
    /// URL to zip archive with images of faces. The images embedding will be averaged to
    /// create a more accurate face id.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub face_images_data_url: Option<String>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The height of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<i64>,
    /// The model type to use. 1_5 is the default and is recommended for most use cases.
    /// "1_5-v1"
    /// "1_5-v1-plus"
    /// "1_5-v2-plus"
    /// "SDXL-v1"
    /// "SDXL-v2-plus"
    /// "1_5-auraface-v1"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_type: Option<String>,
    /// The negative prompt to use.Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    /// "blurry, low resolution, bad, ugly, low quality, pixelated, interpolated, compression artifacts, noisey, grainy"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of inference steps to use for generating the image. The more steps
    /// the better the image will be but it will also take longer to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The number of samples for face id. The more samples the better the image will
    /// be but it will also take longer to generate. Default is 4.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_samples: Option<i64>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "Man cyberpunk, synthwave night city, futuristic, high quality, highly detailed, high resolution, sharp, hyper realistic, extremely detailed"
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    /// 42
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The width of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IpAdapterFaceIdOutput {
    /// The generated image file info.
    pub image: Image,
    /// Seed of the generated Image. It will be the same value of the one passed in the
    /// input or the randomly generated that was used in case none was passed.
    pub seed: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// IP Adapter Face ID
///
/// Category: image-to-image
/// Machine Type: A6000
/// License Type: research
pub fn ip_adapter_face_id(
    params: IpAdapterFaceIdInput,
) -> FalRequest<IpAdapterFaceIdInput, IpAdapterFaceIdOutput> {
    FalRequest::new("fal-ai/ip-adapter-face-id", params)
}
