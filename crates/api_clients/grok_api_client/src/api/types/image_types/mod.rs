//! Shared image-endpoint enums (model, aspect ratio, resolution, response format).
//!
//! These are reused by both [`crate::api::requests::image_generation`] and
//! [`crate::api::requests::image_edit`] so callers can pass type-safe values
//! instead of memorising the allowed strings.

pub mod image_aspect_ratio;
pub mod image_model;
pub mod image_resolution;
pub mod image_response_format;
