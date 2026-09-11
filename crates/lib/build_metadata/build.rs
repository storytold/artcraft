
fn main() {
  // Tell Cargo that if the given file changes, to rerun this build script.
  // TODO: Use this to test the GIT_SHA, etc. files that CI dumps into the working directory
  // println!("cargo::rerun-if-changed=Cargo.toml");
  
  // Make build info available in the main crate sources.
  build_info_build::build_script();
}
