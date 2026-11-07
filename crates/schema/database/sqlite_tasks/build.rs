use std::env;
use std::path::{Path, PathBuf};

pub fn main() {
  println!("cargo:rerun-if-env-changed=DATABASE_URL");
  println!("cargo:rerun-if-env-changed=SQLX_OFFLINE");

  if let Ok(url) = env::var("DATABASE_URL") {
    println!("cargo:rustc-env=DATABASE_URL={}", url);
    return;
  }

  if env::var("SQLX_OFFLINE").as_deref() == Ok("true") || env::var("SQLX_OFFLINE").as_deref() == Ok("1") {
    println!("cargo:rustc-env=SQLX_OFFLINE=true");
    return;
  }

  // NB: This should help JetBrains' RustRover from highlighting failing query macros,
  // but we do not want to interfere with the following: 
  // 
  //    (1) User development builds
  //    (2) Tooling to cache offline queries
  //    (3) CI builds
  let family = env::var("CARGO_CFG_TARGET_FAMILY").ok();

  match family.as_deref() {
    Some("unix") => unix_temp_database_pathing(),
    Some("windows") => windows_temp_database_pathing(),
    _ => {
      println!("cargo:rustc-env=SQLX_OFFLINE=true");
    },
  }
}

fn unix_temp_database_pathing() {
  println!("cargo:rerun-if-changed=/tmp/tasks.sqlite");
  if Path::new("/tmp/tasks.sqlite").exists() {
    println!("cargo:rustc-env=DATABASE_URL=sqlite:/tmp/tasks.sqlite");
  } else {
    println!("cargo:rustc-env=SQLX_OFFLINE=true");
  }
}

fn windows_temp_database_pathing() {
  if let Ok(local_app_data) = env::var("LOCALAPPDATA") {
    let path = PathBuf::from(local_app_data).join("Temp\\tasks.sqlite");
    if path.exists() {
      let path_str = path.to_str().expect("path should be valid");
      println!("cargo:warning=LocalAppData path: {}", path_str);
      println!("cargo:rustc-env=DATABASE_URL=sqlite:{}", path_str);
      return;
    }
  }
  println!("cargo:rustc-env=SQLX_OFFLINE=true");
}
