//! Shared config for thumbnails.

/// NB: DO NOT CHANGE WITHOUT MIGRATION - THIS IS SHARED BETWEEN SERVICES
/// Video media files have conventional gif thumbnails with this suffix.
/// This is how files are physically named in the public bucket.
pub const VIDEO_ANIMATED_GIF_THUMBNAIL_SUFFIX: &str = "-thumb.gif";

/// NB: DO NOT CHANGE WITHOUT MIGRATION - THIS IS SHARED BETWEEN SERVICES
/// Video media files have conventional static jpg thumbnails with this suffix.
/// This is how files are physically named in the public bucket.
pub const VIDEO_STATIC_JPG_THUMBNAIL_SUFFIX: &str = "-thumb.jpg";

/// The current thumbnail format is a dual jpg + gif of a set size. 
/// We write this as version "1". If we change the thumbnails in the behavior, 
/// we may increment this number so that we can backfill.
pub const CURRENT_VIDEO_THUMBNAIL_VERSION : u8 = 1;
