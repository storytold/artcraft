//! Parse provenance / generation metadata out of video files.
//!
//! AI image/video generators increasingly embed [C2PA](https://c2pa.org/)
//! Content Credentials (a JUMBF box carrying a CBOR manifest) describing the
//! generating model, platform, and timestamp. This crate extracts that.
//!
//! Supported formats (see [`VideoInfo`]):
//! - **Seedance** (ByteDance — Volcengine / BytePlus): [`seedance_info::SeedanceInfo`]
//! - **Veo** (Google Generative AI video): [`veo_info::VeoInfo`]

mod scan;

pub mod error;
pub mod seedance_info;
pub mod veo_info;
pub mod video;

pub use error::VideoInfoError;
pub use seedance_info::{SeedanceInfo, SeedancePlatform};
pub use veo_info::VeoInfo;
pub use video::VideoInfo;
