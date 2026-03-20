//! enums_public
//!
//! Sometimes we want to hide which enums we allow over the API
//! to keep competitors in the dark about what we're doing.
//!

// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
#![forbid(unreachable_patterns)]
#![deny(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

#[allow(unused_imports)]
#[macro_use] extern crate serde_derive;

#[cfg(test)] pub mod test_helpers;

pub mod by_table;
