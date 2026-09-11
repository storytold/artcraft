//! Lightweight JWT library for Rust. 
//! No cryptographic verification, no OpenSSL, etc.
//! 
//! DO NOT USE THIS FOR OUR OWN JWT VERIFICATION !!! 
//! It's okay to parse external vendors since we're not validating, but 
//! do not ever use this to secure our own server.

pub (crate) mod utils;

pub mod common_claims;
pub mod error;
pub mod parse_jwt_claims_trait;
