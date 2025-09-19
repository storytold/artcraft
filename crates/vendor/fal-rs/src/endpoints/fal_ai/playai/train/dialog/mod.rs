#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AudioFile {
    /// The mime type of the file.
    /// "image/png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
    /// The duration of the audio file in seconds.
    pub duration: f64,
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
pub struct AudioInput {
    /// The URL of the audio file.
    /// "https://storage.googleapis.com/falserverless/model_tests/f5-tts/en_1_ref.mp3"
    pub audio_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CreateVoiceInput {
    /// Voice name (required, max 255 characters).
    /// "my voice"
    pub name: String,
    /// A list of audio URLs used for cloning (must be between 1 and 5 URLs).
    /// [{"audio_url":"https://storage.googleapis.com/falserverless/model_tests/f5-tts/en_1_ref.mp3"}]
    pub samples: Vec<AudioInput>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CreateVoiceOutput {
    /// The S3 URI of the cloned voice.
    pub voice: String,
}

#[derive(Debug, Serialize, Deserialize)]
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
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LDMTTSInput {
    /// S3 URI of the autoregressive (AR) model.
    /// null
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ar: Option<String>,
    /// The dialogue text with turn prefixes to distinguish speakers.
    /// "Speaker 1: Hey, did you catch the game last night?\nSpeaker 2: Of course! What a match—it had me on the edge of my seat.\nSpeaker 1: Same here! That last-minute goal was unreal. Who's your MVP?\nSpeaker 2: Gotta be the goalie. Those saves were unbelievable.\nSpeaker 1: Absolutely. Saved the day, literally! Are you planning to watch the next game?\nSpeaker 2: Oh, you bet. I’m already stocked up on snacks!\n"
    pub input: String,
    /// S3 URI of the AR LoRA model.
    /// null
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lora: Option<String>,
    /// The format of the response.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response_format: Option<String>,
    /// An integer number greater than or equal to 0. If equal to null or not provided, a random seed will be used. Useful to control the reproducibility of the generated audio. Assuming all other properties didn't change, a fixed seed should always generate the exact same audio file.
    /// null
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// S3 URI of the vocoder model.
    /// null
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vocoder: Option<String>,
    /// A list of voice definitions for each speaker in the dialogue. Must be between 1 and 2 voices.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub voices: Option<Vec<Option<LDMVoiceInput>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LDMTTSOutput {
    /// The generated audio file.
    /// {"content_type":"audio/mpeg","duration":24.3,"file_name":"33dd5f07-f834-4080-aaac-4a253ce1660b.mp3","file_size":584109,"url":"https://fal-api-audio-uploads.s3.amazonaws.com/33dd5f07-f834-4080-aaac-4a253ce1660b.mp3"}
    pub audio: AudioFile,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LDMVoiceInput {
    /// A prefix to identify the speaker in multi-turn dialogues.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub turn_prefix: Option<String>,
    /// The unique ID of a PlayHT or Cloned Voice, or a name from the available presets.
    /// "Jennifer (English (US)/American)"
    /// "Dexter (English (US)/American)"
    /// "Ava (English (AU)/Australian)"
    /// "Tilly (English (AU)/Australian)"
    /// "Charlotte (Advertising) (English (CA)/Canadian)"
    /// "Charlotte (Meditation) (English (CA)/Canadian)"
    /// "Cecil (English (GB)/British)"
    /// "Sterling (English (GB)/British)"
    /// "Cillian (English (IE)/Irish)"
    /// "Madison (English (IE)/Irish)"
    /// "Ada (English (ZA)/South african)"
    /// "Furio (English (IT)/Italian)"
    /// "Alessandro (English (IT)/Italian)"
    /// "Carmen (English (MX)/Mexican)"
    /// "Sumita (English (IN)/Indian)"
    /// "Navya (English (IN)/Indian)"
    /// "Baptiste (English (FR)/French)"
    /// "Lumi (English (FI)/Finnish)"
    /// "Ronel Conversational (Afrikaans/South african)"
    /// "Ronel Narrative (Afrikaans/South african)"
    /// "Abdo Conversational (Arabic/Arabic)"
    /// "Abdo Narrative (Arabic/Arabic)"
    /// "Mousmi Conversational (Bengali/Bengali)"
    /// "Mousmi Narrative (Bengali/Bengali)"
    /// "Caroline Conversational (Portuguese (BR)/Brazilian)"
    /// "Caroline Narrative (Portuguese (BR)/Brazilian)"
    /// "Ange Conversational (French/French)"
    /// "Ange Narrative (French/French)"
    /// "Anke Conversational (German/German)"
    /// "Anke Narrative (German/German)"
    /// "Bora Conversational (Greek/Greek)"
    /// "Bora Narrative (Greek/Greek)"
    /// "Anuj Conversational (Hindi/Indian)"
    /// "Anuj Narrative (Hindi/Indian)"
    /// "Alessandro Conversational (Italian/Italian)"
    /// "Alessandro Narrative (Italian/Italian)"
    /// "Kiriko Conversational (Japanese/Japanese)"
    /// "Kiriko Narrative (Japanese/Japanese)"
    /// "Dohee Conversational (Korean/Korean)"
    /// "Dohee Narrative (Korean/Korean)"
    /// "Ignatius Conversational (Malay/Malay)"
    /// "Ignatius Narrative (Malay/Malay)"
    /// "Adam Conversational (Polish/Polish)"
    /// "Adam Narrative (Polish/Polish)"
    /// "Andrei Conversational (Russian/Russian)"
    /// "Andrei Narrative (Russian/Russian)"
    /// "Aleksa Conversational (Serbian/Serbian)"
    /// "Aleksa Narrative (Serbian/Serbian)"
    /// "Carmen Conversational (Spanish/Spanish)"
    /// "Patricia Conversational (Spanish/Spanish)"
    /// "Aiken Conversational (Tagalog/Filipino)"
    /// "Aiken Narrative (Tagalog/Filipino)"
    /// "Katbundit Conversational (Thai/Thai)"
    /// "Katbundit Narrative (Thai/Thai)"
    /// "Ali Conversational (Turkish/Turkish)"
    /// "Ali Narrative (Turkish/Turkish)"
    /// "Sahil Conversational (Urdu/Pakistani)"
    /// "Sahil Narrative (Urdu/Pakistani)"
    /// "Mary Conversational (Hebrew/Israeli)"
    /// "Mary Narrative (Hebrew/Israeli)"
    pub voice: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TrainingInput {
    /// The name of the training job (required, max 255 characters).
    /// "my voice"
    pub name: String,
    /// A list of audio URLs used for training (must be between 1 and 5 URLs).
    /// [{"audio_url":"https://storage.googleapis.com/falserverless/model_tests/f5-tts/en_1_ref.mp3"}]
    pub training_data: Vec<AudioInput>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct V3TTSInput {
    /// The text to be converted to speech.
    /// "The quick brown fox jumped over the lazy dog."
    pub input: String,
    /// The format of the response.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response_format: Option<String>,
    /// An integer number greater than or equal to 0. If equal to null or not provided, a random seed will be used. Useful to control the reproducibility of the generated audio. Assuming all other properties didn't change, a fixed seed should always generate the exact same audio file.
    /// null
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The unique ID of a PlayHT or Cloned Voice, or a name from the available presets.
    /// "Jennifer (English (US)/American)"
    /// "Dexter (English (US)/American)"
    /// "Ava (English (AU)/Australian)"
    /// "Tilly (English (AU)/Australian)"
    /// "Charlotte (Advertising) (English (CA)/Canadian)"
    /// "Charlotte (Meditation) (English (CA)/Canadian)"
    /// "Cecil (English (GB)/British)"
    /// "Sterling (English (GB)/British)"
    /// "Cillian (English (IE)/Irish)"
    /// "Madison (English (IE)/Irish)"
    /// "Ada (English (ZA)/South african)"
    /// "Furio (English (IT)/Italian)"
    /// "Alessandro (English (IT)/Italian)"
    /// "Carmen (English (MX)/Mexican)"
    /// "Sumita (English (IN)/Indian)"
    /// "Navya (English (IN)/Indian)"
    /// "Baptiste (English (FR)/French)"
    /// "Lumi (English (FI)/Finnish)"
    /// "Ronel Conversational (Afrikaans/South african)"
    /// "Ronel Narrative (Afrikaans/South african)"
    /// "Abdo Conversational (Arabic/Arabic)"
    /// "Abdo Narrative (Arabic/Arabic)"
    /// "Mousmi Conversational (Bengali/Bengali)"
    /// "Mousmi Narrative (Bengali/Bengali)"
    /// "Caroline Conversational (Portuguese (BR)/Brazilian)"
    /// "Caroline Narrative (Portuguese (BR)/Brazilian)"
    /// "Ange Conversational (French/French)"
    /// "Ange Narrative (French/French)"
    /// "Anke Conversational (German/German)"
    /// "Anke Narrative (German/German)"
    /// "Bora Conversational (Greek/Greek)"
    /// "Bora Narrative (Greek/Greek)"
    /// "Anuj Conversational (Hindi/Indian)"
    /// "Anuj Narrative (Hindi/Indian)"
    /// "Alessandro Conversational (Italian/Italian)"
    /// "Alessandro Narrative (Italian/Italian)"
    /// "Kiriko Conversational (Japanese/Japanese)"
    /// "Kiriko Narrative (Japanese/Japanese)"
    /// "Dohee Conversational (Korean/Korean)"
    /// "Dohee Narrative (Korean/Korean)"
    /// "Ignatius Conversational (Malay/Malay)"
    /// "Ignatius Narrative (Malay/Malay)"
    /// "Adam Conversational (Polish/Polish)"
    /// "Adam Narrative (Polish/Polish)"
    /// "Andrei Conversational (Russian/Russian)"
    /// "Andrei Narrative (Russian/Russian)"
    /// "Aleksa Conversational (Serbian/Serbian)"
    /// "Aleksa Narrative (Serbian/Serbian)"
    /// "Carmen Conversational (Spanish/Spanish)"
    /// "Patricia Conversational (Spanish/Spanish)"
    /// "Aiken Conversational (Tagalog/Filipino)"
    /// "Aiken Narrative (Tagalog/Filipino)"
    /// "Katbundit Conversational (Thai/Thai)"
    /// "Katbundit Narrative (Thai/Thai)"
    /// "Ali Conversational (Turkish/Turkish)"
    /// "Ali Narrative (Turkish/Turkish)"
    /// "Sahil Conversational (Urdu/Pakistani)"
    /// "Sahil Narrative (Urdu/Pakistani)"
    /// "Mary Conversational (Hebrew/Israeli)"
    /// "Mary Narrative (Hebrew/Israeli)"
    pub voice: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct V3TTSOutput {
    /// The generated audio file.
    /// {"content_type":"audio/mpeg","duration":2.3486666666666665,"file_name":"166db034-7421-4767-adad-ab7c36a99b75.mp3","file_size":57069,"url":"https://fal-api-audio-uploads.s3.amazonaws.com/166db034-7421-4767-adad-ab7c36a99b75.mp3"}
    pub audio: AudioFile,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// PlayAI Text-to-Speech v3
///
/// Category: text-to-speech
pub fn dialog(params: TrainingInput) -> FalRequest<TrainingInput, File> {
    FalRequest::new("fal-ai/playai/train/dialog", params)
}
