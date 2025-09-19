#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BlurMaskInput {
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/workflow_utils/mask_input.png"
    pub image_url: String,
    /// The radius of the Gaussian blur.
    /// 5
    #[serde(skip_serializing_if = "Option::is_none")]
    pub radius: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BlurMaskOutput {
    /// The mask
    /// {"content_type":"image/png","height":700,"url":"https://storage.googleapis.com/falserverless/model_tests/workflow_utils/blur_mask_output.png","width":610}
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CannyInput {
    /// High threshold for the hysteresis procedure
    /// 200
    #[serde(skip_serializing_if = "Option::is_none")]
    pub high_threshold: Option<i64>,
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/workflow_utils/mask_input.png"
    pub image_url: String,
    /// Low threshold for the hysteresis procedure
    /// 100
    #[serde(skip_serializing_if = "Option::is_none")]
    pub low_threshold: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Color {
    /// Blue value
    /// 128
    #[serde(skip_serializing_if = "Option::is_none")]
    pub b: Option<i64>,
    /// Green value
    /// 128
    #[serde(skip_serializing_if = "Option::is_none")]
    pub g: Option<i64>,
    /// Red value
    /// 128
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CompareTextInput {
    /// Text to compare against
    /// "Hello, World!"
    pub compare_text: String,
    /// Text to return if the input text does not match the compare text
    /// "Hello, Universe!"
    pub fail_text: String,
    /// Text to return if the input text matches the compare text
    /// "Hello, World!"
    pub return_text: String,
    /// Input text
    /// "Hello, World!"
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CompositeImageInput {
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/workflow_utils/mask_input.png"
    pub background_image_url: String,
    /// Optional mask image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/workflow_utils/mask_input.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_image_url: Option<String>,
    /// Overlay image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/workflow_utils/mask_input.png"
    pub overlay_image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FaceDetection {
    /// Bounding box of the face.
    /// [0,0,100,100]
    pub bbox: Vec<i64>,
    /// Confidence score of the detection.
    /// 0.9
    pub det_score: f64,
    /// Embedding of the face.
    /// ""
    pub embedding_file: File,
    /// Keypoints of the face.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub kps: Option<Vec<Option<Vec<Option<i64>>>>>,
    /// Keypoints of the face on the image.
    pub kps_image: Image,
    /// Either M or F if available.
    /// "M"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sex: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
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
    /// The URL where the file can be downloaded from.
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GrowMaskInput {
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/workflow_utils/mask_input.png"
    pub image_url: String,
    /// The number of pixels to grow the mask.
    /// 5
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pixels: Option<i64>,
    /// The threshold to convert the image to a mask. 0-255.
    /// 128
    #[serde(skip_serializing_if = "Option::is_none")]
    pub threshold: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GrowMaskOutput {
    /// The mask
    /// {"content_type":"image/png","height":700,"url":"https://storage.googleapis.com/falserverless/model_tests/workflow_utils/grow_output.png","width":610}
    pub image: Image,
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
pub struct ImageInput {
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/workflow_utils/mask_input.png"
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageOutput {
    /// The output image
    /// {"content_type":"image/png","height":700,"url":"https://storage.googleapis.com/falserverless/model_tests/workflow_utils/invert_mask_output.png","width":610}
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageSizeOutput {
    /// Image size
    /// {"height":700,"width":610}
    pub image_size: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct InsertTextInput {
    /// Template to insert text into
    /// "Hello, {}!"
    pub template: String,
    /// Input text
    /// "Hello, World!"
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct InsightfaceInput {
    /// Size of the detection.
    /// 640
    #[serde(skip_serializing_if = "Option::is_none")]
    pub det_size_height: Option<i64>,
    /// Size of the detection.
    /// 640
    #[serde(skip_serializing_if = "Option::is_none")]
    pub det_size_width: Option<i64>,
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/retoucher/GGsAolHXsAA58vn.jpeg"
    pub image_url: String,
    /// Maximum number of faces to detect.
    /// 1
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_face_num: Option<i64>,
    /// URL of the model weights.
    /// "buffalo_l"
    /// "antelopev2"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_url: Option<String>,
    /// Sorting of the faces.
    /// "largest-to-smallest"
    /// "smallest-to-largest"
    /// "left-to-right"
    /// "right-to-left"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sorting: Option<String>,
    /// Whether to run in sync mode.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
    /// Threshold for the edge map.
    /// 0.5
    #[serde(skip_serializing_if = "Option::is_none")]
    pub threshold: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct InsightfaceOutput {
    /// Bounding box of the face.
    /// [0,0,100,100]
    pub bbox: Vec<f64>,
    /// Confidence score of the detection.
    /// 0.9
    pub det_score: f64,
    /// Embedding of the face.
    /// ""
    pub embedding_file: File,
    /// faces detected sorted by size
    pub faces: Vec<FaceDetection>,
    /// Keypoints of the face.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub kps: Option<Vec<Option<Vec<Option<f64>>>>>,
    /// Keypoints of the face on the image.
    pub kps_image: Image,
    /// Either M or F if available.
    /// "M"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sex: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct InvertMaskOutput {
    /// The mask
    /// {"content_type":"image/png","height":700,"url":"https://storage.googleapis.com/falserverless/model_tests/workflow_utils/invert_mask_output.png","width":610}
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MaskInput {
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/workflow_utils/mask_input.png"
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct RGBAToRGBImageInput {
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/workflow_utils/mask_input.png"
    pub image_url: String,
    /// Color to replace the transparent pixels with
    /// {"b":128,"g":128,"r":128}
    pub transparent_color: Color,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct RegexReplaceInput {
    /// Pattern to replace
    /// "World"
    pub pattern: String,
    /// Replacement text
    /// "Universe"
    pub replace: String,
    /// Input text
    /// "Hello, World!"
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ResizeImageInput {
    /// Position of cropping. Only used when mode is 'crop', default is center
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cropping_position: Option<String>,
    /// Height of the resized image
    /// 700
    pub height: i64,
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/workflow_utils/mask_input.png"
    pub image_url: String,
    /// Resizing mode
    pub mode: String,
    /// Color of padding. Only used when mode is 'pad', default is black
    #[serde(skip_serializing_if = "Option::is_none")]
    pub padding_color: Option<String>,
    /// Resizing strategy. Only used when mode is 'scale', default is nearest
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resampling: Option<String>,
    /// Proportions of the image. Only used when mode is 'scale', default is fit
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scaling_proportions: Option<String>,
    /// Width of the resized image
    /// 610
    pub width: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ResizeToPixelsInput {
    /// If set, the output dimensions will be divisible by this value.
    /// 32
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enforce_divisibility: Option<i64>,
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/retoucher/GGsAolHXsAA58vn.jpeg"
    pub image_url: String,
    /// Maximum number of pixels in the output image.
    /// 1000000
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_pixels: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ShrinkMaskInput {
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/workflow_utils/mask_input.png"
    pub image_url: String,
    /// The number of pixels to shrink the mask.
    /// 5
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pixels: Option<i64>,
    /// The threshold to convert the image to a mask. 0-255.
    /// 128
    #[serde(skip_serializing_if = "Option::is_none")]
    pub threshold: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ShrinkMaskOutput {
    /// The mask
    /// {"content_type":"image/png","height":700,"url":"https://storage.googleapis.com/falserverless/model_tests/workflow_utils/shrink_mask_output.png","width":610}
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TeedInput {
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/retoucher/GGsAolHXsAA58vn.jpeg"
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TeedOutput {
    /// The edge map.
    /// {"content_type":"image/png","height":2048,"url":"https://storage.googleapis.com/falserverless/model_tests/workflow_utils/teed_output.png","width":1246}
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextOutput {
    /// The output text
    /// "Hello, World!"
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TransparentImageToMaskInput {
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/workflow_utils/transparent_image_to_mask_input.png"
    pub image_url: String,
    /// The threshold to convert the image to a mask.
    /// 128
    #[serde(skip_serializing_if = "Option::is_none")]
    pub threshold: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransparentImageToMaskOutput {
    /// The mask
    /// {"content_type":"image/png","height":700,"url":"https://storage.googleapis.com/falserverless/model_tests/workflow_utils/transparent_image_to_mask_output.png","width":610}
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Image Preprocessors
///
/// Category: image-to-image
/// Machine Type: A6000
pub fn transparent_image_to_mask(
    params: TransparentImageToMaskInput,
) -> FalRequest<TransparentImageToMaskInput, TransparentImageToMaskOutput> {
    FalRequest::new("fal-ai/workflowutils/transparent-image-to-mask", params)
}
