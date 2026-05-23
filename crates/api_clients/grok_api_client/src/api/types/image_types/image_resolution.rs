/// Output resolution for xAI image endpoints.
///
/// xAI's actual pixel counts depend on the chosen `aspect_ratio` — the `1k`
/// and `2k` labels denote the *target* size class (roughly 1024-px and
/// 2048-px on the longest edge). When omitted, xAI falls back to its server
/// default (currently 1k as of these docs).
///
/// Docs:
/// - <https://docs.x.ai/developers/model-capabilities/images/generation>
/// - <https://docs.x.ai/developers/rest-api-reference/inference/images>
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum ImageResolution {
  /// `"1k"` — ~1024-px class (faster, cheaper).
  OneK,
  /// `"2k"` — ~2048-px class (higher fidelity, slower, more expensive).
  TwoK,
}

impl ImageResolution {
  /// Wire representation — the exact string xAI expects in the `"resolution"` field.
  pub fn as_str(&self) -> &'static str {
    match self {
      Self::OneK => "1k",
      Self::TwoK => "2k",
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn matches_docs_strings() {
    assert_eq!(ImageResolution::OneK.as_str(), "1k");
    assert_eq!(ImageResolution::TwoK.as_str(), "2k");
  }
}
