pub fn main() {
  // NB: This should help JetBrains' RustRover from highlighting failing query macros,
  // but we do not want to interfere with the following: 
  // 
  //    (1) User development builds
  //    (2) Tooling to cache offline queries
  //    (3) CI builds
  println!("cargo:rustc-env=DATABASE_URL=sqlite:/tmp/tasks.sqlite");
}