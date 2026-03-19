
// TODO(bt,2025-03-13): When it's time for dynamic, non-const allocation, refer to
//  http::header::name::HeaderName: https://github.com/hyperium/http/blob/master/src/header/name.rs
//  as a pattern that will support both compile-time constants and dynamically allocated String-based variants.

#[derive(Clone, Copy)]
pub enum WeightFunction {
  ImageGeneration,
  ImageSegmentation,
  TextEncoder,
  TextTokenizer,
  Unet,
  Vae,
}

pub struct WeightDescriptor {
  /// Name of the weight, eg. "Lykon Dreamshaper 7"
  pub name: &'static str,

  /// Name of the file on the filesystem, eg. lykon_dreamshaper_7_text_encoder.fp16.safetensors
  pub filename: &'static str,

  /// URL of the file in the R2 bucket,
  /// eg. https://pub-bc5e2bc0cdee4bb5ae8fca9d641ca0d6.r2.dev/lykon_dreamshaper_7_text_encoder.fp16.safetensors
  pub r2_download_url: &'static str,

  pub function: WeightFunction,
}

impl WeightFunction {
  pub fn as_descriptive_str(&self) -> &'static str {
    match self {
      WeightFunction::ImageGeneration => "image generation",
      WeightFunction::ImageSegmentation => "image segmentation",
      WeightFunction::TextEncoder => "text encoder",
      WeightFunction::TextTokenizer => "text tokenizer",
      WeightFunction::Unet => "UNET",
      WeightFunction::Vae => "VAE",
    }
  }
}

impl WeightDescriptor {
  pub fn to_descriptive_name(&self) -> String {
    format!("{} ({})", self.name, self.function.as_descriptive_str())
  }
}
