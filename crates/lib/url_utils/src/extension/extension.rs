use std::borrow::Cow;
use std::fmt;
use std::hash::{Hash, Hasher};

/// A file extension that can be either a compile-time constant or a runtime-parsed value.
///
/// ```
/// use url_utils::extension::extension::Extension;
///
/// // Static constants (no allocation)
/// const PNG: Extension = Extension::from_static("png", ".png");
/// assert_eq!(PNG.without_period(), "png");
/// assert_eq!(PNG.with_period(), ".png");
///
/// // Runtime parsing (allocates only if needed)
/// let ext = Extension::new("mp4");
/// assert_eq!(ext.without_period(), "mp4");
/// assert_eq!(ext.with_period(), ".mp4");
/// ```
#[derive(Clone, Eq)]
pub struct Extension {
  /// The extension without the leading period, e.g. "png", "mp4".
  value: Cow<'static, str>,

  /// The extension with the leading period, e.g. ".png", ".mp4".
  dotted: Cow<'static, str>,
}

impl Extension {
  /// Creates an `Extension` from static strings at compile time.
  /// Pass both the bare extension and the dotted form.
  ///
  /// ```
  /// use url_utils::extension::extension::Extension;
  /// const MP4: Extension = Extension::from_static("mp4", ".mp4");
  /// ```
  #[must_use]
  pub const fn from_static(ext: &'static str, dotted: &'static str) -> Self {
    Self { value: Cow::Borrowed(ext), dotted: Cow::Borrowed(dotted) }
  }

  /// Creates an `Extension` from a `&str` at runtime.
  /// The input must NOT include a leading period.
  #[must_use]
  pub fn new(ext: &str) -> Self {
    let dotted = format!(".{ext}");
    Self { value: Cow::Owned(ext.to_string()), dotted: Cow::Owned(dotted) }
  }

  /// Returns the extension without the leading period, e.g. `"png"`.
  #[must_use]
  pub fn without_period(&self) -> &str {
    &self.value
  }

  /// Returns the extension with the leading period, e.g. `".png"`.
  #[must_use]
  pub fn with_period(&self) -> &str {
    &self.dotted
  }
}

impl PartialEq for Extension {
  fn eq(&self, other: &Self) -> bool {
    self.value == other.value
  }
}

impl Hash for Extension {
  fn hash<H: Hasher>(&self, state: &mut H) {
    self.value.hash(state);
  }
}

impl fmt::Debug for Extension {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "Extension(\"{}\")", self.value)
  }
}

impl fmt::Display for Extension {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self.value)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  const PNG: Extension = Extension::from_static("png", ".png");
  const MP4: Extension = Extension::from_static("mp4", ".mp4");
  const MP3: Extension = Extension::from_static("mp3", ".mp3");

  #[test]
  fn static_without_period() {
    assert_eq!(PNG.without_period(), "png");
    assert_eq!(MP4.without_period(), "mp4");
    assert_eq!(MP3.without_period(), "mp3");
  }

  #[test]
  fn static_with_period() {
    assert_eq!(PNG.with_period(), ".png");
    assert_eq!(MP4.with_period(), ".mp4");
    assert_eq!(MP3.with_period(), ".mp3");
  }

  #[test]
  fn runtime_without_period() {
    let ext = Extension::new("webm");
    assert_eq!(ext.without_period(), "webm");
  }

  #[test]
  fn runtime_with_period() {
    let ext = Extension::new("webm");
    assert_eq!(ext.with_period(), ".webm");
  }

  #[test]
  fn unknown_extension() {
    let ext = Extension::new("foobar");
    assert_eq!(ext.without_period(), "foobar");
    assert_eq!(ext.with_period(), ".foobar");
  }

  #[test]
  fn equality() {
    let a = Extension::new("png");
    assert_eq!(a, PNG);
  }

  #[test]
  fn clone() {
    let a = Extension::new("wav");
    let b = a.clone();
    assert_eq!(a, b);
  }

  #[test]
  fn display() {
    assert_eq!(format!("{PNG}"), "png");
    assert_eq!(format!("{}", Extension::new("xyz")), "xyz");
  }

  #[test]
  fn debug() {
    assert_eq!(format!("{PNG:?}"), "Extension(\"png\")");
  }

  #[test]
  fn hash_matches_equality() {
    let plain = Extension::from_static("png", ".png");
    let inconsistent = Extension::from_static("png", ".not-a-suffix");
    assert_eq!(plain, inconsistent);
    assert_eq!(hash(&plain), hash(&inconsistent));
  }

  fn hash(extension: &Extension) -> u64 {
    use std::collections::hash_map::DefaultHasher;

    let mut hasher = DefaultHasher::new();
    extension.hash(&mut hasher);
    hasher.finish()
  }
}
