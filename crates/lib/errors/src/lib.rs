//! errors
//!
//! The purpose of this library is to pin to a single 'anyhow' and also develop
//! common error utilities.
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

/// Useful re-export.
pub use anyhow::anyhow;
pub use anyhow::bail;

/// Easier to import than anyhow::Result.
/// (Naming things "Result" pollutes the import scope or requires nasty renames. Gross.)
pub type AnyhowResult<T> = anyhow::Result<T>;

pub type AnyhowError = anyhow::Error;

