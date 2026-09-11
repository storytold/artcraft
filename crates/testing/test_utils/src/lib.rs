//! testing
//!
//! This crate collects some of our common code around test setup and execution.
//! In the future we may have several such crates that deal with specific functions (http serving,
//! mocks, database, etc.). This crate is meant for general testing concerns. It will also import
//! and re-export the most common testing libraries we use.
//!
//! (The public "testing" crate is used for another project's internal tooling and isn't meant for
//! public consumption.)
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

pub mod test_file_path;