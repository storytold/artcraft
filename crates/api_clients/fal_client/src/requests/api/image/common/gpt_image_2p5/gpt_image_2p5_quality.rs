/// Quality tier. Higher tiers spend more output image tokens (more detail, more latency).
/// Fal's default is `High`.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum GptImage2p5Quality {
  /// Let the model choose. Priced as `High` since that is the documented default.
  Auto,
  Low,
  Medium,
  High,
  XHigh,
  Max,
}

impl GptImage2p5Quality {
  pub fn to_str(self) -> &'static str {
    match self {
      GptImage2p5Quality::Auto => "auto",
      GptImage2p5Quality::Low => "low",
      GptImage2p5Quality::Medium => "medium",
      GptImage2p5Quality::High => "high",
      GptImage2p5Quality::XHigh => "xhigh",
      GptImage2p5Quality::Max => "max",
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn wire_strings_match_fal_schema() {
    assert_eq!(GptImage2p5Quality::Auto.to_str(), "auto");
    assert_eq!(GptImage2p5Quality::Low.to_str(), "low");
    assert_eq!(GptImage2p5Quality::Medium.to_str(), "medium");
    assert_eq!(GptImage2p5Quality::High.to_str(), "high");
    assert_eq!(GptImage2p5Quality::XHigh.to_str(), "xhigh");
    assert_eq!(GptImage2p5Quality::Max.to_str(), "max");
  }
}
