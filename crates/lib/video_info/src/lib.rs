//! Parse provenance / generation metadata out of video files.
//!
//! AI image/video generators increasingly embed [C2PA](https://c2pa.org/)
//! Content Credentials (a JUMBF box carrying a CBOR manifest) describing the
//! generating model, platform, and timestamp. This crate extracts that.
//!
//! Supported formats (see [`VideoInfo`]):
//! - **Seedance** (ByteDance API — Volcengine / BytePlus C2PA): [`seedance_info::SeedanceInfo`]
//! - **Veo** (Google Generative AI video C2PA): [`veo_info::VeoInfo`]
//! - **Dreamina** (ByteDance/CapCut app `ilst` metadata): [`dreamina_info::DreaminaInfo`]
//! - **Kling** (Kuaishou AIGC-label `ilst` metadata): [`kling_info::KlingInfo`]

mod scan;

pub mod dreamina_info;
pub mod error;
pub mod kling_info;
pub mod seedance_info;
pub mod veo_info;
pub mod video;

pub use dreamina_info::DreaminaInfo;
pub use error::VideoInfoError;
pub use kling_info::KlingInfo;
pub use seedance_info::{SeedanceInfo, SeedancePlatform};
pub use veo_info::VeoInfo;
pub use video::VideoInfo;
