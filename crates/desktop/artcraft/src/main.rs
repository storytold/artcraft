// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  if let Some(result) = artcraft_app_lib::updates::finish_helper() {
    let failed = result.is_err();
    if let Err(error) = result { log::error!("Update failed: {error}"); }
    std::process::exit(i32::from(failed));
  }
  artcraft_app_lib::run();
}
