// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
#![deny(unused_imports)]
#![forbid(unreachable_patterns)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

#[allow(unused_imports)]
#[macro_use] extern crate serde_derive;

pub mod api_safe;
pub mod by_table;
pub mod common;
pub mod no_table;
pub mod tauri;

// Re-export shared types
pub use enums_shared::error;
