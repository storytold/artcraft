//! bucket_paths
//!
//! This library is intended to standardize bucket pathing for cloud storage:
//!
//!   - How we address objects
//!   - Serve as a single source of truth and registry for various objects
//!   - Be independent of any bucket libraries, connectors, etc.
//!   - Be more typesafe vs. filesystem paths
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

pub mod legacy;
pub mod pathing;
pub mod traits;
pub mod util;