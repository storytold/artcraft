
// Nearly a third of `ErrorKind` is nightly rust, so we're going to have to match on
// unix error codes until the rest of the ErrorKind enum variants are stable.
// The error codes are maintained in sys/unix/voice_conversion_to_weights - decode_error_kind(i32)

const E_FILESYSTEM_QUOTA_EXCEEDED : i32 = 122; // pub const EDQUOT: ::c_int = 122;
const E_STORAGE_FULL : i32 = 28; // pub const ENOSPC: ::c_int = 28;

/// Reports if an io::Error was caused by the filesystem being full.
pub fn is_filesystem_full_error(err: &std::io::Error) -> bool {
  match err.raw_os_error() {
    Some(E_FILESYSTEM_QUOTA_EXCEEDED) => true,
    Some(E_STORAGE_FULL) => true,
    _ => false,
  }
}
