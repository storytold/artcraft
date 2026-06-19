//! Parse provenance / generation metadata out of video files.
//!
//! Currently focused on **Seedance** (ByteDance) video generations, which embed
//! [C2PA](https://c2pa.org/) Content Credentials (a JUMBF box carrying a CBOR
//! manifest) describing the generating model, platform, and timestamp. See
//! [`seedance_info::SeedanceInfo`].

pub mod error;
pub mod seedance_info;

pub use error::VideoInfoError;
pub use seedance_info::{SeedanceInfo, SeedancePlatform};
