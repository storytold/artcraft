use std::collections::HashMap;

use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::payloads::generic_inference_args::common::watermark_type::WatermarkType;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum NewValue {
    String(String),
    Float(f32),
    Int(i32),
    Bool(bool),
}

impl NewValue {
    pub fn to_string(&self) -> String {
        match self {
            NewValue::String(s) => s.to_string(),
            NewValue::Int(s) => s.to_string(),
            NewValue::Float(s) => s.to_string(),
            NewValue::Bool(s) => s.to_string(),
        }
    }

    pub fn from_json(json: &serde_json::Value) -> Self {
        match json {
            serde_json::Value::String(s) => NewValue::String(s.to_string()),
            serde_json::Value::Number(n) => {
                if n.is_f64() {
                    NewValue::Float(n.as_f64().unwrap() as f32)
                } else {
                    NewValue::Int(n.as_i64().unwrap() as i32)
                }
            },
            serde_json::Value::Bool(b) => NewValue::Bool(*b),
            _ => panic!("Invalid json type for NewValue"),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum WorkflowType {
    /// For jobs that power Storyteller Studio
    #[serde(rename = "s")]
    StorytellerStudio,

    /// For jobs that power video style transfer
    #[serde(rename = "vst")]
    VideoStyleTransfer,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
pub struct WorkflowArgs {
    #[serde(rename = "w")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub workflow_type: Option<WorkflowType>,

    #[serde(rename = "lora")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maybe_lora_model: Option<ModelWeightToken>,

    #[serde(rename = "workflow_config")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maybe_workflow_config: Option<ModelWeightToken>,

    #[serde(rename = "json_modifications")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maybe_json_modifications: Option<HashMap<String, NewValue>>,

    #[serde(rename = "in")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maybe_input_file: Option<MediaFileToken>,

    #[serde(rename = "df")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maybe_input_depth_file: Option<MediaFileToken>,

    #[serde(rename = "nf")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maybe_input_normal_file: Option<MediaFileToken>,

    #[serde(rename = "of")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maybe_input_outline_file: Option<MediaFileToken>,

    // Optional global IP Adapter image media file token
    // This will apply to the entire workflow / video
    #[serde(rename = "gi")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub global_ip_adapter_token: Option<MediaFileToken>,

    #[serde(rename = "out")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maybe_output_path: Option<String>,

    // Upload information
    // google drive link for uploads
    #[serde(rename = "gd")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maybe_google_drive_link: Option<String>,

    #[serde(rename = "ti")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maybe_title: Option<String>,

    #[serde(rename = "de")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maybe_description: Option<String>,

    #[serde(rename = "ch")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maybe_commit_hash: Option<String>,

    #[serde(rename = "cv")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub creator_visibility: Option<Visibility>,

    #[serde(rename = "ts")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trim_start_seconds: Option<u32>,

    #[serde(rename = "te")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trim_end_seconds: Option<u32>,

    #[serde(rename = "tf")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_fps: Option<u32>,

    //
    // New Style Jobs
    //
    // The following jobs simply communicate a "style name" and high level parameters
    // and rely on the backend to set node parameters:
    //

    #[serde(rename = "sn")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style_name: Option<StyleTransferName>,

    #[serde(rename = "tsm")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trim_start_milliseconds: Option<u64>,

    #[serde(rename = "tem")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trim_end_milliseconds: Option<u64>,

    #[serde(rename = "pp")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub positive_prompt: Option<String>,

    #[serde(rename = "np")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,

    #[serde(rename = "tp")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub travel_prompt: Option<String>,

    #[deprecated(note = "Use `lipsync_enabled` instead")]
    #[serde(rename = "el")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_lipsync: Option<bool>,

    #[serde(rename = "rm")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub remove_watermark: Option<bool>,

    #[serde(rename = "wt")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub watermark_type: Option<WatermarkType>,

    // TODO(bt,2024-05-13): This is a temporary rollout flag to enable us to do Python-side mapping of job args
    #[deprecated(note = "This has been rolled out and is effectively dead.")]
    #[serde(rename = "pa")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rollout_python_workflow_args: Option<bool>,

    // TODO(bt,2024-05-13): This is a temporary rollout flag to enable us to do Python-side mapping of job args
    #[serde(rename = "sv")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skip_process_video: Option<bool>,

    // TODO(bt,2024-05-13): This is a temporary rollout flag to enable us to do Python-side mapping of job args
    #[serde(rename = "sp")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sleep_millis: Option<u64>,

    #[serde(rename = "fd")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_face_detailer: Option<bool>,

    #[serde(rename = "up")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_upscaler: Option<bool>,

    #[serde(rename = "le")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lipsync_enabled: Option<bool>,

    #[serde(rename = "dl")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disable_lcm: Option<bool>,

    #[serde(rename = "uc")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_cinematic: Option<bool>,

    #[serde(rename = "uv")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_cogvideo: Option<bool>,

    #[serde(rename = "s")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strength: Option<f32>,

    #[serde(rename = "fs")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frame_skip: Option<u8>,

    #[serde(rename = "fp")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub generate_fast_previews: Option<bool>,
}
