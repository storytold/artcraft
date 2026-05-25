//! google_sign_in
//!
//! The purpose of this library is to make single sign on (SSO) for Google easy to use.
//!

// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
#![forbid(unreachable_patterns)]
//#![forbid(unused_imports)]
#![forbid(unused_mut)]
//#![forbid(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

pub mod certs;
pub mod claims;
pub mod decode_and_verify_token_claims;
pub mod error;

pub(crate) mod jwt;

// Export for external users
pub use jwt_simple::common::VerificationOptions;
