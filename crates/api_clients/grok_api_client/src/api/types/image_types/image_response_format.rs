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

// Serialize as the wire string ("url" or "b64_json").
impl serde::Serialize for ImageResponseFormat {
  fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
    s.serialize_str(self.as_str())
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

  #[test]
  fn serializes_as_plain_wire_string() {
    assert_eq!(serde_json::to_string(&ImageResponseFormat::Url).unwrap(), "\"url\"");
    assert_eq!(serde_json::to_string(&ImageResponseFormat::B64Json).unwrap(), "\"b64_json\"");
  }
}
