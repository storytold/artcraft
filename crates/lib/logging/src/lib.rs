//! logging
//!
//! The purpose of this crate is to pin against a single version of the 'log' crate, making it
//! easier to simultaneously update across apps. We can also pack in a few useful definitions.
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

use std::env;

/// Re-export.
pub use log::debug;
pub use log::error;
pub use log::info;
pub use log::log;
pub use log::trace;
pub use log::warn;

/// Name of the environment variable Rust's env logger uses
pub const ENV_RUST_LOG : &str = "RUST_LOG";

/// The default logging level
pub const DEFAULT_LOG_LEVEL: &str = "info";

/// A useful logging level
/// NB: `sqlx::query` is spammy and dumps all queries as "info"-level log lines.
/// NB: `hyper::proto::h1::io` is incredibly spammy and logs every chunk of bytes in very large files being downloaded.
pub const TYPICAL_LOG_LEVEL : &str = concat!(
  "debug,",
  "actix_web=info,",
  "sqlx::query=warn,",
  "hyper::proto::h1::io=warn,",
  "storyteller_web::threads::db_health_checker_thread::db_health_checker_thread=warn,",
  "http_server_common::request::get_request_ip=info," // Debug spams Rust logs
);

/// Initialize Rust's env logger.
///
/// The Rust logger reads the desired log level from the `RUST_LOG` environment variable. If this
/// isn't set, the provided default is used. If a default fallback isn't provided to this function,
/// we fall back to `"info"`.
///
/// A more robust logging config might configure on a per-component basis, eg.
/// `"tokio_reactor=warn,hyper=info,debug"`. You can read more in the `log` and `env_logger` crate
/// docs.
pub fn init_env_logger(default_if_absent: Option<&str>) {
  if env::var(ENV_RUST_LOG)
      .as_ref()
      .ok()
      .is_none()
  {
    let default_log_level = default_if_absent.unwrap_or(DEFAULT_LOG_LEVEL);
    println!("Setting default logging level to \"{}\", override with env var {}.",
             default_log_level, ENV_RUST_LOG);
    env::set_var(ENV_RUST_LOG, default_log_level);
  }

  // Custom format so that log lines emitted while serving an HTTP request
  // automatically carry the request's trace id (see the `trace_id` crate and
  // the `TraceIdMiddleware` in storyteller-web). Outside of a request scope
  // the trace segment is simply omitted.
  env_logger::Builder::from_env(env_logger::Env::default())
      .format(|buf, record| {
        use std::io::Write;

        let timestamp = buf.timestamp();
        let level_style = buf.default_level_style(record.level());

        match trace_id::current_trace_id() {
          Some(trace) => writeln!(
            buf,
            "[{} {level_style}{}{level_style:#} {} {}] {}",
            timestamp,
            record.level(),
            record.target(),
            trace,
            record.args(),
          ),
          None => writeln!(
            buf,
            "[{} {level_style}{}{level_style:#} {}] {}",
            timestamp,
            record.level(),
            record.target(),
            record.args(),
          ),
        }
      })
      .init();
}

