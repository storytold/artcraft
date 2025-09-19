#![cfg_attr(docsrs, feature(doc_cfg))]
#![doc = include_str!("../README.md")]
#![allow(deprecated)]

pub mod endpoints;
#[cfg(feature = "image")]
pub mod image;
pub mod queue;
pub mod request;
pub mod webhook;

use eventsource_stream::EventStreamError;
pub use fal_derive::endpoint;

pub mod prelude {
    #[allow(unused_imports)]
    pub use super::endpoints::*;
    #[cfg(feature = "image")]
    pub use super::image::*;
    pub use super::queue::*;
    pub use super::request::*;
    pub use super::*;
}

use serde::{Deserialize, Serialize};

#[derive(Debug, thiserror::Error)]
pub enum FalError {
    #[error("fal request failed: {0}")]
    RequestError(#[from] reqwest::Error),
    #[error("image error: {0}")]
    ImageError(#[from] ::image::ImageError),
    #[error("serialization error: {0}")]
    SerializeError(#[from] serde_json::Error),
    #[error("stream error: {0}")]
    StreamError(#[from] EventStreamError<reqwest::Error>),
    #[error("error: {0}")]
    Other(String),
}

impl From<String> for FalError {
    fn from(s: String) -> Self {
        FalError::Other(s)
    }
}

#[deprecated(note = "use a type specific to the endpoint, or make your own")]
pub type Image = File;

#[deprecated(note = "use a type specific to the endpoint, or make your own")]
#[derive(Debug, Deserialize, Serialize, Default)]
pub struct File {
    pub url: String,
    pub content_type: String,
    pub file_name: Option<String>,
    pub file_size: Option<i64>,
    pub width: Option<i64>,
    pub height: Option<i64>,
}
