//! A wrapper for the "fal" crate that bakes in a few extra recipes and utilities.

// NB: The vendored `fal` crate is still a dependency for now.
// Files under `requests/queue/` and `utils/queue_status_checker.rs` still use
// `fal::endpoints::*` and `fal::prelude::*` directly. Those will be migrated later.
extern crate fal;

pub mod creds;
pub mod error;
pub mod model;
pub mod requests;
pub mod utils;
