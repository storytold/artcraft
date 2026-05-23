/// Wire format for returned images.
///
/// - `Url` (default) — xAI returns a temporary CDN URL in `data[].url`.
/// - `B64Json` — xAI returns the raw image bytes inlined as base64 in
///   `data[].b64_json`. Use this when you can't / don't want to make a
///   follow-up HTTP request to fetch the image.
///
/// Docs:
/// - <https://docs.x.ai/developers/model-capabilities/images/generation>
/// - <https://docs.x.ai/developers/rest-api-reference/inference/images>
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum ImageResponseFormat {
  Url,
  B64Json,
}

impl ImageResponseFormat {
  pub fn as_str(&self) -> &'static str {
    match self {
      Self::Url => "url",
      Self::B64Json => "b64_json",
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn matches_docs_strings() {
    assert_eq!(ImageResponseFormat::Url.as_str(), "url");
    assert_eq!(ImageResponseFormat::B64Json.as_str(), "b64_json");
  }
}
