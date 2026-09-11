//! images
//!
//! Even though the "image" library is the most widely used crate, if we declare a dependency here
//! we can update every downstream caller in unison. This will also let us collect common algorithms
//! and functions.
//!

// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
#![forbid(unreachable_patterns)]
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

// Re-export image to everyone importing this library
pub use image;

pub mod encoding;
pub mod error;
pub mod image_info;
pub mod mask_images;
pub mod resize_image_file_preserving_aspect;
pub mod resize_preserving_aspect;

