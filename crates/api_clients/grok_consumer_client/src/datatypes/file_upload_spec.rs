use std::path::Path;

/// Descriptor of a file to be uploaded
/// Includes necessary metadata
pub enum FileUploadSpec<P: AsRef<Path>> {
  /// Path to the file
  Path(P),

  /// Bytes of the file
  Bytes {
    /// Must be owned.
    bytes: Vec<u8>,
    /// Must be owned.
    filename: String,
    /// Mime type
    mimetype: String,
  }
}
