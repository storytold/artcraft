/// Output file format. Fal's default is `Png`.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum GptImage2p5OutputFormat {
  Jpeg,
  Png,
  Webp,
}

impl GptImage2p5OutputFormat {
  pub fn to_str(self) -> &'static str {
    match self {
      GptImage2p5OutputFormat::Jpeg => "jpeg",
      GptImage2p5OutputFormat::Png => "png",
      GptImage2p5OutputFormat::Webp => "webp",
    }
  }

  /// Fal only honours `output_compression` for lossy formats.
  pub fn supports_compression(self) -> bool {
    match self {
      GptImage2p5OutputFormat::Jpeg | GptImage2p5OutputFormat::Webp => true,
      GptImage2p5OutputFormat::Png => false,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn wire_strings_match_fal_schema() {
    assert_eq!(GptImage2p5OutputFormat::Jpeg.to_str(), "jpeg");
    assert_eq!(GptImage2p5OutputFormat::Png.to_str(), "png");
    assert_eq!(GptImage2p5OutputFormat::Webp.to_str(), "webp");
  }

  #[test]
  fn only_lossy_formats_support_compression() {
    assert!(GptImage2p5OutputFormat::Jpeg.supports_compression());
    assert!(GptImage2p5OutputFormat::Webp.supports_compression());
    assert!(!GptImage2p5OutputFormat::Png.supports_compression());
  }
}
