use std::env;
use std::path::PathBuf;

pub fn main() {
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
      println!("cargo:warning=Unsupported target family, using Unix temp database pathing.");
      unix_temp_database_pathing();
    },
  }
}

fn unix_temp_database_pathing() {
  println!("cargo:rustc-env=DATABASE_URL=sqlite:/tmp/tasks.sqlite");
}

fn windows_temp_database_pathing() {
  if let Ok(local_app_data) = env::var("LOCALAPPDATA") {
    let path = PathBuf::from(local_app_data);
    let path = path.join("Temp\\tasks.sqlite");
    let path = path
        .to_str()
        .expect("path should be valid")
        .to_string();
    println!("cargo:warning=LocalAppData path: {}", path);
    println!("cargo:rustc-env=DATABASE_URL=sqlite:{}", path);
  } else {
    panic!("LOCALAPPDATA environment variable not set");
  }
}
