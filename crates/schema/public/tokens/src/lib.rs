//! tokens
//!
//! The purpose of this library is to provide a strongly-typed primary/foreign key system with
//! well-known identifier prefixes to aid in manual database debugging.
//!
//! 1) All table foreign keys have a strongly-typed (non-stringly typed) wrapper type,
//!    eg. `MediaFileToken` for the `token` field in the `media_files` table or `UserToken` for
//!    the `token` field in the `users` table.
//!
//! 2) All such keys should have a well-defined constant prefix. Though tokens should be 100%
//!    opaque to the user and the code, having well-defined prefixes can greatly aid when
//!    debugging systems. Every table's primary key should have a unique prefix that identifies
//!    that key, eg. `comment_` for the `comments` table or `m_` for the `media_files` table.
//!
//! This library does not directly introduce MySQL dependencies, so these strongly-typed token
//! types can be used in other crates, eg. for defining HTTP APIs and returning strongly-typed
//! tokens to the user.
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

// Crockford characters
// https://en.wikipedia.org/wiki/Base32#Crockford's_Base32
pub(crate) const CROCKFORD_UPPERCASE_CHARSET: &[u8] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZ";
pub(crate) const CROCKFORD_LOWERCASE_CHARSET: &[u8] = b"0123456789abcdefghjkmnpqrstvwxyz";
pub(crate) const CROCKFORD_MIXED_CASE_CHARSET: &[u8] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz";

pub(crate) enum TokenCharacterSet {
  CrockfordUpper,
  CrockfordLower,
  CrockfordMixed,
}

/// Every token must have at least this many "characters" of entropy.
pub(crate) static MINIMUM_CHARACTER_ENTROPY : usize = 8;

#[macro_use]
pub (crate) mod macros;

pub (crate) mod deterministic_rng;
pub (crate) mod prefixes;

pub mod tokens;
pub mod traits;
mod safe_entropy;