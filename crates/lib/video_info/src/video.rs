//! [`VideoInfo`] — a union over the supported AI-video provenance formats.

use std::fs;
use std::path::Path;

use crate::dreamina_info::DreaminaInfo;
use crate::error::VideoInfoError;
use crate::kling_info::KlingInfo;
use crate::seedance_info::SeedanceInfo;
use crate::sora_info::SoraInfo;
use crate::veo_info::VeoInfo;

/// Recognized AI-video provenance, dispatched by [`VideoInfo::from_bytes`].
#[derive(Debug, Clone, PartialEq)]
pub enum VideoInfo {
  /// ByteDance Seedance API (Volcengine / BytePlus C2PA).
  Seedance(SeedanceInfo),
  /// Google Veo (Google Generative AI video C2PA).
  Veo(VeoInfo),
  /// OpenAI Sora (OpenAI Generative AI video C2PA).
  Sora(SoraInfo),
  /// Dreamina (ByteDance/CapCut consumer app `ilst` metadata).
  Dreamina(DreaminaInfo),
  /// Kling (Kuaishou AIGC-label `ilst` metadata).
  Kling(KlingInfo),
}

impl VideoInfo {
  /// Detect and parse provenance from a video file on disk.
  pub fn from_path(path: impl AsRef<Path>) -> Result<VideoInfo, VideoInfoError> {
    let bytes = fs::read(path)?;
    Self::from_bytes(&bytes)
  }

  /// Detect and parse provenance from raw video bytes.
  ///
  /// C2PA-based formats (Seedance, Veo) are tried before the `ilst`-based
  /// consumer-app formats (Dreamina, Kling): some Dreamina exports carry *both*
  /// a Bytedance C2PA box and Dreamina `ilst` JSON, but they lack the Ark
  /// vendor markers so [`SeedanceInfo`] declines them and they fall through to
  /// Dreamina. Returns [`VideoInfoError::Unrecognized`] if no format matches.
  pub fn from_bytes(data: &[u8]) -> Result<VideoInfo, VideoInfoError> {
    match SeedanceInfo::from_bytes(data) {
      Ok(info) => return Ok(VideoInfo::Seedance(info)),
      Err(VideoInfoError::NotSeedance) => {}
      Err(other) => return Err(other),
    }
    match VeoInfo::from_bytes(data) {
      Ok(info) => return Ok(VideoInfo::Veo(info)),
      Err(VideoInfoError::NotVeo) => {}
      Err(other) => return Err(other),
    }
    match SoraInfo::from_bytes(data) {
      Ok(info) => return Ok(VideoInfo::Sora(info)),
      Err(VideoInfoError::NotSora) => {}
      Err(other) => return Err(other),
    }
    match DreaminaInfo::from_bytes(data) {
      Ok(info) => return Ok(VideoInfo::Dreamina(info)),
      Err(VideoInfoError::NotDreamina) => {}
      Err(other) => return Err(other),
    }
    match KlingInfo::from_bytes(data) {
      Ok(info) => return Ok(VideoInfo::Kling(info)),
      Err(VideoInfoError::NotKling) => {}
      Err(other) => return Err(other),
    }
    Err(VideoInfoError::Unrecognized)
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
