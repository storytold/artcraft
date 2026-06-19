//! sha1_hash
//!
//! SHA-1 hashing utilities. The primary entry point is
//! [`sha1_hash_bytes_as_crockford`], which hashes bytes with SHA-1 and returns
//! the 20-byte digest as a lowercase Crockford base32 string (32 chars).

pub mod error;
pub mod sha1_hash_bytes_as_crockford;

pub use error::Sha1HashError;
pub use sha1_hash_bytes_as_crockford::sha1_hash_bytes_as_crockford;
