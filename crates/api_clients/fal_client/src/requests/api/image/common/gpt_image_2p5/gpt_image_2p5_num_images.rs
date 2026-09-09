/// Number of images to generate per request.
///
/// Fal accepts 1 to 10; we expose the same 1 to 4 range as the other image bindings, which
/// is what the ArtCraft batch UI offers. Add variants here if a larger batch is ever needed.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum GptImage2p5NumImages {
  One,
  Two,
  Three,
  Four,
}

impl GptImage2p5NumImages {
  pub fn to_u8(self) -> u8 {
    match self {
      GptImage2p5NumImages::One => 1,
      GptImage2p5NumImages::Two => 2,
      GptImage2p5NumImages::Three => 3,
      GptImage2p5NumImages::Four => 4,
    }
  }

  pub fn to_u64(self) -> u64 {
    self.to_u8() as u64
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn counts() {
    assert_eq!(GptImage2p5NumImages::One.to_u8(), 1);
    assert_eq!(GptImage2p5NumImages::Two.to_u8(), 2);
    assert_eq!(GptImage2p5NumImages::Three.to_u8(), 3);
    assert_eq!(GptImage2p5NumImages::Four.to_u8(), 4);
    assert_eq!(GptImage2p5NumImages::Four.to_u64(), 4);
  }
}
