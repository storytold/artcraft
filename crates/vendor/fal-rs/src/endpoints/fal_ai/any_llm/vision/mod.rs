#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ChatInput {
    /// Name of the model to use. Premium models are charged at 10x the rate of standard models, they include: meta-llama/llama-3.2-90b-vision-instruct, openai/gpt-4o, anthropic/claude-3-5-haiku, google/gemini-pro-1.5, anthropic/claude-3.5-sonnet.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    /// Prompt to be used for the chat completion
    /// "What is the meaning of life?"
    pub prompt: String,
    /// Should reasoning be the part of the final answer.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reasoning: Option<bool>,
    /// System prompt to provide context or instructions to the model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system_prompt: Option<SystemPromptProperty>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatOutput {
    /// Error message if an error occurred
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<ErrorProperty>,
    /// Generated output
    /// "The meaning of life is subjective and depends on individual perspectives."
    pub output: String,
    /// Whether the output is partial
    #[serde(skip_serializing_if = "Option::is_none")]
    pub partial: Option<bool>,
    /// Generated reasoning for the final answer
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reasoning: Option<String>,
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

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VisionInput {
    /// URL of the image to be processed
    /// "https://fal.media/files/tiger/4Ew1xYW6oZCs6STQVC7V8_86440216d0fe42e4b826d03a2121468e.jpg"
    pub image_url: String,
    /// Name of the model to use. Premium models are charged at 3x the rate of standard models, they include: meta-llama/llama-3.2-90b-vision-instruct, openai/gpt-4o, anthropic/claude-3-5-haiku, google/gemini-pro-1.5, anthropic/claude-3.5-sonnet.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    /// Prompt to be used for the image
    /// "Caption this image for a text-to-image model with as much detail as possible."
    pub prompt: String,
    /// Should reasoning be the part of the final answer.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reasoning: Option<bool>,
    /// System prompt to provide context or instructions to the model
    /// "Only answer the question, do not provide any additional information or add any prefix/suffix other than the answer of the original question. Don't use markdown."
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system_prompt: Option<SystemPromptProperty>,
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum ErrorProperty {
    #[default]
    String(String),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum SystemPromptProperty {
    #[default]
    String(String),
    Null(serde_json::Value),
}

/// Any LLM
///
/// Category: llm
/// Machine Type: A6000
///
///
/// Run any vision model with fal, powered by [OpenRouter](https://openrouter.ai).
pub fn vision(params: VisionInput) -> FalRequest<VisionInput, ChatOutput> {
    FalRequest::new("fal-ai/any-llm/vision", params)
}
