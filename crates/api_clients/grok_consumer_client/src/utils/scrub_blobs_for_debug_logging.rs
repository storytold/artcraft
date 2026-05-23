use once_cell::sync::Lazy;
use regex::Regex;

static LARGE_BLOB_REGEX: Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#"[^"]{100,}"#)
      .expect("Regex should parse")
});

/// Helpful for debugging large websocket payloads with in-stream base64-encoded image binaries.
pub fn scrub_blobs_for_debug_logging(blob: &str) -> String {
  LARGE_BLOB_REGEX.replace(blob, "...").to_string()
}
