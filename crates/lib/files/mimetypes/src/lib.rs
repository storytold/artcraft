//! mimetypes
//!
//! The purpose of this library is to perform mimetype detection routines on files, raw bytes,
//! streams, etc.
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

pub mod mimetype_for_bytes;
pub mod mimetype_for_file;
pub mod mimetype_info;
pub mod mimetype_to_extension;
