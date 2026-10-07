/// An image format recognized from its magic bytes.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct ImageFormat {
  pub mime_type: &'static str,
  pub extension: &'static str,
}

pub const PNG: ImageFormat = ImageFormat { mime_type: "image/png", extension: "png" };
pub const JPEG: ImageFormat = ImageFormat { mime_type: "image/jpeg", extension: "jpg" };
pub const WEBP: ImageFormat = ImageFormat { mime_type: "image/webp", extension: "webp" };
pub const GIF: ImageFormat = ImageFormat { mime_type: "image/gif", extension: "gif" };
pub const BMP: ImageFormat = ImageFormat { mime_type: "image/bmp", extension: "bmp" };

/// Detects the formats Seedream accepts and returns. `None` for anything else.
pub fn detect_image_format(bytes: &[u8]) -> Option<ImageFormat> {
  if bytes.starts_with(&[0x89, b'P', b'N', b'G']) {
    Some(PNG)
  } else if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
    Some(JPEG)
  } else if bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
    Some(WEBP)
  } else if bytes.starts_with(b"GIF8") {
    Some(GIF)
  } else if bytes.starts_with(b"BM") {
    Some(BMP)
  } else {
    None
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn detects_formats_from_magic_bytes() {
    assert_eq!(detect_image_format(&[0x89, b'P', b'N', b'G', 0x0D, 0x0A]), Some(PNG));
    assert_eq!(detect_image_format(&[0xFF, 0xD8, 0xFF, 0xE0]), Some(JPEG));
    assert_eq!(detect_image_format(b"RIFF\x00\x00\x00\x00WEBPVP8 "), Some(WEBP));
    assert_eq!(detect_image_format(b"GIF89a"), Some(GIF));
    assert_eq!(detect_image_format(b"BM\x00\x00"), Some(BMP));
  }

  #[test]
  fn rejects_unknown_or_truncated_data() {
    assert_eq!(detect_image_format(b""), None);
    assert_eq!(detect_image_format(b"RIFF"), None);
    assert_eq!(detect_image_format(b"%PDF-1.7"), None);
  }
}
