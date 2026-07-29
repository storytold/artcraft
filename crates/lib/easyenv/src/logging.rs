use std::env;

/// Name of the environment variable Rust's env logger uses
pub const ENV_RUST_LOG : &str = "RUST_LOG";

/// The default logging level
pub const DEFAULT_LOG_LEVEL: &str = "info";



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

