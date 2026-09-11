//! A Grok API client.

#[cfg(test)]
pub (crate) mod test_utils;

// Library utils
pub (crate) mod client;

// User lib
pub mod credentials;
pub mod datatypes;
pub mod error;
pub mod recipes;
pub mod requests;
pub mod utils;
