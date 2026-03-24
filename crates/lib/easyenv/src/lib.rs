// Copyright (c) 2020 Brandon Thomas <bt@brand.io>

//! easyenv
//!
//! The interface between an app and its environment variables. This library makes it easy to:
//!
//!   - read in strongly-typed environment variables.
//!   - load default environment variables from one or more files in an order that supports
//!     intentional overriding.
//!
//! Things that might want to move to another package :
//!
//!   - configure env logging
//!   - build conventions around system paths such that paths imported from environment variables
//!     respect pathing conventions.
//!
//! This library does not:
//!
//!   - handle app-specific conventions
//!   - care about servers or deployed environments (eg. "staging" vs "production")
//!

#![deny(dead_code)]
#![deny(missing_docs)]
#![deny(unreachable_patterns)]
#![deny(unused_extern_crates)]
#![deny(unused_imports)]
#![deny(unused_qualifications)]
#![deny(unused_qualifications)]

// NB: These were exported from the root in previous versions.
// It's easy to just keep them exported here to maintain compatibility.
pub use error::EnvError;
pub use error::InitError;
pub use init::from_filename;
pub use init::init_all_with_default_logging;
pub use init::maybe_read_env_config_from_filename_and_paths;
pub use init::read_env_config_from_filename_and_paths;
pub use logging::DEFAULT_LOG_LEVEL;
pub use logging::ENV_RUST_LOG;
pub use logging::init_env_logger;
pub use types::boolean::get_env_bool_optional;
pub use types::boolean::get_env_bool_or_default;
pub use types::boolean::get_env_bool_required;
pub use types::duration::get_env_duration_seconds_optional;
pub use types::duration::get_env_duration_seconds_or_default;
pub use types::duration::get_env_duration_seconds_required;
pub use types::num::get_env_num;
pub use types::num::try_get_env_num_optional;
pub use types::pathbuf::get_env_pathbuf_optional;
pub use types::pathbuf::get_env_pathbuf_or_default;
pub use types::pathbuf::get_env_pathbuf_required;
pub use types::string::get_env_string_optional;
pub use types::string::get_env_string_or_default;
pub use types::string::get_env_string_required;

mod error;
mod init;
mod logging;
pub (crate) mod types;

/// Re-export of env_logger
pub mod env_logger {
  pub use env_logger::Builder;
}
