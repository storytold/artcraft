/// Background treatment for the generated image. Fal's default is `Auto`.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum GptImage2p5Background {
  Auto,
  Transparent,
  Opaque,
}

impl GptImage2p5Background {
  pub fn to_str(self) -> &'static str {
    match self {
      GptImage2p5Background::Auto => "auto",
      GptImage2p5Background::Transparent => "transparent",
      GptImage2p5Background::Opaque => "opaque",
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn wire_strings_match_fal_schema() {
    assert_eq!(GptImage2p5Background::Auto.to_str(), "auto");
    assert_eq!(GptImage2p5Background::Transparent.to_str(), "transparent");
    assert_eq!(GptImage2p5Background::Opaque.to_str(), "opaque");
  }
}
