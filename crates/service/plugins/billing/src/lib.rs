// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
//#![forbid(warnings)]
#![allow(unused_imports)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![forbid(unreachable_patterns)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

#[macro_use] extern crate serde_derive;

pub mod default_routes;
pub mod paypal;
pub mod stripe;
