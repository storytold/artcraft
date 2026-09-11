//! filesys
//!
//! The purpose of this library is to make basic filesystem operations easier.
//! We won't be including content type or magic type features that incur a higher cost.
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

pub mod check_directory_exists;
pub mod check_file_exists;
pub mod create_dir_all_if_missing;
pub mod directory_exists;
pub mod file_deletion;
pub mod file_exists;
pub mod file_lines;
pub mod file_read_bytes;
pub mod file_size;
pub mod filename_concat;
pub mod is_filesystem_full_error;
pub mod path_to_string;
pub mod read_to_trimmed_string;
pub mod recursively_find_file_by_name;
pub mod rename_across_devices;
