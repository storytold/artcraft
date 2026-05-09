//! Resolves file metadata (mime type, file extension) from downloaded bytes,
//! falling back to fal webhook content_type when magic-byte detection fails.

use log::warn;
use mimetypes::mimetype_info::file_extension::FileExtension;
use mimetypes::mimetype_info::mimetype_info::MimetypeInfo;

/// Resolved metadata about a downloaded file: its mime type and extension.
#[derive(Debug)]
pub struct ResolvedFileMetadata {
  pub mime_type: String,
  pub file_extension: FileExtension,
  /// Where we got the mime type from.
  pub source: MetadataSource,
}

#[derive(Debug, PartialEq, Eq)]
pub enum MetadataSource {
  /// Detected from the file's magic bytes.
  MagicBytes,
  /// Fell back to the content_type reported by the fal webhook.
  FalContentType,
}

/// Try to resolve the mime type and extension for `file_bytes`.
///
/// 1. First tries `MimetypeInfo::get_for_bytes` (magic-byte detection).
/// 2. If that fails, falls back to `fal_content_type` (the `content_type`
///    field from the fal webhook payload).
/// 3. If neither works, returns `None`.
pub fn resolve_file_metadata(
  file_bytes: &[u8],
  fal_content_type: Option<&str>,
) -> Option<ResolvedFileMetadata> {
  // Primary: magic-byte detection.
  if let Some(info) = MimetypeInfo::get_for_bytes(file_bytes) {
    if let Some(ext) = info.file_extension() {
      return Some(ResolvedFileMetadata {
        mime_type: info.mime_type().to_string(),
        file_extension: ext,
        source: MetadataSource::MagicBytes,
      });
    }
    // Magic bytes gave a mime type but no known extension — still try fal.
    warn!(
      "Magic bytes detected mime type '{}' but no known file extension; trying fal content_type",
      info.mime_type(),
    );
  }

  // Fallback: fal webhook content_type.
  if let Some(content_type) = fal_content_type {
    if let Some(ext) = FileExtension::from_mimetype(content_type) {
      warn!(
        "Using fal content_type '{}' as fallback (magic-byte detection failed or had no extension)",
        content_type,
      );
      return Some(ResolvedFileMetadata {
        mime_type: content_type.to_string(),
        file_extension: ext,
        source: MetadataSource::FalContentType,
      });
    }
  }

  None
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn png_magic_bytes_detected() {
    // PNG magic: 89 50 4e 47 0d 0a 1a 0a
    let png_bytes: Vec<u8> = vec![137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82];
    let result = resolve_file_metadata(&png_bytes, Some("image/png"));

    let meta = result.expect("should resolve");
    assert_eq!(meta.mime_type, "image/png");
    assert_eq!(meta.file_extension, FileExtension::Png);
    assert_eq!(meta.source, MetadataSource::MagicBytes);
  }

  #[test]
  fn mp4_magic_bytes_detected() {
    // ftypisom MP4 magic
    let mp4_bytes: Vec<u8> = vec![
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
      0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
    ];
    let result = resolve_file_metadata(&mp4_bytes, None);

    let meta = result.expect("should resolve");
    assert_eq!(meta.mime_type, "video/mp4");
    assert_eq!(meta.file_extension, FileExtension::Mp4);
    assert_eq!(meta.source, MetadataSource::MagicBytes);
  }

  #[test]
  fn unknown_magic_bytes_falls_back_to_fal_content_type() {
    // Garbage bytes that infer won't recognize.
    let garbage: Vec<u8> = vec![0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
    let result = resolve_file_metadata(&garbage, Some("image/png"));

    let meta = result.expect("should resolve via fallback");
    assert_eq!(meta.mime_type, "image/png");
    assert_eq!(meta.file_extension, FileExtension::Png);
    assert_eq!(meta.source, MetadataSource::FalContentType);
  }

  #[test]
  fn unknown_magic_bytes_and_no_fal_content_type_returns_none() {
    let garbage: Vec<u8> = vec![0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
    let result = resolve_file_metadata(&garbage, None);
    assert!(result.is_none());
  }

  #[test]
  fn unknown_magic_bytes_and_unknown_fal_content_type_returns_none() {
    let garbage: Vec<u8> = vec![0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
    let result = resolve_file_metadata(&garbage, Some("application/octet-stream"));
    assert!(result.is_none());
  }

  #[test]
  fn empty_bytes_falls_back_to_fal_content_type() {
    let result = resolve_file_metadata(&[], Some("video/mp4"));

    let meta = result.expect("should resolve via fallback");
    assert_eq!(meta.mime_type, "video/mp4");
    assert_eq!(meta.file_extension, FileExtension::Mp4);
    assert_eq!(meta.source, MetadataSource::FalContentType);
  }

  #[test]
  fn tiny_bytes_falls_back_to_fal_content_type() {
    let result = resolve_file_metadata(&[0x89], Some("image/jpeg"));

    let meta = result.expect("should resolve via fallback");
    assert_eq!(meta.mime_type, "image/jpeg");
    assert_eq!(meta.file_extension, FileExtension::Jpg);
    assert_eq!(meta.source, MetadataSource::FalContentType);
  }
}
