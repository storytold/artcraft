use chrono::Local;
use env_logger::Builder;
use log::{debug, error, info, trace, warn, LevelFilter};
use std::io::Write;

const RUST_LOG: &str = "RUST_LOG";

pub fn setup_test_logging(level: LevelFilter) {
  let level_str = get_level_str(level);

  println!("Previous log level: {:?}", env::var(RUST_LOG));

  let is_unsafe = env::set_var(RUST_LOG, level_str);

  if is_unsafe.is_none() {
    println!("Unsafely setting Rust Log Level...");
    unsafe { std::env::set_var(RUST_LOG, level_str) }
  }

  println!("Log level: {:?}", env::var(RUST_LOG));

  Builder::new()
    .is_test(true)
    .format(|buf, record| {
      writeln!(buf,
        "{} [{}] - {}",
        Local::now().format("%H:%M:%S%.6f"),
        record.level(),
        record.args()
      )
    })
    .filter(None, level)
    .filter_level(level)
    .init();

  trace!("Test trace log");
  debug!("Test debug log");
  info!("Test info log");
  warn!("Test warn log");
  error!("Test error log");
}

fn get_level_str(level: LevelFilter) -> &'static str {
  match level {
    LevelFilter::Error => "error",
    LevelFilter::Warn => "warn",
    LevelFilter::Info => "info",
    LevelFilter::Debug => "debug",
    LevelFilter::Trace => "trace",
    LevelFilter::Off => "off",
  }
}
