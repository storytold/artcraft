/// The version of the ArtCraft desktop app reported in the UI and via Analytics.
/// This should match the CI builds.
pub const ARTCRAFT_VERSION: &str = "0.36.0";

#[cfg(test)]
mod tests {
  use super::ARTCRAFT_VERSION;

  fn configured_version(contents: &str) -> String {
    serde_json::from_str::<serde_json::Value>(contents).expect("Tauri configuration should be valid JSON").get("version").and_then(serde_json::Value::as_str).expect("Tauri configuration should declare a version").to_owned()
  }

  #[test]
  fn desktop_runtime_version_matches_tauri_bundle_versions() {
    for (name, contents) in [("tauri.conf.json", include_str!("../tauri.conf.json")), ("tauri-mac.conf.json", include_str!("../tauri-mac.conf.json"))] {
      assert_eq!(ARTCRAFT_VERSION, configured_version(contents), "{name} must match ARTCRAFT_VERSION");
    }
  }
}
