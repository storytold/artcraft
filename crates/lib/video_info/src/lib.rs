//! Parse provenance / generation metadata out of video files.
//!
//! AI image/video generators increasingly embed [C2PA](https://c2pa.org/)
//! Content Credentials (a JUMBF box carrying a CBOR manifest) describing the
//! generating model, platform, and timestamp. This crate extracts that.
//!
//! Supported formats (see [`VideoInfo`]):
//! - **Seedance** (ByteDance API — Volcengine / BytePlus C2PA): [`seedance_info::SeedanceInfo`]
//! - **Veo** (Google Generative AI video C2PA): [`veo_info::VeoInfo`]
//! - **Sora** (OpenAI Generative AI video C2PA): [`sora_info::SoraInfo`]
//! - **Dreamina** (ByteDance/CapCut app `ilst` metadata): [`dreamina_info::DreaminaInfo`]
//! - **Kling** (Kuaishou AIGC-label `ilst` metadata): [`kling_info::KlingInfo`]

mod scan;

pub mod dreamina_info;
pub mod error;
pub mod kling_info;
pub mod seedance_info;
pub mod sora_info;
pub mod veo_info;
pub mod video;

pub use dreamina_info::DreaminaInfo;
pub use error::VideoInfoError;
pub use kling_info::KlingInfo;
pub use seedance_info::{SeedanceInfo, SeedancePlatform};
pub use sora_info::SoraInfo;
pub use veo_info::VeoInfo;
pub use video::VideoInfo;

/// Read the container's `©too` encoder tag (e.g. `"Lavf60.16.100"`, `"Google"`),
/// if present. Useful context for videos with no recognized provenance: an
/// `Lavf…` value means the file was re-encoded through ffmpeg, which strips C2PA
/// manifests and AIGC metadata — explaining why provenance is absent.
pub fn encoder_tag(data: &[u8]) -> Option<String> {
  scan::find_encoder_tag(data)
}
