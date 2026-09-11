//! primitives
//!
//! The purpose of this library is to package converters and utilities around Rust's primitive types.
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

pub mod bool_to_str;
pub mod iterators;
pub mod lazy_any_option_true;
pub mod numerics;
pub mod optional_false_to_none;
pub mod str;
pub mod str_to_bool;
pub mod traits;
pub mod trim_or_empty;
pub mod truncate_str;
pub mod try_str_to_num;
