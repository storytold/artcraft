use crate::weights_registry::weight_descriptor::{WeightDescriptor, WeightFunction};
use crate::weights_registry::weight_descriptor_builder::weight;


/// https://huggingface.co/black-forest-labs/FLUX.1-dev
pub const FLUX_DEV : WeightDescriptor = weight!(
  "Flux-1 Dev",
  "flux1-dev.safetensors",
  WeightFunction::ImageGeneration
);

// TODO(bt): I think the autoencoder for Dev and Schnell are the same.
//  They have the same checksum unless I mixed up the files when downloading.

/// https://huggingface.co/black-forest-labs/FLUX.1-dev
pub const FLUX_DEV_AUTOENCODER : WeightDescriptor = weight!(
  "Flux-1 Dev (Autoencoder)",
  "flux1-dev.ae.safetensors",
  WeightFunction::ImageGeneration
);

/// https://huggingface.co/black-forest-labs/FLUX.1-schnell
pub const FLUX_SCHNELL : WeightDescriptor = weight!(
  "Flux-1 Schnell",
  "flux1-schnell.safetensors",
  WeightFunction::ImageGeneration
);

/// https://huggingface.co/black-forest-labs/FLUX.1-schnell
pub const FLUX_SCHNELL_AUTOENCODER : WeightDescriptor = weight!(
  "Flux-1 Schnell (Autoencoder)",
  "flux1-schnell.ae.safetensors",
  WeightFunction::ImageGeneration
);

/// https://huggingface.co/lmz/candle-flux
pub const LMZ_CANDLE_FLUX_SCHNELL_QUANTIZED_GGUF : WeightDescriptor = weight!(
  "LMZ Flux Schnell Quantized",
  "lmz_candle_flux_flux1-schnell.gguf",
  WeightFunction::ImageGeneration
);

/// https://huggingface.co/google/t5-v1_1-xxl/tree/main
/// NB: I couldn't find the safetensors file here
/// NB: This should live under "refs/pr/2"
pub const GOOGLE_T5_V1_1_XXL_MODEL : WeightDescriptor = weight!(
  "Google T5 v1.1 (XXL)",
  "google_t5_v1_1_xxl_model.safetensors",
  WeightFunction::TextEncoder
);

/// https://huggingface.co/google/t5-v1_1-xxl/tree/main
/// NB: I couldn't find the safetensors file here
/// NB: This should live under "refs/pr/2"
pub const GOOGLE_T5_V1_1_XXL_CONFIG : WeightDescriptor = weight!(
  "Google T5 v1.1 (XXL) Config",
  "google_t5_v1_1_xxl_config.json",
  WeightFunction::TextEncoder
);

/// https://huggingface.co/lmz/mt5-tokenizers
pub const LMZ_T5_TOKENIZER_JSON : WeightDescriptor = weight!(
  "LMZ T5 Tokenizer",
  "lmz_mt5_tokenizers_t5-v1_1-xxl.tokenizer.json",
  WeightFunction::TextTokenizer
);

/// https://huggingface.co/openai/clip-vit-large-patch14/tree/main
pub const OPENAI_CLIP_VIT_P14_MODEL : WeightDescriptor = weight!(
  "OpenAI CLIP VIT (patch 14) model",
  "openai_clip-vit-large-patch14.model.safetensors",
  WeightFunction::TextTokenizer
);

/// https://huggingface.co/openai/clip-vit-large-patch14/tree/main
pub const OPENAI_CLIP_VIT_P14_TOKENIZER_JSON: WeightDescriptor = weight!(
  "OpenAI CLIP VIT (patch 14) tokenizer",
  "openai_clip-vit-large-patch14.tokenizer.json",
  WeightFunction::TextTokenizer
);
