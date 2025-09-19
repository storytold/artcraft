#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
    /// The mime type of the file.
    /// "image/png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_type: Option<ContentTypeProperty>,
    /// The name of the file. It will be auto-generated if not provided.
    /// "z9RV14K95DvU.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_name: Option<FileNameProperty>,
    /// The size of the file in bytes.
    /// 4404019
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_size: Option<FileSizeProperty>,
    /// The URL where the file can be downloaded from.
    pub url: String,
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
    pub content_type: Option<ContentTypeProperty>,
    /// The name of the file. It will be auto-generated if not provided.
    /// "z9RV14K95DvU.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_name: Option<FileNameProperty>,
    /// The size of the file in bytes.
    /// 4404019
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_size: Option<FileSizeProperty>,
    /// The height of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<HeightProperty>,
    /// The URL where the file can be downloaded from.
    pub url: String,
    /// The width of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<WidthProperty>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ObjectOutput {
    /// Generated 3D object file.
    /// {"content_type":"application/octet-stream","file_name":"base_basic_pbr.glb","file_size":2230472,"url":"https://v3.fal.media/files/koala/VlX4JqNI8F9HO2ETp_B7t_base_basic_pbr.glb"}
    pub model_mesh: File,
    /// Seed value used for generation.
    pub seed: i64,
    /// Generated textures for the 3D object.
    pub textures: Vec<Image>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Rodin3DInput {
    /// When generating the human-like model, this parameter control the generation result to T/A Pose.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tapose: Option<bool>,
    /// Generation add-on features. Default is []. Possible values are HighPack. The HighPack option will provide 4K resolution textures instead of the default 1K, as well as models with high-poly. It will cost triple the billable units.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub addons: Option<AddonsProperty>,
    /// An array that specifies the dimensions and scaling factor of the bounding box. Typically, this array contains 3 elements, Length(X-axis), Width(Y-axis) and Height(Z-axis).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bbox_condition: Option<BboxConditionProperty>,
    /// For fuse mode, One or more images are required.It will generate a model by extracting and fusing features of objects from multiple images.For concat mode, need to upload multiple multi-view images of the same object and generate the model.(You can upload multi-view images in any order, regardless of the order of view.)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub condition_mode: Option<String>,
    /// Format of the geometry file. Possible values: glb, usdz, fbx, obj, stl. Default is glb.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub geometry_file_format: Option<String>,
    /// URL of images to use while generating the 3D model. Required for Image-to-3D mode. Optional for Text-to-3D mode.
    /// "https://storage.googleapis.com/falserverless/model_tests/video_models/robot.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub input_image_urls: Option<Vec<Option<String>>>,
    /// Material type. Possible values: PBR, Shaded. Default is PBR.
    /// "Shaded"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub material: Option<String>,
    /// A textual prompt to guide model generation. Required for Text-to-3D mode. Optional for Image-to-3D mode.
    /// "A futuristic robot with sleek metallic design."
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    /// Generation quality. Possible values: high, medium, low, extra-low. Default is medium.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub quality: Option<String>,
    /// Seed value for randomization, ranging from 0 to 65535. Optional.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<SeedProperty>,
    /// Tier of generation. For Rodin Sketch, set to Sketch. For Rodin Regular, set to Regular.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tier: Option<String>,
    /// Whether to export the model using hyper mode. Default is false.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_hyper: Option<bool>,
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
pub enum AddonsProperty {
    #[default]
    String(String),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum BboxConditionProperty {
    #[default]
    Array(Vec<i64>),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum ContentTypeProperty {
    #[default]
    String(String),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum FileNameProperty {
    #[default]
    String(String),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum FileSizeProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum HeightProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum SeedProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum WidthProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

/// Hyper3D Rodin
///
/// Category: image-to-3d
/// Machine Type: A100
pub fn rodin(params: Rodin3DInput) -> FalRequest<Rodin3DInput, ObjectOutput> {
    FalRequest::new("fal-ai/hyper3d/rodin", params)
}
