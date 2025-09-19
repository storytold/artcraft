#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AmEngOutput {
    /// The generated music
    /// {"url":"https://fal.media/files/elephant/dXVMqWsBDG9yan3kaOT0Z_tmp0vvkha3s.wav"}
    pub audio: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AmEnglishRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    /// Voice ID for the desired voice.
    /// "af_heart"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub voice: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BrEngOutput {
    /// The generated music
    /// {"url":"https://fal.media/files/kangaroo/4wpA60Kum6UjOVBKJoNyL_tmpxfrkn95k.wav"}
    pub audio: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BrEnglishRequest {
    pub prompt: String,
    /// Voice ID for the desired voice.
    /// "bf_alice"
    pub voice: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BrPortugeseOutput {
    /// The generated music
    /// {"url":"https://fal.media/files/rabbit/Y9-bWJt5lixo8PTCmncN6_tmpyh7u57oa.wav"}
    pub audio: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BrPortugueseRequest {
    pub prompt: String,
    /// Voice ID for the desired voice.
    /// "pf_dora"
    pub voice: String,
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
pub struct FrenchOutput {
    /// The generated music
    /// {"url":"https://fal.media/files/kangaroo/E_itKJKZKRNaO-QtU77k1_tmpe1qso5xp.wav"}
    pub audio: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FrenchRequest {
    pub prompt: String,
    /// Voice ID for the desired voice.
    /// "ff_siwis"
    pub voice: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HindiOutput {
    /// The generated music
    /// {"url":"https://fal.media/files/elephant/3sGUskl1AFG4TN_NAinO8_tmpdq_1m8og.wav"}
    pub audio: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HindiRequest {
    pub prompt: String,
    /// Voice ID for the desired voice.
    /// "hf_alpha"
    pub voice: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ItalianOutput {
    /// The generated music
    /// {"url":"https://fal.media/files/monkey/-MZ0hRO4IpTMukb_S5aRZ_tmpin14eoed.wav"}
    pub audio: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ItalianRequest {
    pub prompt: String,
    /// Voice ID for the desired voice.
    /// "if_sara"
    pub voice: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct JapaneseOutput {
    /// The generated music
    /// {"url":"https://fal.media/files/lion/piLhqKO8LJxrWaNg2dVUv_tmpp6eff6zl.wav"}
    pub audio: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct JapaneseRequest {
    pub prompt: String,
    /// Voice ID for the desired voice.
    /// "jf_alpha"
    pub voice: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MandarinOutput {
    /// The generated music
    /// {"url":"https://fal.media/files/rabbit/8UiqobkQXPrYDRHl4l5oU_tmptz6jo3ex.wav"}
    pub audio: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MandarinRequest {
    pub prompt: String,
    /// Voice ID for the desired voice.
    /// "zf_xiaobei"
    pub voice: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SpanishOutput {
    /// The generated music
    /// {"url":"https://fal.media/files/monkey/5rBM3qVCED73Lxs5XLcwj_tmp4f2z_qrf.wav"}
    pub audio: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SpanishRequest {
    pub prompt: String,
    /// Voice ID for the desired voice.
    /// "ef_dora"
    pub voice: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Kokoro TTS
///
/// Category: text-to-audio
/// Machine Type: A100
pub fn hindi(params: HindiRequest) -> FalRequest<HindiRequest, HindiOutput> {
    FalRequest::new("fal-ai/kokoro/hindi", params)
}
