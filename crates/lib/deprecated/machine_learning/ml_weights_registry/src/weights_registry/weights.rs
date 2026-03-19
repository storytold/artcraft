use crate::weights_registry::weight_descriptor::{WeightDescriptor, WeightFunction};
use crate::weights_registry::weight_descriptor_builder::weight;

pub const CLIP_JSON : WeightDescriptor = weight!(
  "CLIP",
  "clip_vit_bigg_14_lion2b_39b_b160k.tokenizer.json",
  WeightFunction::TextTokenizer
);

/// For LCM-based image generation
pub const LYKON_DEAMSHAPER_7_TEXT_ENCODER_FP16 : WeightDescriptor = weight!(
  "Lykon Dreamshaper 7",
  "lykon_dreamshaper_7_text_encoder.fp16.safetensors",
  WeightFunction::TextEncoder
);

/// For LCM-based image generation
pub const LYKON_DEAMSHAPER_7_VAE : WeightDescriptor = weight!(
  "Lykon Dreamshaper 7",
  "lykon_dreamshaper_7_vae.safetensors",
  WeightFunction::Vae
);

/// For LCM-based image generation
pub const SIMIANLUO_LCM_DREAMSHAPER_V7_UNET : WeightDescriptor = weight!(
  "SimianLuo LCM Dreamshaper v7",
  "simianluo_lcm_dreamshaper_v7_unet.safetensors",
  WeightFunction::Unet
);

/// Image segmentation and background removal
/// dis_medium.onnx
pub const DIS_MEDIUM_ONNX : WeightDescriptor = weight!(
  "Dichotomous Image Segmentation Medium",
  "dis_medium.onnx",
  WeightFunction::ImageSegmentation
);

#[deprecated]
pub const SDXL_TURBO_CLIP_TEXT_ENCODER : WeightDescriptor = weight!(
  "SDXL Turbo CLIP",
  "clip_text_encoder.safetensors",
  WeightFunction::TextEncoder
);

#[deprecated]
pub const SDXL_TURBO_CLIP_TEXT_ENCODER_2 : WeightDescriptor = weight!(
  "SDXL Turbo CLIP #2",
  "clip_text_encoder_2.safetensors",
  WeightFunction::TextEncoder
);

#[deprecated]
pub const SDXL_TURBO_VAE : WeightDescriptor = weight!(
  "SDXL Turbo",
  "diffusion_pytorch_model.vae.safetensors",
  WeightFunction::Vae
);

#[deprecated]
pub const SDXL_TURBO_UNET : WeightDescriptor = weight!(
  "SDXL Turbo",
  "diffusion_pytorch_model.unet.safetensors",
  WeightFunction::Unet
);
