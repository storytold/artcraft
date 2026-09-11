use crate::core::state::data_dir::app_data_root::AppDataRoot;
use errors::AnyhowResult;
use log::LevelFilter;
use std::env;
use std::env::VarError;
use tauri::AppHandle;
use tauri_plugin_log::{Target, TargetKind};

const RUST_LOG: &str = "RUST_LOG";

pub fn set_app_log_level(
  app: &AppHandle,
  root: &AppDataRoot,
) -> AnyhowResult<()> {

  //print_env_var(RUST_LOG);

  // NB: The semantics of this do not match `RUST_LOG` exactly as it's not set per-package.
  let maybe_level = env::var(RUST_LOG)
      .map(|value| value.trim().to_ascii_lowercase());

  let mut log_level = LevelFilter::Info;

  match maybe_level {
    Ok(level) => {
      println!("The `RUST_LOG` environment variable was set to: `{}`.", level);

      if level.contains("debug") {
        log_level = LevelFilter::Debug;
      } else if level.contains("info") {
        log_level = LevelFilter::Info;
      } else if level.contains("warn") {
        log_level = LevelFilter::Warn;
      } else if level.contains("error") {
        log_level = LevelFilter::Error;
      } else if level.contains("off") {
        log_level = LevelFilter::Off;
      }
    }
    Err(VarError::NotPresent) => {
      // NB: This demonstrably tests stderr output in the default case.
      eprintln!("No `RUST_LOG` environment variable found.");
    }
    Err(VarError::NotUnicode(_)) => {
      // NB: This demonstrably tests stderr output in the default case.
      eprintln!("Could not parse `RUST_LOG` environment variable; not unicode.");
    }
  }

  println!("Setting app log level to: {:?}", log_level);

  app.plugin(
    tauri_plugin_log::Builder::default()
        .level(log_level)
        .targets(vec![
          Target::new(TargetKind::Stdout),
          Target::new(TargetKind::LogDir {
            file_name: Some(root.log_file_name_str().to_string())
          }),
        ])
        .build(),
  )?;

  Ok(())
}

// pub fn print_env_var(var_name: &str) {
//   match env::var(var_name) {
//     Ok(value) => println!("Environment variable `{}` = {}", var_name, value),
//     Err(VarError::NotPresent) => println!("Environment variable `{}` is not set.", var_name),
//     Err(VarError::NotUnicode(_)) => println!("Environment variable `{}` is not a valid Unicode string", var_name),
//   }
// }
