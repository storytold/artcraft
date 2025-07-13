//! enums
//!
//! The purpose of this library is to have a strongly-typed MySQL enum-type wrapper.
//! This should also work for CHAR/VARCHAR fields that work similarly to enums (typically
//! as part of a composite key)
//!
//! These types should also be friendly for API usage in JSON payloads.
//!
//! In the future this should be *CODEGEN DRIVEN* and should get checked into source control.
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

#[macro_use] extern crate serde_derive;

#[macro_use]
mod macros;

#[cfg(test)] pub mod test_helpers;

pub mod by_table;
pub mod common;
pub mod no_table;
pub mod tauri;
pub mod traits;
