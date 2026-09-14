/// A single in-progress preview image carried on the websocket during a job.
///
/// Midjourney streams four images (indices 0-3) that refine over successive
/// diffusion steps. Each websocket progress frame may carry one preview per
/// image for the current step; the previews grow sharper as the step count
/// climbs. The final, full-resolution image is NOT delivered here — it is
/// fetched over HTTP once the job reaches `completed` (see the `imagine`
/// endpoint).
#[derive(Clone)]
pub struct JobStepImage {
  /// Which of the four grid images this is, in `[0, 4)`.
  pub image_index: u8,

  /// The diffusion step this preview was rendered at (larger = more refined).
  pub step: u32,

  /// The image encoding. Observed to be JPEG in practice.
  pub format: MidjourneyImageFormat,

  /// The raw encoded image bytes.
  pub bytes: Vec<u8>,
}

/// The encoding of a websocket preview image, taken from the file extension in
/// the frame and cross-checked against the leading magic bytes.
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MidjourneyImageFormat {
  Jpeg,
  Webp,
  Png,
  Other(String),
}

impl JobStepImage {
  /// Parse one `files` entry, whose key looks like `"0_step_5.jpeg"`.
  /// Returns `None` if the key does not match the expected shape.
  pub fn from_file_entry(key: &str, bytes: Vec<u8>) -> Option<Self> {
    // "0_step_5.jpeg" -> index "0", rest "step_5.jpeg"
    let (index_str, rest) = key.split_once('_')?;
    let image_index = index_str.parse::<u8>().ok()?;

    // "step_5.jpeg" -> "5.jpeg"
    let rest = rest.strip_prefix("step_")?;

    // "5.jpeg" -> step "5", extension "jpeg"
    let (step_str, extension) = rest.split_once('.')?;
    let step = step_str.parse::<u32>().ok()?;

    let format = MidjourneyImageFormat::infer(extension, &bytes);

    Some(Self { image_index, step, format, bytes })
  }
}

impl MidjourneyImageFormat {
  /// Prefer the magic bytes (authoritative), falling back to the extension.
  fn infer(extension: &str, bytes: &[u8]) -> Self {
    if bytes.len() >= 4 && bytes[0..3] == [0xFF, 0xD8, 0xFF] {
      return Self::Jpeg;
    }
    if bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
      return Self::Webp;
    }
    if bytes.len() >= 8 && bytes[0..8] == [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] {
      return Self::Png;
    }
    match extension.to_ascii_lowercase().as_str() {
      "jpeg" | "jpg" => Self::Jpeg,
      "webp" => Self::Webp,
      "png" => Self::Png,
      other => Self::Other(other.to_string()),
    }
  }

  pub fn extension(&self) -> &str {
    match self {
      Self::Jpeg => "jpeg",
      Self::Webp => "webp",
      Self::Png => "png",
      Self::Other(ext) => ext,
    }
  }
}

impl std::fmt::Debug for JobStepImage {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("JobStepImage").field("image_index", &self.image_index).field("step", &self.step).field("format", &self.format).field("bytes", &format!("<{} bytes>", self.bytes.len())).finish()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  const JPEG_MAGIC: &[u8] = &[0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10];

  #[test]
  fn parses_step_file_key() {
    let image = JobStepImage::from_file_entry("2_step_14.jpeg", JPEG_MAGIC.to_vec()).unwrap();
    assert_eq!(image.image_index, 2);
    assert_eq!(image.step, 14);
    assert_eq!(image.format, MidjourneyImageFormat::Jpeg);
  }

  #[test]
  fn magic_bytes_override_extension() {
    let image = JobStepImage::from_file_entry("0_step_0.png", JPEG_MAGIC.to_vec()).unwrap();
    assert_eq!(image.format, MidjourneyImageFormat::Jpeg);
  }

  #[test]
  fn rejects_malformed_keys() {
    assert!(JobStepImage::from_file_entry("garbage", vec![]).is_none());
    assert!(JobStepImage::from_file_entry("x_step_1.jpeg", vec![]).is_none());
    assert!(JobStepImage::from_file_entry("0_notstep_1.jpeg", vec![]).is_none());
  }
}
