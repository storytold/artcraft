//! Shared video-endpoint enums (model, aspect ratio, resolution).
//!
//! `VideoModel` is reused by every video endpoint
//! ([`crate::api::requests::videos::video_generation`],
//! [`crate::api::requests::videos::video_edit`],
//! [`crate::api::requests::videos::video_extension`]).
//!
//! `VideoAspectRatio` and `VideoResolution` are accepted only by
//! [`crate::api::requests::videos::video_generation`] — the edit and
//! extension endpoints inherit dimensions from the source video.

pub mod video_aspect_ratio;
pub mod video_model;
pub mod video_resolution;
