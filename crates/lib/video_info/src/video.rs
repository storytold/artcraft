//! [`VideoInfo`] — a union over the supported AI-video provenance formats.

use std::fs;
use std::path::Path;

use crate::error::VideoInfoError;
use crate::seedance_info::SeedanceInfo;
use crate::veo_info::VeoInfo;

/// Recognized AI-video provenance, dispatched by [`VideoInfo::from_bytes`].
#[derive(Debug, Clone, PartialEq)]
pub enum VideoInfo {
  /// ByteDance Seedance (Volcengine / BytePlus).
  Seedance(SeedanceInfo),
  /// Google Veo (Google Generative AI video).
  Veo(VeoInfo),
}

impl VideoInfo {
  /// Detect and parse provenance from a video file on disk.
  pub fn from_path(path: impl AsRef<Path>) -> Result<VideoInfo, VideoInfoError> {
    let bytes = fs::read(path)?;
    Self::from_bytes(&bytes)
  }

  /// Detect and parse provenance from raw video bytes. Tries Seedance, then Veo.
  /// Returns [`VideoInfoError::Unrecognized`] if neither format is present.
  pub fn from_bytes(data: &[u8]) -> Result<VideoInfo, VideoInfoError> {
    match SeedanceInfo::from_bytes(data) {
      Ok(info) => Ok(VideoInfo::Seedance(info)),
      // Not Seedance — try Veo next.
      Err(VideoInfoError::NotSeedance) => match VeoInfo::from_bytes(data) {
        Ok(info) => Ok(VideoInfo::Veo(info)),
        Err(VideoInfoError::NotVeo) => Err(VideoInfoError::Unrecognized),
        Err(other) => Err(other),
      },
      // A Seedance manifest was present but malformed (or I/O) — surface it.
      Err(other) => Err(other),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn unrecognized_for_plain_video() {
    let data = b"....ftypisom....just a normal mp4....";
    assert!(matches!(VideoInfo::from_bytes(data), Err(VideoInfoError::Unrecognized)));
  }
}
