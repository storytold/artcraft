#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxFinetuneInput {
    /// Enables/disables automatic image captioning
    #[serde(skip_serializing_if = "Option::is_none")]
    pub captioning: Option<bool>,
    /// URL to the training data
    pub data_url: String,
    /// Descriptive note to identify your fine-tune since names are UUIDs. Will be displayed in finetune_details.
    /// "test-1"
    pub finetune_comment: String,
    /// Choose between 'full' for a full finetuning + post hoc extraction of the trained weights into a LoRA or 'lora' for a raw LoRA training
    /// "full"
    /// "lora"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub finetune_type: Option<String>,
    /// Defines training duration
    #[serde(skip_serializing_if = "Option::is_none")]
    pub iterations: Option<i64>,
    /// Learning rate for training. Lower values may be needed for certain scenarios. Default is 1e-5 for full and 1e-4 for LoRA.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub learning_rate: Option<f64>,
    /// Choose between 32 and 16. A lora_rank of 16 can increase training efficiency and decrease loading times.
    /// 32
    /// 16
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lora_rank: Option<i64>,
    /// Determines the finetuning approach based on your concept
    /// "character"
    /// "product"
    /// "style"
    /// "general"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode: Option<String>,
    /// The speed priority will improve training and inference speed
    /// "quality"
    /// "speed"
    /// "high_res_only"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub priority: Option<String>,
    /// Unique word/phrase that will be used in the captions, to reference the newly introduced concepts
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trigger_word: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FluxFinetuneOutput {
    /// References your specific model
    pub finetune_id: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Train Flux LoRAs For Pro Models
///
/// Category: training
/// Machine Type: H100
///
///
/// FLUX.1 Finetune [pro] API, next generation text-to-image model.
///
/// All usages of this model must comply with [FLUX.1 PRO Terms of Service](https://blackforestlabs.ai/terms-of-service/).
pub fn flux_pro_trainer(
    params: FluxFinetuneInput,
) -> FalRequest<FluxFinetuneInput, FluxFinetuneOutput> {
    FalRequest::new("fal-ai/flux-pro-trainer", params)
}
