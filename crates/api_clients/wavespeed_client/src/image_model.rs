#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ImageModel {
  FluxDev,
  FluxSchnell,
  FluxPro11,
  FluxPro11Ultra,
  NanoBanana,
  NanoBanana2,
  NanoBananaPro,
  Seedream4,
  Seedream4p5,
  Seedream5Lite,
  GptImage1p5,
  GptImage2,
  GptImage2p5Flare,
  GptImage2p5Sunburst,
}

impl ImageModel {
  /// Select the documented creation or edit endpoint for this image model.
  pub fn endpoint(self, editing: bool) -> &'static str {
    match (self, editing) {
      (Self::FluxDev, _) => "wavespeed-ai/flux-dev",
      (Self::FluxSchnell, _) => "wavespeed-ai/flux-schnell",
      (Self::FluxPro11, _) => "wavespeed-ai/flux-1.1-pro",
      (Self::FluxPro11Ultra, _) => "wavespeed-ai/flux-1.1-pro-ultra",
      (Self::NanoBanana, false) => "google/nano-banana/text-to-image",
      (Self::NanoBanana, true) => "google/nano-banana/edit",
      (Self::NanoBanana2, false) => "google/nano-banana-2/text-to-image",
      (Self::NanoBanana2, true) => "google/nano-banana-2/edit",
      (Self::NanoBananaPro, false) => "google/nano-banana-pro/text-to-image",
      (Self::NanoBananaPro, true) => "google/nano-banana-pro/edit",
      (Self::Seedream4, false) => "bytedance/seedream-v4",
      (Self::Seedream4, true) => "bytedance/seedream-v4/edit",
      (Self::Seedream4p5, false) => "bytedance/seedream-v4.5",
      (Self::Seedream4p5, true) => "bytedance/seedream-v4.5/edit",
      (Self::Seedream5Lite, false) => "bytedance/seedream-v5.0-lite",
      (Self::Seedream5Lite, true) => "bytedance/seedream-v5.0-lite/edit",
      (Self::GptImage1p5, false) => "openai/gpt-image-1.5/text-to-image",
      (Self::GptImage1p5, true) => "openai/gpt-image-1.5/edit",
      (Self::GptImage2, false) => "openai/gpt-image-2/text-to-image",
      (Self::GptImage2, true) => "openai/gpt-image-2/edit",
      (Self::GptImage2p5Flare, false) => "openai/gpt-image-2.5-flare/text-to-image",
      (Self::GptImage2p5Flare, true) => "openai/gpt-image-2.5-flare/edit",
      (Self::GptImage2p5Sunburst, false) => "openai/gpt-image-2.5-sunburst/text-to-image",
      (Self::GptImage2p5Sunburst, true) => "openai/gpt-image-2.5-sunburst/edit",
    }
  }

  /// Return the model-specific input-image limit enforced before submission.
  pub fn max_reference_images(self) -> usize {
    match self {
      Self::FluxDev | Self::FluxSchnell => 1,
      Self::FluxPro11 | Self::FluxPro11Ultra => 0,
      Self::NanoBanana2 | Self::NanoBananaPro => 14,
      Self::GptImage2 | Self::GptImage2p5Flare | Self::GptImage2p5Sunburst => 16,
      _ => 10,
    }
  }

  /// Return the number of outputs supported by a single paid creation request.
  pub fn max_output_images(self) -> u16 {
    match self {
      Self::FluxDev | Self::FluxSchnell => 4,
      _ => 1,
    }
  }
}
