//! Shared config for thumbnails.

/// NB: DO NOT CHANGE WITHOUT MIGRATION - THIS IS SHARED BETWEEN SERVICES
/// Video media files have conventional gif thumbnails with this suffix.
/// This is how files are physically named in the public bucket.
pub const VIDEO_ANIMATED_GIF_THUMBNAIL_SUFFIX: &str = "-thumb.gif";

/// NB: DO NOT CHANGE WITHOUT MIGRATION - THIS IS SHARED BETWEEN SERVICES
/// Video media files have conventional static jpg thumbnails with this suffix.
/// This is how files are physically named in the public bucket.
pub const VIDEO_STATIC_JPG_THUMBNAIL_SUFFIX: &str = "-thumb.jpg";
